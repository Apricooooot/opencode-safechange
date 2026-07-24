param(
  [ValidatePattern('^[a-z0-9][a-z0-9._-]*$')]
  [string]$Task = 'config-api-options-v1',

  [Parameter(Mandatory = $true)]
  [ValidatePattern('^[a-z0-9._-]+/[a-zA-Z0-9._-]+$')]
  [string]$Model,

  [ValidateSet('none', 'low', 'medium', 'high', 'xhigh', 'max')]
  [string]$Variant = 'high'
)

$ErrorActionPreference = 'Stop'
$repositoryRoot = Split-Path -Parent $PSScriptRoot
$workspaceRoot = Split-Path -Parent (Split-Path -Parent $repositoryRoot)
$resultsDirectory = Join-Path $repositoryRoot '.benchmark-runs\results'

$openCode = Get-Command 'opencode.cmd' -ErrorAction SilentlyContinue
if (-not $openCode) {
  throw 'opencode.cmd was not found. Install it with: npm.cmd install -g opencode-ai'
}

$previousErrorAction = $ErrorActionPreference
$ErrorActionPreference = 'Continue'
$authOutput = & $openCode.Source auth list 2>&1 | Out-String
$authExitCode = $LASTEXITCODE
$ErrorActionPreference = $previousErrorAction
if ($authExitCode -ne 0 -or $authOutput -match '0 credentials') {
  throw 'OpenCode has no configured provider. Run opencode.cmd and use /connect.'
}

$runDirectory = (& node (Join-Path $PSScriptRoot 'prepare-run.js') $Task |
  Out-String).Trim()
if ($LASTEXITCODE -ne 0) {
  throw 'Failed to prepare the isolated benchmark worktree.'
}

& git -C $runDirectory init --quiet
if ($LASTEXITCODE -ne 0) {
  throw 'Failed to initialize the isolated Git worktree.'
}

New-Item -ItemType Directory -Force -Path $resultsDirectory | Out-Null
$timestamp = (Get-Date).ToUniversalTime().ToString('yyyyMMddTHHmmssZ')
$rawPath = Join-Path $resultsDirectory "$timestamp.raw.jsonl"
$metadataPath = Join-Path $resultsDirectory "$timestamp.metadata.json"
$predictionPath = Join-Path $resultsDirectory "$timestamp.prediction.json"
$scorePath = Join-Path $resultsDirectory "$timestamp.score.json"
$prompt = Get-Content -Raw (Join-Path $runDirectory 'PROMPT.txt')
$openCodeVersion = (& $openCode.Source --version | Out-String).Trim()
$gitCommit = (& git -C $repositoryRoot rev-parse HEAD | Out-String).Trim()

$metadata = [ordered]@{
  schemaVersion = 1
  taskId = $Task
  startedAt = (Get-Date).ToUniversalTime().ToString('o')
  openCodeVersion = $openCodeVersion
  provider = $Model.Split('/')[0]
  model = $Model
  variant = $Variant
  safeChangeCommit = $gitCommit
  rawOutput = [System.IO.Path]::GetFileName($rawPath)
}
$metadata | ConvertTo-Json | Set-Content -Encoding utf8 $metadataPath

Write-Host "Running isolated benchmark with $Model ($Variant)..."
$ErrorActionPreference = 'Continue'
& $openCode.Source run `
  --agent safechange `
  --model $Model `
  --variant $Variant `
  --format json `
  --dir $runDirectory `
  $prompt 2>&1 | Tee-Object -FilePath $rawPath
$runExitCode = $LASTEXITCODE
$ErrorActionPreference = $previousErrorAction

if ($runExitCode -ne 0) {
  throw "OpenCode benchmark failed with exit code $runExitCode. Raw output: $rawPath"
}

$isolatedPrediction = Join-Path $runDirectory '.safechange\prediction.json'
if (-not (Test-Path $isolatedPrediction)) {
  throw "OpenCode exited without submitting prediction.json. Raw output: $rawPath"
}

Copy-Item -LiteralPath $isolatedPrediction -Destination $predictionPath
& node (Join-Path $PSScriptRoot 'evaluate.js') $predictionPath |
  Tee-Object -FilePath $scorePath
if ($LASTEXITCODE -ne 0) {
  throw "Benchmark prediction could not be scored. Prediction: $predictionPath"
}

Write-Host "Raw result: $rawPath"
Write-Host "Metadata:   $metadataPath"
Write-Host "Prediction: $predictionPath"
Write-Host "Score:      $scorePath"

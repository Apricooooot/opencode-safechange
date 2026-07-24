# Example: dependency major-version upgrade

Start OpenCode in a repository containing this SafeChange configuration and run:

```text
Use SafeChange in analysis-only mode.

Assess upgrading pydantic from v1 to v2. Find all directly and indirectly
affected code, configuration, tests, CI, and documentation. Produce an ordered
migration plan, validation commands, and rollback strategy. Do not edit files.
```

After reviewing the plan:

```text
Apply the approved migration plan. Keep changes within the identified scope,
run focused tests before the full suite, and produce the structured SafeChange
report.
```


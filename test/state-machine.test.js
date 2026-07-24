import test from "node:test"
import assert from "node:assert/strict"

import { SafeChangeRun, States } from "../runtime/state-machine.js"

test("analysis-only workflow can complete from planned state", () => {
  const run = new SafeChangeRun("Assess a major dependency upgrade")

  run
    .transition(States.ANALYZING, "scope understood")
    .transition(States.PLANNED, "impact evidence collected")
    .transition(States.COMPLETED, "analysis-only request fulfilled")

  assert.equal(run.state, States.COMPLETED)
  assert.equal(run.history.length, 4)
})

test("approved implementation follows verification gate", () => {
  const run = new SafeChangeRun("Rename a public API")

  run
    .transition(States.ANALYZING, "request accepted")
    .transition(States.PLANNED, "plan ready")
    .transition(States.APPLYING, "user approved plan")
    .transition(States.VERIFYING, "implementation finished")
    .transition(States.COMPLETED, "all required checks passed")

  assert.equal(run.state, States.COMPLETED)
})

test("implementation cannot start before analysis and planning", () => {
  const run = new SafeChangeRun("Upgrade a database schema")

  assert.throws(
    () => run.transition(States.APPLYING, "skip planning"),
    /invalid transition/,
  )
})

test("failed and completed runs are terminal", () => {
  const run = new SafeChangeRun("Change a shared interface")
  run.transition(States.FAILED, "request is unsafe")

  assert.equal(run.canTransition(States.ANALYZING), false)
  assert.throws(
    () => run.transition(States.ANALYZING, "retry"),
    /invalid transition/,
  )
})

test("history snapshots cannot mutate internal history", () => {
  const run = new SafeChangeRun("Migrate an endpoint")
  const history = run.history
  history[0].reason = "tampered"

  assert.equal(run.history[0].reason, "run created")
})


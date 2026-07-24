export const States = Object.freeze({
  INTAKE: "INTAKE",
  ANALYZING: "ANALYZING",
  PLANNED: "PLANNED",
  APPLYING: "APPLYING",
  VERIFYING: "VERIFYING",
  COMPLETED: "COMPLETED",
  FAILED: "FAILED",
})

const transitions = Object.freeze({
  [States.INTAKE]: new Set([States.ANALYZING, States.FAILED]),
  [States.ANALYZING]: new Set([States.PLANNED, States.FAILED]),
  [States.PLANNED]: new Set([States.APPLYING, States.COMPLETED, States.FAILED]),
  [States.APPLYING]: new Set([States.VERIFYING, States.FAILED]),
  [States.VERIFYING]: new Set([
    States.APPLYING,
    States.COMPLETED,
    States.FAILED,
  ]),
  [States.COMPLETED]: new Set(),
  [States.FAILED]: new Set(),
})

export class SafeChangeRun {
  #state = States.INTAKE
  #history = []

  constructor(request) {
    if (!request?.trim()) throw new TypeError("request must not be empty")
    this.request = request.trim()
    this.#record(null, States.INTAKE, "run created")
  }

  get state() {
    return this.#state
  }

  get history() {
    return structuredClone(this.#history)
  }

  canTransition(next) {
    return transitions[this.#state]?.has(next) ?? false
  }

  transition(next, reason) {
    if (!Object.values(States).includes(next)) {
      throw new TypeError(`unknown state: ${next}`)
    }
    if (!reason?.trim()) throw new TypeError("transition reason is required")
    if (!this.canTransition(next)) {
      throw new Error(`invalid transition: ${this.#state} -> ${next}`)
    }

    const previous = this.#state
    this.#state = next
    this.#record(previous, next, reason.trim())
    return this
  }

  #record(from, to, reason) {
    this.#history.push({
      sequence: this.#history.length,
      from,
      to,
      reason,
    })
  }
}


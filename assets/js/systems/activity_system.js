export function startActivity(state, payload) {
  state.activity = {
    ...payload,
    startedAt: Date.now(),
    lastProcessedAt: Date.now(),
    progress: 0
  }
}

export function stopActivity(state) {
  state.activity = {
    kind: "none",
    progress: 0
  }
}

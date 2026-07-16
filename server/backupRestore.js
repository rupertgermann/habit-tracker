function createStateRestorer({ replaceAll }) {
  return state => ({
    ok: true,
    state: replaceAll(state)
  })
}

module.exports = { createStateRestorer }

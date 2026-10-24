export const DEFAULT_PROFILE = { name: 'User Name', email: 'user@example.com', avatarImage: null }

export const normalizeProfile = value => ({
  name: typeof value?.name === 'string' && value.name.trim() ? value.name.trim() : DEFAULT_PROFILE.name,
  email: typeof value?.email === 'string' && value.email.trim() ? value.email.trim() : DEFAULT_PROFILE.email,
  avatarImage: typeof value?.avatarImage === 'string' ? value.avatarImage : null
})

export const createProfileLifecycle = ({ persistence, createAvatarImage }) => {
  let state = { status: 'loading', committed: null, draft: { ...DEFAULT_PROFILE } }
  const listeners = new Set()
  let queue = Promise.resolve()
  let loading
  const publish = changes => {
    state = { ...state, ...changes }
    listeners.forEach(listener => listener(state))
  }
  const mutate = getPatch => {
    if (!state.committed) return Promise.resolve({ ok: false, error: new Error('Load profile before saving') })
    const operation = queue.then(async () => {
      publish({ status: 'saving' })
      try {
        const previous = state.committed
        const previousDraft = state.draft
        const patch = await getPatch()
        const committed = normalizeProfile(await persistence.save(patch))
        const draft = { ...state.draft }
        for (const field of ['name', 'email']) {
          if (draft[field] === previous[field] && draft[field] === previousDraft[field]) draft[field] = committed[field]
        }
        publish({ status: 'committed', committed, draft })
        return { ok: true, profile: committed }
      } catch (error) {
        publish({ status: 'failed' })
        return { ok: false, error }
      }
    })
    queue = operation.then(() => {})
    return operation
  }
  return {
    getState: () => state,
    subscribe(listener) {
      listeners.add(listener)
      listener(state)
      return () => listeners.delete(listener)
    },
    load() {
      if (loading) return loading
      publish({ status: 'loading' })
      loading = (async () => {
        try {
          const committed = normalizeProfile(await persistence.load())
          publish({ status: 'committed', committed, draft: { ...committed } })
          return { ok: true, profile: committed }
        } catch (error) {
          publish({ status: 'unavailable' })
          return { ok: false, error }
        } finally {
          loading = null
        }
      })()
      return loading
    },
    edit(patch) { publish({ draft: { ...state.draft, ...patch } }) },
    async saveText() {
      const name = state.draft.name.trim()
      const email = state.draft.email.trim()
      if (!name) return { ok: false, error: new Error('Please enter a username') }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return { ok: false, error: new Error('Please enter a valid email') }
      }
      const patch = {}
      if (name !== state.committed?.name) patch.name = name
      if (email !== state.committed?.email) patch.email = email
      const result = await mutate(() => patch)
      if (result.ok && state.draft.name.trim() === name && state.draft.email.trim() === email) {
        publish({ draft: { ...state.draft, name: result.profile.name, email: result.profile.email } })
      }
      return result
    },
    replaceAvatar(file) { return mutate(async () => ({ avatarImage: await createAvatarImage(file) })) },
    removeAvatar() { return mutate(() => ({ avatarImage: null })) }
  }
}

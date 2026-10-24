import assert from 'node:assert/strict'
import { createProfileLifecycle } from '/src/domain/profile.js'

const original = { name: 'Rupert', email: 'rupert@example.com', avatarImage: 'old-avatar' }
const setup = (overrides = {}) => {
  let stored = { ...original }
  const persistence = {
    async load() { return stored },
    async save(patch) { stored = { ...stored, ...patch }; return stored },
    ...overrides
  }
  const lifecycle = createProfileLifecycle({ persistence, createAvatarImage: async file => file, ...overrides.adapters })
  return { lifecycle, persistence, getStored: () => stored }
}

export const tests = [
  {
    name: 'independent profiles preserve renamed text during stale avatar removal and later email edits',
    async run() {
      const { lifecycle: first, persistence, getStored } = setup()
      const second = createProfileLifecycle({ persistence, createAvatarImage: async file => file })
      await Promise.all([first.load(), second.load()])
      first.edit({ name: 'New name' })
      await first.saveText()
      await second.removeAvatar()
      assert.deepEqual(getStored(), { ...original, name: 'New name', avatarImage: null })
      assert.equal(second.getState().draft.name, 'New name')
      second.edit({ email: 'new@example.com' })
      await second.saveText()
      assert.deepEqual(getStored(), { name: 'New name', email: 'new@example.com', avatarImage: null })
    }
  },
  {
    name: 'a stale profile sends only edited text fields and preserves drafts during avatar reconciliation',
    async run() {
      const { lifecycle: first, persistence, getStored } = setup()
      const second = createProfileLifecycle({ persistence, createAvatarImage: async file => file })
      await Promise.all([first.load(), second.load()])
      first.edit({ name: 'New name' })
      await first.saveText()
      second.edit({ email: 'new@example.com' })
      await second.saveText()
      assert.deepEqual(getStored(), { ...original, name: 'New name', email: 'new@example.com' })
      second.edit({ name: 'Unsaved draft' })
      await second.replaceAvatar('new-avatar')
      assert.equal(second.getState().draft.name, 'Unsaved draft')
      assert.equal(getStored().name, 'New name')
    }
  },
  {
    name: 'profile failed load blocks writes and can be retried without defaults overwriting saved data',
    async run() {
      let fail = true
      let writes = 0
      const { lifecycle } = setup({
        async load() { if (fail) throw new Error('offline'); return original },
        async save() { writes++; return original }
      })
      assert.equal((await lifecycle.load()).ok, false)
      assert.equal(lifecycle.getState().status, 'unavailable')
      assert.equal((await lifecycle.saveText()).ok, false)
      assert.equal((await lifecycle.replaceAvatar('new')).ok, false)
      assert.equal(writes, 0)
      fail = false
      assert.equal((await lifecycle.load()).ok, true)
      assert.deepEqual(lifecycle.getState().committed, original)
    }
  },
  {
    name: 'profile save failure retains committed value and exact draft for retry, success uses server response',
    async run() {
      let fail = true
      const { lifecycle } = setup({ async save(profile) {
        if (fail) throw new Error('offline')
        return { ...original, ...profile, name: 'Server normalized' }
      } })
      await lifecycle.load()
      lifecycle.edit({ name: ' New name ', email: 'new@example.com' })
      const draft = lifecycle.getState().draft
      assert.equal((await lifecycle.saveText()).ok, false)
      assert.deepEqual(lifecycle.getState().committed, original)
      assert.deepEqual(lifecycle.getState().draft, draft)
      fail = false
      const result = await lifecycle.saveText()
      assert.equal(result.profile.name, 'Server normalized')
      assert.equal(lifecycle.getState().draft.name, 'Server normalized')
      assert.equal(result.profile.avatarImage, original.avatarImage)
    }
  },
  {
    name: 'profile serializes slow image conversion, text edits and avatar removal with no stale document writes',
    async run() {
      let resolveImage
      const image = new Promise(resolve => { resolveImage = resolve })
      const { lifecycle, getStored } = setup({ adapters: { createAvatarImage: () => image } })
      await lifecycle.load()
      const avatar = lifecycle.replaceAvatar('file')
      lifecycle.edit({ name: 'Updated' })
      const text = lifecycle.saveText()
      const removal = lifecycle.removeAvatar()
      resolveImage('new-avatar')
      assert.equal((await avatar).profile.avatarImage, 'new-avatar')
      assert.equal((await text).profile.avatarImage, 'new-avatar')
      assert.equal((await removal).profile.name, 'Updated')
      assert.deepEqual(getStored(), { ...original, name: 'Updated', avatarImage: null })
    }
  },
  {
    name: 'profile image and write failures preserve saved data and do not poison later queued mutations',
    async run() {
      const { lifecycle, persistence, getStored } = setup({ adapters: { createAvatarImage: async () => { throw new Error('decode failed') } } })
      await lifecycle.load()
      assert.equal((await lifecycle.replaceAvatar('broken')).ok, false)
      assert.deepEqual(lifecycle.getState().committed, original)
      const save = persistence.save
      persistence.save = async () => { throw new Error('write failed') }
      assert.equal((await lifecycle.removeAvatar()).ok, false)
      assert.deepEqual(getStored(), original)
      persistence.save = save
      assert.equal((await lifecycle.removeAvatar()).ok, true)
      assert.equal(getStored().avatarImage, null)
    }
  },
  {
    name: 'profile rejects invalid text without persisting and keeps edits made during a save',
    async run() {
      let finish
      let started
      const pending = new Promise(resolve => { started = resolve })
      const { lifecycle } = setup({ async save(profile) { await new Promise(resolve => { finish = resolve; started() }); return { ...original, ...profile } } })
      await lifecycle.load()
      lifecycle.edit({ email: 'invalid' })
      assert.equal((await lifecycle.saveText()).ok, false)
      lifecycle.edit({ email: original.email, name: 'First' })
      const saving = lifecycle.saveText()
      await pending
      lifecycle.edit({ name: 'Later' })
      finish()
      await saving
      assert.equal(lifecycle.getState().draft.name, 'Later')
      assert.equal(lifecycle.getState().committed.name, 'First')
    }
  },
  {
    name: 'profile keeps a draft reverted to its old value while a text save is pending',
    async run() {
      let finish
      const { lifecycle } = setup({ async save(patch) {
        await new Promise(resolve => { finish = resolve })
        return { ...original, ...patch }
      } })
      await lifecycle.load()
      lifecycle.edit({ name: 'First' })
      const saving = lifecycle.saveText()
      while (!finish) await Promise.resolve()
      lifecycle.edit({ name: original.name })
      finish()
      await saving
      assert.equal(lifecycle.getState().draft.name, original.name)
      assert.equal(lifecycle.getState().committed.name, 'First')
    }
  }
]

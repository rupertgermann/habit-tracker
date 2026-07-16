import { createBackupPersistence } from '../domain/backup'
import { habitsApi } from './habitsApi'

export const createHttpBackupPersistence = (api = habitsApi) => createBackupPersistence({
  readState: () => api.getState(),
  restoreState: async state => {
    const result = await api.restore(state)
    return result.state
  }
})

export const backupPersistence = createHttpBackupPersistence()

export const MAX_BACKUP_BYTES = 32 * 1024 * 1024
export const BACKUP_SIZE_ERROR_MESSAGE = 'Backup exceeds the 32 MiB size limit.'

export const assertBackupSize = byteLength => {
  if (byteLength <= MAX_BACKUP_BYTES) return
  const error = new Error(BACKUP_SIZE_ERROR_MESSAGE)
  error.code = 'backup-too-large'
  error.status = 413
  throw error
}

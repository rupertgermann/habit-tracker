import { assertBackupSize } from '../../shared/backupLimits.mjs'

export const createBrowserBackupAdapter = ({
  documentObject = globalThis.document,
  FileReaderClass = globalThis.FileReader,
  BlobClass = globalThis.Blob,
  URLObject = globalThis.URL
} = {}) => ({
  download({ serialized, filename }) {
    const blob = new BlobClass([serialized], { type: 'application/json' })
    const url = URLObject.createObjectURL(blob)
    const link = documentObject.createElement('a')

    try {
      link.href = url
      link.download = filename
      documentObject.body?.append?.(link)
      link.click()
    } finally {
      documentObject.body?.removeChild?.(link)
      URLObject.revokeObjectURL(url)
    }
  },

  selectFile() {
    return new Promise((resolve, reject) => {
      const input = documentObject.createElement('input')
      input.type = 'file'
      input.accept = '.json,application/json'
      input.hidden = true

      input.oncancel = () => {
        input.remove()
        resolve({ status: 'cancelled' })
      }
      input.onchange = () => {
        const file = input.files?.[0]
        input.remove()
        if (!file) {
          resolve({ status: 'cancelled' })
          return
        }
        try {
          assertBackupSize(file.size)
        } catch (error) {
          reject(error)
          return
        }

        const reader = new FileReaderClass()
        reader.onload = () => resolve({
          status: 'selected',
          filename: file.name,
          serialized: String(reader.result)
        })
        reader.onerror = () => reject(reader.error || new Error('Unable to read backup file'))
        reader.readAsText(file)
      }

      documentObject.body.append(input)
      try {
        input.click()
      } catch (error) {
        input.remove()
        reject(error)
      }
    })
  }
})

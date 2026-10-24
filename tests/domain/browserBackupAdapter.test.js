import assert from 'node:assert/strict'
import { MAX_BACKUP_BYTES, BACKUP_SIZE_ERROR_MESSAGE } from '/shared/backupLimits.mjs'
import { createBrowserBackupAdapter } from '/src/adapters/browserBackup.js'

const createFileDocument = (files, onClick = input => input.onchange()) => {
  const input = {
    files,
    isConnected: false,
    click() {
      assert.equal(this.isConnected, true)
      assert.equal(this.hidden, true)
      onClick(this)
    },
    remove() { this.isConnected = false }
  }
  return {
    input,
    body: { append(element) { element.isConnected = true } },
    createElement() { return input }
  }
}

export const tests = [
  {
    name: 'browser backup selection rejects oversized files before constructing a FileReader',
    async run() {
      let readers = 0
      const documentObject = createFileDocument([{ name: 'large.json', size: MAX_BACKUP_BYTES + 1 }])
      const adapter = createBrowserBackupAdapter({
        documentObject,
        FileReaderClass: class { constructor() { readers += 1 } }
      })
      await assert.rejects(adapter.selectFile(), error =>
        error.code === 'backup-too-large' && error.message === BACKUP_SIZE_ERROR_MESSAGE)
      assert.equal(readers, 0)
      assert.equal(documentObject.input.isConnected, false)
    }
  },
  {
    name: 'browser backup adapter downloads prepared content and treats file cancellation as a no-op',
    async run() {
      const clicks = []
      const createdUrls = []
      const revokedUrls = []
      let input
      const documentObject = {
        body: {
          append(element) { element.isConnected = true },
          removeChild() {}
        },
        createElement(tagName) {
          if (tagName === 'a') {
            return {
              click() {
                clicks.push({
                  href: this.href,
                  download: this.download
                })
              }
            }
          }
          input = {
            files: [],
            click() {
              assert.equal(this.isConnected, true)
              this.oncancel()
            },
            remove() { this.isConnected = false }
          }
          return input
        }
      }
      const adapter = createBrowserBackupAdapter({
        documentObject,
        BlobClass: class {
          constructor(parts, options) {
            this.parts = parts
            this.options = options
          }
        },
        URLObject: {
          createObjectURL(blob) {
            createdUrls.push(blob)
            return 'blob:backup'
          },
          revokeObjectURL(url) {
            revokedUrls.push(url)
          }
        }
      })

      adapter.download({
        serialized: '{"formatVersion":2}',
        filename: 'habit-tracker-backup-2026-07-16.json'
      })
      const selection = await adapter.selectFile()

      assert.deepEqual(clicks, [{
        href: 'blob:backup',
        download: 'habit-tracker-backup-2026-07-16.json'
      }])
      assert.deepEqual(createdUrls[0].parts, ['{"formatVersion":2}'])
      assert.deepEqual(revokedUrls, ['blob:backup'])
      assert.deepEqual(selection, { status: 'cancelled' })
      assert.equal(input.isConnected, false)
    }
  },
  {
    name: 'browser backup adapter reports file read failure without producing restore content',
    async run() {
      const readError = new Error('read failed')
      const documentObject = createFileDocument([{ name: 'backup.json', size: 2 }])
      const adapter = createBrowserBackupAdapter({
        documentObject,
        FileReaderClass: class {
          readAsText() {
            this.error = readError
            this.onerror()
          }
        }
      })

      await assert.rejects(adapter.selectFile(), error => error === readError)
      assert.equal(documentObject.input.isConnected, false)
    }
  },
  {
    name: 'browser backup selection removes the input after reading a selected file',
    async run() {
      const documentObject = createFileDocument([{ name: 'backup.json', size: 2 }])
      const adapter = createBrowserBackupAdapter({
        documentObject,
        FileReaderClass: class {
          readAsText() {
            this.result = '{}'
            this.onload()
          }
        }
      })

      assert.deepEqual(await adapter.selectFile(), {
        status: 'selected', filename: 'backup.json', serialized: '{}'
      })
      assert.equal(documentObject.input.isConnected, false)
    }
  },
  {
    name: 'browser backup selection removes the input when no file is selected',
    async run() {
      const documentObject = createFileDocument([])
      const adapter = createBrowserBackupAdapter({ documentObject })

      assert.deepEqual(await adapter.selectFile(), { status: 'cancelled' })
      assert.equal(documentObject.input.isConnected, false)
    }
  },
  {
    name: 'browser backup selection removes the input when opening the chooser fails',
    async run() {
      const clickError = new Error('chooser failed')
      const documentObject = createFileDocument([], () => { throw clickError })
      const adapter = createBrowserBackupAdapter({ documentObject })

      await assert.rejects(adapter.selectFile(), error => error === clickError)
      assert.equal(documentObject.input.isConnected, false)
    }
  },
  {
    name: 'browser backup adapter exposes download failures to its caller',
    run() {
      const downloadError = new Error('download failed')
      const adapter = createBrowserBackupAdapter({
        documentObject: {},
        BlobClass: class {},
        URLObject: {
          createObjectURL() {
            throw downloadError
          }
        }
      })

      assert.throws(
        () => adapter.download({
          serialized: '{"formatVersion":2}',
          filename: 'habit-tracker-backup-2026-07-16.json'
        }),
        error => error === downloadError
      )
    }
  }
]

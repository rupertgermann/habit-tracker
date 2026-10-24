import assert from 'node:assert/strict'
import { MAX_BACKUP_BYTES, BACKUP_SIZE_ERROR_MESSAGE } from '/shared/backupLimits.mjs'
import { createBrowserBackupAdapter } from '/src/adapters/browserBackup.js'

export const tests = [
  {
    name: 'browser backup selection rejects oversized files before constructing a FileReader',
    async run() {
      let readers = 0
      const adapter = createBrowserBackupAdapter({
        documentObject: {
          createElement() {
            return {
              files: [{ name: 'large.json', size: MAX_BACKUP_BYTES + 1 }],
              click() { this.onchange() }
            }
          }
        },
        FileReaderClass: class { constructor() { readers += 1 } }
      })
      await assert.rejects(adapter.selectFile(), error =>
        error.code === 'backup-too-large' && error.message === BACKUP_SIZE_ERROR_MESSAGE)
      assert.equal(readers, 0)
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
          append() {},
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
              this.oncancel()
            }
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
    }
  },
  {
    name: 'browser backup adapter reports file read failure without producing restore content',
    async run() {
      const readError = new Error('read failed')
      const adapter = createBrowserBackupAdapter({
        documentObject: {
          createElement() {
            return {
              files: [{ name: 'backup.json', size: 2 }],
              click() {
                this.onchange()
              }
            }
          }
        },
        FileReaderClass: class {
          readAsText() {
            this.error = readError
            this.onerror()
          }
        }
      })

      await assert.rejects(adapter.selectFile(), error => error === readError)
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

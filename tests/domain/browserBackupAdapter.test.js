import assert from 'node:assert/strict'
import { createBrowserBackupAdapter } from '/src/adapters/browserBackup.js'

export const tests = [
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
              files: [{ name: 'backup.json' }],
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
  }
]

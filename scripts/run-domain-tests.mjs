import { createServer } from 'vite'

const testModules = [
  '/tests/appDesign/catalog.test.js',
  '/tests/domain/backup.test.js',
  '/tests/domain/browserBackupAdapter.test.js',
  '/tests/domain/habitTracking.test.js',
  '/tests/domain/habitLifecycle.test.js',
  '/tests/domain/dashboardHabitTracking.test.js',
  '/tests/domain/progressReadModel.test.js',
  '/tests/domain/dailyReminder.test.js',
  '/tests/domain/journalEntryWrites.test.js',
  '/tests/domain/journalTimeline.test.js',
  '/tests/context/preferencesContext.test.js',
  '/tests/context/themeContext.test.js'
]

const server = await createServer({
  appType: 'custom',
  logLevel: 'error',
  ssr: {
    noExternal: ['styled-components']
  },
  server: {
    middlewareMode: true,
    hmr: false
  }
})

let passed = 0
let failed = 0

try {
  for (const modulePath of testModules) {
    const module = await server.ssrLoadModule(modulePath)

    for (const testCase of module.tests) {
      try {
        await testCase.run()
        passed += 1
        console.log(`ok ${passed + failed} - ${testCase.name}`)
      } catch (error) {
        failed += 1
        console.error(`not ok ${passed + failed} - ${testCase.name}`)
        console.error(error)
      }
    }
  }
} finally {
  await server.close()
}

console.log(`${passed} passed, ${failed} failed`)

if (failed > 0) {
  process.exitCode = 1
}

import { createServer } from 'vite'

const testModules = [
  '/tests/domain/habitTracking.test.js',
  '/tests/domain/journalTimeline.test.js',
  '/tests/context/preferencesContext.test.js',
  '/tests/context/themeContext.test.js'
]

const server = await createServer({
  appType: 'custom',
  logLevel: 'error',
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

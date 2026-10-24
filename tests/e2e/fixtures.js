import { test as base, expect } from '@playwright/test'

// Functional tests use fallback fonts so external CSS cannot stall navigation.
export const test = base.extend({
  localFonts: [async ({ context }, use) => {
    await context.route('https://fonts.googleapis.com/**', route =>
      route.fulfill({ contentType: 'text/css', body: '' }))
    await use()
  }, { auto: true }]
})

export { expect }

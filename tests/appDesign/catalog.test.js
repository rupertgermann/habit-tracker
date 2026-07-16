import assert from 'node:assert/strict'
import {
  createAppDesignCatalog,
  DEFAULT_APP_DESIGN_ID,
  getAppDesign,
  getAppDesignTheme,
  listAppDesigns,
  normalizeAppDesignId
} from '/src/appDesign/catalog.jsx'

const expectedDesigns = [
  {
    id: 'standard',
    name: 'Standard',
    description: 'The familiar, friendly green Habit Tracker.',
    commit: '2bbc54a61644f1e0ccda4d474a04af2e42bc3932',
    preview: ['#FFFFFF', '#4CAF50', '#FFC107', '#212121'],
    frame: {
      mobile: { padding: '0 0 80px' },
      wide: { padding: '64px 0 0' }
    }
  },
  {
    id: 'rhythm-ledger',
    name: 'Rhythm Ledger',
    description: 'Warm paper, editorial type, and a seven-day rhythm rail.',
    commit: '7c9a357e5f9fb6191abb4640dd256eb8272a8b31',
    preview: ['#F2EBDD', '#C63E27', '#D7A928', '#201D18'],
    frame: {
      mobile: { padding: '0 0 92px' },
      wide: { padding: '0 0 0 112px' }
    }
  },
  {
    id: 'orbit',
    name: 'Orbit',
    description: 'A spatial command deck with cobalt paths and lime signals.',
    commit: '7aec7cbf85c486775f68cb6c72fc4bc4897776b2',
    preview: ['#E6ECF4', '#3457D5', '#C6E84D', '#111827'],
    frame: {
      mobile: { padding: '0 0 calc(76px + env(safe-area-inset-bottom, 0px))' },
      wide: { padding: '0 0 0 168px' }
    }
  },
  {
    id: 'quiet-momentum',
    name: 'Quiet Momentum',
    description: 'Soft botanical calm for deliberate, low-noise progress.',
    commit: '24ddae65079ecdf2bbb8249c57b3c2b9df66d4f8',
    preview: ['#F3EFE6', '#526B54', '#E4B75D', '#263028'],
    frame: {
      mobile: { padding: '0 0 calc(76px + env(safe-area-inset-bottom, 0px))' },
      wide: { padding: '88px 0 0' }
    }
  },
  {
    id: 'sunday-club',
    name: 'Sunday Club',
    description: 'Playful punch cards, bright ink, and a little weekend energy.',
    commit: '9e35ba2350cecc709ce01d5552a59d9d59e629fb',
    preview: ['#F6EFAF', '#1D5BFF', '#FF4E9B', '#171A17'],
    frame: {
      mobile: { padding: '0 0 calc(76px + env(safe-area-inset-bottom, 0px))' },
      wide: { padding: '0 176px 0 0' }
    }
  }
]

export const tests = [
  {
    name: 'app design catalog resolves a complete Standard registration',
    run() {
      const design = getAppDesign(DEFAULT_APP_DESIGN_ID)

      assert.equal(design.id, 'standard')
      assert.equal(design.name, 'Standard')
      assert.equal(design.description, 'The familiar, friendly green Habit Tracker.')
      assert.equal(design.commit, '2bbc54a61644f1e0ccda4d474a04af2e42bc3932')
      assert.deepEqual(design.preview, ['#FFFFFF', '#4CAF50', '#FFC107', '#212121'])
      assert.equal(design.themes.light.mode, 'light')
      assert.equal(design.themes.dark.mode, 'dark')
      assert.ok(design.globalStyles)
      assert.ok(design.dashboard)
      assert.ok(design.primaryNavigation)
      assert.deepEqual(design.frame, {
        mobile: { padding: '0 0 80px' },
        wide: { padding: '64px 0 0' }
      })
    }
  },
  {
    name: 'app design catalog lists all five complete authored registrations',
    run() {
      const designs = listAppDesigns()

      assert.equal(designs.length, expectedDesigns.length)

      expectedDesigns.forEach((expected, index) => {
        const design = designs[index]

        assert.deepEqual({
          id: design.id,
          name: design.name,
          description: design.description,
          commit: design.commit,
          preview: design.preview,
          frame: design.frame
        }, expected)
        assert.equal(design.themes.light.mode, 'light')
        assert.equal(design.themes.dark.mode, 'dark')
        assert.ok(design.globalStyles)
        assert.ok(design.dashboard)
        assert.ok(design.primaryNavigation)
        assert.equal(getAppDesign(expected.id), design)
      })
    }
  },
  {
    name: 'app design catalog falls back to Standard for unsupported, empty, or malformed ids',
    run() {
      const standard = getAppDesign(DEFAULT_APP_DESIGN_ID)

      for (const value of [
        'unsupported',
        '',
        ' orbit ',
        null,
        undefined,
        {},
        ['orbit']
      ]) {
        assert.equal(normalizeAppDesignId(value), DEFAULT_APP_DESIGN_ID)
        assert.equal(getAppDesign(value), standard)
      }
    }
  },
  {
    name: 'app design catalog resolves light and dark themes within every registration',
    run() {
      const expectedPrimaryColors = {
        standard: { light: '#4CAF50', dark: '#66BB6A' },
        'rhythm-ledger': { light: '#C63E27', dark: '#FF6B4A' },
        orbit: { light: '#3457D5', dark: '#7D9BFF' },
        'quiet-momentum': { light: '#526B54', dark: '#A9C2A5' },
        'sunday-club': { light: '#1D5BFF', dark: '#78A0FF' }
      }

      for (const [id, colors] of Object.entries(expectedPrimaryColors)) {
        const light = getAppDesignTheme(id, false)
        const dark = getAppDesignTheme(id, true)

        assert.equal(light.design, id)
        assert.equal(light.mode, 'light')
        assert.equal(light.colors.primary, colors.light)
        assert.equal(dark.design, id)
        assert.equal(dark.mode, 'dark')
        assert.equal(dark.colors.primary, colors.dark)
      }
    }
  },
  {
    name: 'app design catalog rejects incomplete registrations',
    run() {
      const { dashboard: _dashboard, ...incompleteStandard } = getAppDesign('standard')

      assert.throws(
        () => createAppDesignCatalog([incompleteStandard]),
        /standard.*dashboard/i
      )
    }
  }
]

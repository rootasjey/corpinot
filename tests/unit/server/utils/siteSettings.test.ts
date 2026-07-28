import { describe, expect, it, vi, beforeEach } from 'vitest'

const { dbMock } = vi.hoisted(() => {
  const findFirst = vi.fn()
  const run = vi.fn().mockResolvedValue({})
  const values = vi.fn().mockReturnValue({ run })
  const insert = vi.fn().mockReturnValue({ values })
  const update = vi.fn().mockReturnValue({
    set: vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({ run }),
    }),
  })

  return {
    dbMock: {
      query: {
        site_settings: {
          findFirst,
        },
      },
      insert,
      update,
    },
  }
})

vi.mock('hub:db', () => {
  const schema = { site_settings: {} }
  return { db: dbMock, schema }
})

import { getSettingValue, setSettingValue } from '../../../../server/utils/siteSettings'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('getSettingValue', () => {
  it('returns fallback when no setting exists', async () => {
    dbMock.query.site_settings.findFirst.mockResolvedValue(null)

    const result = await getSettingValue('socials', [])
    expect(result).toEqual([])
  })

  it('parses existing setting value', async () => {
    dbMock.query.site_settings.findFirst.mockResolvedValue({
      value: JSON.stringify([{ platform: 'github', url: 'https://github.com/test' }]),
    })

    const result = await getSettingValue('socials', [])
    expect(result).toEqual([{ platform: 'github', url: 'https://github.com/test' }])
  })

  it('returns fallback on invalid JSON', async () => {
    dbMock.query.site_settings.findFirst.mockResolvedValue({ value: 'invalid json' })

    const result = await getSettingValue('socials', [])
    expect(result).toEqual([])
  })
})

describe('setSettingValue', () => {
  it('inserts new setting when key does not exist', async () => {
    dbMock.query.site_settings.findFirst.mockResolvedValue(null)

    await setSettingValue('socials', [{ platform: 'github', url: 'https://github.com/test' }])

    expect(dbMock.insert).toHaveBeenCalled()
  })

  it('updates existing setting when key exists', async () => {
    dbMock.query.site_settings.findFirst.mockResolvedValue({ id: 1 })

    await setSettingValue('socials', [{ platform: 'github', url: 'https://github.com/test' }])

    expect(dbMock.update).toHaveBeenCalled()
    expect(dbMock.insert).not.toHaveBeenCalled()
  })
})

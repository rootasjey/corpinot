import { db, schema } from 'hub:db'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

export const SOCIALS_KEY = 'socials'

export const socialLinkSchema = z.object({
  platform: z.string().min(1),
  url: z.string().url(),
  label: z.string().optional(),
  order: z.number().optional(),
  enabled: z.boolean().optional(),
})

export const socialsSchema = z.array(socialLinkSchema)

export type SocialLink = z.infer<typeof socialLinkSchema>

export async function getSettingValue<T = unknown>(key: string, fallback: T): Promise<T> {
  const existing = await db.query.site_settings.findFirst({ where: eq(schema.site_settings.key, key) })
  if (!existing?.value) return fallback
  try {
    return JSON.parse(existing.value) as T
  } catch (error) {
    console.error('Failed to parse site setting', key, error)
    return fallback
  }
}

export async function setSettingValue(key: string, value: unknown) {
  const serialized = JSON.stringify(value)
  const existing = await db.query.site_settings.findFirst({ where: eq(schema.site_settings.key, key) })

  if (existing) {
    await db
      .update(schema.site_settings)
      .set({ value: serialized, updated_at: new Date().toISOString() })
      .where(eq(schema.site_settings.id, existing.id))
      .run()
    return
  }

  await db
    .insert(schema.site_settings)
    .values({ key, value: serialized, created_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .run()
}

export async function getSocials(): Promise<SocialLink[]> {
  return getSettingValue<SocialLink[]>(SOCIALS_KEY, [])
}

export async function setSocials(socials: SocialLink[]) {
  socialsSchema.parse(socials)
  await setSettingValue(SOCIALS_KEY, socials)
}

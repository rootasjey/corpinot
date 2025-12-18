import { db, schema } from 'hub:db'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

const bodySchema = z.object({
  email: z.string().email(),
})

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, bodySchema.parse)
  const normalizedEmail = body.email.trim().toLowerCase()

  const session = await getUserSession(event).catch(() => null)
  const userId = session?.user?.id ? Number(session.user.id) : null

  const ip = getRequestHeader(event, 'x-forwarded-for')?.split(',')[0]?.trim() ?? ''
  const userAgent = getRequestHeader(event, 'user-agent') ?? ''
  const metadata = JSON.stringify({ ip, userAgent })

  try {
    const existing = await db.query.newsletter_subscribers.findFirst({
      where: eq(schema.newsletter_subscribers.email, normalizedEmail),
    })

    const updateSet: Partial<typeof schema.newsletter_subscribers.$inferInsert> = {
      status: 'subscribed',
      metadata,
    }

    if (userId) {
      updateSet.user_id = userId
    }

    await db
      .insert(schema.newsletter_subscribers)
      .values({
        email: normalizedEmail,
        user_id: userId ?? null,
        status: 'subscribed',
        metadata,
      })
      .onConflictDoUpdate({
        target: schema.newsletter_subscribers.email,
        set: updateSet,
      })
      .run()

    return {
      ok: true,
      status: 'subscribed',
      alreadySubscribed: existing?.status === 'subscribed',
      message: 'Thanks for subscribing! You will hear from us soon.',
    }
  } catch (error: any) {
    console.error('newsletter subscribe error:', error)
    throw createError({ statusCode: 500, message: 'Failed to subscribe' })
  }
})

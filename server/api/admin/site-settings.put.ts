import { eventHandler, readBody, createError } from 'h3'
import { socialsSchema, setSocials } from '~~/server/utils/siteSettings'

export default eventHandler(async (event) => {
  const session = await requireUserSession(event)
  if (session.user.role !== 'admin') {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  const body = await readBody(event)
  const parsed = socialsSchema.safeParse(body?.socials ?? body)

  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid socials', data: parsed.error.flatten() })
  }

  await setSocials(parsed.data)

  return { message: 'Site socials updated', socials: parsed.data }
})

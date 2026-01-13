import { db, schema } from 'hub:db'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

const bodySchema = z.object({
  email: z.email(),
  password: z.string().min(8)
})

export default defineEventHandler(async (event) => {
  const { email, password } = await readValidatedBody(event, bodySchema.parse)

  const userData = await db.query.users.findFirst({
    where: eq(schema.users.email, email),
  })

  if (!userData) {
    throw createError({
      statusCode: 401,
      message: 'Bad credentials'
    })
  }

  const isValidPassword = await verifyPassword(userData.password as string, password)
  
  if (!isValidPassword) {
    throw createError({
      statusCode: 401,
      message: 'Bad credentials'
    })
  }

  const sessionUser = {
    avatar: userData.avatar ?? '',
    biography: userData.biography ?? '',
    created_at: userData.created_at,
    email: userData.email,
    id: userData.id,
    job: userData.job ?? '',
    language: userData.language ?? 'en',
    location: userData.location ?? '',
    name: userData.name,
    role: userData.role,
    socials: userData.socials ?? '[]',
    updated_at: userData.updated_at,
  }

  await setUserSession(event, { user: sessionUser })
  return { user: sessionUser }
})
// DELETE /api/user/avatar
import { blob } from 'hub:blob'
import { db, schema } from 'hub:db'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const userId = session.user.id
  const hb = blob
  const database = db

  // Find current avatar
  const user = await database.query.users.findFirst({ columns: { avatar: true }, where: eq(schema.users.id, userId) })
  if (!user) throw createError({ statusCode: 404, message: 'User not found' })

  if (!user.avatar) {
    throw createError({ statusCode: 400, message: 'No avatar to delete' })
  }

  try {
    const folderPrefix = user.avatar.replace(/^\/+/, '').replace(/\/[^\/]+$/, '')
    const blobList = await hb.list({ prefix: folderPrefix })
    for (const b of blobList.blobs) {
      await hb.del(b.pathname)
    }

    await database.update(schema.users).set({ avatar: '', updated_at: new Date().toISOString() }).where(eq(schema.users.id, userId)).run()
    await replaceUserSession(event, { user: { ...session.user, avatar: '' } })

    return { success: true, message: 'Avatar removed' }
  } catch (err) {
    console.error('Failed to delete avatar:', err)
    throw createError({ statusCode: 500, message: 'Failed to delete avatar' })
  }
})

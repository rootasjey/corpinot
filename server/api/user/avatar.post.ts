// POST /api/user/avatar
import { blob } from 'hub:blob'
import { db, schema } from 'hub:db'
import { eq } from 'drizzle-orm'
import { Jimp } from 'jimp'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const userId = session.user.id
  console.log('[avatar.post] userId=', userId)
  const hb = blob
  const database = db

  const formData = await readMultipartFormData(event)
  const file = formData?.find((item) => item.name === 'file')?.data
  const fileName = formData?.find((item) => item.name === 'fileName')?.data?.toString()
  const type = formData?.find((item) => item.name === 'type')?.data?.toString()

  if (!file || !fileName || !type) {
    throw createError({ statusCode: 400, message: 'Missing file or metadata' })
  }

  // Minimal validation: ensure this is an image and is one of the supported mime types.
  const supportedMimes = [
    'image/png',
    'image/jpeg',
    'image/gif',
    'image/bmp',
    'image/x-ms-bmp',
    'image/tiff',
    'image/webp'
  ] as const
  type SupportedMime = typeof supportedMimes[number]

  // Some clients send `image/jpg` — normalize that to `image/jpeg` for downstream APIs.
  const mimeAliases: Record<string, SupportedMime> = {
    'image/jpg': 'image/jpeg'
  }

  if (!type.startsWith('image/')) {
    throw createError({ statusCode: 400, message: 'File must be an image' })
  }

  if (!((supportedMimes as readonly string[]).includes(type) || type in mimeAliases)) {
    throw createError({ statusCode: 400, message: 'Unsupported image format' })
  }

  const mime = (type in mimeAliases ? (mimeAliases as Record<string, SupportedMime>)[type] : (type as SupportedMime))

  const mimeToExt: Record<SupportedMime, string> = {
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/gif': 'gif',
    'image/bmp': 'bmp',
    'image/x-ms-bmp': 'bmp',
    'image/tiff': 'tiff',
    'image/webp': 'webp'
  }

  const extension = mimeToExt[mime]
  const avatarFolder = `users/${userId}/avatar`

  // Process image
  const originalImage = await Jimp.fromBuffer(file)
  const sizes = [
    { width: 48, suffix: 'xxs' },
    { width: 160, suffix: 'sm' },
    { width: 320, suffix: 'md' },
    { width: 640, suffix: 'lg' }
  ]

  const generated: any[] = []
  const fileBlob = new Blob([new Uint8Array(file)], { type: mime })

  const originalPath = `${avatarFolder}/original.${extension}`
  const originalBlob = await hb.put(originalPath, fileBlob, { addRandomSuffix: false })
  generated.push({ size: 'original', pathname: originalBlob.pathname ?? originalPath, width: originalImage.width, height: originalImage.height })

  for (const size of sizes) {
    const resized = originalImage.clone().resize({ w: size.width })

    // Jimp supports a narrower set of MIME strings for getBuffer; map originals like
    // `image/webp` to a Jimp-supported output (PNG preserves transparency).
    type JimpMime = 'image/png' | 'image/jpeg' | 'image/gif' | 'image/bmp' | 'image/x-ms-bmp' | 'image/tiff'
    const mimeToJimp: Record<SupportedMime, JimpMime> = {
      'image/png': 'image/png',
      'image/jpeg': 'image/jpeg',
      'image/gif': 'image/gif',
      'image/bmp': 'image/bmp',
      'image/x-ms-bmp': 'image/x-ms-bmp',
      'image/tiff': 'image/tiff',
      'image/webp': 'image/png'
    }

    const jimpMime = mimeToJimp[mime]
    const jimpMimeToExt: Record<JimpMime, string> = {
      'image/png': 'png',
      'image/jpeg': 'jpg',
      'image/gif': 'gif',
      'image/bmp': 'bmp',
      'image/x-ms-bmp': 'bmp',
      'image/tiff': 'tiff'
    }

    const buffer = await resized.getBuffer(jimpMime)
    const resizedBlob = new Blob([new Uint8Array(buffer)], { type: jimpMime })
    const resizedExt = jimpMimeToExt[jimpMime]
    const resizedPath = `${avatarFolder}/${size.suffix}.${resizedExt}`
    const response = await hb.put(resizedPath, resizedBlob, { addRandomSuffix: false })
    generated.push({ size: size.suffix, pathname: response.pathname ?? resizedPath, width: resized.width, height: resized.height })
  }

  // Store the raw blob path in the DB. The provider will handle the rewrite to /images/...
  // Example: /users/1/avatar/original.png
  const storedPath = `/${originalPath.replace(/^\/+/, '')}`
  try {
    const result = await database.update(schema.users).set({ avatar: storedPath, updated_at: new Date().toISOString() }).where(eq(schema.users.id, userId)).run()
    console.log('[avatar.post] db update result=', result)
  } catch (err: any) {
    console.error('[avatar.post] db update failed:', String(err))
  }

  // Update session so frontend reflects new avatar
  await replaceUserSession(event, { user: { ...session.user, avatar: storedPath } })

  // Return current DB avatar for debugging to ensure update persisted
  const current = await database.query.users.findFirst({ columns: { avatar: true }, where: eq(schema.users.id, userId) })
  return { success: true, image: { src: storedPath, alt: fileName }, generated, dbAvatar: current?.avatar ?? null }
})

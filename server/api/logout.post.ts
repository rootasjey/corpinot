export default defineEventHandler(async (event) => {
  try {
    // Replace session with no user — this is how we 'log out' by clearing the user session
    await replaceUserSession(event, {})
    return { success: true }
  } catch (err: any) {
    console.error('Error logging out:', err)
    throw createError({ statusCode: 500, message: 'Failed to log out' })
  }
})

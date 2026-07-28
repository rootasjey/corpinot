export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('afterResponse', (event: any) => {
    const path = event.path || ''
    if (!path.startsWith('/api/v1/')) return

    setResponseHeader(event, 'access-control-allow-origin', '*')
    setResponseHeader(event, 'access-control-allow-methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS')
    setResponseHeader(event, 'access-control-allow-headers', 'Content-Type, Authorization')
    setResponseHeader(event, 'access-control-max-age', '86400')
  })
})

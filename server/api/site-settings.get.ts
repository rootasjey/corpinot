import { eventHandler } from 'h3'
import { getSocials } from '~~/server/utils/siteSettings'

export default eventHandler(async () => {
  const socials = await getSocials()
  return { socials }
})

import { blob } from 'hub:blob'
import { z } from 'zod'

export default eventHandler(async (event) => {
  const { pathname } = await getValidatedRouterParams(event, z.object({
    pathname: z.string().min(1)
  }).parse)

  let imagePathname = pathname
  const query = getQuery(event)

  if (typeof query.relatedTo === 'string' && typeof query.slug === 'string') {
    imagePathname = `${query.relatedTo}/${query.slug}/${imagePathname}`
  }

  return blob.serve(event, imagePathname)
})

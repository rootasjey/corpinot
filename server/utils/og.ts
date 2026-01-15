/**
 * Open Graph image HTML templates and rendering utilities
 * Used by server/routes/og/[type]/[slug].get.ts to generate OG cards
 */

interface OgHomeData {
  title: string
  description: string
  postCount?: number
}

interface OgPostData {
  title: string
  description: string
  author: {
    name: string
    avatar?: string
  }
  publishedAt?: string
  tags?: string[]
  cover?: string
} 

interface OgAuthorData {
  name: string
  avatar?: string
  biography: string
  postCount?: number
  location?: string
  job?: string
}

interface OgTagData {
  name: string
  description: string
  postCount?: number
  category?: string
}

type OgData = OgHomeData | OgPostData | OgAuthorData | OgTagData

/**
 * Base styles for all OG images - inlined for standalone HTML rendering
 * Design inspired by the clean, minimalist blog theme (dark variant)
 */
const baseStyles = `
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    width: 1200px;
    height: 630px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #0b1220;
    color: #f8fafc;
    overflow: hidden;
    position: relative;
  }
  body::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, #3b82f6 0%, #6366f1 50%, #8b5cf6 100%);
  }
  .container {
    width: 100%;
    height: 100%;
    padding: 100px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    position: relative;
    z-index: 1;
  }
  .cover {
    position: absolute;
    inset: 80px;
    border-radius: 12px;
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    transform: scale(1.02);
    z-index: 0;
    overflow: hidden;
  }
  .cover::after {
    /* subtle dark overlay so text remains legible and image "blends" behind content */
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 12px;
    pointer-events: none;
    z-index: 0;
  }
  .cover { filter: brightness(0.9) saturate(0.95); }
  .header {
    display: flex;
    align-items: center;
    gap: 16px;
  }
  .logo {
    font-size: 28px;
    font-weight: 700;
    letter-spacing: -0.5px;
    color: #f8fafc;
  }
  .content {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 24px;
    max-width: 900px;
  }
  .title {
    font-size: 72px;
    font-weight: 800;
    line-height: 1.1;
    letter-spacing: -2px;
    color: #f8fafc;
    max-height: 240px;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
  }
  .description {
    font-size: 28px;
    line-height: 1.5;
    color: #cbd5e1;
    max-height: 126px;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
  }
  .footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 20px;
    color: #94a3b8;
  }
  .meta {
    display: flex;
    align-items: center;
    gap: 20px;
  }
  .author {
    display: flex;
    align-items: center;
    gap: 16px;
  }
  .avatar {
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background: #0f1724;
    border: 3px solid #1f2937;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    font-weight: 700;
    color: #9ca3af;
  }
  .avatar img {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    object-fit: cover;
  }
  .tags {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
    margin-top: 20px;
  }
  .tag {
    background: #0f1724;
    color: #cbd5e1;
    padding: 10px 20px;
    border-radius: 24px;
    font-size: 18px;
    font-weight: 600;
  }
  .stat {
    background: #0f1724;
    border: 2px solid #1f2937;
    color: #e6eef8;
    padding: 12px 24px;
    border-radius: 12px;
    font-size: 20px;
    font-weight: 600;
  }
`

/**
 * Render home page OG card HTML
 */
function renderHomeHtml(data: OgHomeData): string {
  const baseUrl = useRuntimeConfig().public.siteUrl

  const parts: string[] = []
  parts.push('<!DOCTYPE html>')
  parts.push('<html>')
  parts.push('<head>')
  parts.push('  <meta charset="UTF-8">')
  parts.push('  <base href="' + baseUrl + '/">')
  parts.push('  <style>' + baseStyles + '</style>')
  parts.push('</head>')
  parts.push('<body>')
  // Default cover image (public/images/corpinot-cover.jpeg) blends behind content
  parts.push('  <div class="cover" style="background-image: url(\'' + baseUrl + '/images/corpinot-cover.jpeg\')"></div>')
  parts.push('  <div class="container">')

  // Spacer to push footer to the bottom and keep minimal content (only stats + site)
  parts.push('    <div style="flex: 1;"></div>')
  parts.push('    <div class="footer">')
  parts.push('      <div class="meta">')
  parts.push(data.postCount ? ('        <div class="stat">' + data.postCount + ' posts</div>') : '')
  parts.push('      </div>')
  parts.push('      <div style="color: #94a3b8;">corpinot.cc</div>')
  parts.push('    </div>')
  parts.push('  </div>')
  parts.push('</body>')
  parts.push('</html>')
  return parts.join('\n')
}

/**
 * Render post page OG card HTML
 */
function renderPostHtml(data: OgPostData): string {
  const publishedDate = data.publishedAt
    ? new Date(data.publishedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
    : ''

  const baseUrl = useRuntimeConfig().public.siteUrl

  const parts: string[] = []
  parts.push('<!DOCTYPE html>')
  parts.push('<html>')
  parts.push('<head>')
  parts.push('  <meta charset="UTF-8">')
  parts.push('  <base href="' + baseUrl + '/">')
  parts.push('  <style>' + baseStyles + '</style>')
  parts.push('</head>')
  parts.push('<body>')
  const cover = (data as OgPostData).cover
  if (cover) parts.push('  <div class="cover" style="background-image: url(\'' + escapeHtml(cover) + '\')"></div>')
  parts.push('  <div class="container">')
  parts.push('    <div class="header">')
  parts.push('      <div class="logo">Corpinot</div>')
  parts.push('    </div>')
  parts.push('    <div class="content">')
  parts.push('      <div class="title">' + escapeHtml(data.title) + '</div>')
  if (data.description) parts.push('      <div class="description">' + escapeHtml(data.description) + '</div>')
  if (data.tags && data.tags.length > 0) {
    parts.push('        <div class="tags">')
    parts.push(data.tags.slice(0, 4).map(tag => '<div class="tag">#' + escapeHtml(tag) + '</div>').join(''))
    parts.push('        </div>')
  }
  parts.push('    </div>')
  parts.push('    <div class="footer">')
  parts.push('      <div class="author">')
  parts.push('        <div class="avatar">')
  parts.push(data.author.avatar ? ('<img src="' + escapeHtml(data.author.avatar) + '" alt="' + escapeHtml(data.author.name) + '" />') : data.author.name.charAt(0).toUpperCase())
  parts.push('        </div>')
  parts.push('        <div>')
  parts.push('          <div style="font-weight: 600; color: #f8fafc; font-size: 20px;">' + escapeHtml(data.author.name) + '</div>')
  if (publishedDate) parts.push('          <div style="font-size: 16px; color: #94a3b8; margin-top: 4px;">' + publishedDate + '</div>')
  parts.push('        </div>')
  parts.push('      </div>')
  parts.push('      <div style="color: #94a3b8;">corpinot.cc</div>')
  parts.push('    </div>')
  parts.push('  </div>')
  parts.push('</body>')
  parts.push('</html>')
  return parts.join('\n')
}

/**
 * Render author page OG card HTML
 */
function renderAuthorHtml(data: OgAuthorData): string {
  const baseUrl = useRuntimeConfig().public.siteUrl

  const parts: string[] = []
  parts.push('<!DOCTYPE html>')
  parts.push('<html>')
  parts.push('<head>')
  parts.push('  <meta charset="UTF-8">')
  parts.push('  <base href="' + baseUrl + '/">')
  parts.push('  <style>' + baseStyles + '</style>')
  parts.push('</head>')
  parts.push('<body>')
  parts.push('  <div class="container">')
  parts.push('    <div class="header">')
  parts.push('      <div class="logo">Corpinot</div>')
  parts.push('    </div>')
  parts.push('    <div class="content">')
  parts.push('      <div class="author" style="gap: 28px; margin-bottom: 32px;">')
  parts.push('        <div class="avatar" style="width: 120px; height: 120px; font-size: 48px; border: 4px solid #1f2937;">')
  parts.push(data.avatar ? ('          <img src="' + escapeHtml(data.avatar) + '" alt="' + escapeHtml(data.name) + '" />') : ('          ' + data.name.charAt(0).toUpperCase()))
  parts.push('        </div>')
  parts.push('        <div>')
  parts.push('          <div class="title" style="font-size: 64px;">' + escapeHtml(data.name) + '</div>')
  if (data.job || data.location) {
    parts.push('            <div style="font-size: 24px; color: #cbd5e1; margin-top: 12px; font-weight: 500;">')
    parts.push('              ' + [data.job, data.location].filter(Boolean).join(' · '))
    parts.push('            </div>')
  }
  parts.push('        </div>')
  parts.push('      </div>')
  if (data.biography) parts.push('      <div class="description">' + escapeHtml(data.biography) + '</div>')
  parts.push('    </div>')
  parts.push('    <div class="footer">')
  parts.push('      <div class="meta">')
  parts.push(data.postCount ? ('        <div class="stat">' + data.postCount + ' posts</div>') : '')
  parts.push('      </div>')
  parts.push('      <div style="color: #94a3b8;">corpinot.cc</div>')
  parts.push('    </div>')
  parts.push('  </div>')
  parts.push('</body>')
  parts.push('</html>')
  return parts.join('\n')
}

/**
 * Render tag page OG card HTML
 */
function renderTagHtml(data: OgTagData): string {
  const parts: string[] = []
  parts.push('<!DOCTYPE html>')
  parts.push('<html>')
  parts.push('<head>')
  parts.push('  <meta charset="UTF-8">')
  parts.push('  <style>' + baseStyles + '</style>')
  parts.push('</head>')
  parts.push('<body>')
  parts.push('  <div class="container">')
  parts.push('    <div class="header">')
  parts.push('      <div class="logo">Corpinot</div>')
  parts.push('    </div>')
  parts.push('    <div class="content">')
  parts.push('      <div style="font-size: 24px; color: #cbd5e1; margin-bottom: 20px; text-transform: uppercase; letter-spacing: 3px; font-weight: 700;">')
  parts.push('        ' + (data.category ? escapeHtml(data.category) : 'Tag'))
  parts.push('      </div>')
  parts.push('      <div class="title">#' + escapeHtml(data.name) + '</div>')
  if (data.description) parts.push('      <div class="description">' + escapeHtml(data.description) + '</div>')
  parts.push('    </div>')
  parts.push('    <div class="footer">')
  parts.push('      <div class="meta">')
  parts.push(data.postCount !== undefined ? ('        <div class="stat">' + data.postCount + ' posts</div>') : '')
  parts.push('      </div>')
  parts.push('      <div style="color: #94a3b8;">corpinot.cc</div>')
  parts.push('    </div>')
  parts.push('  </div>')
  parts.push('</body>')
  parts.push('</html>')
  return parts.join('\n')
}
/**
 * Main entry point: render OG HTML based on type and data
 */
export function renderOgHtml(type: string, data: OgData): string {
  switch (type) {
    case 'home':
      return renderHomeHtml(data as OgHomeData)
    case 'post':
      return renderPostHtml(data as OgPostData)
    case 'author':
      return renderAuthorHtml(data as OgAuthorData)
    case 'tag':
      return renderTagHtml(data as OgTagData)
    default:
      throw new Error('Unknown OG type: ' + type)
  }
}

/**
 * Escape HTML to prevent XSS in dynamic content
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }
  return text.replace(/[&<>"']/g, m => map[m] || m)
}

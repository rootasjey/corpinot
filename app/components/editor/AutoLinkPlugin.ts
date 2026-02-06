import { Extension } from '@tiptap/core'
import { Plugin, PluginKey, TextSelection } from 'prosemirror-state'

const URL_REGEX = /^(https?:\/\/[^\s]+)$/i
const PLUGIN_KEY = new PluginKey('autoLinkPlugin')

export default Extension.create({
  name: 'autoLinkPlugin',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: PLUGIN_KEY,
        state: {
          init() {
            return null
          },
          apply(tr, value) {
            const meta = tr.getMeta(PLUGIN_KEY as any)
            if (meta !== undefined) return meta
            // Clear state when doc changes to avoid stale entries
            if (tr.docChanged) return null
            return value
          },
        },

        props: {
          handlePaste(view, event) {
            try {
              const text = event.clipboardData?.getData('text/plain')?.trim() ?? ''
              if (!text) return false
              if (!URL_REGEX.test(text)) return false

              const { state } = view
              const { $from } = state.selection
              if ($from.parent.type.name !== 'paragraph') return false

              // Store transient state so Enter can convert it to a preview
              view.dispatch(state.tr.setMeta(PLUGIN_KEY as any, { url: text, pos: $from.start(), ts: Date.now() }))

              // Clear after a short timeout if user doesn't press Enter
              setTimeout(() => {
                const st = PLUGIN_KEY.getState(view.state)
                if (st && st.url === text) {
                  view.dispatch(view.state.tr.setMeta(PLUGIN_KEY as any, null))
                }
              }, 3000)

              // allow default paste behaviour (don't prevent)
              return false
            } catch (e) {
              return false
            }
          },

          handleKeyDown(view, event) {
            if (event.key !== 'Enter') return false
            const st = PLUGIN_KEY.getState(view.state) as any

            const { state } = view
            const { $from } = state.selection
            if ($from.parent.type.name !== 'paragraph') return false
            const paragraphText = $from.parent.textContent?.trim() ?? ''

            // Candidate URL: prefer transient pasted URL, otherwise the paragraph text (typed URL)
            const urlCandidate = (st && st.url) || paragraphText
            if (!URL_REGEX.test(String(urlCandidate))) return false

            // Ensure the paragraph contains only the URL (trimmed)
            if (paragraphText !== String(urlCandidate)) return false

            // Require caret at (or near) the end to emulate "press Enter to go to next line" behavior
            const isAtEnd = state.selection.empty && ($from.parentOffset >= Math.max(0, $from.parent.content.size - 1))
            if (!isAtEnd) return false

            const schema = state.schema
            const previewType = schema.nodes.autoLinkPreview
            if (!previewType) return false

            const start = $from.start()
            const end = $from.end()
            // Insert an autoLinkPreview node and mark it as loading
            const previewNode = previewType.create({ href: String(urlCandidate), loading: true })
            const tr = state.tr.replaceWith(start, end, previewNode)

            // Place caret after the inserted preview node
            try {
              const sel = TextSelection.create(tr.doc, start + 1)
              tr.setSelection(sel)
            } catch (e) {}

            view.dispatch(tr.scrollIntoView())

            // Clear transient state
            view.dispatch(view.state.tr.setMeta(PLUGIN_KEY as any, null))

            // Fetch metadata and update preview node attributes (async)
            ;(async () => {
              try {
                const res = await fetch(`/api/link-preview?url=${encodeURIComponent(String(urlCandidate))}`)
                if (!res.ok) return
                const json = await res.json()

                const attrsToUpdate: Record<string, any> = {}
                if (json.image) attrsToUpdate.imageSrc = json.image
                if (json.title) attrsToUpdate.title = json.title
                if (json.description) attrsToUpdate.description = json.description

                if (Object.keys(attrsToUpdate).length) {
                  // Prefer updating node at the original start position
                  const nodeAtStart = view.state.doc.nodeAt(start)
                  if (nodeAtStart && nodeAtStart.type.name === 'autoLinkPreview') {
                    const t2 = view.state.tr.setNodeMarkup(start, undefined, { ...(nodeAtStart.attrs || {}), ...attrsToUpdate, loading: false })
                    view.dispatch(t2.scrollIntoView())
                    return
                  }

                  // Fallback: search for an autoLinkPreview node with matching href attr
                  let foundPos: number | null = null
                  view.state.doc.descendants((node, pos) => {
                    if (node.type.name === 'autoLinkPreview' && node.attrs && node.attrs.href === String(urlCandidate)) {
                      foundPos = pos
                      return false
                    }
                    return true
                  })

                  if (foundPos !== null) {
                    const node = view.state.doc.nodeAt(foundPos)
                    const t3 = view.state.tr.setNodeMarkup(foundPos, undefined, { ...(node?.attrs || {}), ...attrsToUpdate, loading: false })
                    view.dispatch(t3.scrollIntoView())
                    return
                  }

                }
              } catch (e) {
                // swallow
              }
            })()

            return true
          },
        },
      }),
    ]
  },
})

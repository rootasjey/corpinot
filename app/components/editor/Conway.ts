import { Node, mergeAttributes } from '@tiptap/core'
import { VueNodeViewRenderer } from '@tiptap/vue-3'
import ConwayNodeView from './ConwayNodeView.vue'

export const Conway = Node.create({
  name: 'conway',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      rows: { default: 25 },
      cols: { default: 25 },
      speed: { default: 200 },
      // seed is an array of [row,col] coordinates, or null
      seed: { default: null },
    }
  },

  parseHTML() {
    return [{ tag: 'figure[data-type="conway"]' }]
  },

  renderHTML({ HTMLAttributes }) {
    const attrs = mergeAttributes(HTMLAttributes)
    const rows = attrs.rows ?? 25
    const cols = attrs.cols ?? 25
    // Minimal SSR-friendly snapshot. Keep markup small so viewers show something useful.
    const wrapperAttrs: any = { 'data-type': 'conway', 'data-rows': String(rows), 'data-cols': String(cols), class: 'conway-figure' }
    return ['figure', wrapperAttrs, ['div', { class: 'conway-snapshot' }, 'Conway’s Game of Life']]
  },

  addNodeView() {
    return VueNodeViewRenderer(ConwayNodeView)
  },

  addCommands() {
    return {
      insertConway: (attrs: any) => ({ commands }: any) => {
        return commands.insertContent({ type: this.name, attrs })
      },
    } as any
  },
})

export default Conway

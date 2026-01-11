import { Node, mergeAttributes } from '@tiptap/core'
import { VueNodeViewRenderer } from '@tiptap/vue-3'
import AudioNodeView from './AudioNodeView.vue'

export const Audio = Node.create({
  name: 'audio',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      src: { default: null },
      title: { default: '' },
      duration: { default: null },
      poster: { default: null },
      type: { default: null },
      controls: { default: true },
      preload: { default: 'metadata' },
      loop: { default: false },
    }
  },

  parseHTML() {
    return [{ tag: 'figure[data-type="audio"]' }]
  },

  renderHTML({ HTMLAttributes }) {
    const attrs = mergeAttributes(HTMLAttributes)
    const { src, controls, preload } = attrs as any
    const audioAttrs: any = { src }
    if (controls) audioAttrs.controls = 'controls'
    if (preload) audioAttrs.preload = preload

    return ['figure', { 'data-type': 'audio', class: 'audio-figure' }, ['audio', audioAttrs], ['figcaption', { class: 'audio-caption' }, '']]
  },

  addNodeView() {
    return VueNodeViewRenderer(AudioNodeView)
  },

  addCommands() {
    return {
      insertAudio: (attrs: any) => ({ commands }: any) => {
        return commands.insertContent({ type: this.name, attrs })
      },
    } as any
  },
})

export default Audio

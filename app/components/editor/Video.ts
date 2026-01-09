import { Node, mergeAttributes } from '@tiptap/core'
import { VueNodeViewRenderer } from '@tiptap/vue-3'
import VideoNodeView from './VideoNodeView.vue'

export const Video = Node.create({
  name: 'video',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      src: { default: null },
      poster: { default: null },
      type: { default: null },
      width: { default: null },
      height: { default: null },
      controls: { default: true },
      preload: { default: 'metadata' },
    }
  },

  parseHTML() {
    return [{ tag: 'figure[data-type="video"]' }]
  },

  renderHTML({ HTMLAttributes }) {
    const attrs = mergeAttributes(HTMLAttributes)
    const { src, poster, controls, preload, width, height } = attrs as any
    const videoAttrs: any = { src }
    if (poster) videoAttrs.poster = poster
    if (controls) videoAttrs.controls = 'controls'
    if (preload) videoAttrs.preload = preload
    if (width) videoAttrs.width = width
    if (height) videoAttrs.height = height

    return ['figure', { 'data-type': 'video', class: 'video-figure' }, ['video', videoAttrs], ['figcaption', { class: 'video-caption' }, '']]
  },

  addNodeView() {
    return VueNodeViewRenderer(VideoNodeView)
  },

  addCommands() {
    // Typing as any to keep the command shape simple and compatible with RawCommands
    return {
      insertVideo: (attrs: any) => ({ commands }: any) => {
        return commands.insertContent({ type: this.name, attrs })
      },
    } as any
  },
})

export default Video

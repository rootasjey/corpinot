import Image from '@tiptap/extension-image'
import { VueNodeViewRenderer } from '@tiptap/vue-3'
import ImageNodeView from '~~/app/components/editor/ImageNodeView.vue'

export const CustomImage = Image.extend({
  name: 'image',

  addAttributes() {
    // `parent` isn't exposed on the public typings so guard it via `any`.
    const parentAttrs = (this as any).parent?.() ?? {}
    return {
      ...parentAttrs,
      src: { default: null },
      alt: { default: '' },
      // Per-image layout preference: 'center' (default) or 'full-bleed'
      display: { default: 'center' },
    }
  },

  addNodeView() {
    return VueNodeViewRenderer(ImageNodeView)
  },

  renderHTML({ HTMLAttributes }: { HTMLAttributes: Record<string, any> }) {
    // Figure with caption (static rendering). Alt shown as caption if present.
    const { alt, display, ...rest } = HTMLAttributes as any
    const displayClass = `image-figure--${display || 'center'}`
    return ['figure', { class: `image-figure ${displayClass}` }, ['img', { ...rest, alt }], ['figcaption', { class: 'image-caption' }, alt || '']]
  },
})

export default CustomImage

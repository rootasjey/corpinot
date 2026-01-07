import { Node, mergeAttributes, type RawCommands } from '@tiptap/core'
import { VueNodeViewRenderer } from '@tiptap/vue-3'
import ImageGalleryNodeView from './ImageGalleryNodeView.vue'

export const ImageGallery = Node.create({
  name: 'imageGallery',

  group: 'block',
  atom: true,

  addAttributes() {
    return {
      images: { default: [] },
      columns: { default: null },
    }
  },

  parseHTML() {
    return [
      { tag: 'div[data-type="image-gallery"]' },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    const attrs = mergeAttributes(HTMLAttributes)
    const images = attrs.images ?? []
    const count = (images && images.length) || 0
    let className = ''

    if (count === 1) className = 'image-gallery--single'
    else if (count === 2) className = 'image-gallery--cols-2'
    else if (count === 3) className = 'image-gallery--cols-3'
    else if (count > 3) className = 'image-gallery--grid'

    const children = (images || []).map((img: any) => {
      const src = img?.attrs?.src ?? img?.src ?? null
      const alt = img?.attrs?.alt ?? ''
      return ['img', { src, alt }]
    })

    return ['div', { 'data-type': 'image-gallery', class: `image-gallery ${className}`.trim() }, ...children]
  },

  addNodeView() {
    return VueNodeViewRenderer(ImageGalleryNodeView)
  },

  addCommands() {
    return {
      insertImageGallery:
        (images: any[], columns?: number) =>
        ({ commands }: { commands: RawCommands }) => {
          return commands.insertContent({ type: this.name, attrs: { images, columns } })
        },
    } as Partial<RawCommands>
  },
})

export default ImageGallery

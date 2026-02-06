import { Node, mergeAttributes } from '@tiptap/core'
import { VueNodeViewRenderer } from '@tiptap/vue-3'
import AutoLinkPreviewNodeView from './AutoLinkPreviewNodeView.vue'

export interface AutoLinkPreviewAttributes {
  href: string
  title?: string
  description?: string
  imageSrc?: string | null
  imageAlt?: string
  imagePosition?: 'left' | 'right'
  square?: boolean
  loading?: boolean
}

export const AutoLinkPreview = Node.create<AutoLinkPreviewAttributes>({
  name: 'autoLinkPreview',
  group: 'block',
  atom: true,
  selectable: true,

  addAttributes() {
    return {
      href: { default: '' },
      title: { default: '' },
      description: { default: '' },
      imageSrc: { default: null },
      imageAlt: { default: '' },
      imagePosition: { default: 'left' },
      square: { default: true },
      loading: { default: false },
    }
  },

  parseHTML() {
    return [{ tag: 'figure[data-type="auto-link-preview"]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['figure', mergeAttributes(HTMLAttributes, { 'data-type': 'auto-link-preview', class: 'auto-link-preview' })]
  },

  addNodeView() {
    return VueNodeViewRenderer(AutoLinkPreviewNodeView)
  },
})

export default AutoLinkPreview

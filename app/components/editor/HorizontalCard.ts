import { Node, mergeAttributes } from '@tiptap/core'
import { VueNodeViewRenderer } from '@tiptap/vue-3'
import { TextSelection, Selection } from 'prosemirror-state'
import HorizontalCardNodeView from './HorizontalCardNodeView.vue'

export interface HorizontalCardAttributes {
  imageSrc: string | null
  imageAlt: string
  imagePosition: 'left' | 'right'
  square: boolean
  href?: string | null
  title?: string
  description?: string
}

export const HorizontalCard = Node.create({
  name: 'horizontalCard',
  group: 'block',
  content: 'block*',
  draggable: false,

  addAttributes() {
    return {
      imageSrc: {
        default: null,
        parseHTML: (element: HTMLElement) => element.querySelector('img')?.getAttribute('src') ?? null,
      },
      imageAlt: {
        default: '',
        parseHTML: (element: HTMLElement) => element.querySelector('img')?.getAttribute('alt') ?? '',
      },
      imagePosition: {
        default: 'left',
        parseHTML: (element: HTMLElement) => (element.getAttribute('data-image-position') === 'right' ? 'right' : 'left'),
      },
      square: {
        default: true,
        parseHTML: (element: HTMLElement) => element.getAttribute('data-image-square') !== 'false',
      },
      // Persist original URL and optional fetched metadata
      href: {
        default: null,
        parseHTML: (element: HTMLElement) => element.getAttribute('data-href') ?? null,
      },
      title: {
        default: '',
        parseHTML: (element: HTMLElement) => element.getAttribute('data-title') ?? '',
      },
      description: {
        default: '',
        parseHTML: (element: HTMLElement) => element.getAttribute('data-description') ?? '',
      },
    }
  },

  parseHTML() {
    return [{ tag: 'figure[data-type="horizontal-card"]' }]
  },

  renderHTML({ HTMLAttributes }) {
    const attrs = HTMLAttributes as HorizontalCardAttributes & Record<string, any>
    const position = attrs.imagePosition === 'right' ? 'right' : 'left'
    const isSquare = attrs.square !== false
    const figureAttrs = mergeAttributes(attrs, {
      'data-type': 'horizontal-card',
      'data-image-position': position,
      'data-image-square': isSquare ? 'true' : 'false',
      // expose original url and metadata as data attrs for portability
      'data-href': attrs.href ?? undefined,
      'data-title': attrs.title ?? undefined,
      'data-description': attrs.description ?? undefined,
      class: `horizontal-card horizontal-card--image-${position}`,
    })

    const imageNode = attrs.imageSrc
      ? ['img', { src: attrs.imageSrc, alt: attrs.imageAlt ?? '', class: 'horizontal-card__image' }]
      : ['div', { class: 'horizontal-card__placeholder' }, '']

    // 0 indicates where child content should be rendered
    return [
      'figure',
      figureAttrs,
      ['div', { class: 'horizontal-card__media' }, imageNode],
      ['div', { class: 'horizontal-card__body' }, 0],
    ]
  },

  addNodeView() {
    return VueNodeViewRenderer(HorizontalCardNodeView)
  },

  addCommands() {
    return {
      insertHorizontalCard:
        (attrs: Partial<HorizontalCardAttributes> = {}) =>
        ({ commands, editor }: any) =>
          commands.command((args: { tr: any; state: any; dispatch?: any }) => {
            const { tr, state, dispatch } = args
            const pos = state.selection.anchor
            const schema = state.schema
            const cardType = schema.nodes.horizontalCard
            const paragraph = schema.nodes.paragraph.create({ placeholder: 'Add text…' })
            const card = cardType.create(
              {
                imageSrc: attrs?.imageSrc ?? null,
                imageAlt: attrs?.imageAlt ?? '',
                imagePosition: attrs?.imagePosition ?? 'left',
                square: attrs?.square ?? true,
                href: attrs?.href ?? null,
                title: attrs?.title ?? '',
                description: attrs?.description ?? '',
              },
              paragraph ? [paragraph] : null
            )

            tr.insert(pos, card)
            // Place caret inside the inserted paragraph (pos + 2 is the first position inside the paragraph)
            try {
              const sel = TextSelection.create(tr.doc, pos + 2)
              tr.setSelection(sel)
            } catch (e) {}

            dispatch?.(tr.scrollIntoView())
            return true
          }),

      insertHorizontalCardFromUrl:
        (url: string, initialMeta: Partial<HorizontalCardAttributes> = {}) =>
        ({ commands, editor }: any) =>
          commands.command((args: { tr: any; state: any; dispatch?: any }) => {
            // Simply delegate to insertHorizontalCard but ensure href/title/description are set
            return (commands as any).insertHorizontalCard({ href: url, ...initialMeta })
          }),
    } as any
  },
})

export default HorizontalCard

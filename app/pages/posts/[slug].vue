<template>
  <div v-if="post" class="min-h-screen">
    <!-- Hero Section - Dark Header with Title -->
    <div class="py-16 md:py-24">
      <div class="container mx-auto px-4 md:px-8">
        <div class="max-w-4xl mx-auto text-center">
          <!-- Date and Reading Time -->
          <div class="font-600 text-md text-gray-400 flex items-center justify-center gap-3 mb-6">
            <time>{{ formatPostDate(post.publishedAt || post.createdAt) }}</time>
            <span>—</span>
            <span>{{ enhancedPost.readingTime }}</span>
          </div>
          
          <!-- Title -->
          <h1 class="max-w-3xl mx-auto text-4xl md:text-5xl lg:text-4xl font-serif font-700 mb-6 leading-tight">
            {{ post.name }}
          </h1>
          
          <!-- Excerpt/Description -->
          <p class="font-body font-600 color-gray-500 text-base md:text-lg leading-relaxed mb-8 max-w-3xl mx-auto">
            {{ post.description }}
          </p>

          <!-- Tags/Badges -->
          <div class="flex items-center justify-center flex-wrap gap-3">
            <NuxtLink
              v-for="tag in post.tags"
              :key="tag.id"
              :to="{ path: '/tags', query: { tag: tag.name } }"
              class="uppercase bg-[#F2F3F4] text-color-black dark:bg-gray-600 dark:text-color-white rounded-full px-4 py-1 text-xs font-semibold flex items-center transition-transform hover:scale-105 active:scale-95"
              :aria-label="`View posts for tag ${tag.name}`"
            >
              <NIcon v-if="iconTag[tag.name]" :name="iconTag[tag.name]" />
              <span>{{ tag.name }}</span>
            </NuxtLink>
            <NTooltip v-if="isAdmin">
              <template #content>
                <span class="font-600">Edit Post</span>
              </template>
                <NButton
                size="xs"
                icon
                label="i-ph-pencil"
                rounded="full"
                btn="soft-gray"
                :to="`/posts/edit/${post.slug || post.id}`"
                class="hover:scale-110 active:scale-99 transition-transform"
              />
            </NTooltip>
          </div>
        </div>
      </div>
    </div>

    <!-- Featured Image -->
    <div v-if="post.image?.src" class="w-full px-4">
      <NuxtImg
        provider="hubblob"
        :src="post.image.src" 
        :alt="post.image.alt || post.name"
        class="w-full h-auto max-h-[90vh] object-cover rounded-2xl"
      />
    </div>

    <!-- Post Info Bar Below Image -->
    <div class="border-b border-border bg-background">
      <div class="container mx-auto px-4 md:px-8">
        <div class="max-w-3xl mx-auto py-6">
          <div class="flex items-center justify-between flex-wrap gap-4">
            <!-- Author Info -->
            <NLink v-if="post.user" :to="`/authors/${post.user.slug || post.user.id}`" class="flex items-center gap-3">
              <NuxtImg 
                provider="hubblob" 
                v-if="post.user.avatar"
                :src="post.user.avatar" 
                :alt="post.user.name || 'User'"
                class="w-8 h-8 rounded-full border"
              />
              <div v-if="post.user.name">
                <div class="font-semibold">{{ post.user.name }}</div>
              </div>
            </NLink>

            <!-- Social Share Buttons -->
            <div class="flex gap-2">
              <NButton
                icon
                size="sm"
                btn="ghost-gray"
                class="hover:bg-muted"
                aria-label="Share on Twitter"
              >
                <div class="i-ph-x-logo w-5 h-5" />
              </NButton>
              <NButton
                icon
                size="sm"
                btn="ghost-gray"
                class="hover:bg-muted"
                aria-label="Share on Facebook"
              >
                <div class="i-ph-facebook-logo w-5 h-5" />
              </NButton>
              <NButton
                icon
                size="sm"
                btn="ghost-gray"
                class="hover:bg-muted"
                aria-label="Share via Email"
              >
                <div class="i-ph-envelope w-5 h-5" />
              </NButton>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Article Content -->
    <article class="py-12 md:py-16 bg-background">
      <div class="container mx-auto px-4 md:px-8">
        <div
          class="max-w-3xl mx-auto"
          @click="handleContentClick"
        >
          <!-- Tiptap Content Renderer -->
          <PostContent v-if="post.article" :content="post.article" />
        </div>
      </div>
    </article>

    <!-- Author Bio Section -->
    <section v-if="post.user" class="py-12 md:py-16 dark:bg-gray-950">
      <div class="container mx-auto px-4 md:px-8">
        <div class="max-w-3xl mx-auto border-t pt-8">
          <div class="flex items-center justify-between gap-8 flex-wrap md:flex-nowrap">
            <!-- Left: Avatar and Name -->
            <NLink :to="`/authors/${post.user.slug || post.user.id}`" class="flex items-center gap-6">
              <NuxtImg 
                provider="hubblob"
                v-if="post.user.avatar"
                :src="post.user.avatar" 
                :alt="post.user.name || 'User'"
                class="w-12 h-12 rounded-full flex-shrink-0 ring-4 ring-white/10 border"
              />
              <div>
                <h3 class="text-md font-bold mb-1">{{ post.user.name }}</h3>
              </div>
            </NLink>

            <!-- Social Share Buttons -->
            <div class="flex gap-2">
              <NButton
                icon
                size="sm"
                btn="ghost-gray"
                class="hover:bg-muted"
                aria-label="Share on Twitter"
              >
                <div class="i-ph-x-logo w-5 h-5" />
              </NButton>
              <NButton
                icon
                size="sm"
                btn="ghost-gray"
                class="hover:bg-muted"
                aria-label="Share on Facebook"
              >
                <div class="i-ph-facebook-logo w-5 h-5" />
              </NButton>
              <NButton
                icon
                size="sm"
                btn="ghost-gray"
                class="hover:bg-muted"
                aria-label="Share via Email"
              >
                <div class="i-ph-envelope w-5 h-5" />
              </NButton>
              <NButton
                icon
                size="sm"
                btn="ghost-gray"
                class="hover:bg-muted"
                aria-label="Copy Link"
              >
                <div class="i-ph-copy w-5 h-5" />
              </NButton>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Related Posts Section - TODO: Implement related posts API -->
    <!-- <section class="py-16 bg-muted/30">
      <div class="container mx-auto px-4 md:px-8">
        <h2 class="uppercase font-600 text-size-4 mb-4">You Might Also Like</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          Related posts will go here
        </div>
      </div>
    </section> -->

    <transition :css="false" @enter="handleLightboxEnter" @leave="handleLightboxLeave">
      <div
        v-if="lightboxImage"
        class="lightbox-backdrop"
        role="dialog"
        aria-modal="true"
        aria-label="Expanded post image"
        @click.self="closeLightbox"
      >
        <div class="lightbox-image-frame">
          <img
            :src="lightboxImage.src"
            :alt="lightboxImage.alt || post.name"
            class="lightbox-image"
            :style="lightboxImageStyle"
          />
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import type { Post } from '~~/shared/types/post'

const route = useRoute()
const slug = route.params.slug as string
const { enhancePost, formatPostDate } = usePost()
const { loggedIn, user } = useUserSession()

const isAdmin = computed(() => loggedIn.value && user.value?.role === 'admin')

const isEditableTarget = (target: EventTarget | null) => {
  if (!target || !(target instanceof HTMLElement)) return false
  const tag = target.tagName
  return (
    tag === 'INPUT' ||
    tag === 'TEXTAREA' ||
    target.isContentEditable ||
    target.getAttribute('role') === 'textbox'
  )
}

const handleEditShortcut = (event: KeyboardEvent) => {
  if (!isAdmin.value || !post.value) return
  if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return
  if (isEditableTarget(event.target)) return
  if (event.key.toLowerCase() !== 'e') return
  event.preventDefault()
  navigateTo(editPostUrl.value)
}

// Fetch post data from API
const { data: post, error } = await useFetch<Post>(`/api/posts/${slug}`)
if (error.value || !post.value) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Post not found'
  })
}

const editPostUrl = computed(() => `/posts/edit/${post.value?.slug || post.value?.id}`)

// Enhance post with computed properties
const enhancedPost = computed(() => enhancePost(post.value!))

const iconTag: Record<string, string> = {
  featured: 'i-ph-lightning-fill',
  'featured post': 'i-ph-lightning-fill',
  'featured project': 'i-ph-lightning-fill',
  technology: 'i-ph-laptop-fill',
  lifestyle: 'i-ph-coffee-fill',
  travel: 'i-ph-airplane-fill',
  food: 'i-ph-fork-knife-fill',
  education: 'i-ph-book-fill',
  health: 'i-ph-heartbeat-fill',
  finance: 'i-ph-currency-dollar-fill',
  entertainment: 'i-ph-film-strip-fill',
  business: 'i-ph-briefcase-fill',
  science: 'i-ph-flask-fill',
}

type LightboxImage = {
  src: string
  alt?: string
}

const lightboxImage = ref<LightboxImage | null>(null)
const lastImageOrigin = ref<{ x: number; y: number } | null>(null)
const lastImageRect = ref<DOMRect | null>(null)
let listenersAttached = false

const closeLightbox = () => {
  lightboxImage.value = null
  lastImageOrigin.value = null
}

const handleContentClick = (event: MouseEvent) => {
  const target = event.target as HTMLElement | null
  if (!target || target.tagName !== 'IMG') return

  const image = target as HTMLImageElement
  const src =
    image.currentSrc ||
    image.getAttribute('src') ||
    (image.dataset as Record<string, string | undefined>)['src'] ||
    (image.dataset as Record<string, string | undefined>)['lazySrc']

  if (!src) return
  event.preventDefault()

  if (import.meta.client) {
    const rect = image.getBoundingClientRect()
    lastImageOrigin.value = {
      x: Math.round(((rect.left + rect.width / 2) / window.innerWidth) * 100),
      y: Math.round(((rect.top + rect.height / 2) / window.innerHeight) * 100),
    }
    lastImageRect.value = rect
  } else {
    lastImageOrigin.value = null
    lastImageRect.value = null
  }

  lightboxImage.value = {
    src,
    alt: image.alt || undefined,
  }
}

const lightboxImageStyle = computed(() => {
  if (!lastImageOrigin.value) {
    return { transformOrigin: 'center center' }
  }
  return {
    transformOrigin: `${lastImageOrigin.value.x}% ${lastImageOrigin.value.y}%`,
  }
})

const getTransitionParams = (img: HTMLImageElement | null) => {
  if (!img || !lastImageRect.value || !import.meta.client) return null
  const frame = img.closest('.lightbox-image-frame') as HTMLElement | null
  const finalWidth = frame?.clientWidth || img.clientWidth || 1
  const finalHeight = frame?.clientHeight || img.clientHeight || 1
  const scaleX = lastImageRect.value.width / finalWidth
  const scaleY = lastImageRect.value.height / finalHeight
  const startScale = Math.max(Math.min(Math.min(scaleX, scaleY), 1.5), 0.35)
  const deltaX = lastImageRect.value.left + lastImageRect.value.width / 2 - window.innerWidth / 2
  const deltaY = lastImageRect.value.top + lastImageRect.value.height / 2 - window.innerHeight / 2
  return { startScale, deltaX, deltaY }
}

const animateLightbox = (
  img: HTMLImageElement | null,
  from: { scale: number; deltaX: number; deltaY: number },
  to: { scale: number; deltaX: number; deltaY: number },
  done: () => void
) => {
  if (!img) {
    done()
    return
  }

  // Pre-set the starting transform so there is no blank frame before WA kicks in
  img.style.transform = `translate(${from.deltaX}px, ${from.deltaY}px) scale(${from.scale})`
  img.style.opacity = '1'

  const animation = img.animate(
    [
      {
        transform: `translate(${from.deltaX}px, ${from.deltaY}px) scale(${from.scale})`,
        opacity: 1,
      },
      {
        transform: `translate(${to.deltaX}px, ${to.deltaY}px) scale(${to.scale})`,
        opacity: 1,
      },
    ],
    {
      duration: 280,
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
      fill: 'forwards',
    }
  )
  animation.onfinish = done
  animation.oncancel = done
}

const handleLightboxEnter = (el: Element, done: () => void) => {
  const img = el.querySelector<HTMLImageElement>('.lightbox-image')
  const params = getTransitionParams(img)
  if (!params) {
    done()
    return
  }
  animateLightbox(
    img,
    { scale: params.startScale, deltaX: params.deltaX, deltaY: params.deltaY },
    { scale: 1, deltaX: 0, deltaY: 0 },
    done
  )
}

const handleLightboxLeave = (el: Element, done: () => void) => {
  const img = el.querySelector<HTMLImageElement>('.lightbox-image')
  const params = getTransitionParams(img)
  if (!params) {
    done()
    return
  }
  animateLightbox(
    img,
    { scale: 1, deltaX: 0, deltaY: 0 },
    { scale: params.startScale, deltaX: params.deltaX, deltaY: params.deltaY },
    () => {
      lastImageRect.value = null
      done()
    }
  )
}

const handleDocumentScroll = () => {
  if (!lightboxImage.value) return
  closeLightbox()
}

const handleEscape = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    closeLightbox()
  }
}

const addLightboxListeners = () => {
  if (listenersAttached || !import.meta.client) return
  listenersAttached = true
  window.addEventListener('scroll', handleDocumentScroll, { passive: true })
  window.addEventListener('wheel', handleDocumentScroll, { passive: true })
  window.addEventListener('touchmove', handleDocumentScroll, { passive: true })
  window.addEventListener('keyup', handleEscape)
}

const removeLightboxListeners = () => {
  if (!listenersAttached || !import.meta.client) return
  window.removeEventListener('scroll', handleDocumentScroll)
  window.removeEventListener('wheel', handleDocumentScroll)
  window.removeEventListener('touchmove', handleDocumentScroll)
  window.removeEventListener('keyup', handleEscape)
  listenersAttached = false
}

watch(lightboxImage, (value) => {
  if (!import.meta.client) return
  if (value) addLightboxListeners()
  else removeLightboxListeners()
})

onBeforeUnmount(() => {
  removeLightboxListeners()
})

if (import.meta.client) {
  useEventListener(document, 'keydown', handleEditShortcut)
}

const config = useRuntimeConfig()
const ogImageUrl = computed(() => {
  const v = encodeURIComponent((post.value?.updatedAt as string) || new Date().toISOString())
  return `${config.public.siteUrl}/og/post/${route.params.slug}.png?v=${v}`
})

useSeoMeta({
  title: post.value.name,
  description: post.value.description || '',
  ogTitle: post.value.name,
  ogDescription: post.value.description || '',
  ogImage: ogImageUrl.value,
  ogUrl: `${config.public.siteUrl}/posts/${route.params.slug}`,
  twitterCard: 'summary_large_image',
  twitterImage: ogImageUrl.value,
})
</script>

<style scoped>
.social-btn {
  transition: all 0.3s ease;
}

.social-btn:hover {
  transform: translateY(-2px);
}

.lightbox-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(6, 6, 6, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 60;
  padding: 1.5rem;
}

.lightbox-image-frame {
  width: min(90vw, 1200px);
  max-height: 90vh;
  overflow: hidden;
  border-radius: 1.5rem;
  box-shadow: 0 25px 75px rgba(0, 0, 0, 0.45);
}

.lightbox-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
}

</style>

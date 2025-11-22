<template>
  <div class="container mx-auto px-4 py-8 max-w-3xl">
    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-2">Create New Post</h1>
      <NuxtLink to="/posts" class="text-blue-600 dark:text-blue-400 hover:underline">
        ← Back to posts
      </NuxtLink>
    </div>

    <!-- Error -->
    <NAlert v-if="error" color="error" class="mb-6">
      {{ error }}
    </NAlert>

    <!-- Create Form -->
    <div class="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
      <form @submit.prevent="createPost" class="space-y-6">
        <!-- Title -->
        <div>
          <label for="name" class="block text-sm font-medium mb-2">
            Post Title *
          </label>
          <NInput
            id="name"
            v-model="name"
            placeholder="Enter a catchy title for your post"
            required
            autofocus
          />
          <p class="text-xs text-gray-500 mt-1">
            This will be used to generate the URL slug automatically
          </p>
        </div>

        <!-- Description -->
        <div>
          <label for="description" class="block text-sm font-medium mb-2">
            Description
          </label>
          <NTextarea
            id="description"
            v-model="description"
            placeholder="Write a brief description of what this post is about"
            :rows="4"
          />
          <p class="text-xs text-gray-500 mt-1">
            This will be used for SEO and social media previews
          </p>
        </div>

        <!-- Tags -->
        <div>
          <label for="tag-input" class="block text-sm font-medium mb-2">
            Tags (optional)
          </label>
          
          <!-- Tag chips -->
          <div v-if="tags.length > 0" class="flex flex-wrap gap-2 mb-2">
            <span
              v-for="(tag, index) in tags"
              :key="index"
              class="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 rounded-full text-sm"
            >
              {{ tag }}
              <button
                @click="removeTag(index)"
                type="button"
                class="hover:text-blue-600 dark:hover:text-blue-300"
              >
                <span class="i-lucide-x text-sm" />
              </button>
            </span>
          </div>
          
          <!-- Tag input -->
          <div class="flex gap-2">
            <NInput
              id="tag-input"
              v-model="tagInput"
              placeholder="Add a tag and press Enter"
              @keydown="handleTagKeydown"
            />
            <NButton
              @click="addTag"
              type="button"
              variant="soft"
              :disabled="!tagInput.trim()"
            >
              <span class="i-lucide-plus mr-2" />
              Add
            </NButton>
          </div>
          <p class="text-xs text-gray-500 mt-1">
            Press Enter or click Add to include a tag
          </p>
        </div>

        <!-- Info Box -->
        <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div class="flex gap-3">
            <span class="i-lucide-info text-blue-600 dark:text-blue-400 mt-0.5" />
            <div class="text-sm text-blue-900 dark:text-blue-100">
              <p class="font-medium mb-1">What happens next?</p>
              <p>
                Your post will be created as a <strong>draft</strong>. 
                You'll be redirected to the editor where you can write your content 
                using our rich text editor powered by Tiptap.
              </p>
            </div>
          </div>
        </div>

        <!-- Submit Button -->
        <div class="flex gap-3 pt-4">
          <NButton
            type="submit"
            color="primary"
            size="lg"
            :disabled="creating || !name.trim()"
            class="flex-1"
          >
            <span class="i-lucide-pencil mr-2" />
            {{ creating ? 'Creating...' : 'Create Post & Start Writing' }}
          </NButton>
          
          <NButton
            type="button"
            variant="soft"
            color="neutral"
            size="lg"
            @click="router.push('/posts')"
            :disabled="creating"
          >
            Cancel
          </NButton>
        </div>
      </form>
    </div>
  </div>
</template>
<script setup lang="ts">
const router = useRouter()

// State
const creating = ref(false)
const error = ref('')

// Form fields
const name = ref('')
const description = ref('')
const tags = ref<string[]>([])
const tagInput = ref('')

// Create post
const createPost = async () => {
  if (!name.value.trim()) {
    error.value = 'Please enter a post title'
    return
  }
  
  creating.value = true
  error.value = ''
  
  try {
    const post = await $fetch('/api/posts', {
      method: 'POST',
      body: {
        name: name.value,
        description: description.value,
        tags: tags.value.map(tag => ({ name: tag })),
      },
    })
    
    // Redirect to edit page
    router.push(`/posts/edit/${post.id}`)
  } catch (e: any) {
    error.value = e.data?.message || 'Failed to create post'
    console.error('Failed to create post:', e)
    creating.value = false
  }
}

// Add tag
const addTag = () => {
  const tag = tagInput.value.trim()
  if (tag && !tags.value.includes(tag)) {
    tags.value.push(tag)
    tagInput.value = ''
  }
}

// Remove tag
const removeTag = (index: number) => {
  tags.value.splice(index, 1)
}

// Handle tag input enter key
const handleTagKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Enter') {
    e.preventDefault()
    addTag()
  }
}
</script>

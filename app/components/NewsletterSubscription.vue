<template>
  <!-- Newsletter Subscription -->
  <section class="py-12 md:py-12 bg-white dark:bg-gray-950">
    <div class="container mx-auto px-4 text-center">
      <h1 class="text-2xl md:text-3xl lg:text-4xl font-serif font-bold mb-6 md:mb-8 max-w-3xl mx-auto leading-tight">
        Dive into top stories, trends, and gems you'll love. Subscribe!
      </h1>
      <form class="max-w-lg mx-auto" @submit.prevent="handleSubscribe">
        <div class="flex sm:flex-row gap-3 items-stretch">
          <div class="flex-1 relative">
            <input
              v-model="email"
              type="email"
              placeholder="Email address"
              class="w-full px-5 py-3.5 bg-gray-50 dark:bg-gray-900 border-0 rounded-full 
                font-600 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
              required
            />
          </div>
          <button
            type="submit"
            :disabled="loading"
            class="sm:w-auto px-6 bg-yellow-400 hover:bg-yellow-500 dark:bg-yellow-500 dark:hover:bg-yellow-400 
              rounded-full uppercase font-medium text-size-3 font-600 transition-colors text-black disabled:opacity-60 disabled:cursor-not-allowed"
          >
          <span v-if="loading">subscribing...</span>
          <span v-else>subscribe</span>
          </button>
        </div>
        <p v-if="feedback" :class="feedback.type === 'success' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'" class="text-sm mt-3">
          {{ feedback.message }}
        </p>
      </form>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const email = ref('')
const loading = ref(false)
const feedback = ref<{ type: 'success' | 'error'; message: string } | null>(null)

async function handleSubscribe() {
  if (loading.value) return
  loading.value = true
  feedback.value = null

  try {
    const message = await $fetch('/api/newsletter/subscribe', {
      method: 'POST',
      body: { email: email.value },
    }).then((res: any) => res?.message ?? 'Thanks for subscribing!')

    feedback.value = { type: 'success', message }
    email.value = ''
  } catch (error: any) {
    const message = error?.data?.message || 'Unable to subscribe right now. Please try again.'
    feedback.value = { type: 'error', message }
  } finally {
    loading.value = false
  }
}
</script>

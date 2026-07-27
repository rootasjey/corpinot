<template>
  <div class="min-h-screen flex flex-col items-center py-12 px-6 bg-gray-50 dark:bg-gray-950">

    <!-- Logo -->
    <NuxtLink to="/" class="mb-12">
      <span class="font-title text-4xl font-bold text-black dark:text-white">{{ $t('pages.signin.welcomeBack') }}</span>
    </NuxtLink>

    <!-- Card -->
    <div class="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-10">
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-black dark:text-white mb-2">{{ $t('pages.signin.heading') }}</h1>
        <p class="text-sm text-gray-500 dark:text-gray-400">{{ $t('pages.signin.description') }}</p>
      </div>

      <form @submit.prevent="onSubmit" class="space-y-4">
        <div>
          <input
            v-model="form.email"
            type="email"
            autocomplete="email"
            class="w-full rounded-full px-6 py-4 bg-gray-50 dark:bg-gray-800 border-0 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-lime-400"
            :placeholder="$t('pages.signin.emailPlaceholder')"
          />
          <p v-if="errors.email" class="text-xs text-red-500 mt-2 px-2">{{ errors.email }}</p>
        </div>

        <div>
          <input
            v-model="form.password"
            :type="showPassword ? 'text' : 'password'"
            autocomplete="current-password"
            class="w-full rounded-full px-6 py-4 bg-gray-50 dark:bg-gray-800 border-0 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-lime-400"
            :placeholder="$t('pages.signin.passwordPlaceholder')"
          />
          <div class="flex items-center justify-between mt-2">
            <label class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <input type="checkbox" v-model="form.remember" class="w-4 h-4" />
              {{ $t('pages.signin.rememberMe') }}
            </label>
            <NuxtLink to="/forgot-password" class="text-sm text-gray-700 dark:text-gray-300 hover:underline">{{ $t('pages.signin.forgotPassword') }}</NuxtLink>
          </div>
          <p v-if="errors.password" class="text-xs text-red-500 mt-2 px-2">{{ errors.password }}</p>
        </div>

        <div v-if="errorMessage" class="text-sm text-red-600 dark:text-red-400">{{ errorMessage }}</div>

        <div>
          <button
            :disabled="isSubmitting"
            type="submit"
            class="w-full rounded-full px-6 py-4 bg-lime-300 hover:bg-lime-400 text-black font-bold text-sm uppercase tracking-wide transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <span v-if="!isSubmitting">{{ $t('pages.signin.submit') }}</span>
            <span v-else>{{ $t('pages.signin.submitting') }}</span>
          </button>
        </div>
      </form>

      <p class="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
        {{ $t('pages.signin.noAccount') }} <NuxtLink to="/signup" class="text-black dark:text-white font-medium underline hover:no-underline">{{ $t('pages.signin.signUpLink') }}</NuxtLink>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const { $t } = useI18n()

const { loggedIn, fetch: refreshSession } = useUserSession()

const form = reactive({ email: '', password: '', remember: false })
const errors = reactive<{ email?: string; password?: string }>({})
const isSubmitting = ref(false)
const showPassword = ref(false)
const errorMessage = ref('')

function validate() {
  errors.email = ''
  if (!form.email) {
    errors.email = $t('pages.signin.emailRequired')
    return false
  } else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) {
    errors.email = $t('pages.signin.emailValid')
    return false
  }
  if (!form.password) {
    errors.password = $t('pages.signin.passwordRequired')
    return false
  }
  return true
}

async function onSubmit() {
  if (!validate()) return
  isSubmitting.value = true

  errorMessage.value = ''
  try {
    await $fetch('/api/login', {
      method: 'POST',
      body: { email: form.email, password: form.password }
    })

    // Refresh session and navigate
    await refreshSession()
    router.push('/')
  } catch (e: any) {
    errorMessage.value = e?.data?.message || $t('pages.signin.invalidCredentials')
  } finally {
    isSubmitting.value = false
  }
}
</script>

<style scoped></style>

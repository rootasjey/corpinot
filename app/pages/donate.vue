<template>
  <div class="mx-auto max-w-4xl px-6 py-12">
    <div class="text-center mb-8">
      <h1 class="font-title text-3xl font-bold mb-2">Support Constellate</h1>
      <p class="text-slate-600 dark:text-slate-400">Help keep independent writing thriving. Your support funds development and editorial work.</p>
    </div>

    <div v-if="donationCompleted" class="rounded-lg p-6 border b-dashed border-gray-200 dark:border-gray-800 text-center" role="status" aria-live="polite">
      <div class="flex flex-col items-center gap-3">
        <NIcon class="confetti-icon" name="i-ph-confetti" size="16" />
        <h2 class="text-size-16 font-title font-bold">Thank you!</h2>
        <p class="text-size-8 font-300 text-slate-600 dark:text-slate-400">We received a donation {{ formatAmount(lastDonation?.amount ?? displayAmount) }}{{ lastDonation?.recurring ? ' (monthly)' : '' }}. Your support keeps Constellate running.</p>
        <div class="mt-4 space-x-2">
          <NButton btn="solid-lime" @click="donateAgain">Donate again</NButton>
          <NButton btn="soft" to="/">Return Home</NButton>
        </div>
        <div v-if="statusMessage" :class="['text-sm mt-2', statusOk ? 'text-lime' : 'text-red']">{{ statusMessage }}</div>
      </div>
    </div>

    <div v-else class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <!-- Donation Info -->
      <div class="rounded-lg p-6 border border-gray-200 dark:border-gray-800">
        <h2 class="font-600 text-lg mb-4">Why donate?</h2>
        <ul class="list-disc ml-5 text-sm text-slate-700 dark:text-slate-300 space-y-2">
          <li>Support independent authors and projects on the platform.</li>
          <li>Fund product improvements, new features, and editorial curation.</li>
          <li>Occasional perks for donors (early previews, community access).</li>
        </ul>

        <div class="mt-6">
          <h3 class="text-sm font-medium text-slate-600 dark:text-slate-400">Suggested amounts</h3>
          <div class="flex gap-2 mt-3">
            <button v-for="a in suggestedAmounts" :key="a" @click="selectAmount(a)" :class="['px-4 py-2 rounded-lg transition-colors', selectedAmount === a ? 'bg-black text-white' : 'bg-gray-100 dark:bg-gray-800 text-slate-800 dark:text-slate-200']">{{ formatAmount(a) }}</button>
          </div>
        </div>

        <div class="mt-6">
          <h3 class="text-sm font-medium text-slate-600 dark:text-slate-400">Recurring?</h3>
          <div class="flex items-center gap-3 mt-2">
            <label class="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" v-model="recurring" class="form-checkbox" />
              <span class="text-sm text-slate-700 dark:text-slate-300">Make this a recurring monthly donation</span>
            </label>
          </div>
        </div>
      </div>

      <!-- Donation Form -->
      <div class="rounded-lg p-6 border border-gray-200 dark:border-gray-800">
        <h2 class="font-600 text-lg mb-4">Donate</h2>
        <form @submit.prevent="submitDonation" class="space-y-4">
          <div>
            <label class="text-sm text-slate-600 dark:text-slate-400 block mb-1">Amount (USD)</label>
            <NInput v-model="amountInput" input="outline" type="number" min="1" placeholder="Enter amount" />
          </div>

          <div>
            <label class="text-sm text-slate-600 dark:text-slate-400 block mb-1">Email (optional)</label>
            <NInput v-model="email" input="outline" type="email" placeholder="you@example.com" />
          </div>

          <div>
            <label class="text-sm text-slate-600 dark:text-slate-400 block mb-1">Message (optional)</label>
            <NInput v-model="message" input="outline" type="textarea" :rows="4" placeholder="Say something…" />
          </div>

          <div class="flex items-center gap-3">
            <NButton type="submit" btn="solid-green">Donate {{ formatAmount(displayAmount) }}</NButton>
            <NButton btn="ghost" @click.prevent="resetForm">Reset</NButton>
          </div>

          <div v-if="statusMessage" :class="['text-sm mt-2', statusOk ? 'text-lime' : 'text-red']">{{ statusMessage }}</div>
        </form>

        <div class="mt-6 text-xs text-slate-500 dark:text-slate-400">
          This page is a front-end stub. We'll wire up payment processing later.
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

definePageMeta({ title: 'Donate' })

const suggestedAmounts = [5, 10, 25, 50, 100]
const selectedAmount = ref<number | null>(25)
const amountInput = ref<number | null>(25)
const recurring = ref(false)
const email = ref('')
const message = ref('')
const statusMessage = ref('')
const statusOk = ref(false)
const donationCompleted = ref(false)
const lastDonation = ref<{ amount:number; recurring:boolean; email?:string; message?:string } | null>(null)

function formatAmount(n: number) {
  return `$${n}`
}

function selectAmount(a: number) {
  selectedAmount.value = a
  amountInput.value = a
}

const displayAmount = computed(() => {
  return amountInput.value ?? selectedAmount.value ?? 0
})

function resetForm() {
  selectedAmount.value = 25
  amountInput.value = 25
  recurring.value = false
  email.value = ''
  message.value = ''
  statusMessage.value = ''
}

async function submitDonation() {
  statusMessage.value = ''
  statusOk.value = false
  const payload = {
    amount: Number(displayAmount.value),
    recurring: recurring.value,
    email: email.value || undefined,
    message: message.value || undefined,
  }

  try {
    const res = await $fetch('/api/donate', {
      method: 'POST',
      body: payload,
    })

    // When we wire a payment provider, this will respond with a checkout url.
    // For now we show a success message and the returned payload.
    statusMessage.value = res?.message ?? 'Donation request received. Thank you!'
    statusOk.value = true
    lastDonation.value = payload
    donationCompleted.value = true
  } catch (err: any) {
    statusMessage.value = err?.data?.message || 'Failed to process donation request.'
    statusOk.value = false
  }
}

function donateAgain() {
  donationCompleted.value = false
  resetForm()
}

</script>

<style scoped>
.confetti-icon {
  display: inline-block;
  color: #34D399; /* start green */
  transform-origin: center;
  animation: confetti-color 6s linear infinite, confetti-move 3s ease-in-out infinite;
}

.confetti-icon svg {
  display: inline-block;
  width: 1em;
  height: 1em;
  fill: currentColor; /* ensure SVG inherits color */
}

@keyframes confetti-color {
  0%   { color: #F472B6; } /* pink */
  25%  { color: #60A5FA; } /* blue */
  50%  { color: #A78BFA; } /* purple */
  75%  { color: #FDE047; } /* yellow */
  100% { color: #34D399; } /* green */
}

/* Mostly idle, but briefly pops/shakes once per cycle */
@keyframes confetti-move {
  0%, 40% { transform: scale(1) rotate(0) translateX(0); }
  45%     { transform: scale(1.06) rotate(-6deg) translateX(-3px); }
  50%     { transform: scale(1.12) rotate(6deg) translateX(3px); }
  55%     { transform: scale(1.04) rotate(-4deg) translateX(-2px); }
  60%, 100% { transform: scale(1) rotate(0) translateX(0); }
}

@media (prefers-reduced-motion: reduce) {
  .confetti-icon { animation: none; }
}
</style>

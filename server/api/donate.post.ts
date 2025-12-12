import { z } from 'zod'

const bodySchema = z.object({
  amount: z.number().min(1),
  recurring: z.boolean().optional(),
  email: z.string().email().optional(),
  message: z.string().optional()
})

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, bodySchema.parse)

  // Placeholder: we'll wire a payment provider here later.
  // For now, respond with a simple acknowledgement and an example checkout URL placeholder.
  try {
    const { amount, recurring, email, message } = body

    const response = {
      ok: true,
      message: `Donation request received for $${amount}${recurring ? ' (recurring)' : ''}`,
      data: {
        amount,
        recurring: !!recurring,
        email: email || null,
        message: message || null,
        // In the future, provide a real `checkoutUrl` from the payment provider.
        checkoutUrl: null,
      }
    }

    return response
  } catch (err: any) {
    console.error('Error processing donation request:', err)
    throw createError({ statusCode: 500, message: 'Failed to process donation request' })
  }
})
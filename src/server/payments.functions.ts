import { createServerFn } from "@tanstack/react-start"
import { z } from "zod"

// Creates a Stripe Checkout session for a deposit or invoice payment.
// Requires STRIPE_SECRET_KEY to be set in the Netlify environment.
export const createCheckoutSession = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      amount: z.number().positive(),
      description: z.string(),
      customerEmail: z.string().email().optional(),
      successUrl: z.string(),
      cancelUrl: z.string(),
    })
  )
  .handler(async ({ data }) => {
    const secretKey = process.env.STRIPE_SECRET_KEY
    if (!secretKey) {
      throw new Error(
        "Online payments are not configured yet. Set STRIPE_SECRET_KEY in your Netlify environment variables to enable Stripe checkout."
      )
    }

    const Stripe = (await import("stripe")).default
    const stripe = new Stripe(secretKey)

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      customer_email: data.customerEmail,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { name: data.description },
            unit_amount: Math.round(data.amount * 100),
          },
          quantity: 1,
        },
      ],
      success_url: data.successUrl,
      cancel_url: data.cancelUrl,
    })

    return { url: session.url }
  })

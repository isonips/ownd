import { NextResponse } from "next/server";
import Stripe from "stripe";
import { supabaseAdmin } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-09-30.acacia" });
  const sig = req.headers.get("stripe-signature");
  if (!sig) return NextResponse.json({ error: "no signature" }, { status: 400 });
  const raw = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(raw, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err: any) {
    return NextResponse.json({ error: `bad signature: ${err.message}` }, { status: 400 });
  }

  const admin = supabaseAdmin();

  if (event.type === "checkout.session.completed") {
    const s = event.data.object as Stripe.Checkout.Session;
    const userId = s.metadata?.user_id;
    if (userId) {
      await admin
        .from("profiles")
        .update({ is_premium: true, stripe_customer_id: s.customer as string })
        .eq("id", userId);
    }
  } else if (event.type === "customer.subscription.deleted") {
    const s = event.data.object as Stripe.Subscription;
    await admin.from("profiles").update({ is_premium: false }).eq("stripe_customer_id", s.customer as string);
  }

  return NextResponse.json({ received: true });
}

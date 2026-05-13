import express from "express";
import Payments from "../models/Payments.js";
import Stripe from "stripe";
import axios from "axios";

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/* ── Create Payment Intent ── */
router.post("/create-payment-intent", async (req, res) => {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({ error: "orderId is required" });
    }

    // Check if payment already exists
    const existingPayment = await Payments.findOne({ orderId });
    if (existingPayment?.status === "completed") {
      return res.status(400).json({ error: "Order is already paid" });
    }

    // Fetch order from main backend
    let order;
    try {
      const orderRes = await axios.get(
        `${process.env.ORDER_SERVICE_URL}/orders/${orderId}`,
      );
      order = orderRes.data;
    } catch (err) {
      console.error("Failed to fetch order:", err.message);
      if (err.response) {
        return res
          .status(err.response.status)
          .json({ error: "Order not found" });
      }
      return res.status(500).json({ error: "Failed to fetch order" });
    }

    if (!order) return res.status(404).json({ error: "Order not found" });

    if (!order.total || isNaN(order.total)) {
      return res.status(400).json({ error: "Order total is invalid" });
    }

    // Create Stripe PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(order.total * 100),
      currency: "usd",
      metadata: { orderId },
    });

    console.log(
      `✅ Payment intent created for order ${orderId} — $${order.total}`,
    );
    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    console.error("Stripe error:", err.message);
    console.error("Stripe error stack:", err.stack);
    res.status(500).json({ error: err.message || "Payment failed" });
  }
});

/* ── Stripe Webhook ── */
router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const sig = req.headers["stripe-signature"];
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET,
      );
    } catch (err) {
      console.error("Webhook signature verification failed", err);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === "payment_intent.succeeded") {
      const paymentIntent = event.data.object;
      const exists = await Payments.findOne({
        transactionId: paymentIntent.id,
      });
      if (!exists) {
        await Payments.create({
          orderId: paymentIntent.metadata.orderId,
          amount: paymentIntent.amount / 100,
          method: paymentIntent.payment_method_types[0],
          status: "completed",
          transactionId: paymentIntent.id,
        });
        console.log(
          `✅ Payment recorded for order ${paymentIntent.metadata.orderId}`,
        );
      }
    }

    res.json({ received: true });
  },
);

/* ── Get all payments ── */
router.get("/", async (req, res) => {
  try {
    const payments = await Payments.find().sort({ createdAt: -1 });
    res.status(200).json(payments);
  } catch (err) {
    console.error("Unable to find payments", err);
    res.status(500).json({ error: "Failed to fetch payments" });
  }
});

/* ── Search payments ── */
router.get("/search", async (req, res) => {
  try {
    const { transactionId, orderId } = req.query;
    const filter = {};
    if (transactionId) filter.transactionId = transactionId;
    if (orderId) filter.orderId = orderId;

    const payments = await Payments.find(filter).sort({ createdAt: -1 });
    res.status(200).json(payments);
  } catch (err) {
    console.error("Search payments error", err);
    res.status(500).json({ error: "Failed to search payments" });
  }
});

/* ── Update payment ── */
router.put("/:id", async (req, res) => {
  try {
    const { status, transactionId } = req.body;

    const updatedPayment = await Payments.findByIdAndUpdate(
      req.params.id,
      {
        ...(status && { status }),
        ...(transactionId && { transactionId }),
      },
      { new: true },
    );

    if (!updatedPayment)
      return res.status(404).json({ message: "Payment not found" });

    res.status(200).json(updatedPayment);
  } catch (err) {
    console.error("Update payment error", err);
    res.status(500).json({ message: "Failed to update payment" });
  }
});

export default router;

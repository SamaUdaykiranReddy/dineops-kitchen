import { useState, useEffect } from "react";
import { useStripe, useElements, CardElement } from "@stripe/react-stripe-js";
import { useParams, useNavigate } from "react-router-dom";
import {
  CreditCard,
  Banknote,
  CheckCircle,
  ArrowLeft,
  Lock,
} from "lucide-react";
import { toast } from "sonner";
import { API_BASE, PAYMENT_BASE } from "../config";

export default function PaymentForm() {
  const stripe = useStripe();
  const elements = useElements();
  const { orderId } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [paid, setPaid] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("card");

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await fetch(`${API_BASE}/orders/${orderId}`);
        if (!res.ok) throw new Error("Order not found");
        const data = await res.json();
        setOrder(data);
      } catch (err) {
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [orderId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!order) return;
    if (paymentMethod === "card" && (!stripe || !elements)) return;

    setProcessing(true);

    try {
      const intentRes = await fetch(`${PAYMENT_BASE}/create-payment-intent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });

      const intentData = await intentRes.json();
      if (!intentRes.ok)
        throw new Error(intentData.error || "Failed to create payment intent");

      if (paymentMethod === "card") {
        const { clientSecret } = intentData;
        const result = await stripe.confirmCardPayment(clientSecret, {
          payment_method: {
            card: elements.getElement(CardElement),
          },
        });
        if (result.error) throw new Error(result.error.message);
        if (result.paymentIntent?.status !== "succeeded")
          throw new Error("Payment did not succeed");
      }

      await fetch(`${API_BASE}/orders/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "completed",
          paymentStatus: "paid",
        }),
      });

      setPaid(true);
      toast.success("Payment successful!");
      setTimeout(() => navigate("/orders"), 2500);
    } catch (err) {
      console.error(err);
      toast.error(`Payment failed: ${err.message}`);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
        <div className="text-center">
          <p className="text-xl font-semibold mb-4">Order not found</p>
          <button
            onClick={() => navigate("/orders")}
            className="px-4 py-2 bg-violet-600 hover:bg-violet-500 rounded-xl transition-colors"
          >
            Back to Orders
          </button>
        </div>
      </div>
    );
  }

  if (paid) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto">
            <CheckCircle className="w-10 h-10 text-green-400" />
          </div>
          <h2 className="text-2xl font-bold">Payment Successful!</h2>
          <p className="text-slate-400">
            Order #{orderId.slice(-6)} has been marked as completed
          </p>
          <p className="text-sm text-slate-500">Redirecting to orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-white">
      <div className="w-full max-w-md space-y-6">
        <button
          onClick={() => navigate("/orders")}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Orders
        </button>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div>
            <h1 className="text-2xl font-bold">Payment</h1>
            <p className="text-slate-400 text-sm mt-1">
              Order #{orderId.slice(-6)} · Table {order.table}
            </p>
          </div>

          <div className="bg-slate-800 rounded-xl p-4 space-y-2">
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-3">
              Order Summary
            </p>
            {order.items?.map((item, i) => (
              <div
                key={i}
                className="flex items-center justify-between text-sm"
              >
                <span className="text-slate-300">
                  <span className="text-violet-400 font-medium">
                    {item.quantity}×
                  </span>{" "}
                  {item.name}
                </span>
                <span className="text-slate-300">
                  ${(item.price * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
            <div className="border-t border-slate-700 pt-2 mt-2 flex items-center justify-between">
              <span className="font-semibold">Total</span>
              <span className="text-xl font-bold text-violet-400">
                $
                {typeof order.total === "number"
                  ? order.total.toFixed(2)
                  : parseFloat(order.total || 0).toFixed(2)}
              </span>
            </div>
          </div>

          <div>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-3">
              Payment Method
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPaymentMethod("card")}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border transition-all ${
                  paymentMethod === "card"
                    ? "border-violet-500 bg-violet-500/10 text-violet-300"
                    : "border-slate-700 text-slate-400 hover:border-slate-600"
                }`}
              >
                <CreditCard className="w-4 h-4" />
                <span className="text-sm font-medium">Card</span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod("cash")}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border transition-all ${
                  paymentMethod === "cash"
                    ? "border-green-500 bg-green-500/10 text-green-300"
                    : "border-slate-700 text-slate-400 hover:border-slate-600"
                }`}
              >
                <Banknote className="w-4 h-4" />
                <span className="text-sm font-medium">Cash</span>
              </button>
            </div>
          </div>

          {paymentMethod === "card" && (
            <div>
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-3">
                Card Details
              </p>
              <div className="p-4 bg-slate-800 border border-slate-700 rounded-xl focus-within:border-violet-500/50 transition-colors">
                <CardElement
                  options={{
                    style: {
                      base: {
                        color: "#f1f5f9",
                        fontFamily: "inherit",
                        fontSize: "15px",
                        "::placeholder": { color: "#475569" },
                      },
                      invalid: { color: "#ef4444" },
                    },
                  }}
                />
              </div>
            </div>
          )}

          {paymentMethod === "cash" && (
            <div className="p-4 bg-green-500/5 border border-green-500/20 rounded-xl">
              <p className="text-sm text-green-300 font-medium mb-1">
                Cash Payment
              </p>
              <p className="text-xs text-slate-400">
                Collect $
                {typeof order.total === "number"
                  ? order.total.toFixed(2)
                  : parseFloat(order.total || 0).toFixed(2)}{" "}
                from the customer and confirm below.
              </p>
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={
              processing || (paymentMethod === "card" && (!stripe || !elements))
            }
            className="w-full py-3 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
          >
            {processing ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Lock className="w-4 h-4" />
                Pay $
                {typeof order.total === "number"
                  ? order.total.toFixed(2)
                  : parseFloat(order.total || 0).toFixed(2)}
              </>
            )}
          </button>

          <p className="text-xs text-slate-600 text-center flex items-center justify-center gap-1">
            <Lock className="w-3 h-3" />
            Secured by Stripe · End-to-end encrypted
          </p>
        </div>
      </div>
    </div>
  );
}

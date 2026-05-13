import { useEffect, useState } from "react";
import { CreditCard } from "lucide-react";
import { PAYMENT_BASE } from "../config";

export default function PaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const res = await fetch(`${PAYMENT_BASE}/`);
        const data = await res.json();
        setPayments(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to fetch payments", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPayments();
  }, []);

  if (loading) {
    return (
      <div className="p-8 bg-slate-950 min-h-screen text-white space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-14 bg-slate-800 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="p-8 bg-slate-950 min-h-screen text-white space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Payments</h1>
        <p className="text-slate-400 text-sm mt-1">
          Transaction history and payment records
        </p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-800/50">
            <tr>
              <th className="p-3 text-left text-xs text-slate-400 font-medium">
                Transaction ID
              </th>
              <th className="p-3 text-xs text-slate-400 font-medium">
                Order ID
              </th>
              <th className="p-3 text-xs text-slate-400 font-medium">Amount</th>
              <th className="p-3 text-xs text-slate-400 font-medium">Method</th>
              <th className="p-3 text-xs text-slate-400 font-medium">Status</th>
              <th className="p-3 text-xs text-slate-400 font-medium">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {payments.map((payment) => (
              <tr
                key={payment._id}
                className="hover:bg-slate-800/30 transition-colors"
              >
                <td className="p-3 font-mono text-xs text-violet-400">
                  {payment.transactionId?.slice(-12) || "—"}
                </td>
                <td className="p-3 text-center font-mono text-xs text-slate-400">
                  #{payment.orderId?.slice(-6) || "—"}
                </td>
                <td className="p-3 text-center font-semibold">
                  ${payment.amount?.toFixed(2)}
                </td>
                <td className="p-3 text-center capitalize text-slate-300">
                  {payment.method}
                </td>
                <td className="p-3 text-center">
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-medium border capitalize ${
                      payment.status === "completed"
                        ? "bg-green-500/20 text-green-400 border-green-500/30"
                        : payment.status === "pending"
                          ? "bg-orange-500/20 text-orange-400 border-orange-500/30"
                          : "bg-red-500/20 text-red-400 border-red-500/30"
                    }`}
                  >
                    {payment.status}
                  </span>
                </td>
                <td className="p-3 text-center text-xs text-slate-500">
                  {new Date(payment.createdAt).toLocaleDateString()}{" "}
                  {new Date(payment.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {payments.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-slate-500">
            <CreditCard className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-lg font-medium">No payments yet</p>
            <p className="text-sm mt-1">Completed payments will appear here</p>
          </div>
        )}
      </div>
    </div>
  );
}

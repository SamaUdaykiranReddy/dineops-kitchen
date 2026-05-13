import PaymentForm from "../components/PaymentPage.jsx";

export default function CheckoutPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white shadow-xl rounded-2xl p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center">
          Secure Checkout
        </h2>

        <PaymentForm />
      </div>
    </div>
  );
}

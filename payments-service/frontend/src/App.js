import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import CheckoutPage from "./pages/CheckoutPage.jsx";

//published key from stripe dashboard
const stripePromise = loadStripe(
  "pk_test_51T1yXtR3fy6OGvbWXZ9QXBcQqMV9oruNGp1euOW8110hbOTxoBXJMotEPB32eBie7M3MCWldxXxC3VV0be7T71h400LVi94MjW",
);

function App() {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutPage />
    </Elements>
  );
}

export default App;

import { AppProps } from 'next/app'; // Import the correct type for AppProps
import { Elements } from '@stripe/react-stripe-js'; // Import Elements for Stripe
import { loadStripe } from '@stripe/stripe-js'; // Import loadStripe for initializing Stripe
import Header from '../components/Header'; // Import Header component
import Footer from '../components/Footer'; // Import Footer component
import '../styles/globals.css'; // Import global styles

// Load Stripe outside of a component to avoid reinitialization
const stripePublicKey = process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY;
if (!stripePublicKey) {
  throw new Error("Stripe public key is missing in .env file");
}

const stripePromise = loadStripe(stripePublicKey); 

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <Elements stripe={stripePromise}>  {/* Wrap your app in Elements */}
      <div>
        <Header /> {/* Shared header */}
        <main>
          <Component {...pageProps} /> {/* Page-specific content */}
        </main>
        <Footer /> {/* Shared footer */}
      </div>
    </Elements>
  );
}
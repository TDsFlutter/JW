import { Montserrat, Cinzel } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/context/CartContext";
import { AuthProvider } from "@/context/AuthContext";
import CartDrawer from "@/components/CartDrawer";
import AnnouncementBar from "@/components/AnnouncementBar";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ErrorTracker from "@/components/ErrorTracker";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const cinzel = Cinzel({
  variable: "--font-cinzel",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata = {
  title: "ORNIVAJEWELS | Premium Jewelry Collection",
  description:
    "Discover exquisite handcrafted jewelry at ORNIVAJEWELS. Shop diamond rings, gold bracelets, necklaces and more. Free shipping over $99. Premium quality, timeless designs.",
  keywords:
    "jewelry, diamond rings, gold bracelets, necklaces, earrings, premium jewelry, luxury jewelry",
  openGraph: {
    title: "ORNIVAJEWELS | Premium Jewelry Collection",
    description:
      "Discover exquisite handcrafted jewelry at ORNIVAJEWELS. Shop diamond rings, gold bracelets, necklaces and more.",
    type: "website",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${montserrat.variable} ${cinzel.variable}`}
        suppressHydrationWarning
      >
        <AuthProvider>
          <CartProvider>
            <ErrorTracker />
            <AnnouncementBar />
            <Header />
            {children}
            <Footer />
            <CartDrawer />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}


import { Lato, Montserrat_Alternates, Libre_Baskerville, Corben } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/context/CartContext";
import { AuthProvider } from "@/context/AuthContext";
import CartDrawer from "@/components/CartDrawer";
import AnnouncementBar from "@/components/AnnouncementBar";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const lato = Lato({
  variable: "--font-lato",
  subsets: ["latin"],
  weight: ["100", "300", "400", "700", "900"],
  display: "swap",
});

const montserrat = Montserrat_Alternates({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const corben = Corben({
  variable: "--font-corben",
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
});

const baskerville = Libre_Baskerville({
  variable: "--font-baskerville",
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
});

export const metadata = {
  title: "ëlla | Premium Jewelry Collection",
  description:
    "Discover exquisite handcrafted jewelry at ëlla. Shop diamond rings, gold bracelets, necklaces and more. Free shipping over $99. Premium quality, timeless designs.",
  keywords:
    "jewelry, diamond rings, gold bracelets, necklaces, earrings, premium jewelry, luxury jewelry",
  openGraph: {
    title: "ëlla | Premium Jewelry Collection",
    description:
      "Discover exquisite handcrafted jewelry at ëlla. Shop diamond rings, gold bracelets, necklaces and more.",
    type: "website",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${lato.variable} ${montserrat.variable} ${corben.variable} ${baskerville.variable}`}
        suppressHydrationWarning
      >
        <AuthProvider>
          <CartProvider>
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


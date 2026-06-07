import ProductPageClient from "./ProductPageClient";
import { db, isFirebaseConfigured, collection, getDocs } from "@/lib/firebase";

export async function generateStaticParams() {
  if (!isFirebaseConfigured) {
    console.warn("Firebase is not configured during static generation. Using placeholder path.");
    // Must return at least one path with output: export — the client page handles 404s gracefully
    return [{ slug: "_placeholder" }];
  }
  try {
    const querySnapshot = await getDocs(collection(db, "products"));
    const paths = [];
    querySnapshot.forEach((doc) => {
      paths.push({ slug: doc.id });
    });
    console.log(`Generated ${paths.length} static paths for product pages.`);
    // Always return at least one path to avoid export build failure
    return paths.length > 0 ? paths : [{ slug: "_placeholder" }];
  } catch (error) {
    console.error("Failed to generate static params from firestore:", error);
    return [{ slug: "_placeholder" }];
  }
}


export default async function Page({ params }) {
  return <ProductPageClient params={params} />;
}

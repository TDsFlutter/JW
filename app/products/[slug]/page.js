import ProductPageClient from "./ProductPageClient";
import { db, isFirebaseConfigured, collection, getDocs } from "@/lib/firebase";

export async function generateStaticParams() {
  if (!isFirebaseConfigured) {
    console.log("Firebase is not configured during static generation. Returning empty paths.");
    return [];
  }
  try {
    const querySnapshot = await getDocs(collection(db, "products"));
    const paths = [];
    querySnapshot.forEach((doc) => {
      paths.push({ slug: doc.id });
    });
    console.log(`Generated ${paths.length} static paths for product pages.`);
    return paths;
  } catch (error) {
    console.error("Failed to generate static params from firestore:", error);
    return [];
  }
}

export default async function Page({ params }) {
  return <ProductPageClient params={params} />;
}

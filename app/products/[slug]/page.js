import ProductPageClient from "./ProductPageClient";
export async function generateStaticParams() {
  const ADMIN_URL = process.env.NEXT_PUBLIC_ADMIN_URL || "http://localhost:3001";
  try {
    const res = await fetch(`${ADMIN_URL}/api/products`);
    if (res.ok) {
      const products = await res.json();
      const paths = products.map((p) => ({ slug: p.slug }));
      console.log(`Generated ${paths.length} static paths for product pages.`);
      return paths.length > 0 ? paths : [{ slug: "_placeholder" }];
    }
  } catch (error) {
    console.warn("Failed to generate static params from API, using placeholder:", error.message);
  }
  return [{ slug: "_placeholder" }];
}


export default async function Page({ params }) {
  return <ProductPageClient params={params} />;
}

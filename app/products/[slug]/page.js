import ProductPageClient from "./ProductPageClient";

// Rendered on demand (the client fetches the product from /api/products/[slug]).
export const dynamic = "force-dynamic";

export default async function Page({ params }) {
  return <ProductPageClient params={params} />;
}

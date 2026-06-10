export const products = [];

export const categories = ["All", "Rings", "Bracelets", "Pendants", "Earrings"];

export function getProductBySlug(slug) {
  return products.find((p) => p.slug === slug) || null;
}

export function getRelatedProducts(product, limit = 4) {
  return products
    .filter((p) => p.id !== product.id && p.category === product.category)
    .slice(0, limit);
}

export function getProductsByCategory(category) {
  if (category === "All") return products;
  return products.filter((p) => p.category === category);
}

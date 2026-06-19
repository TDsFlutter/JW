// Single source of truth for ordering via WhatsApp (no payment gateway).
// The business number can be overridden per-environment; the fallback keeps the
// site functional until the real number is configured.
export const WHATSAPP_NUMBER = (
  process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "919876543210"
).replace(/[^0-9]/g, "");

function formatPrice(value) {
  const n = parseFloat(value || 0);
  return `₹${n.toFixed(2)}`;
}

// Builds the full cart-order message sent from the checkout page.
export function buildOrderMessage({
  orderNumber,
  name,
  phone,
  address,
  items = [],
  subtotal,
  shipping,
  tax,
  total,
}) {
  const lines = [];
  lines.push("Hello! I'd like to place an order with ORNIVAJEWELS. 💍");
  if (orderNumber) lines.push(`Order Ref: ${orderNumber}`);
  lines.push("");
  lines.push("*Items*");

  items.forEach((item, idx) => {
    const opts = [item.metal, item.size && `Size ${item.size}`]
      .filter(Boolean)
      .join(" / ");
    const detail = opts ? ` — ${opts}` : "";
    lines.push(
      `${idx + 1}. ${item.name} × ${item.quantity}${detail} — ${formatPrice(item.price)}`
    );
  });

  lines.push("");
  if (subtotal != null) lines.push(`Subtotal: ${formatPrice(subtotal)}`);
  if (shipping != null) {
    lines.push(`Shipping: ${parseFloat(shipping) === 0 ? "FREE" : formatPrice(shipping)}`);
  }
  if (tax != null) lines.push(`Tax: ${formatPrice(tax)}`);
  if (total != null) lines.push(`*Total: ${formatPrice(total)}*`);

  lines.push("");
  lines.push("*Delivery details*");
  if (name) lines.push(`Name: ${name}`);
  if (phone) lines.push(`Phone: ${phone}`);
  if (address) lines.push(`Address: ${address}`);

  return lines.join("\n");
}

// Builds a quick single-product enquiry message from a product detail page.
export function buildProductMessage(product, { size, metal, quantity = 1 } = {}) {
  const lines = [];
  lines.push("Hello! I'm interested in this piece from ORNIVAJEWELS. 💍");
  lines.push("");
  lines.push(`*${product.name}*`);
  if (product.price != null) lines.push(`Price: ${formatPrice(product.price)}`);
  if (metal) lines.push(`Plating: ${metal}`);
  if (size) lines.push(`Size: ${size}`);
  lines.push(`Quantity: ${quantity}`);
  lines.push("");
  lines.push("Could you help me place the order?");
  return lines.join("\n");
}

// Opens WhatsApp with the prefilled message. Must be called inside a user
// gesture (e.g. a click handler) so popup blockers don't swallow it.
export function openWhatsApp(message) {
  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  window.open(url, "_blank");
}

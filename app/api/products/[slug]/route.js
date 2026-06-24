import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';

// Public, read-only single product lookup by slug / sku / id.
export const dynamic = 'force-dynamic';

function lookupBy(slug) {
  const or = [{ slug }, { sku: slug }];
  if (!isNaN(slug)) or.push({ id: parseInt(slug, 10) });
  return { $or: or };
}

export async function GET(req, { params }) {
  try {
    const { slug } = await params;
    const db = await getDb();

    const p = await db.collection('products').findOne(lookupBy(slug));
    if (!p) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const category = await db.collection('categories').findOne({ id: p.category_id });
    const { _id, ...rest } = p;

    return NextResponse.json({
      ...rest,
      price: p.base_price,
      originalPrice: p.sale_price,
      images: Array.isArray(p.images) ? p.images : [],
      specs: Array.isArray(p.specs) ? p.specs.map((s) => ({ label: s.name, value: s.value })) : [],
      category: category?.name,
      category_name: category?.name,
      sku_prefix: category?.sku_prefix,
      rating_avg: p.rating_avg || 0,
      rating_count: p.rating_count || 0,
      rating_breakdown: p.rating_breakdown || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

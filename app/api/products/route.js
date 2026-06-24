import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';

// Public, read-only product feed. Mirrors the admin panel's GET so the
// website can read products straight from MongoDB without the admin running.
export const dynamic = 'force-dynamic';

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function enrich(p) {
  const { _id, ...rest } = p;
  return {
    ...rest,
    price: p.base_price,
    originalPrice: p.sale_price,
    images: Array.isArray(p.images) ? p.images : [],
    specs: Array.isArray(p.specs) ? p.specs.map((s) => ({ label: s.name, value: s.value })) : [],
    category: p.category_name,
    rating_avg: p.rating_avg || 0,
    rating_count: p.rating_count || 0,
  };
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const status = searchParams.get('status') || 'Active';
    const metalType = searchParams.get('metal_type') || '';
    const stoneType = searchParams.get('stone_type') || '';
    const collection = searchParams.get('collection') || '';
    const gender = searchParams.get('gender') || '';
    const sortBy = searchParams.get('sort_by') || 'display_order';

    const db = await getDb();

    const pipeline = [
      {
        $lookup: {
          from: 'categories',
          localField: 'category_id',
          foreignField: 'id',
          as: '_cat',
        },
      },
      {
        $addFields: {
          category_name: { $arrayElemAt: ['$_cat.name', 0] },
          sku_prefix: { $arrayElemAt: ['$_cat.sku_prefix', 0] },
        },
      },
      { $project: { _cat: 0 } },
    ];

    const match = {};
    if (status && status !== 'all') match.status = status;
    if (search) {
      const term = new RegExp(escapeRegex(search), 'i');
      match.$or = [{ name: term }, { sku: term }, { description: term }];
    }
    if (category) {
      if (isNaN(category)) match.category_name = category;
      else match.category_id = parseInt(category, 10);
    }
    if (metalType) match.metal_type = metalType;
    if (stoneType) match.stone_type = stoneType;
    if (collection) match.collection = collection;
    if (gender) match.gender = gender;
    if (Object.keys(match).length > 0) pipeline.push({ $match: match });

    const sortMap = {
      newest: { created_at: -1 },
      oldest: { created_at: 1 },
      'price-low': { base_price: 1 },
      'price-high': { base_price: -1 },
      'alphabetical-asc': { name: 1 },
      'alphabetical-desc': { name: -1 },
    };
    pipeline.push({ $sort: sortMap[sortBy] || { display_order: 1, id: -1 } });

    const products = await db.collection('products').aggregate(pipeline).toArray();
    return NextResponse.json(products.map(enrich));
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

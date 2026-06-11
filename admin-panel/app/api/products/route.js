import { NextResponse } from 'next/server';
import { getDb, getNextId } from '@/lib/mongodb';
import { verifyAdminRequest } from '@/lib/auth';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

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
  };
}

// GET products (with filters, search, sorting)
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
    return NextResponse.json(products.map(enrich), { headers: corsHeaders });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
}

// POST product (Admin Auth)
export async function POST(req) {
  try {
    const admin = await verifyAdminRequest(req);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
    }

    const data = await req.json();
    const {
      name, slug, short_description, description, category_id, subcategory,
      metal_type, metal_color, purity, stone_type, stone_shape, cut_grade,
      style, collection, base_price, sale_price, status, display_order,
      gender, availability, video_url, images, specs,
    } = data;

    if (!name || !category_id || !base_price) {
      return NextResponse.json({ error: 'Name, Category, and Base Price are required' }, { status: 400, headers: corsHeaders });
    }

    const db = await getDb();
    const catId = parseInt(category_id, 10);
    const category = await db.collection('categories').findOne({ id: catId });
    if (!category) {
      return NextResponse.json({ error: 'Invalid category selection' }, { status: 400, headers: corsHeaders });
    }
    const prefix = category.sku_prefix;

    // SKU generation (sequence based on category prefix)
    const lastSkuDoc = await db.collection('products')
      .find({ sku: new RegExp('^' + escapeRegex(prefix) + '-') })
      .sort({ sku: -1 })
      .limit(1)
      .toArray();
    let nextNum = 1;
    if (lastSkuDoc.length > 0) {
      const num = parseInt(lastSkuDoc[0].sku.split('-')[1], 10);
      if (!isNaN(num)) nextNum = num + 1;
    }
    const sku = `${prefix}-${String(nextNum).padStart(4, '0')}`;

    const cleanSlug =
      (slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')) +
      '-' + Date.now().toString(36).substr(-4);

    // Build specs (defaults + custom), dedupe by name
    const allSpecs = [
      { name: 'Metal Type', value: metal_type || '' },
      { name: 'Metal Color', value: metal_color || '' },
      { name: 'Purity', value: purity || '' },
      { name: 'Stone Type', value: stone_type || '' },
      { name: 'Stone Shape', value: stone_shape || '' },
      { name: 'Cut Grade', value: cut_grade || '' },
    ];
    if (Array.isArray(specs)) {
      specs.forEach((s) => {
        if (s.name && s.value) {
          const name = s.name.trim();
          const existing = allSpecs.find((x) => x.name === name);
          if (existing) existing.value = s.value.trim();
          else allSpecs.push({ name, value: s.value.trim() });
        }
      });
    }
    const cleanImages = Array.isArray(images)
      ? images.filter((img) => img && img.trim()).map((img) => img.trim())
      : [];

    const id = await getNextId('products');
    const now = new Date().toISOString();

    await db.collection('products').insertOne({
      id,
      name: name.trim(),
      sku,
      slug: cleanSlug,
      short_description: short_description || '',
      description: description || '',
      category_id: catId,
      subcategory: subcategory || '',
      metal_type: metal_type || '',
      metal_color: metal_color || '',
      purity: purity || '',
      stone_type: stone_type || '',
      stone_shape: stone_shape || '',
      cut_grade: cut_grade || '',
      style: style || '',
      collection: collection || '',
      base_price: parseFloat(base_price),
      sale_price: sale_price ? parseFloat(sale_price) : null,
      status: status || 'Draft',
      display_order: parseInt(display_order || 0, 10),
      gender: gender || 'Unisex',
      availability: availability || 'Made To Order',
      video_url: video_url || null,
      images: cleanImages,
      specs: allSpecs.filter((s) => s.name && s.value),
      created_at: now,
      updated_at: now,
    });

    return NextResponse.json({ success: true, productId: id, sku, slug: cleanSlug }, { headers: corsHeaders });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
}

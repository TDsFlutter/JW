import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { verifyAdminRequest } from '@/lib/auth';
import { sanitizeColorVariants } from '@/lib/plating';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const ALLOWED_STATUSES = ['Draft', 'Active', 'Deactive', 'Out of Stock'];

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

function lookupBy(slug) {
  const or = [{ slug }, { sku: slug }];
  if (!isNaN(slug)) or.push({ id: parseInt(slug, 10) });
  return { $or: or };
}

// GET single product by slug / sku / id
export async function GET(req, { params }) {
  try {
    const { slug } = await params;
    const db = await getDb();

    const p = await db.collection('products').findOne(lookupBy(slug));
    if (!p) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404, headers: corsHeaders });
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
    }, { headers: corsHeaders });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
}

// PUT (update) product (Admin Auth)
export async function PUT(req, { params }) {
  try {
    const admin = await verifyAdminRequest(req);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
    }

    const { slug: urlSlug } = await params;
    const data = await req.json();
    const {
      name, short_description, description, category_id, subcategory,
      metal_type, metal_color, purity, stone_type, stone_shape, cut_grade,
      style, collection, base_price, sale_price, status, display_order,
      gender, availability, video_url, images, specs, colorVariants,
    } = data;

    const db = await getDb();
    const existing = await db.collection('products').findOne(lookupBy(urlSlug));
    if (!existing) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404, headers: corsHeaders });
    }

    if (!name || !category_id || !base_price) {
      return NextResponse.json({ error: 'Name, Category, and Base Price are required' }, { status: 400, headers: corsHeaders });
    }

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
          const sname = s.name.trim();
          const ex = allSpecs.find((x) => x.name === sname);
          if (ex) ex.value = s.value.trim();
          else allSpecs.push({ name: sname, value: s.value.trim() });
        }
      });
    }
    const cleanImages = Array.isArray(images)
      ? images.filter((img) => img && img.trim()).map((img) => img.trim())
      : [];

    await db.collection('products').updateOne(
      { id: existing.id },
      {
        $set: {
          name: name.trim(),
          short_description: short_description || '',
          description: description || '',
          category_id: parseInt(category_id, 10),
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
          colorVariants: sanitizeColorVariants(colorVariants),
          updated_at: new Date().toISOString(),
        },
      }
    );

    return NextResponse.json({ success: true }, { headers: corsHeaders });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
}

// PATCH (partial update — currently status only, for inline quick-edit) (Admin Auth)
export async function PATCH(req, { params }) {
  try {
    const admin = await verifyAdminRequest(req);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
    }

    const { slug } = await params;
    const { status } = await req.json();

    if (!ALLOWED_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Allowed: ${ALLOWED_STATUSES.join(', ')}` },
        { status: 400, headers: corsHeaders }
      );
    }

    const db = await getDb();
    const result = await db.collection('products').updateOne(
      lookupBy(slug),
      { $set: { status, updated_at: new Date().toISOString() } }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404, headers: corsHeaders });
    }

    return NextResponse.json({ success: true, status }, { headers: corsHeaders });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
}

// DELETE product (Admin Auth)
export async function DELETE(req, { params }) {
  try {
    const admin = await verifyAdminRequest(req);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
    }

    const { slug } = await params;
    const db = await getDb();
    const result = await db.collection('products').deleteOne(lookupBy(slug));

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404, headers: corsHeaders });
    }

    return NextResponse.json({ success: true }, { headers: corsHeaders });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
}

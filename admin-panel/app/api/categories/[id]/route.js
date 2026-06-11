import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { verifyAdminRequest } from '@/lib/auth';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

// Update category (Admin Auth)
export async function PUT(req, { params }) {
  try {
    const admin = await verifyAdminRequest(req);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
    }

    const { id } = await params;
    const catId = parseInt(id, 10);
    const { name, sku_prefix, display_order, genders } = await req.json();

    if (!name || !sku_prefix) {
      return NextResponse.json({ error: 'Name and SKU Prefix are required' }, { status: 400, headers: corsHeaders });
    }

    const prefix = sku_prefix.trim().toUpperCase();
    const cleanGenders = Array.isArray(genders) ? genders : [];

    const db = await getDb();
    const existing = await db.collection('categories').findOne({ sku_prefix: prefix, id: { $ne: catId } });
    if (existing) {
      return NextResponse.json({ error: 'SKU Prefix must be unique' }, { status: 400, headers: corsHeaders });
    }

    await db.collection('categories').updateOne(
      { id: catId },
      { $set: { name: name.trim(), sku_prefix: prefix, display_order: display_order || 0, genders: cleanGenders, updated_at: new Date().toISOString() } }
    );

    return NextResponse.json({ success: true }, { headers: corsHeaders });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
}

// Delete category (Admin Auth) — cascades to products in this category
export async function DELETE(req, { params }) {
  try {
    const admin = await verifyAdminRequest(req);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
    }

    const { id } = await params;
    const catId = parseInt(id, 10);

    const db = await getDb();
    // Cascade: remove products belonging to this category (mirrors MySQL ON DELETE CASCADE)
    await db.collection('products').deleteMany({ category_id: catId });
    await db.collection('categories').deleteOne({ id: catId });

    return NextResponse.json({ success: true }, { headers: corsHeaders });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
}

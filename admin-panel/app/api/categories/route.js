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

// Get all categories sorted by display_order
export async function GET() {
  try {
    const db = await getDb();
    const categories = await db.collection('categories')
      .find({}, { projection: { _id: 0 } })
      .sort({ display_order: 1 })
      .toArray();
    return NextResponse.json(categories, { headers: corsHeaders });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
}

// Create a new category (Admin Auth)
export async function POST(req) {
  try {
    const admin = await verifyAdminRequest(req);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
    }

    const { name, sku_prefix, display_order, genders } = await req.json();

    if (!name || !sku_prefix) {
      return NextResponse.json({ error: 'Name and SKU Prefix are required' }, { status: 400, headers: corsHeaders });
    }

    const prefix = sku_prefix.trim().toUpperCase();
    const cleanGenders = Array.isArray(genders) ? genders : [];

    const db = await getDb();
    const existing = await db.collection('categories').findOne({ sku_prefix: prefix });
    if (existing) {
      return NextResponse.json({ error: 'SKU Prefix must be unique' }, { status: 400, headers: corsHeaders });
    }

    const id = await getNextId('categories');
    const now = new Date().toISOString();
    await db.collection('categories').insertOne({
      id,
      name: name.trim(),
      sku_prefix: prefix,
      display_order: display_order || 0,
      genders: cleanGenders,
      created_at: now,
      updated_at: now,
    });

    return NextResponse.json({
      success: true,
      category: { id, name: name.trim(), sku_prefix: prefix, display_order: display_order || 0, genders: cleanGenders }
    }, { headers: corsHeaders });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
}

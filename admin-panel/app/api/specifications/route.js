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

// Get all specification fields
export async function GET() {
  try {
    const db = await getDb();
    const fields = await db.collection('specification_fields')
      .find({}, { projection: { _id: 0 } })
      .sort({ display_order: 1 })
      .toArray();
    return NextResponse.json(fields, { headers: corsHeaders });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
}

// Add a specification field (Admin Auth)
export async function POST(req) {
  try {
    const admin = await verifyAdminRequest(req);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
    }

    const { name, display_order } = await req.json();

    if (!name) {
      return NextResponse.json({ error: 'Field name is required' }, { status: 400, headers: corsHeaders });
    }

    const cleanName = name.trim();

    const db = await getDb();
    const existing = await db.collection('specification_fields').findOne({ name: cleanName });
    if (existing) {
      return NextResponse.json({ error: 'Field name already exists' }, { status: 400, headers: corsHeaders });
    }

    const id = await getNextId('specification_fields');
    await db.collection('specification_fields').insertOne({
      id,
      name: cleanName,
      display_order: display_order || 0,
    });

    return NextResponse.json({
      success: true,
      field: { id, name: cleanName, display_order: display_order || 0 }
    }, { headers: corsHeaders });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
}

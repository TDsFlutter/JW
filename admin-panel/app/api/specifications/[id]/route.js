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

// Update spec field (Admin Auth)
export async function PUT(req, { params }) {
  try {
    const admin = await verifyAdminRequest(req);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
    }

    const { id } = await params;
    const fieldId = parseInt(id, 10);
    const { name, display_order } = await req.json();

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400, headers: corsHeaders });
    }

    const cleanName = name.trim();

    const db = await getDb();
    const existing = await db.collection('specification_fields').findOne({ name: cleanName, id: { $ne: fieldId } });
    if (existing) {
      return NextResponse.json({ error: 'Field name must be unique' }, { status: 400, headers: corsHeaders });
    }

    await db.collection('specification_fields').updateOne(
      { id: fieldId },
      { $set: { name: cleanName, display_order: display_order || 0 } }
    );

    return NextResponse.json({ success: true }, { headers: corsHeaders });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
}

// Delete spec field (Admin Auth)
export async function DELETE(req, { params }) {
  try {
    const admin = await verifyAdminRequest(req);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
    }

    const { id } = await params;
    const db = await getDb();
    await db.collection('specification_fields').deleteOne({ id: parseInt(id, 10) });

    return NextResponse.json({ success: true }, { headers: corsHeaders });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
}

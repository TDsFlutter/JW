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

function lookupBy(id) {
  const or = [{ order_number: id }];
  if (!isNaN(id)) or.push({ id: parseInt(id, 10) });
  return { $or: or };
}

// PUT (update status) order (Admin Auth)
export async function PUT(req, { params }) {
  try {
    const admin = await verifyAdminRequest(req);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
    }

    const { id } = await params;
    const { status } = await req.json();

    if (!status) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400, headers: corsHeaders });
    }

    const db = await getDb();
    const result = await db.collection('orders').updateOne(
      lookupBy(id),
      { $set: { status, updated_at: new Date().toISOString() } }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404, headers: corsHeaders });
    }

    return NextResponse.json({ success: true }, { headers: corsHeaders });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
}

// DELETE order (Admin Auth)
export async function DELETE(req, { params }) {
  try {
    const admin = await verifyAdminRequest(req);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
    }

    const { id } = await params;
    const db = await getDb();
    const result = await db.collection('orders').deleteOne(lookupBy(id));

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404, headers: corsHeaders });
    }

    return NextResponse.json({ success: true }, { headers: corsHeaders });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
}

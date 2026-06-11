import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { verifyAdminRequest } from '@/lib/auth';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

// Bulk update categories display order
export async function POST(req) {
  try {
    const admin = await verifyAdminRequest(req);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
    }

    const { items } = await req.json(); // Array of { id, display_order }

    if (!Array.isArray(items)) {
      return NextResponse.json({ error: 'Items list is required' }, { status: 400, headers: corsHeaders });
    }

    const db = await getDb();
    const ops = items.map((item) => ({
      updateOne: {
        filter: { id: parseInt(item.id, 10) },
        update: { $set: { display_order: item.display_order } },
      },
    }));
    if (ops.length > 0) await db.collection('categories').bulkWrite(ops);

    return NextResponse.json({ success: true }, { headers: corsHeaders });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
}

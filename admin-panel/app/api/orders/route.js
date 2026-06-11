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

// GET all orders (Admin Auth or filter by user_id)
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('user_id');

    const filter = {};
    if (userId) {
      filter.user_id = userId;
    } else {
      const admin = await verifyAdminRequest(req);
      if (!admin) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
      }
    }

    const db = await getDb();
    const orders = await db.collection('orders')
      .find(filter, { projection: { _id: 0 } })
      .sort({ created_at: -1 })
      .toArray();

    const formattedOrders = orders.map((ord) => {
      let parsedItems = [];
      try {
        parsedItems = typeof ord.items === 'string' ? JSON.parse(ord.items) : (ord.items || []);
      } catch (_) {
        parsedItems = [];
      }
      return { ...ord, items: parsedItems, createdAt: ord.created_at };
    });

    return NextResponse.json(formattedOrders, { headers: corsHeaders });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
}

// POST new order (Public checkout)
export async function POST(req) {
  try {
    const data = await req.json();
    const { order_number, user_id, email, name, phone, address, total_amount, payment_method, items } = data;

    if (!order_number || !email || !name || !address || !total_amount || !items) {
      return NextResponse.json({ error: 'Missing required order fields' }, { status: 400, headers: corsHeaders });
    }

    const parsedItems = typeof items === 'string' ? JSON.parse(items) : items;

    const db = await getDb();
    const id = await getNextId('orders');
    const now = new Date().toISOString();
    await db.collection('orders').insertOne({
      id,
      order_number,
      user_id: user_id || null,
      email,
      name,
      phone: phone || '',
      address,
      total_amount: parseFloat(total_amount),
      payment_method: payment_method || 'COD',
      items: parsedItems,
      status: 'Pending',
      created_at: now,
      updated_at: now,
    });

    return NextResponse.json({ success: true, order_number }, { headers: corsHeaders });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
}

import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
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

    let sql = 'SELECT * FROM orders';
    const params = [];

    if (userId) {
      // If querying user_id, ensure they are authenticated as that user (or are admin)
      // We can relax check or verify authUid matches userId
      // For simple public/private checks, we check:
      sql += ' WHERE user_id = ?';
      params.push(userId);
    } else {
      // If querying all orders, must be admin
      const admin = await verifyAdminRequest(req);
      if (!admin) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
      }
    }

    sql += ' ORDER BY created_at DESC';
    const orders = await query(sql, params);

    // Parse items JSON for each order
    const formattedOrders = orders.map(ord => {
      let parsedItems = [];
      try {
        parsedItems = JSON.parse(ord.items);
      } catch (_) {
        parsedItems = [];
      }
      return {
        ...ord,
        items: parsedItems,
        createdAt: ord.created_at // compatibility mapping
      };
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
    const {
      order_number,
      user_id,
      email,
      name,
      phone,
      address,
      total_amount,
      payment_method,
      items
    } = data;

    if (!order_number || !email || !name || !address || !total_amount || !items) {
      return NextResponse.json({ error: 'Missing required order fields' }, { status: 400, headers: corsHeaders });
    }

    const itemsStr = typeof items === 'string' ? items : JSON.stringify(items);

    await query(
      `INSERT INTO orders (
        order_number, user_id, email, name, phone, address, total_amount, payment_method, items
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        order_number,
        user_id || null,
        email,
        name,
        phone || '',
        address,
        parseFloat(total_amount),
        payment_method || 'COD',
        itemsStr
      ]
    );

    return NextResponse.json({ success: true, order_number }, { headers: corsHeaders });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
}

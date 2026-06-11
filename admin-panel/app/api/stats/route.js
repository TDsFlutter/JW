import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { verifyAdminRequest } from '@/lib/auth';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

// Dashboard counts only — avoids fetching full product/category/blog/order/
// inquiry lists just to show the overview tiles.
export async function GET(req) {
  try {
    const admin = await verifyAdminRequest(req);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
    }

    const db = await getDb();
    const [products, categories, blogs, orders, inquiries] = await Promise.all([
      db.collection('products').countDocuments(),
      db.collection('categories').countDocuments(),
      db.collection('blogs').countDocuments(),
      db.collection('orders').countDocuments(),
      db.collection('contact_inquiries').countDocuments(),
    ]);

    return NextResponse.json(
      { products, categories, blogs, orders, inquiries },
      { headers: corsHeaders }
    );
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
}

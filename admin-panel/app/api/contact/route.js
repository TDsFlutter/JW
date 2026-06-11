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

// GET all contact inquiries (Admin Auth)
export async function GET(req) {
  try {
    const admin = await verifyAdminRequest(req);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
    }

    const db = await getDb();
    const inquiries = await db.collection('contact_inquiries')
      .find({}, { projection: { _id: 0 } })
      .sort({ created_at: -1 })
      .toArray();
    return NextResponse.json(inquiries, { headers: corsHeaders });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
}

// POST new contact inquiry (Public submission)
export async function POST(req) {
  try {
    const { name, email, phone, message } = await req.json();

    if (!name || !email || !message) {
      return NextResponse.json({ error: 'Name, Email, and Message are required' }, { status: 400, headers: corsHeaders });
    }

    const db = await getDb();
    const id = await getNextId('contact_inquiries');
    await db.collection('contact_inquiries').insertOne({
      id,
      name: name.trim(),
      email: email.trim(),
      phone: phone || '',
      message: message.trim(),
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({ success: true }, { headers: corsHeaders });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
}

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

// GET all FAQs
export async function GET() {
  try {
    const db = await getDb();
    const faqs = await db.collection('faqs')
      .find({}, { projection: { _id: 0 } })
      .sort({ display_order: 1 })
      .toArray();
    return NextResponse.json(faqs, { headers: corsHeaders });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
}

// POST new FAQ (Admin Auth)
export async function POST(req) {
  try {
    const admin = await verifyAdminRequest(req);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
    }

    const { question, answer, display_order } = await req.json();

    if (!question || !answer) {
      return NextResponse.json({ error: 'Question and Answer are required' }, { status: 400, headers: corsHeaders });
    }

    const db = await getDb();
    const id = await getNextId('faqs');
    const now = new Date().toISOString();
    await db.collection('faqs').insertOne({
      id,
      question: question.trim(),
      answer: answer.trim(),
      display_order: display_order || 0,
      created_at: now,
      updated_at: now,
    });

    return NextResponse.json({
      success: true,
      faq: { id, question, answer, display_order: display_order || 0 }
    }, { headers: corsHeaders });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
}

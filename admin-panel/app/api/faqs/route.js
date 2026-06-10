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

// GET all FAQs
export async function GET() {
  try {
    const faqs = await query('SELECT * FROM faqs ORDER BY display_order ASC');
    
    // Format response to group by category if needed or just return raw array
    // Storefront expects categories or raw array depending on page.js
    // Let's check how storefront faqs page consumes it. In seed we saved them with questions and answers.
    // If storefront consumes a structured format or raw array, we can return the array.
    // We will ensure compatibility with storefront's faqs page.
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

    const result = await query(
      'INSERT INTO faqs (question, answer, display_order) VALUES (?, ?, ?)',
      [question.trim(), answer.trim(), display_order || 0]
    );

    return NextResponse.json({
      success: true,
      faq: {
        id: result.insertId,
        question,
        answer,
        display_order: display_order || 0
      }
    }, { headers: corsHeaders });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
}

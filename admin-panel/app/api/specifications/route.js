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

// Get all specification fields
export async function GET() {
  try {
    const fields = await query('SELECT * FROM specification_fields ORDER BY display_order ASC');
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

    // Check unique field name
    const existing = await query('SELECT id FROM specification_fields WHERE name = ?', [cleanName]);
    if (existing.length > 0) {
      return NextResponse.json({ error: 'Field name already exists' }, { status: 400, headers: corsHeaders });
    }

    const result = await query(
      'INSERT INTO specification_fields (name, display_order) VALUES (?, ?)',
      [cleanName, display_order || 0]
    );

    return NextResponse.json({
      success: true,
      field: {
        id: result.insertId,
        name: cleanName,
        display_order: display_order || 0
      }
    }, { headers: corsHeaders });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
}

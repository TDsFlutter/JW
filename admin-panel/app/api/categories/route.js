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

// Get all categories sorted by display_order
export async function GET() {
  try {
    const categories = await query('SELECT * FROM categories ORDER BY display_order ASC');
    return NextResponse.json(categories, { headers: corsHeaders });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
}

// Create a new category (Admin Auth)
export async function POST(req) {
  try {
    const admin = await verifyAdminRequest(req);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
    }

    const { name, sku_prefix, display_order } = await req.json();

    if (!name || !sku_prefix) {
      return NextResponse.json({ error: 'Name and SKU Prefix are required' }, { status: 400, headers: corsHeaders });
    }

    // Force SKU prefix to be uppercase
    const prefix = sku_prefix.trim().toUpperCase();

    // Check if prefix already exists
    const existing = await query('SELECT id FROM categories WHERE sku_prefix = ?', [prefix]);
    if (existing.length > 0) {
      return NextResponse.json({ error: 'SKU Prefix must be unique' }, { status: 400, headers: corsHeaders });
    }

    const result = await query(
      'INSERT INTO categories (name, sku_prefix, display_order) VALUES (?, ?, ?)',
      [name.trim(), prefix, display_order || 0]
    );

    return NextResponse.json({
      success: true,
      category: {
        id: result.insertId,
        name: name.trim(),
        sku_prefix: prefix,
        display_order: display_order || 0,
      }
    }, { headers: corsHeaders });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
}

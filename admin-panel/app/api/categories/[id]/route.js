import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyAdminRequest } from '@/lib/auth';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

// Update category (Admin Auth)
export async function PUT(req, { params }) {
  try {
    const admin = await verifyAdminRequest(req);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
    }

    const { id } = await params;
    const { name, sku_prefix, display_order } = await req.json();

    if (!name || !sku_prefix) {
      return NextResponse.json({ error: 'Name and SKU Prefix are required' }, { status: 400, headers: corsHeaders });
    }

    const prefix = sku_prefix.trim().toUpperCase();

    // Check unique prefix excluding current category
    const existing = await query('SELECT id FROM categories WHERE sku_prefix = ? AND id != ?', [prefix, id]);
    if (existing.length > 0) {
      return NextResponse.json({ error: 'SKU Prefix must be unique' }, { status: 400, headers: corsHeaders });
    }

    await query(
      'UPDATE categories SET name = ?, sku_prefix = ?, display_order = ? WHERE id = ?',
      [name.trim(), prefix, display_order || 0, id]
    );

    return NextResponse.json({ success: true }, { headers: corsHeaders });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
}

// Delete category (Admin Auth)
export async function DELETE(req, { params }) {
  try {
    const admin = await verifyAdminRequest(req);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
    }

    const { id } = await params;

    // Check if products exist in this category before deleting (or cascade)
    // The foreign key is configured ON DELETE CASCADE, but it is safer to warn/inform
    await query('DELETE FROM categories WHERE id = ?', [id]);

    return NextResponse.json({ success: true }, { headers: corsHeaders });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
}

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

// GET all blogs
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || 'Active'; // Active by default for storefront

    let sql = 'SELECT * FROM blogs WHERE 1=1';
    const params = [];

    if (status && status !== 'all') {
      sql += ' AND status = ?';
      params.push(status);
    }

    sql += ' ORDER BY created_at DESC';

    const blogs = await query(sql, params);

    // Map fields for frontend compatibility (e.g. image -> cover_image)
    const formattedBlogs = blogs.map(b => ({
      ...b,
      coverImage: b.cover_image,
      image: b.cover_image // support both naming conventions
    }));

    return NextResponse.json(formattedBlogs, { headers: corsHeaders });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
}

// POST blog post (Admin Auth)
export async function POST(req) {
  try {
    const admin = await verifyAdminRequest(req);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
    }

    const { title, slug, content, excerpt, cover_image, status } = await req.json();

    if (!title || !content || !cover_image) {
      return NextResponse.json({ error: 'Title, Content, and Cover Image are required' }, { status: 400, headers: corsHeaders });
    }

    const cleanSlug = (slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')) + '-' + Date.now().toString(36).substr(-4);

    // Check unique slug
    const existing = await query('SELECT id FROM blogs WHERE slug = ?', [cleanSlug]);
    if (existing.length > 0) {
      return NextResponse.json({ error: 'Slug must be unique' }, { status: 400, headers: corsHeaders });
    }

    const result = await query(
      'INSERT INTO blogs (title, slug, content, excerpt, cover_image, status) VALUES (?, ?, ?, ?, ?, ?)',
      [title.trim(), cleanSlug, content, excerpt || '', cover_image.trim(), status || 'Draft']
    );

    return NextResponse.json({
      success: true,
      blog: {
        id: result.insertId,
        title,
        slug: cleanSlug,
        status: status || 'Draft'
      }
    }, { headers: corsHeaders });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
}

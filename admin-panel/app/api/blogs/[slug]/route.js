import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyAdminRequest } from '@/lib/auth';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

// GET single blog post by slug
export async function GET(req, { params }) {
  try {
    const { slug } = await params;

    const blogs = await query('SELECT * FROM blogs WHERE slug = ? OR id = ?', [slug, isNaN(slug) ? -1 : parseInt(slug, 10)]);

    if (blogs.length === 0) {
      return NextResponse.json({ error: 'Blog post not found' }, { status: 404, headers: corsHeaders });
    }

    const b = blogs[0];
    const formattedBlog = {
      ...b,
      coverImage: b.cover_image,
      image: b.cover_image
    };

    return NextResponse.json(formattedBlog, { headers: corsHeaders });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
}

// PUT (update) blog post (Admin Auth)
export async function PUT(req, { params }) {
  try {
    const admin = await verifyAdminRequest(req);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
    }

    const { slug: urlSlug } = await params;
    const { title, content, excerpt, cover_image, status } = await req.json();

    if (!title || !content || !cover_image) {
      return NextResponse.json({ error: 'Title, Content, and Cover Image are required' }, { status: 400, headers: corsHeaders });
    }

    const result = await query(
      'UPDATE blogs SET title = ?, content = ?, excerpt = ?, cover_image = ?, status = ? WHERE slug = ? OR id = ?',
      [title.trim(), content, excerpt || '', cover_image.trim(), status || 'Draft', urlSlug, isNaN(urlSlug) ? -1 : parseInt(urlSlug, 10)]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: 'Blog post not found' }, { status: 404, headers: corsHeaders });
    }

    return NextResponse.json({ success: true }, { headers: corsHeaders });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
}

// DELETE blog post (Admin Auth)
export async function DELETE(req, { params }) {
  try {
    const admin = await verifyAdminRequest(req);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
    }

    const { slug } = await params;

    const result = await query('DELETE FROM blogs WHERE slug = ? OR id = ?', [slug, isNaN(slug) ? -1 : parseInt(slug, 10)]);

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: 'Blog post not found' }, { status: 404, headers: corsHeaders });
    }

    return NextResponse.json({ success: true }, { headers: corsHeaders });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
}

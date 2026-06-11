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

// GET all blogs
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || 'Active';

    const filter = {};
    if (status && status !== 'all') filter.status = status;

    const db = await getDb();
    const blogs = await db.collection('blogs')
      .find(filter, { projection: { _id: 0 } })
      .sort({ created_at: -1 })
      .toArray();

    const formattedBlogs = blogs.map((b) => ({
      ...b,
      coverImage: b.cover_image,
      image: b.cover_image,
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

    const db = await getDb();
    const existing = await db.collection('blogs').findOne({ slug: cleanSlug });
    if (existing) {
      return NextResponse.json({ error: 'Slug must be unique' }, { status: 400, headers: corsHeaders });
    }

    const id = await getNextId('blogs');
    const now = new Date().toISOString();
    await db.collection('blogs').insertOne({
      id,
      title: title.trim(),
      slug: cleanSlug,
      content,
      excerpt: excerpt || '',
      cover_image: cover_image.trim(),
      status: status || 'Draft',
      created_at: now,
      updated_at: now,
    });

    return NextResponse.json({
      success: true,
      blog: { id, title, slug: cleanSlug, status: status || 'Draft' }
    }, { headers: corsHeaders });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
}

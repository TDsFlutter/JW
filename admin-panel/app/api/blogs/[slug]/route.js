import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { verifyAdminRequest } from '@/lib/auth';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

function lookupBy(slug) {
  const or = [{ slug }];
  if (!isNaN(slug)) or.push({ id: parseInt(slug, 10) });
  return { $or: or };
}

// GET single blog post by slug / id
export async function GET(req, { params }) {
  try {
    const { slug } = await params;
    const db = await getDb();
    const b = await db.collection('blogs').findOne(lookupBy(slug), { projection: { _id: 0 } });

    if (!b) {
      return NextResponse.json({ error: 'Blog post not found' }, { status: 404, headers: corsHeaders });
    }

    return NextResponse.json({ ...b, coverImage: b.cover_image, image: b.cover_image }, { headers: corsHeaders });

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

    const db = await getDb();
    const result = await db.collection('blogs').updateOne(
      lookupBy(urlSlug),
      { $set: { title: title.trim(), content, excerpt: excerpt || '', cover_image: cover_image.trim(), status: status || 'Draft', updated_at: new Date().toISOString() } }
    );

    if (result.matchedCount === 0) {
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
    const db = await getDb();
    const result = await db.collection('blogs').deleteOne(lookupBy(slug));

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Blog post not found' }, { status: 404, headers: corsHeaders });
    }

    return NextResponse.json({ success: true }, { headers: corsHeaders });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
}

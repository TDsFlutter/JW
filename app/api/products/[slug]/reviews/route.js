/**
 * /api/products/[slug]/reviews
 *
 *   GET  — public, paginated list of APPROVED reviews + rating summary.
 *   POST — authenticated; submit a review (saved as `pending` for moderation).
 *
 * Note: this is product-scoped and is unrelated to /api/reviews, which serves
 * Google Places reviews.
 */

import { NextResponse } from 'next/server';
import { verifyUser } from '@/lib/auth';
import {
  ensureIndexes,
  findProduct,
  getApprovedReviews,
  getReviewSummary,
  createReview,
  isVerifiedPurchase,
} from '@/lib/productReviews';

export const dynamic = 'force-dynamic';

// Publish customer reviews immediately by default (no admin moderation needed),
// so they show on the storefront without any env-var setup. Override with
// REVIEW_AUTO_APPROVE=verified (only verified purchasers auto-publish) or
// REVIEW_AUTO_APPROVE=off (queue everything for approval).
const AUTO_APPROVE = process.env.REVIEW_AUTO_APPROVE || 'all';

const TITLE_MIN = 3;
const TITLE_MAX = 100;
const BODY_MIN = 10;
const BODY_MAX = 2000;

function hashIp(ip) {
  // Lightweight, non-reversible-ish fingerprint for spam signals (not security).
  let h = 0;
  for (let i = 0; i < ip.length; i++) h = (h * 31 + ip.charCodeAt(i)) | 0;
  return String(h);
}

export async function GET(req, { params }) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(req.url);

    const page = Math.max(parseInt(searchParams.get('page') || '1', 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '10', 10) || 10, 1), 50);
    const sort = searchParams.get('sort') || 'recent';
    const ratingParam = parseInt(searchParams.get('rating') || '', 10);
    const rating = ratingParam >= 1 && ratingParam <= 5 ? ratingParam : null;

    await ensureIndexes();

    const product = await findProduct(slug);
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const [summary, { reviews, total }] = await Promise.all([
      getReviewSummary(product.id),
      getApprovedReviews(product.id, { page, limit, sort, rating }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / limit));
    return NextResponse.json({
      summary,
      reviews,
      page,
      totalPages,
      total,
      hasMore: page < totalPages,
    });
  } catch (error) {
    console.error('[GET /api/products/[slug]/reviews] Error:', error);
    return NextResponse.json(
      { error: 'Failed to load reviews.', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req, { params }) {
  try {
    const { slug } = await params;

    const user = await verifyUser(req);
    if (!user) {
      return NextResponse.json({ error: 'You must be signed in to leave a review.' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const rating = parseInt(body.rating, 10);
    const title = (body.title || '').trim();
    const text = (body.body ?? body.text ?? '').trim();

    // Validation
    const errors = [];
    if (!(rating >= 1 && rating <= 5)) errors.push('Rating must be between 1 and 5.');
    if (title.length < TITLE_MIN || title.length > TITLE_MAX)
      errors.push(`Title must be ${TITLE_MIN}–${TITLE_MAX} characters.`);
    if (text.length < BODY_MIN || text.length > BODY_MAX)
      errors.push(`Review must be ${BODY_MIN}–${BODY_MAX} characters.`);
    if (errors.length) {
      return NextResponse.json({ error: errors.join(' '), details: errors }, { status: 400 });
    }

    await ensureIndexes();

    const product = await findProduct(slug);
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }
    if (product.status && product.status !== 'Active') {
      return NextResponse.json({ error: 'Reviews are closed for this product.' }, { status: 403 });
    }

    const verified = await isVerifiedPurchase(user.uid, product);
    const status =
      AUTO_APPROVE === 'all' ? 'approved'
      : AUTO_APPROVE === 'off' ? 'pending'
      : verified ? 'approved'
      : 'pending';

    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get('x-real-ip') ||
      '';

    try {
      await createReview({
        product_id: product.id,
        product_slug: product.slug,
        product_name: product.name,
        user_id: user.uid,
        author_name: (body.author_name || user.name || user.email?.split('@')[0] || 'Customer').trim().slice(0, 60),
        author_email: user.email,
        rating,
        title,
        body: text,
        status,
        verified_purchase: verified,
        ipHash: ip ? hashIp(ip) : null,
        userAgent: (req.headers.get('user-agent') || '').slice(0, 200),
      });
    } catch (e) {
      if (e?.code === 11000) {
        return NextResponse.json({ error: 'You have already reviewed this product.' }, { status: 409 });
      }
      throw e;
    }

    return NextResponse.json({
      success: true,
      status,
      message:
        status === 'approved'
          ? 'Thanks! Your review is now live.'
          : 'Thanks! Your review will appear once it has been approved.',
    });
  } catch (error) {
    console.error('[POST /api/products/[slug]/reviews] Error:', error);
    return NextResponse.json(
      { error: 'Failed to submit review.', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/products/[slug]/reviews/mine
 *
 * Returns the signed-in customer's OWN review for this product (any status, so
 * they can see/edit a pending or rejected one), or { review: null } if they
 * aren't signed in or haven't reviewed it.
 */

import { NextResponse } from 'next/server';
import { verifyUser } from '@/lib/auth';
import { findProduct, getMyReview } from '@/lib/productReviews';

export const dynamic = 'force-dynamic';

export async function GET(req, { params }) {
  try {
    const { slug } = await params;
    const user = await verifyUser(req);
    if (!user) return NextResponse.json({ review: null });

    const product = await findProduct(slug);
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const review = await getMyReview(product.id, user.uid);
    return NextResponse.json({ review: review || null });
  } catch (error) {
    console.error('[GET /api/products/[slug]/reviews/mine] Error:', error);
    return NextResponse.json({ review: null });
  }
}

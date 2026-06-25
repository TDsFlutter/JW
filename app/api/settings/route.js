/**
 * GET /api/settings
 *
 * Public, read-only storefront feature flags (which review systems are enabled).
 * On any error, returns everything enabled so features never break.
 */

import { NextResponse } from 'next/server';
import { getSettings, DEFAULT_DISCOUNT_TIERS } from '@/lib/settings';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const settings = await getSettings();
    return NextResponse.json(settings);
  } catch (error) {
    console.error('[GET /api/settings] Error:', error);
    return NextResponse.json({
      googleReviewsEnabled: true,
      productReviewsEnabled: true,
      discountTiers: DEFAULT_DISCOUNT_TIERS,
    });
  }
}

/**
 * /api/settings  (admin)
 *
 *   GET   — read site feature flags (review systems on/off).
 *   PATCH — update flags. Admin only.
 */

import { NextResponse } from 'next/server';
import { verifyAdminRequest } from '@/lib/auth';
import { getSettings, updateSettings } from '@/lib/settings';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, PATCH, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET(req) {
  try {
    const admin = await verifyAdminRequest(req);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
    const settings = await getSettings();
    return NextResponse.json(settings, { headers: corsHeaders });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
}

export async function PATCH(req) {
  try {
    const admin = await verifyAdminRequest(req);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
    const body = await req.json().catch(() => ({}));
    const settings = await updateSettings(body);
    return NextResponse.json({ success: true, settings }, { headers: corsHeaders });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
}

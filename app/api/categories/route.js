import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';

// Public, read-only categories list (used by the shop filters).
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const db = await getDb();
    const categories = await db.collection('categories')
      .find({}, { projection: { _id: 0 } })
      .sort({ display_order: 1 })
      .toArray();
    return NextResponse.json(categories);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

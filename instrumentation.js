// Runs once when the server boots. We open the MongoDB connection eagerly so
// the first real request doesn't pay the cold-connection cost (~1-2s on Atlas).
export async function register() {
  // Only the Node.js server runtime can talk to MongoDB (not the Edge runtime).
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;
  try {
    const { getClient } = await import('@/lib/mongodb');
    await getClient();
    console.log('[instrumentation] MongoDB connection warmed up.');
  } catch (err) {
    // Don't crash startup if the DB is unreachable — requests will retry.
    console.warn('[instrumentation] DB warm-up skipped:', err?.message || err);
  }
}

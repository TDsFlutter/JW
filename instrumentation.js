// Runs once when the server boots. We open the MongoDB connection eagerly so
// the first real request doesn't pay the cold-connection cost (~1-2s on Atlas).
//
// IMPORTANT: this is fire-and-forget. Next.js awaits register() before it starts
// serving requests, so we must NOT await the DB connection here — a slow or
// unreachable Atlas (TLS handshake can hang ~30s+ per attempt) would otherwise
// block EVERY request, including DB-less pages like /login, until it times out.
// The warm-up runs in the background; requests that need the DB await it lazily.
export function register() {
  // Only the Node.js server runtime can talk to MongoDB (not the Edge runtime).
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;

  import('@/lib/mongodb')
    .then(({ getClient }) => getClient())
    .then(() => console.log('[instrumentation] MongoDB connection warmed up.'))
    .catch((err) => {
      // Don't crash startup if the DB is unreachable — requests will retry.
      console.warn('[instrumentation] DB warm-up skipped:', err?.message || err);
    });
}

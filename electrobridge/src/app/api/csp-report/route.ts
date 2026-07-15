import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const report = await request.json();
    if (process.env.NODE_ENV === 'development') {
      console.warn('[CSP Violation]', JSON.stringify(report, null, 2));
    }
  } catch {
  }
  return new Response(null, { status: 204 });
}

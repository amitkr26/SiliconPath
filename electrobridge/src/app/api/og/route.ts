import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const title = searchParams.get("title") || "SiliconPath";
  const description = searchParams.get("description") || "VLSI/Embedded Career Platform";
  const image = searchParams.get("image") || "https://siliconpath.vercel.app/og-default.png";

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta property="og:title" content="${title}" />
      <meta property="og:description" content="${description}" />
      <meta property="og:image" content="${image}" />
      <meta property="og:type" content="website" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="${title}" />
      <meta name="twitter:description" content="${description}" />
      <meta name="twitter:image" content="${image}" />
      <style>
        body { margin: 0; display: flex; justify-content: center; align-items: center; height: 100vh; background: #0f172a; font-family: system-ui; color: #fff; }
        .card { background: #1e293b; padding: 48px; border-radius: 16px; max-width: 600px; text-align: center; border: 1px solid #334155; }
        h1 { font-size: 48px; margin-bottom: 16px; background: linear-gradient(135deg, #22d3ee, #a855f7); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        p { font-size: 20px; color: #94a3b8; }
      </style>
    </head>
    <body>
      <div class="card">
        <h1>SiliconPath</h1>
        <p>${description}</p>
      </div>
    </body>
    </html>
  `;

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html", "Cache-Control": "public, max-age=86400" },
  });
}
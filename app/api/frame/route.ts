import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

const CONTRACT_ADDRESS = "0xc475851f9101A2AC48a84EcF869766A94D301FaA";

export async function POST(req: NextRequest) {
  try {
    const host = req.headers.get('host') || '';
    const protocol = req.headers.get('x-forwarded-proto') || 'https';
    const baseUrl = `${protocol}://${host}`;

    // Append a timestamp to bust the Farcaster image cache
    const ts = Date.now();
    const imageUrl = `${baseUrl}/api/og?ts=${ts}`;
    const postUrl = `${baseUrl}/api/frame`;
    const tradeUrl = `https://aerodrome.finance/swap?from=eth&to=${CONTRACT_ADDRESS}`;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta property="fc:frame" content="vNext" />
          <meta property="fc:frame:image" content="${imageUrl}" />
          <meta property="fc:frame:post_url" content="${postUrl}" />
          <meta property="fc:frame:button:1" content="🔄 Refresh Price" />
          <meta property="fc:frame:button:1:action" content="post" />
          <meta property="fc:frame:button:2" content="Trade on Aerodrome" />
          <meta property="fc:frame:button:2:action" content="link" />
          <meta property="fc:frame:button:2:target" content="${tradeUrl}" />
        </head>
        <body>
          <h1>GBLIN Frame Updated</h1>
        </body>
      </html>
    `;

    return new NextResponse(html, {
      headers: { 'Content-Type': 'text/html' },
    });
  } catch (error) {
    console.error('Frame POST error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

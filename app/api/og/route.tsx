import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const ts = searchParams.get('ts') || Date.now();

    // Fetch price from GeckoTerminal
    let price = "0.0000";
    try {
      const res = await fetch(`https://api.geckoterminal.com/api/v2/networks/base/tokens/0xc475851f9101A2AC48a84EcF869766A94D301FaA/pools`, { next: { revalidate: 10 } });
      const data = await res.json();
      if (data?.data?.[0]?.attributes?.base_token_price_usd) {
        price = parseFloat(data.data[0].attributes.base_token_price_usd).toFixed(4);
      }
    } catch (e) {
      console.error("Error fetching price for OG image:", e);
    }

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#09090b', // zinc-950
            fontFamily: 'sans-serif',
            color: 'white',
            border: '8px solid #18181b', // zinc-900
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '60px 80px',
              background: 'linear-gradient(to bottom right, #18181b, #09090b)',
              borderRadius: '32px',
              border: '2px solid #27272a',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            }}
          >
            <h1 style={{ fontSize: '72px', fontWeight: '900', margin: '0 0 10px 0', color: '#10b981', letterSpacing: '-0.05em' }}>
              GBLIN
            </h1>
            <div style={{ display: 'flex', fontSize: '32px', marginBottom: '40px', color: '#a1a1aa', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Global Inflation Index
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: '#000000', padding: '30px 60px', borderRadius: '24px', border: '1px solid #3f3f46' }}>
              <span style={{ fontSize: '24px', color: '#71717a', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Current Price</span>
              <div style={{ display: 'flex', fontSize: '96px', fontWeight: 'bold', margin: '0', color: '#ffffff', lineHeight: '1' }}>
                ${price}
              </div>
            </div>

            <div style={{ display: 'flex', fontSize: '24px', color: '#3b82f6', marginTop: '50px', fontWeight: '600', letterSpacing: '0.05em' }}>
              BASE MAINNET • AERODROME SLIPSTREAM
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (e: any) {
    console.error(e);
    return new Response(`Failed to generate image`, { status: 500 });
  }
}

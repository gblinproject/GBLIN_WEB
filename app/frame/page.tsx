import { Metadata, ResolvingMetadata } from 'next';
import { headers } from 'next/headers';
import FarcasterInit from './FarcasterInit';

const CONTRACT_ADDRESS = "0xc475851f9101A2AC48a84EcF869766A94D301FaA";

export async function generateMetadata(
  { params, searchParams }: any,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const headersList = headers();
  const host = headersList.get('host') || '';
  const protocol = headersList.get('x-forwarded-proto') || 'https';
  const baseUrl = `${protocol}://${host}`;

  const imageUrl = `${baseUrl}/api/og`;
  const postUrl = `${baseUrl}/api/frame`;
  const tradeUrl = `https://aerodrome.finance/swap?from=eth&to=${CONTRACT_ADDRESS}`;

  return {
    title: 'GBLIN Protocol Frame',
    description: 'Global Inflation Index on Base',
    openGraph: {
      title: 'GBLIN Protocol',
      images: [imageUrl],
    },
    other: {
      'fc:frame': 'vNext',
      'fc:frame:image': imageUrl,
      'fc:frame:post_url': postUrl,
      'fc:frame:button:1': '🔄 Refresh Price',
      'fc:frame:button:1:action': 'post',
      'fc:frame:button:2': 'Trade on Aerodrome',
      'fc:frame:button:2:action': 'link',
      'fc:frame:button:2:target': tradeUrl,
    },
  };
}

export default function FramePage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-4 font-mono">
      <FarcasterInit />
      <div className="max-w-xl w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center shadow-2xl">
        <h1 className="text-4xl font-bold text-emerald-500 mb-2 tracking-tighter">GBLIN FRAME</h1>
        <p className="text-zinc-400 mb-8 text-sm">Farcaster Integration Active</p>
        
        <div className="bg-black border border-zinc-800 rounded-xl p-6 mb-8">
          <p className="text-zinc-300 text-sm mb-4">
            This page contains the Open Graph meta tags required by Warpcast to render the GBLIN interactive Frame.
          </p>
          <p className="text-zinc-500 text-xs">
            To deploy the Frame, simply copy the URL of this page and paste it into a new cast on Warpcast.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <div className="text-xs text-zinc-600 uppercase tracking-widest mb-2">Frame Capabilities</div>
          <div className="flex items-center justify-between bg-zinc-800/50 px-4 py-3 rounded-lg text-sm">
            <span className="text-zinc-400">Real-time Price Fetch</span>
            <span className="text-emerald-400">Active</span>
          </div>
          <div className="flex items-center justify-between bg-zinc-800/50 px-4 py-3 rounded-lg text-sm">
            <span className="text-zinc-400">Aerodrome Routing</span>
            <span className="text-emerald-400">Active</span>
          </div>
          <div className="flex items-center justify-between bg-zinc-800/50 px-4 py-3 rounded-lg text-sm">
            <span className="text-zinc-400">Cache Busting</span>
            <span className="text-emerald-400">Active</span>
          </div>
        </div>
      </div>
    </div>
  );
}

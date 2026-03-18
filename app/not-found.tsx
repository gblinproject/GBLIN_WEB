import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-4 font-mono">
      <div className="max-w-xl w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center shadow-2xl">
        <h1 className="text-4xl font-bold text-emerald-500 mb-2 tracking-tighter">404</h1>
        <p className="text-zinc-400 mb-8 text-sm">Page Not Found</p>
        <Link href="/" className="text-emerald-400 hover:text-emerald-300 underline text-sm">Return to Protocol</Link>
      </div>
    </div>
  );
}

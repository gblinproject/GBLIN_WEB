import Image from 'next/image';

export default function BannerPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-black p-8">
      <div className="text-center space-y-4">
        <p className="text-zinc-500 font-mono text-sm uppercase tracking-widest mb-4">
          Cattura uno screenshot di questo riquadro (1500x500)
        </p>
        
        {/* Twitter Banner Container 1500x500 */}
        <div className="relative w-[1500px] h-[500px] bg-[#050505] overflow-hidden border border-white/10 shadow-2xl">
          {/* Background effects */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(245,158,11,0.15),transparent_70%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:40px_40px]" />

          {/* Content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
            <div className="relative w-40 h-40 mb-8">
              <Image
                src="https://raw.githubusercontent.com/gblinproject/GBLIN/main/LOGO_GBLIN.svg"
                alt="GBLIN Logo"
                fill
                unoptimized
                className="object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            <h1 className="font-serif text-7xl text-white tracking-tight mb-6">
              The Golden <span className="italic text-amber-500">Vault</span>
            </h1>
            <p className="text-amber-500/60 font-mono tracking-[0.4em] uppercase text-xl">
              Intrinsic Value • Institutional Backing
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

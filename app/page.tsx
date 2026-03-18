'use client'

import React from 'react'
import { motion } from 'motion/react'
import Image from 'next/image'
import { 
  ShieldCheck, 
  Zap, 
  Lock, 
  TrendingUp, 
  ExternalLink, 
  Copy, 
  Check,
  Database,
  ArrowRight,
  ChevronDown,
  Activity,
  Twitter,
  Mail
} from 'lucide-react'
import { Dashboard } from '@/components/Dashboard'

const CONTRACT_ADDRESS = "0xc475851f9101A2AC48a84EcF869766A94D301FaA"

export default function GBLINManifesto() {
  const [copied, setCopied] = React.useState(false)

  const copyToClipboard = () => {
    navigator.clipboard.writeText(CONTRACT_ADDRESS)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <main className="min-h-screen font-sans selection:bg-amber-500/30">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-black/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative w-14 h-14 aspect-square rounded-full overflow-hidden">
              <Image 
                src="https://raw.githubusercontent.com/rubbe89/gblin-assets/main/LOGO_GBLIN.png"
                alt="GBLIN Logo"
                fill
                unoptimized
                className="object-cover scale-[1.02]"
                priority
                referrerPolicy="no-referrer"
              />
            </div>
            <span className="font-serif text-3xl tracking-tighter font-bold bg-gradient-to-r from-amber-200 via-amber-500 to-amber-200 bg-clip-text text-transparent">GBLIN</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium tracking-widest uppercase opacity-60">
            <a href="#concept" className="hover:opacity-100 transition-opacity">Concept</a>
            <a href="#vault" className="hover:opacity-100 transition-opacity">The Vault</a>
            <a href="#dashboard" className="hover:opacity-100 transition-opacity">Telemetry</a>
            <a href="#security" className="hover:opacity-100 transition-opacity">Security</a>
          </div>
          <a 
            href={`https://basescan.org/token/${CONTRACT_ADDRESS}`}
            target="_blank"
            className="px-5 py-2 bg-white text-black text-xs font-bold uppercase tracking-widest rounded-full hover:bg-amber-400 transition-colors"
          >
            Basescan
          </a>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-20 px-6 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none">
          <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-amber-500/10 blur-[120px] rounded-full" />
        </div>

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <span className="inline-block py-1 px-3 border border-amber-500/30 rounded-full text-[10px] font-bold tracking-[0.2em] uppercase text-amber-500 mb-8">
              Base Mainnet Protocol
            </span>
            <h1 className="font-serif text-7xl md:text-9xl leading-[0.9] mb-8 tracking-tighter">
              The Autonomous <br />
              <span className="italic text-amber-500">Central Bank</span>
            </h1>
            <p className="max-w-2xl mx-auto text-lg md:text-xl text-white/60 font-light leading-relaxed mb-12">
              GBLIN is a self-governing liquidity index. No owners. No human intervention. 
              Just pure mathematical rebalancing across the strongest assets on Base.
            </p>

            <div className="flex flex-col md:flex-row items-center justify-center gap-6 mb-8">
              <a 
                href={`https://aerodrome.finance/swap?outputCurrency=${CONTRACT_ADDRESS}`}
                target="_blank"
                className="flex items-center justify-center gap-3 px-10 py-5 bg-amber-500 text-black text-xl font-bold rounded-2xl hover:bg-amber-400 hover:scale-105 transition-all shadow-[0_0_40px_rgba(245,158,11,0.4)]"
              >
                BUY GBLIN <ArrowRight size={24} />
              </a>
              <a 
                href="https://www.geckoterminal.com/base/pools/0xdaecc15bf028bc4d135260d044b87001dafb3c22"
                target="_blank"
                className="flex items-center justify-center gap-3 px-10 py-5 bg-white/10 border border-white/20 text-white text-xl font-bold rounded-2xl hover:bg-white/20 hover:scale-105 transition-all backdrop-blur-md"
              >
                LIVE CHART <Activity size={24} />
              </a>
            </div>
            
            <div className="flex justify-center">
              <button 
                onClick={copyToClipboard}
                className="group flex items-center gap-3 px-6 py-3 bg-white/5 border border-white/10 rounded-full hover:bg-white/10 transition-all"
              >
                <span className="hidden sm:inline text-xs uppercase tracking-widest opacity-50">Contract:</span>
                <code className="font-mono text-sm opacity-80">
                  {CONTRACT_ADDRESS}
                </code>
                {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} className="opacity-40 group-hover:opacity-100" />}
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Presentation Letter Section */}
      <section id="concept" className="py-32 px-6 bg-[#050505]">
        <div className="max-w-3xl mx-auto space-y-12">
          <div className="space-y-4">
            <span className="text-amber-500 text-xs font-mono uppercase tracking-[0.3em]">Institutional Vision</span>
            <h2 className="font-serif text-4xl md:text-5xl tracking-tight leading-tight">
              A Vision for <br />
              <span className="italic">Intrinsic Stability</span>
            </h2>
          </div>
          
          <div className="space-y-8 text-white/70 font-light leading-relaxed text-lg">
            <p>
              The GBLIN Project was born from a simple yet profound realization: when major assets like Bitcoin and Ethereum crash, the entire market bleeds. GBLIN is built to cushion that fall. It is not an inflation hedge; it is a shock absorber.
            </p>
            <p>
              By holding a diversified, balanced basket of WETH, cbBTC, and USDC, GBLIN acts as an autonomous central bank. When volatility strikes, the protocol&apos;s internal rebalancing mechanisms work to hold value constant, protecting the index from catastrophic drawdowns.
            </p>
            <p>
              Transparency is our cornerstone. We implement a lean <strong>0.1% protocol fee</strong> on transactions, designed for long-term sustainability. This fee is strategically reinvested to <strong>bolster the token&apos;s intrinsic value</strong>, ensuring the floor price of GBLIN is constantly supported by real assets.
            </p>
          </div>

          <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 text-amber-500" />
              </div>
              <div>
                <p className="text-sm font-bold uppercase tracking-widest">GBLIN Protocol</p>
                <p className="text-xs text-white/40 uppercase tracking-widest">The Autonomous Central Bank</p>
              </div>
            </div>
            <a 
              href="https://basescan.org/token/0xc475851f9101A2AC48a84EcF869766A94D301FaA"
              target="_blank"
              className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-amber-500 hover:text-amber-400 transition-colors"
            >
              Verify Contract <ExternalLink size={14} />
            </a>
          </div>
        </div>
      </section>

      {/* Benefits Highlight */}
      <section className="py-20 px-6 bg-white/[0.02] border-y border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              { 
                title: 'Shock Absorber', 
                desc: 'Designed to help hold value constant when BTC and ETH crash, utilizing a balanced basket of assets.',
                icon: ShieldCheck 
              },
              { 
                title: 'Autonomous Rebalancing', 
                desc: 'The protocol relies on external callers to recalibrate the asset basket, paying a bounty to the bots that execute it.',
                icon: Zap 
              },
              { 
                title: 'Intrinsic Growth', 
                desc: 'The 0.1% fee is hardcoded to feed the treasury, ensuring the floor price has a constant upward pressure.',
                icon: TrendingUp 
              }
            ].map((benefit, i) => (
              <div key={i} className="space-y-4 group">
                <div className="w-12 h-12 rounded-full bg-amber-500/5 flex items-center justify-center border border-amber-500/20 group-hover:border-amber-500/50 transition-colors">
                  <benefit.icon className="w-6 h-6 text-amber-500" />
                </div>
                <h4 className="text-xl font-serif italic">{benefit.title}</h4>
                <p className="text-sm text-white/50 leading-relaxed">{benefit.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* The Vault Section */}
      <section id="vault" className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row gap-20 items-center">
            <div className="flex-1 space-y-8">
              <h2 className="font-serif text-5xl md:text-6xl tracking-tight">
                Inside the <br />
                <span className="italic text-amber-500">Golden Vault</span>
              </h2>
              <p className="text-white/60 leading-relaxed">
                Every GBLIN token is backed by a proportional share of the protocol&apos;s treasury. 
                The vault holds a diversified mix of Ethereum (WETH), Coinbase Bitcoin (cbBTC), and USD Coin (USDC).
                As these underlying assets grow or the protocol collects fees, the intrinsic value of GBLIN increases.
              </p>
              
              <div className="pt-4 border-t border-white/10">
                <div className="flex flex-wrap gap-4">
                  {['Ethereum (WETH)', 'Coinbase Bitcoin (cbBTC)', 'USD Coin (USDC)'].map((asset) => (
                    <span key={asset} className="px-4 py-2 bg-white/5 rounded-full text-[10px] font-mono uppercase tracking-widest opacity-60">
                      {asset}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="flex-1 flex justify-center items-center">
              <div className="relative w-full max-w-[420px] aspect-square group">
                {/* Core Logo as the Vault Centerpiece - Ultra Sharp Super-Sampling */}
                <div className="absolute inset-0 bg-amber-500/5 blur-[120px] rounded-full opacity-30 animate-pulse" />
                <div className="relative w-full h-full rounded-full overflow-hidden">
                  <Image 
                    src="https://raw.githubusercontent.com/rubbe89/gblin-assets/main/LOGO_GBLIN.png"
                    alt="GBLIN Core"
                    fill
                    unoptimized
                    className="object-cover scale-[1.02] hover:scale-[1.05] transition-transform duration-700"
                    style={{ imageRendering: 'auto' }}
                    priority
                    referrerPolicy="no-referrer"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Rebalancing Section */}
      <section className="py-20 px-6 bg-amber-500/5 border-t border-amber-500/10">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row gap-12 items-center">
            <div className="flex-1 space-y-6">
              <span className="text-amber-500 text-xs font-mono uppercase tracking-[0.3em]">MEV & Arbitrage</span>
              <h2 className="font-serif text-4xl md:text-5xl tracking-tight">
                Call the Function. <br />
                <span className="italic text-amber-500">Get Paid.</span>
              </h2>
              <p className="text-white/60 leading-relaxed">
                GBLIN relies on decentralized actors to maintain its peg and balance its treasury. The protocol features a public recalibration function that anyone can call. When the basket deviates from its target weights, bots and arbitrageurs are financially incentivized to trigger the rebalance, earning a direct payout for their service to the network.
              </p>
              <div className="flex items-center gap-4 pt-4">
                <a 
                  href={`https://basescan.org/address/${CONTRACT_ADDRESS}#writeContract`}
                  target="_blank"
                  className="px-6 py-3 bg-amber-500 text-black font-bold rounded-xl hover:bg-amber-400 transition-colors flex items-center gap-2"
                >
                  Interact on Basescan <ExternalLink size={16} />
                </a>
              </div>
            </div>
            <div className="flex-1 w-full">
              <div className="bg-[#0a0a0a] border border-[#333] p-8 rounded-2xl relative overflow-hidden font-mono text-sm text-zinc-400">
                <div className="text-emerald-500 mb-4">{`// The Autonomous Central Bank`}</div>
                <div className="space-y-2">
                  <p><span className="text-blue-400">function</span> <span className="text-yellow-200">recalibrate</span>() <span className="text-blue-400">external</span> {'{'}</p>
                  <p className="pl-4">require(needsRebalance(), <span className="text-green-400">&quot;Balanced&quot;</span>);</p>
                  <p className="pl-4 text-zinc-500">{`// Rebalance WETH, cbBTC, USDC`}</p>
                  <p className="pl-4">_executeSwaps();</p>
                  <p className="pl-4 text-zinc-500">{`// Pay the caller for their service`}</p>
                  <p>_rewardCaller(msg.sender);</p>
                  <p>{'}'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Liquidity Section */}
      <section className="py-20 px-6 bg-[#0a0a0a] border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row gap-12 items-center">
            <div className="flex-1 space-y-6">
              <span className="text-amber-500 text-xs font-mono uppercase tracking-[0.3em]">Market Infrastructure</span>
              <h2 className="font-serif text-4xl md:text-5xl tracking-tight">
                Concentrated <br />
                <span className="italic text-amber-500">Slipstream Liquidity</span>
              </h2>
              <p className="text-white/60 leading-relaxed">
                GBLIN utilizes Aerodrome&apos;s advanced Slipstream technology. By concentrating liquidity in a specific mathematical range (0.85 - 1.15 WETH), we ensure zero slippage and maximum capital efficiency. The 1% fee tier protects the protocol from predatory arbitrage while rewarding long-term liquidity providers.
              </p>
              <div className="flex items-center gap-4 pt-4">
                <a 
                  href={`https://aerodrome.finance/swap?from=eth&to=${CONTRACT_ADDRESS}`}
                  target="_blank"
                  className="px-6 py-3 bg-white/5 border border-white/10 text-white font-bold rounded-xl hover:bg-white/10 transition-colors flex items-center gap-2"
                >
                  Trade on Aerodrome <ExternalLink size={16} />
                </a>
              </div>
            </div>
            <div className="flex-1 w-full">
              <div className="bg-[#1A1A1A] border border-[#333] p-8 rounded-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-bl-full -z-0"></div>
                <div className="relative z-10 space-y-6">
                  <div className="flex justify-between items-center border-b border-[#333] pb-4">
                    <span className="text-sm font-mono text-zinc-400">POOL TYPE</span>
                    <span className="text-sm font-bold text-amber-500">SLIPSTREAM (CONCENTRATED)</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-[#333] pb-4">
                    <span className="text-sm font-mono text-zinc-400">FEE TIER</span>
                    <span className="text-sm font-bold text-white">1.0%</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-[#333] pb-4">
                    <span className="text-sm font-mono text-zinc-400">PRICE RANGE</span>
                    <span className="text-sm font-bold text-white">0.80 - 1.15 WETH</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-mono text-zinc-400">DEX</span>
                    <span className="text-sm font-bold text-blue-400">AERODROME FINANCE</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Dashboard Section */}
      <section id="dashboard" className="py-32 px-6 border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12">
            <h2 className="font-serif text-5xl md:text-6xl tracking-tight mb-4">
              Protocol <span className="italic text-amber-500">Telemetry</span>
            </h2>
            <p className="text-white/60 max-w-2xl">
              Real-time monitoring of the GBLIN autonomous engine. Transparency is the foundation of trust in the decentralized era.
            </p>
          </div>
          <Dashboard />
        </div>
      </section>

      {/* Security Badges */}
      <section id="security" className="py-20 px-6 bg-white/[0.01] border-t border-white/5">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-center gap-8 md:gap-20 opacity-40 grayscale hover:grayscale-0 transition-all">
          <div className="flex items-center gap-3">
            <ShieldCheck size={32} />
            <span className="font-mono text-xs uppercase tracking-widest">Verified Source</span>
          </div>
          <div className="flex items-center gap-3">
            <Lock size={32} />
            <span className="font-mono text-xs uppercase tracking-widest">Liquidity Burned</span>
          </div>
          <div className="flex items-center gap-3">
            <Zap size={32} />
            <span className="font-mono text-xs uppercase tracking-widest">No Owner</span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-24 px-6 border-t border-white/5 text-center bg-black">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="flex flex-col items-center gap-6">
            <div className="relative w-32 h-32 aspect-square rounded-full overflow-hidden">
              <Image 
                src="https://raw.githubusercontent.com/rubbe89/gblin-assets/main/LOGO_GBLIN.png"
                alt="GBLIN Logo"
                fill
                unoptimized
                className="object-cover scale-[1.02]"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="font-serif text-4xl tracking-tighter font-bold bg-gradient-to-b from-amber-200 to-amber-600 bg-clip-text text-transparent">GBLIN</div>
          </div>
          
          <div className="flex justify-center gap-8">
            <a 
              href="https://x.com/GBLIN_Protocol" 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-amber-500/20 hover:text-amber-500 transition-all"
            >
              <Twitter size={18} />
            </a>
            <a 
              href="mailto:gblin.protocol@proton.me" 
              className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-amber-500/20 hover:text-amber-500 transition-all"
            >
              <Mail size={18} />
            </a>
          </div>

          <div className="flex justify-center gap-6 text-sm opacity-50">
            <a href={`https://basescan.org/token/${CONTRACT_ADDRESS}`} className="hover:text-amber-500 transition-colors">Basescan</a>
            <a href="https://dexscreener.com" className="hover:text-amber-500 transition-colors">DexScreener</a>
            <a href="https://aerodrome.finance" className="hover:text-amber-500 transition-colors">Aerodrome</a>
          </div>
          <p className="text-[10px] font-mono uppercase tracking-[0.2em] opacity-30">
            © 2026 GBLIN Protocol. Built for the Base Ecosystem.
          </p>
        </div>
      </footer>
    </main>
  )
}

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
  Mail,
  Globe
} from 'lucide-react'
import { Dashboard } from '@/components/Dashboard'
import { RebalanceAction } from '@/components/RebalanceAction'
import { TradeInterface } from '@/components/TradeInterface'
import { useLanguage } from '@/context/LanguageContext'
import { Language } from '@/translations'

const CONTRACT_ADDRESS = "0xc475851f9101A2AC48a84EcF869766A94D301FaA"

export default function GBLINManifesto() {
  const [copied, setCopied] = React.useState(false)
  const { t, language, setLanguage, isMounted } = useLanguage()
  const [showLangSelector, setShowLangSelector] = React.useState(false)

  const languages: { code: Language; name: string; flag: string }[] = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'it', name: 'Italiano', flag: '🇮🇹' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'zh', name: '中文', flag: '🇨🇳' },
    { code: 'ja', name: '日本語', flag: '🇯🇵' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  ]

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
            <a href="#concept" className="hover:opacity-100 transition-opacity">{t('nav.manifesto')}</a>
            <a href="#vault" className="hover:opacity-100 transition-opacity">{t('vault.title').split(' ').slice(-1)}</a>
            <a href="#dashboard" className="hover:opacity-100 transition-opacity">{t('nav.dashboard')}</a>
            <a href="#security" className="hover:opacity-100 transition-opacity">Security</a>
          </div>

          <div className="flex items-center gap-4">
            {/* Language Selector */}
            <div className="relative">
              <button 
                onClick={() => setShowLangSelector(!showLangSelector)}
                className="flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 rounded-full hover:bg-white/10 transition-all text-[10px] font-bold uppercase tracking-widest"
              >
                <Globe size={14} className="text-amber-500" />
                {isMounted ? language : 'en'}
              </button>
              
              {showLangSelector && (
                <div className="absolute top-full right-0 mt-2 w-40 bg-[#111] border border-white/10 rounded-xl overflow-hidden shadow-2xl z-50">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        setLanguage(lang.code)
                        setShowLangSelector(false)
                      }}
                      className={`w-full px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest hover:bg-white/5 flex items-center justify-between transition-colors ${language === lang.code ? 'text-amber-500 bg-amber-500/5' : 'text-zinc-400'}`}
                    >
                      <span>{lang.flag} {lang.name}</span>
                      {language === lang.code && <Check size={12} />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <a 
              href={`https://basescan.org/token/${CONTRACT_ADDRESS}`}
              target="_blank"
              className="px-5 py-2 bg-white text-black text-xs font-bold uppercase tracking-widest rounded-full hover:bg-amber-400 transition-colors"
            >
              Basescan
            </a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-24 pb-20 px-6 overflow-hidden">
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
            <h1 className="font-serif text-5xl md:text-9xl leading-[0.9] mb-8 tracking-tighter">
              {t('hero.title').split(' ').slice(0, -1).join(' ')} <br />
              <span className="italic text-amber-500">{t('hero.title').split(' ').slice(-1)}</span>
            </h1>
            <p className="max-w-2xl mx-auto text-lg md:text-xl text-white/60 font-light leading-relaxed mb-12">
              {t('hero.subtitle')}
            </p>

            <div className="flex flex-col md:flex-row items-center justify-center gap-6 mb-8">
              <a 
                href="#trade"
                className="flex items-center justify-center gap-3 px-10 py-5 bg-amber-500 text-black text-xl font-bold rounded-2xl hover:bg-amber-400 hover:scale-105 transition-all shadow-[0_0_40px_rgba(245,158,11,0.4)]"
              >
                {t('hero.cta').toUpperCase()} <ArrowRight size={24} />
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

      {/* Trade Section */}
      <section id="trade" className="py-20 px-6 bg-[#050505] border-t border-white/5 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-amber-500/5 blur-[100px] rounded-full pointer-events-none" />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col lg:flex-row gap-16 items-center">
            <div className="flex-1 space-y-8 text-center lg:text-left">
              <span className="text-amber-500 text-xs font-mono uppercase tracking-[0.3em]">{t('trade.title')}</span>
              <h2 className="font-serif text-5xl md:text-6xl tracking-tight leading-tight">
                {t('trade.heading')} <br />
                <span className="italic text-amber-500">{t('trade.subheading')}</span>
              </h2>
              <p className="text-white/60 leading-relaxed text-lg max-w-xl mx-auto lg:mx-0">
                {t('trade.desc')}
              </p>
              
              <div className="flex flex-col gap-4 pt-4 max-w-md mx-auto lg:mx-0">
                <div className="flex items-start gap-4 p-4 bg-white/5 rounded-2xl border border-white/10">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                    <Check className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white mb-1">{t('trade.feature1Title')}</h4>
                    <p className="text-sm text-zinc-400">{t('trade.feature1Desc')}</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-4 bg-white/5 rounded-2xl border border-white/10">
                  <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0">
                    <Database className="w-5 h-5 text-amber-500" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white mb-1">{t('trade.feature2Title')}</h4>
                    <p className="text-sm text-zinc-400">{t('trade.feature2Desc')}</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex-1 w-full max-w-md lg:max-w-none flex justify-center">
              <TradeInterface />
            </div>
          </div>
        </div>
      </section>

      {/* Presentation Letter Section */}
      <section id="concept" className="py-32 px-6 bg-[#050505]">
        <div className="max-w-3xl mx-auto space-y-12">
          <div className="space-y-4">
              <h2 className="font-serif text-4xl md:text-5xl tracking-tight leading-tight">
                {t('manifesto.title')}
              </h2>
            </div>
          
          <div className="space-y-8 text-white/70 font-light leading-relaxed text-lg">
            <p>
              {t('manifesto.text')}
            </p>
          </div>

          <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 text-amber-500" />
              </div>
              <div>
                <p className="text-sm font-bold uppercase tracking-widest">{t('common.protocol')}</p>
                <p className="text-xs text-white/40 uppercase tracking-widest">{t('common.centralBank')}</p>
              </div>
            </div>
            <a 
              href="https://basescan.org/token/0xc475851f9101A2AC48a84EcF869766A94D301FaA"
              target="_blank"
              className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-amber-500 hover:text-amber-400 transition-colors"
            >
              {t('common.verifyContract')} <ExternalLink size={14} />
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
                title: t('features.crashShield.title'), 
                desc: t('features.crashShield.desc'),
                icon: ShieldCheck 
              },
              { 
                title: t('features.centralBank.title'), 
                desc: t('features.centralBank.desc'),
                icon: Zap 
              },
              { 
                title: t('features.appreciation.title'), 
                desc: t('features.appreciation.desc'),
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
                {t('vault.title').split(' ').slice(0, -2).join(' ')} <br />
                <span className="italic text-amber-500">{t('vault.title').split(' ').slice(-2).join(' ')}</span>
              </h2>
              <p className="text-white/60 leading-relaxed">
                {t('vault.desc')}
              </p>
              
              <div className="pt-4 border-t border-white/10">
                <div className="flex flex-wrap gap-4">
                  {[t('vault.assets.weth'), t('vault.assets.cbbtc'), t('vault.assets.usdc')].map((asset) => (
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
                    alt={t('vault.core')}
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
              <span className="text-amber-500 text-xs font-mono uppercase tracking-[0.3em]">{t('mev.title')}</span>
              <h2 className="font-serif text-4xl md:text-5xl tracking-tight">
                {t('mev.callTitle').split('.').slice(0, 1).join('.') + '.'} <br />
                <span className="italic text-amber-500">{t('mev.callTitle').split('.').slice(1).join('.')}</span>
              </h2>
              <p className="text-white/60 leading-relaxed">
                {t('mev.desc')}
              </p>
              <div className="flex items-center gap-4 pt-4">
                <a 
                  href={`https://basescan.org/address/${CONTRACT_ADDRESS}#writeContract`}
                  target="_blank"
                  className="px-6 py-3 bg-amber-500 text-black font-bold rounded-xl hover:bg-amber-400 transition-colors flex items-center gap-2"
                >
                  {t('mev.interact')} <ExternalLink size={16} />
                </a>
              </div>
            </div>
            <div className="flex-1 w-full">
              <div className="bg-[#0a0a0a] border border-[#333] p-8 rounded-2xl relative overflow-hidden font-mono text-sm text-zinc-400">
                <div className="text-emerald-500 mb-4">{t('mev.codeComment')}</div>
                <div className="space-y-2">
                  <p><span className="text-blue-400">function</span> <span className="text-yellow-200">incentivizedRebalance</span>() <span className="text-blue-400">external</span> {'{'}</p>
                  <p className="pl-4">require(needsRebalance(), <span className="text-green-400">&quot;{t('mev.codeBalanced')}&quot;</span>);</p>
                  <p className="pl-4 text-zinc-500">{t('mev.codeRebalance')}</p>
                  <p className="pl-4">_executeSwaps();</p>
                  <p className="pl-4 text-zinc-500">{t('mev.codePay')}</p>
                  <p className="pl-4">_rewardCaller(msg.sender);</p>
                </div>
                <p className="font-mono text-zinc-600 mt-4 text-[10px] uppercase tracking-widest">{t('mev.codeSurvival')}</p>
              </div>
            </div>
          </div>
          
          <RebalanceAction />
        </div>
      </section>

      {/* Liquidity Section */}
      <section className="py-20 px-6 bg-[#0a0a0a] border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row gap-12 items-center">
            <div className="flex-1 space-y-6">
              <span className="text-amber-500 text-xs font-mono uppercase tracking-[0.3em]">{t('market.title')}</span>
              <h2 className="font-serif text-4xl md:text-5xl tracking-tight">
                {t('market.subtitle').split(' ').slice(0, 1).join(' ')} <br />
                <span className="italic text-amber-500">{t('market.subtitle').split(' ').slice(1).join(' ')}</span>
              </h2>
              <p className="text-white/60 leading-relaxed">
                {t('market.desc')}
              </p>
              <div className="flex items-center gap-4 pt-4">
                <a 
                  href={`https://aerodrome.finance/swap?from=eth&to=${CONTRACT_ADDRESS}`}
                  target="_blank"
                  className="px-6 py-3 bg-white/5 border border-white/10 text-white font-bold rounded-xl hover:bg-white/10 transition-colors flex items-center gap-2"
                >
                  {t('market.trade')} <ExternalLink size={16} />
                </a>
              </div>
            </div>
            <div className="flex-1 w-full">
              <div className="bg-[#1A1A1A] border border-[#333] p-8 rounded-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-bl-full -z-0"></div>
                <div className="relative z-10 space-y-6">
                  <div className="flex justify-between items-center border-b border-[#333] pb-4">
                    <span className="text-sm font-mono text-zinc-400">{t('market.poolType')}</span>
                    <span className="text-sm font-bold text-amber-500">{t('market.slipstream')}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-[#333] pb-4">
                    <span className="text-sm font-mono text-zinc-400">{t('market.feeTier')}</span>
                    <span className="text-sm font-bold text-white">1.0%</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-[#333] pb-4">
                    <span className="text-sm font-mono text-zinc-400">{t('market.priceRange')}</span>
                    <span className="text-sm font-bold text-white">0.80 - 1.15 WETH</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-mono text-zinc-400">{t('market.dex')}</span>
                    <span className="text-sm font-bold text-blue-400">{t('market.aerodrome')}</span>
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
              Protocol <span className="italic text-amber-500">{t('nav.dashboard')}</span>
            </h2>
            <p className="text-white/60 max-w-2xl">
              {t('dashboard.arbitrageText')}
            </p>
          </div>
          <Dashboard />
        </div>
      </section>

      {/* Footer */}
      <footer className="py-24 px-6 border-t border-white/5 text-center bg-black">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="flex flex-col items-center gap-6">
            <div className="relative w-24 h-24 aspect-square rounded-full overflow-hidden">
              <Image 
                src="https://raw.githubusercontent.com/rubbe89/gblin-assets/main/LOGO_GBLIN.png"
                alt="GBLIN Logo"
                fill
                unoptimized
                className="object-cover scale-[1.02]"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="font-serif text-2xl tracking-tighter font-bold bg-gradient-to-b from-amber-200 to-amber-600 bg-clip-text text-transparent">GBLIN</div>
          </div>
          
          <div className="flex justify-center gap-6 text-sm opacity-50">
            <a href={`https://basescan.org/token/${CONTRACT_ADDRESS}`} className="hover:text-amber-500 transition-colors">Basescan</a>
            <a href="https://dexscreener.com" className="hover:text-amber-500 transition-colors">DexScreener</a>
            <a href="https://aerodrome.finance" className="hover:text-amber-500 transition-colors">Aerodrome</a>
          </div>

          <p className="text-[10px] font-mono uppercase tracking-[0.2em] opacity-30">
            {t('footer.rights')}
          </p>
        </div>
      </footer>
    </main>
  )
}

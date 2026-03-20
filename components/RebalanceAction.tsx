import React, { useState, useEffect, useRef, useCallback } from 'react'
import { motion } from 'motion/react'
import { Wallet, AlertCircle, CheckCircle2, Zap, Coins, Database, TrendingUp, Clock, ArrowRightLeft, Percent } from 'lucide-react'
import { BrowserProvider, Contract, MaxUint256, JsonRpcProvider, formatEther, formatUnits } from 'ethers'
import { useLanguage } from '@/context/LanguageContext'

const CONTRACT_ADDRESS = "0xc475851f9101A2AC48a84EcF869766A94D301FaA"

const WETH = "0x4200000000000000000000000000000000000006"
const cbBTC = "0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf"
const USDC = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"
const WETH_ORACLE = "0x71041dddad3595F9CEd3DcCFBe3D1F4b0a16Bb70"

const ABI = [
  "function incentivizedRebalance(uint256 assetIndex, bool isWethToAsset, uint256 amountToSwap) external",
  "function stabilityFund() view returns (uint256)",
  "function basket(uint256) view returns (address token, address oracle, uint24 poolFee, bool isStable, uint256 baseWeight, uint256 dynamicWeight, uint256 peakPrice, uint256 lastPeakUpdate)",
  "event Rebalanced(address indexed executor, address tokenIn, address tokenOut, uint256 amountIn, uint256 amountOut)"
]

const ERC20_ABI = ["function balanceOf(address account) view returns (uint256)"]
const ORACLE_ABI = ["function latestRoundData() view returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound)"]

const getTokenSymbol = (address: string) => {
  if (address.toLowerCase() === WETH.toLowerCase()) return "WETH"
  if (address.toLowerCase() === cbBTC.toLowerCase()) return "cbBTC"
  if (address.toLowerCase() === USDC.toLowerCase()) return "USDC"
  return "Token"
}

export function RebalanceAction() {
  const { t } = useLanguage()
  const [account, setAccount] = useState<string | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [isArbitraging, setIsArbitraging] = useState(false)
  const [txHash, setTxHash] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [stats, setStats] = useState<{
    tvlUsd: number;
    fundEth: number;
    weights: { symbol: string; actual: number; dynamic: number; base: number }[];
    recentLogs: { txHash: string; executor: string; tokenIn: string; tokenOut: string }[];
  } | null>(null)
  const [isLoadingStats, setIsLoadingStats] = useState(true)

  const hasLoadedOnce = useRef(false)

  const fetchRecentRebalances = useCallback(async (mounted: boolean) => {
    try {
      const logRPCs = [
        "https://base-rpc.publicnode.com",
        "https://base.llamarpc.com",
        "https://mainnet.base.org"
      ]
      
      let allLogs: any[] = []
      for (const rpc of logRPCs) {
        try {
          const logProvider = new JsonRpcProvider(rpc)
          const logContract = new Contract(CONTRACT_ADDRESS, ABI, logProvider)
          const currentBlock = await logProvider.getBlockNumber()
          const filter = logContract.filters.Rebalanced()
          
          let toBlock = currentBlock
          const chunkSize = 200000 
          const maxIterations = 25 // Search back ~5M blocks (~115 days)
          
          for (let i = 0; i < maxIterations; i++) {
            const fromBlock = Math.max(0, toBlock - chunkSize)
            try {
              const logs = await logContract.queryFilter(filter, fromBlock, toBlock)
              if (logs.length > 0) {
                const reversedChunk = [...logs].reverse()
                const newLogs = reversedChunk.filter(nl => !allLogs.some(al => al.transactionHash === nl.transactionHash))
                allLogs = [...allLogs, ...newLogs]
              }
              if (allLogs.length >= 20) break
              toBlock = fromBlock - 1
              if (toBlock <= 0) break
            } catch (chunkError) {
              toBlock = toBlock - 20000 // Skip a bit if error
            }
          }
          if (allLogs.length > 0) break
        } catch (rpcError) { continue }
      }

      const iface = new Contract(CONTRACT_ADDRESS, ABI).interface
      const recentLogs = allLogs.slice(0, 10).map((log: any) => {
        try {
          const parsed = iface.parseLog({ topics: [...log.topics], data: log.data })
          const tIn = (parsed?.args[1] || parsed?.args?.tokenIn || "") as string
          const tOut = (parsed?.args[2] || parsed?.args?.tokenOut || "") as string
          const getSymbol = (addr: string) => {
            const sym = getTokenSymbol(addr)
            return (sym === "Token" && addr) ? addr.slice(0, 6) : sym
          }
          return {
            txHash: log.transactionHash as string,
            executor: (parsed?.args[0] || parsed?.args?.executor || "0x...") as string,
            tokenIn: getSymbol(tIn),
            tokenOut: getSymbol(tOut),
          }
        } catch (e) { return null }
      }).filter((item): item is { txHash: string; executor: string; tokenIn: string; tokenOut: string } => item !== null)

      if (mounted) {
        setStats(prev => prev ? { ...prev, recentLogs } : null)
      }
    } catch (logError) {
      console.warn("Could not fetch recent logs:", logError)
    }
  }, [])

  const fetchStats = useCallback(async (isMounted = true) => {
    try {
      if (isMounted && !hasLoadedOnce.current) setIsLoadingStats(true)
      const provider = new JsonRpcProvider("https://base-rpc.publicnode.com")
      const contract = new Contract(CONTRACT_ADDRESS, ABI, provider)

      // 1. Stability Fund
      const fund = await contract.stabilityFund()
      const fundEth = Number(formatEther(fund))

      // 2. Basket & TVL
      const b0 = await contract.basket(0) // cbBTC
      const b1 = await contract.basket(1) // WETH
      const b2 = await contract.basket(2) // USDC

      const wethContract = new Contract(WETH, ERC20_ABI, provider)
      const cbbtcContract = new Contract(cbBTC, ERC20_ABI, provider)
      const usdcContract = new Contract(USDC, ERC20_ABI, provider)

      const [wethBal, cbbtcBal, usdcBal] = await Promise.all([
        wethContract.balanceOf(CONTRACT_ADDRESS),
        cbbtcContract.balanceOf(CONTRACT_ADDRESS),
        usdcContract.balanceOf(CONTRACT_ADDRESS)
      ])

      const wethOracle = new Contract(WETH_ORACLE, ORACLE_ABI, provider)
      const cbbtcOracle = new Contract(b0[1], ORACLE_ABI, provider)
      const usdcOracle = new Contract(b2[1], ORACLE_ABI, provider)

      const [wethData, cbbtcData, usdcData] = await Promise.all([
        wethOracle.latestRoundData(),
        cbbtcOracle.latestRoundData(),
        usdcOracle.latestRoundData()
      ])

      const wethPrice = Number(formatUnits(wethData[1], 8))
      const cbbtcPrice = Number(formatUnits(cbbtcData[1], 8))
      const usdcPrice = Number(formatUnits(usdcData[1], 8))

      const wethValue = Number(formatUnits(wethBal, 18)) * wethPrice
      const cbbtcValue = Number(formatUnits(cbbtcBal, 8)) * cbbtcPrice
      const usdcValue = Number(formatUnits(usdcBal, 6)) * usdcPrice

      // TVL is the sum of all assets in the contract (WETH balance already includes the fund)
      const tvlUsd = wethValue + cbbtcValue + usdcValue
      
      // For weights, we use the value EXCLUDING the stability fund, matching the contract's _calculateTotalEthValue()
      const fundValue = fundEth * wethPrice
      const totalBasketValue = Math.max(0, wethValue - fundValue) + cbbtcValue + usdcValue

      // Weights: b[4] is baseWeight, b[5] is dynamicWeight (BPS)
      const cbbtcBase = Number(b0[4]) / 100
      const cbbtcDynamic = Number(b0[5]) / 100
      
      const wethBase = Number(b1[4]) / 100
      const wethDynamic = Number(b1[5]) / 100
      
      const usdcBase = Number(b2[4]) / 100
      const usdcDynamic = Number(b2[5]) / 100

      const cbbtcActual = totalBasketValue > 0 ? (cbbtcValue / totalBasketValue) * 100 : 0
      const wethActual = totalBasketValue > 0 ? (wethValue / totalBasketValue) * 100 : 0
      const usdcActual = totalBasketValue > 0 ? (usdcValue / totalBasketValue) * 100 : 0

      const weights = [
        { symbol: "cbBTC", actual: cbbtcActual, dynamic: cbbtcDynamic, base: cbbtcBase },
        { symbol: "WETH", actual: wethActual, dynamic: wethDynamic, base: wethBase },
        { symbol: "USDC", actual: usdcActual, dynamic: usdcDynamic, base: usdcBase }
      ]

      if (isMounted) {
        setStats(prev => ({ 
          tvlUsd, 
          fundEth, 
          weights, 
          recentLogs: prev?.recentLogs || [] 
        }))
        setIsLoadingStats(false)
        hasLoadedOnce.current = true
      }

      // Fetch logs separately to not block UI
      fetchRecentRebalances(isMounted)
    } catch (e) {
      console.error("Error fetching stats:", e)
      if (isMounted) setIsLoadingStats(false)
    }
  }, [fetchRecentRebalances])

  useEffect(() => {
    let isMounted = true
    fetchStats(isMounted)
    const interval = setInterval(() => fetchStats(isMounted), 30000)
    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [fetchStats])

  const connectWallet = async () => {
    if (typeof window === 'undefined' || !window.ethereum) {
      setError("MetaMask non trovato. Installa l'estensione per continuare.")
      return
    }

    try {
      setIsConnecting(true)
      setError(null)
      const provider = new BrowserProvider(window.ethereum)
      const accounts = await provider.send("eth_requestAccounts", [])
      if (accounts.length > 0) {
        setAccount(accounts[0])
        
        // Ensure we are on Base Mainnet
        const network = await provider.getNetwork()
        if (network.chainId !== 8453n) {
          try {
            await provider.send("wallet_switchEthereumChain", [{ chainId: "0x2105" }])
          } catch (switchError: any) {
            if (switchError.code === 4902) {
              await provider.send("wallet_addEthereumChain", [{
                chainId: "0x2105",
                chainName: "Base",
                rpcUrls: ["https://mainnet.base.org"],
                nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
                blockExplorerUrls: ["https://basescan.org"]
              }])
            } else {
              throw switchError
            }
          }
        }
      }
    } catch (err: any) {
      console.error(err)
      setError(err.message || "Errore durante la connessione al wallet")
    } finally {
      setIsConnecting(false)
    }
  }

  const handleArbitrage = async () => {
    if (!account || !window.ethereum) return

    try {
      setIsArbitraging(true)
      setError(null)
      setTxHash(null)

      const provider = new BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      const contract = new Contract(CONTRACT_ADDRESS, ABI, signer)

      const combos = [
        { index: 0n, isWethToAsset: true, name: "Compra cbBTC" },
        { index: 0n, isWethToAsset: false, name: "Vendi cbBTC" },
        { index: 2n, isWethToAsset: true, name: "Compra USDC" },
        { index: 2n, isWethToAsset: false, name: "Vendi USDC" }
      ]

      let validCombo = null

      for (const combo of combos) {
        try {
          await contract.incentivizedRebalance.staticCall(combo.index, combo.isWethToAsset, MaxUint256)
          validCombo = combo
          break
        } catch (e) {
          continue
        }
      }

      if (!validCombo) {
        setError("Il portafoglio è già perfettamente bilanciato. Nessun arbitraggio necessario in questo momento.")
        setIsArbitraging(false)
        return
      }

      const tx = await contract.incentivizedRebalance(validCombo.index, validCombo.isWethToAsset, MaxUint256)
      setTxHash(tx.hash)
      
      await tx.wait()
      setIsArbitraging(false)
    } catch (err: any) {
      console.error(err)
      setError(err.reason || err.message || "Errore durante l'esecuzione dell'arbitraggio")
      setIsArbitraging(false)
    }
  }

  const rewardThreshold = 0.0001
  const progress = stats ? Math.min((stats.fundEth / rewardThreshold) * 100, 100) : 0

  if (isLoadingStats && !stats) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <div className="w-12 h-12 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin"></div>
        <p className="text-zinc-500 font-mono text-sm animate-pulse uppercase tracking-widest">
          {t('rebalance.loading') || 'Loading Protocol Stats...'}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-8 mt-12 w-full">
      {/* TRANSPARENCY DASHBOARD */}
      {stats && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {/* Col 1: TVL & Stability Fund */}
          <div className="space-y-6 flex flex-col">
            <div className="bg-[#0a0a0a] border border-[#333] p-6 rounded-2xl flex-1">
              <div className="flex items-center justify-between mb-4 text-zinc-400">
                <div className="flex items-center gap-2">
                  <Database size={16} />
                  <h4 className="text-sm font-mono uppercase tracking-wider">{t('rebalance.tvl') || 'Liquidity TVL'}</h4>
                </div>
                <button 
                  onClick={() => fetchStats()} 
                  className="p-1 hover:bg-white/5 rounded-full transition-colors text-zinc-600 hover:text-zinc-400"
                  title="Refresh"
                >
                  <Clock size={14} />
                </button>
              </div>
              <p className="text-4xl font-serif text-white">
                {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(stats.tvlUsd)}
              </p>
              <p className="text-xs text-zinc-500 mt-2">{t('rebalance.tvlDesc') || 'Total value of assets in the contract'}</p>
            </div>

            <div className="bg-[#0a0a0a] border border-[#333] p-6 rounded-2xl flex-1">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-zinc-400">
                  <TrendingUp size={16} />
                  <h4 className="text-sm font-mono uppercase tracking-wider">{t('rebalance.fund') || 'Reward Fund'}</h4>
                </div>
              </div>
              
              <div className="mb-2 flex justify-between items-end">
                <span className="text-2xl font-serif text-white">{stats.fundEth.toFixed(6)} ETH</span>
                <span className="text-sm text-zinc-500 font-mono">{progress.toFixed(1)}%</span>
              </div>
              
              <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden mb-3">
                <div 
                  className="bg-emerald-500 h-full rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-zinc-500">
                  {progress >= 100 
                    ? (t('rebalance.ready') || "Pronto per pagare!") 
                    : `${(rewardThreshold - stats.fundEth).toFixed(6)} ETH ${t('rebalance.missing') || 'Missing'}`}
                </span>
                <span className="text-amber-500 font-mono bg-amber-500/10 px-2 py-1 rounded">
                  {t('rebalance.threshold') || 'Threshold'}: {rewardThreshold} ETH
                </span>
              </div>
            </div>
          </div>

          {/* Col 2: Weights */}
          <div className="bg-[#0a0a0a] border border-[#333] p-6 rounded-2xl flex flex-col">
            <div className="flex items-center gap-2 mb-6 text-zinc-400">
              <Percent size={16} />
              <h4 className="text-sm font-mono uppercase tracking-wider">{t('rebalance.basket') || 'Basket Status'}</h4>
            </div>

            <div className="flex-1 overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="text-zinc-500 border-b border-zinc-800">
                    <th className="pb-3 font-medium">{t('rebalance.asset') || 'Asset'}</th>
                    <th className="pb-3 font-medium text-right">{t('rebalance.actual') || 'Reale'}</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.weights.map(w => {
                    const diff = Math.abs(w.actual - w.dynamic)
                    const isImbalanced = diff > 0.5
                    return (
                      <tr key={w.symbol} className="border-b border-zinc-800/50 last:border-0">
                        <td className="py-4 font-medium text-white flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${isImbalanced ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`}></div>
                          {w.symbol}
                        </td>
                        <td className={`py-4 font-mono text-right ${isImbalanced ? 'text-amber-400' : 'text-emerald-400'}`}>
                          {w.actual.toFixed(2)}%
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-zinc-500 mt-4 leading-relaxed">
              {t('rebalance.imbalanceDesc') || "Il protocollo opera per la Sopravvivenza Geometrica: se un asset crolla, lo Scudo Anti-Crash ne taglia l'esposizione e incentiva il ribilanciamento verso asset sicuri (Flight to Safety)."}
            </p>
          </div>

          {/* Col 3: Recent Rebalances */}
          <div className="bg-[#0a0a0a] border border-[#333] p-6 rounded-2xl flex flex-col">
            <div className="flex items-center gap-2 mb-6 text-zinc-400">
              <Clock size={16} />
              <h4 className="text-sm font-mono uppercase tracking-wider">{t('rebalance.recent') || 'Recent Arbitrage'}</h4>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 space-y-3 max-h-[250px] custom-scrollbar">
              {stats.recentLogs.length === 0 ? (
                <p className="text-sm text-zinc-600 italic">{t('rebalance.noRecent') || 'No recent arbitrage found.'}</p>
              ) : (
                stats.recentLogs.map((log, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5 hover:bg-white/10 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center">
                        <ArrowRightLeft size={14} className="text-zinc-400" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-mono text-zinc-300">
                          {log.tokenIn} <span className="text-zinc-600">→</span> {log.tokenOut}
                        </span>
                        <span className="text-[10px] text-zinc-500 font-mono">
                          {log.executor.slice(0, 6)}...{log.executor.slice(-4)}
                        </span>
                      </div>
                    </div>
                    <a 
                      href={`https://basescan.org/tx/${log.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-amber-500 hover:text-amber-400 underline decoration-amber-500/30 underline-offset-2"
                    >
                      Tx
                    </a>
                  </div>
                ))
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* ARBITRAGE ACTION CARD */}
      <div className="max-w-3xl mx-auto bg-[#0a0a0a] border border-[#333] p-8 md:p-10 rounded-3xl relative overflow-hidden shadow-2xl mt-12">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-bl-full -z-0 blur-3xl"></div>
        
        <div className="relative z-10 space-y-8 text-center">
          <div className="flex flex-col items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
              <Zap className="w-8 h-8 text-amber-500" />
            </div>
            <div>
              <h3 className="text-3xl font-serif italic text-white mb-2">{t('rebalance.executeTitle') || 'Execute MEV Arbitrage'}</h3>
              <p className="text-sm text-zinc-400 font-mono uppercase tracking-widest">{t('rebalance.executeSub') || 'Maintain the Peg, Receive ETH'}</p>
            </div>
          </div>

          <p className="text-base text-white/60 leading-relaxed max-w-xl mx-auto">
            {t('rebalance.executeDesc1') || 'The GBLIN protocol incentivizes rebalancing to ensure Geometric Survival. When an asset crashes, the Crash Shield slashes its target weight, and the protocol pays you to move capital into safer assets.'}
          </p>

          <div className="max-w-md mx-auto pt-4">
            {!account ? (
              <button
                onClick={connectWallet}
                disabled={isConnecting}
                className="w-full py-5 bg-white/5 border border-white/10 text-white font-bold rounded-2xl hover:bg-white/10 transition-colors flex items-center justify-center gap-3 disabled:opacity-50 text-lg"
              >
                <Wallet size={20} />
                {isConnecting ? (t('trade.connecting') || "Connecting...") : (t('trade.connect') || "Connect Wallet")}
              </button>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-mono text-zinc-400">{t('rebalance.connected') || 'Wallet Connected'}</span>
                    <span className="text-sm font-mono text-emerald-400 bg-emerald-400/10 px-3 py-1 rounded-full w-fit">
                      {account.slice(0, 6)}...{account.slice(-4)}
                    </span>
                  </div>
                  <button
                    onClick={() => setAccount(null)}
                    className="text-xs text-zinc-500 hover:text-white uppercase tracking-widest font-bold transition-colors"
                  >
                    {t('trade.disconnect') || 'Disconnect'}
                  </button>
                </div>

                <button
                  onClick={handleArbitrage}
                  disabled={isArbitraging}
                  className="w-full py-5 bg-amber-500 text-black font-bold rounded-2xl hover:bg-amber-400 hover:scale-[1.02] transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:hover:scale-100 text-lg shadow-[0_0_30px_rgba(245,158,11,0.3)]"
                >
                  <Coins size={20} className={isArbitraging ? "animate-bounce" : ""} />
                  {isArbitraging ? (t('rebalance.executing') || "Arbitraging...") : (t('rebalance.executeBtn') || "Execute Arbitrage")}
                </button>
              </div>
            )}
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start gap-3 text-red-400 text-sm max-w-md mx-auto text-left"
            >
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <p className="break-words">{error}</p>
            </motion.div>
          )}

          {txHash && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-start gap-3 text-emerald-400 text-sm max-w-md mx-auto text-left"
            >
              <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
              <div>
                <p className="font-bold mb-1">{t('rebalance.success') || 'Arbitrage executed successfully!'}</p>
                <a 
                  href={`https://basescan.org/tx/${txHash}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs underline hover:text-emerald-300 inline-block"
                >
                  {t('trade.viewTx') || 'View on Basescan'}
                </a>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}

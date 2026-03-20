import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Wallet, ArrowDownUp, AlertCircle, CheckCircle2, Loader2, Settings, ChevronDown, Search, X } from 'lucide-react'
import { BrowserProvider, Contract, parseEther, formatEther, JsonRpcProvider, solidityPacked, parseUnits, formatUnits, isAddress } from 'ethers'
import { useLanguage } from '@/context/LanguageContext'

const CONTRACT_ADDRESS = "0xc475851f9101A2AC48a84EcF869766A94D301FaA"
const WETH_ADDRESS = "0x4200000000000000000000000000000000000006"
const USDC_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"
const CBBTC_ADDRESS = "0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf"
const UNISWAP_ROUTER = "0x2626664c2603336E57B271c5C0b26F421741e481"

const ABI = [
  "function buyGBLIN(uint256 minGblinOut) external payable",
  "function buyGBLINWithToken(bytes calldata path, uint256 amountIn, uint256 minWethOut, uint256 minGblinOut) external",
  "function sellGBLINForEth(uint256 gblinAmount, uint256 minEthOut) external",
  "function quoteBuyGBLIN(uint256 ethAmount) view returns (uint256 gblinOut, uint256 founderFee, uint256 stabFee)",
  "function quoteSellGBLIN(uint256 gblinAmount) view returns (uint256 ethOut)",
  "function balanceOf(address account) view returns (uint256)"
]

const ERC20_ABI = [
  "function balanceOf(address account) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)"
]

const QUOTER_ABI = [
  "function quoteExactInputSingle(address tokenIn, address tokenOut, uint24 fee, uint256 amountIn, uint160 sqrtPriceLimitX96) external returns (uint256 amountOut)"
]
const QUOTER_ADDRESS = "0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6"

const TOKENS: Record<string, { address: string, decimals: number, fee: number }> = {
  'ETH': { address: '', decimals: 18, fee: 0 },
  'USDC': { address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', decimals: 6, fee: 500 },
  'cbBTC': { address: '0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf', decimals: 8, fee: 500 },
  'DEGEN': { address: '0x4ed4E862860beD51a9570b96d89aF5E1B0Efefed', decimals: 18, fee: 10000 },
  'AERO': { address: '0x940181a94A35A4569E4529A3CDfB74e38FD98631', decimals: 18, fee: 10000 },
  'BRETT': { address: '0x532f27101965dd16442E59d40670FaF5eBB142E4', decimals: 18, fee: 10000 },
}

type Token = keyof typeof TOKENS | string

export function TradeInterface() {
  const { t } = useLanguage()
  const [isMounted, setIsMounted] = useState(false)
  const [account, setAccount] = useState<string | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [mode, setMode] = useState<'buy' | 'sell'>('buy')
  const [selectedToken, setSelectedToken] = useState<Token>('ETH')
  const [isTokenModalOpen, setIsTokenModalOpen] = useState(false)
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false)
  
  const [amount, setAmount] = useState('')
  const [quote, setQuote] = useState<string>('0')
  const [isLoadingQuote, setIsLoadingQuote] = useState(false)
  const [isTransacting, setIsTransacting] = useState(false)
  const [txHash, setTxHash] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  const [balance, setBalance] = useState<string>('0')
  const [tokenBalance, setTokenBalance] = useState<string>('0')
  const [slippage, setSlippage] = useState<number>(1) // 1% default slippage
  const [customTokenInfo, setCustomTokenInfo] = useState<{address: string, decimals: number, symbol: string} | null>(null)

  // Token Search States
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearchingCustom, setIsSearchingCustom] = useState(false)
  const [customTokenResult, setCustomTokenResult] = useState<{address: string, symbol: string, decimals: number} | null>(null)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Fetch balances
  useEffect(() => {
    const fetchBalances = async () => {
      if (!account || !window.ethereum) return
      try {
        const provider = new BrowserProvider(window.ethereum)
        
        // GBLIN Balance
        const contract = new Contract(CONTRACT_ADDRESS, ABI, provider)
        const bal = await contract.balanceOf(account)
        setBalance(formatEther(bal))
        
        // Selected Token Balance
        if (selectedToken === 'ETH') {
          const ethBal = await provider.getBalance(account)
          setTokenBalance(formatEther(ethBal))
        } else {
          let tokenAddress = ''
          let decimals = 18
          if (TOKENS[selectedToken]) {
            tokenAddress = TOKENS[selectedToken].address
            decimals = TOKENS[selectedToken].decimals
          } else if (customTokenInfo && customTokenInfo.symbol === selectedToken) {
            tokenAddress = customTokenInfo.address
            decimals = customTokenInfo.decimals
          }

          if (tokenAddress) {
            const tokenContract = new Contract(tokenAddress, ERC20_ABI, provider)
            const tBal = await tokenContract.balanceOf(account)
            setTokenBalance(formatUnits(tBal, decimals))
          }
        }
      } catch (e) {
        console.error("Error fetching balances", e)
      }
    }
    fetchBalances()
    const interval = setInterval(fetchBalances, 10000)
    return () => clearInterval(interval)
  }, [account, txHash, selectedToken, customTokenInfo])

  // Fetch quotes
  useEffect(() => {
    const fetchQuote = async () => {
      if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
        setQuote('0')
        return
      }

      setIsLoadingQuote(true)
      try {
        const provider = new JsonRpcProvider("https://base-rpc.publicnode.com")
        const contract = new Contract(CONTRACT_ADDRESS, ABI, provider)

        if (mode === 'buy') {
          let wethAmount = parseEther(amount)
          
          if (selectedToken !== 'ETH') {
            // We need to estimate how much WETH we get for the token
            const quoter = new Contract(QUOTER_ADDRESS, QUOTER_ABI, provider)
            
            let tokenAddress = ''
            let decimals = 18
            let fee = 3000 // Default to 0.3% pool for custom tokens
            
            if (TOKENS[selectedToken]) {
              tokenAddress = TOKENS[selectedToken].address
              decimals = TOKENS[selectedToken].decimals
              fee = TOKENS[selectedToken].fee
            } else if (customTokenInfo && customTokenInfo.symbol === selectedToken) {
              tokenAddress = customTokenInfo.address
              decimals = customTokenInfo.decimals
              // For custom tokens, we might want to try different fees (100, 500, 3000, 10000)
              // For simplicity in this quote, we assume a 0.3% (3000) pool exists.
              fee = 3000
            }

            if (tokenAddress) {
              const parsedAmount = parseUnits(amount, decimals)
              
              // Call Quoter (Token -> WETH)
              try {
                wethAmount = await quoter.quoteExactInputSingle.staticCall(
                  tokenAddress, WETH_ADDRESS, fee, parsedAmount, 0
                )
              } catch (e) {
                console.error("Quoter failed for fee", fee, e)
                // If 3000 fails, try 10000 (1%)
                if (fee === 3000) {
                  wethAmount = await quoter.quoteExactInputSingle.staticCall(
                    tokenAddress, WETH_ADDRESS, 10000, parsedAmount, 0
                  )
                }
              }
            }
          }

          const [gblinOut] = await contract.quoteBuyGBLIN(wethAmount)
          setQuote(formatEther(gblinOut))
        } else {
          const parsedAmount = parseEther(amount)
          const ethOut = await contract.quoteSellGBLIN(parsedAmount)
          setQuote(formatEther(ethOut))
        }
      } catch (e) {
        console.error("Quote error:", e)
        setQuote('0')
      } finally {
        setIsLoadingQuote(false)
      }
    }

    const timeoutId = setTimeout(fetchQuote, 500)
    return () => clearTimeout(timeoutId)
  }, [amount, mode, selectedToken, customTokenInfo])

  useEffect(() => {
    const searchCustomToken = async () => {
      if (isAddress(searchQuery)) {
        setIsSearchingCustom(true)
        try {
          const provider = new JsonRpcProvider("https://base-rpc.publicnode.com")
          const contract = new Contract(searchQuery, [
            "function symbol() view returns (string)",
            "function decimals() view returns (uint8)"
          ], provider)
          
          const [symbol, decimals] = await Promise.all([
            contract.symbol(),
            contract.decimals()
          ])
          
          setCustomTokenResult({ address: searchQuery, symbol, decimals: Number(decimals) })
        } catch (e) {
          console.error("Token non trovato", e)
          setCustomTokenResult(null)
        } finally {
          setIsSearchingCustom(false)
        }
      } else {
        setCustomTokenResult(null)
      }
    }

    const timeoutId = setTimeout(searchCustomToken, 500)
    return () => clearTimeout(timeoutId)
  }, [searchQuery])

  const filteredTokens = Object.keys(TOKENS).filter(t => t.toLowerCase().includes(searchQuery.toLowerCase()))

  const connectWallet = async () => {
    setIsWalletModalOpen(false)
    if (typeof window === 'undefined' || !window.ethereum) {
      setError("MetaMask o un wallet compatibile non trovato. Installa l'estensione per continuare.")
      return
    }

    try {
      setIsConnecting(true)
      setError(null)
      const provider = new BrowserProvider(window.ethereum)
      const accounts = await provider.send("eth_requestAccounts", [])
      if (accounts.length > 0) {
        setAccount(accounts[0])
        
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



  if (!isMounted) return null

  const handleTrade = async () => {
    if (!account || !window.ethereum || !amount || Number(amount) <= 0) return

    try {
      setIsTransacting(true)
      setError(null)
      setTxHash(null)

      const provider = new BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      const contract = new Contract(CONTRACT_ADDRESS, ABI, signer)

      const parsedQuote = parseEther(quote)
      const minOut = (parsedQuote * BigInt(10000 - slippage * 100)) / 10000n

      let tx;
      if (mode === 'buy') {
        if (selectedToken === 'ETH') {
          const parsedAmount = parseEther(amount)
          tx = await contract.buyGBLIN(minOut, { value: parsedAmount })
        } else {
          let tokenAddress = ''
          let decimals = 18
          let fee = 3000
          
          if (TOKENS[selectedToken]) {
            tokenAddress = TOKENS[selectedToken].address
            decimals = TOKENS[selectedToken].decimals
            fee = TOKENS[selectedToken].fee
          } else if (customTokenInfo && customTokenInfo.symbol === selectedToken) {
            tokenAddress = customTokenInfo.address
            decimals = customTokenInfo.decimals
            fee = 3000 // We assume 0.3% pool for custom tokens
          }

          if (!tokenAddress) throw new Error("Token non valido")

          const parsedAmount = parseUnits(amount, decimals)
          
          // 1. Approve Token
          const tokenContract = new Contract(tokenAddress, ERC20_ABI, signer)
          const allowance = await tokenContract.allowance(account, CONTRACT_ADDRESS)
          if (allowance < parsedAmount) {
            const approveTx = await tokenContract.approve(CONTRACT_ADDRESS, parsedAmount)
            await approveTx.wait()
          }

          // 2. Execute buyGBLINWithToken
          // Path: tokenIn + fee + WETH
          const path = solidityPacked(['address', 'uint24', 'address'], [tokenAddress, fee, WETH_ADDRESS])
          
          // Estimate minWethOut (we can just use 0 for simplicity, or calculate it. The contract protects NAV anyway)
          tx = await contract.buyGBLINWithToken(path, parsedAmount, 0, minOut)
        }
      } else {
        const parsedAmount = parseEther(amount)
        tx = await contract.sellGBLINForEth(parsedAmount, minOut)
      }

      setTxHash(tx.hash)
      await tx.wait()
      
      setAmount('')
      setIsTransacting(false)
    } catch (err: any) {
      console.error(err)
      // Check for user rejection (code 4001 in MetaMask)
      if (err.code === 4001 || err.info?.error?.code === 4001) {
        setError("Transazione annullata dall'utente.")
      } else {
        setError(err.reason || err.message || "Errore durante la transazione")
      }
      setIsTransacting(false)
    }
  }

  const setMaxAmount = () => {
    if (mode === 'buy') {
      if (selectedToken === 'ETH') {
        const maxEth = Number(tokenBalance) - 0.001
        setAmount(maxEth > 0 ? maxEth.toFixed(6) : '0')
      } else {
        setAmount(tokenBalance)
      }
    } else {
      setAmount(balance)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto bg-[#0a0a0a] border border-[#333] rounded-3xl overflow-hidden shadow-2xl relative">
      {/* Header Tabs */}
      <div className="flex border-b border-[#333]">
        <button 
          onClick={() => { setMode('buy'); setAmount(''); setError(null); setTxHash(null); }}
          className={`flex-1 py-4 text-sm font-bold uppercase tracking-widest transition-colors ${mode === 'buy' ? 'text-amber-500 border-b-2 border-amber-500 bg-amber-500/5' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          {t('trade.buyBtn') || 'Buy GBLIN'}
        </button>
        <button 
          onClick={() => { setMode('sell'); setAmount(''); setError(null); setTxHash(null); }}
          className={`flex-1 py-4 text-sm font-bold uppercase tracking-widest transition-colors ${mode === 'sell' ? 'text-amber-500 border-b-2 border-amber-500 bg-amber-500/5' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          {t('trade.sellBtn') || 'Sell GBLIN'}
        </button>
      </div>

      <div className="p-6 space-y-6">
        {/* Input Section */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-mono text-zinc-500 px-1">
            <span>{t('trade.pay') || 'You Pay'}</span>
            {account && (
              <button onClick={setMaxAmount} className="hover:text-amber-500 transition-colors">
                {t('trade.balance') || 'Balance'}: {mode === 'buy' ? Number(tokenBalance).toFixed(4) : Number(balance).toFixed(4)} {mode === 'buy' ? selectedToken : 'GBLIN'}
              </button>
            )}
          </div>
          <div className="bg-[#111] border border-[#333] rounded-2xl p-4 flex items-center justify-between focus-within:border-amber-500/50 transition-colors relative">
            <input 
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.0"
              className="bg-transparent text-3xl font-serif text-white outline-none w-full"
            />
            
            {mode === 'buy' ? (
              <div className="relative shrink-0">
                <button 
                  onClick={() => setIsTokenModalOpen(true)}
                  className="flex items-center gap-2 bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-xl border border-white/10 transition-colors"
                >
                  <span className="font-bold">{selectedToken}</span>
                  <ChevronDown size={14} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-xl border border-white/10 shrink-0">
                <span className="font-bold">GBLIN</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-center -my-2 relative z-10">
          <div className="w-10 h-10 bg-[#0a0a0a] border border-[#333] rounded-full flex items-center justify-center text-zinc-500">
            <ArrowDownUp size={16} />
          </div>
        </div>

        {/* Output Section */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-mono text-zinc-500 px-1">
            <span>{t('trade.receive') || 'You Receive (Est.)'}</span>
          </div>
          <div className="bg-[#111] border border-[#333] rounded-2xl p-4 flex items-center justify-between opacity-70">
            <div className="text-3xl font-serif text-white flex items-center gap-3">
              {isLoadingQuote ? <Loader2 size={24} className="animate-spin text-amber-500" /> : Number(quote).toFixed(6)}
            </div>
            <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-xl border border-white/10 shrink-0">
              <span className="font-bold">{mode === 'buy' ? 'GBLIN' : 'ETH'}</span>
            </div>
          </div>
        </div>

        {/* Slippage Settings */}
        <div className="flex items-center justify-between text-xs font-mono text-zinc-500 px-2 pt-2">
          <div className="flex items-center gap-1">
            <Settings size={12} />
            <span>{t('trade.slippage') || 'Slippage Tolerance'}</span>
          </div>
          <div className="flex gap-2">
            {[0.5, 1, 2].map(val => (
              <button 
                key={val}
                onClick={() => setSlippage(val)}
                className={`px-2 py-0.5 rounded ${slippage === val ? 'bg-amber-500/20 text-amber-500' : 'bg-white/5 hover:bg-white/10'}`}
              >
                {val}%
              </button>
            ))}
          </div>
        </div>

      {/* Action Button */}
        <div className="pt-4">
          {!account ? (
            <button
              onClick={() => setIsWalletModalOpen(true)}
              disabled={isConnecting}
              className="w-full py-4 bg-white/5 border border-white/10 text-white font-bold rounded-2xl hover:bg-white/10 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Wallet size={18} />
              {isConnecting ? (t('trade.connecting') || "Connessione...") : (t('trade.connect') || "Connetti Wallet")}
            </button>
          ) : (
            <div className="space-y-2">
              <button
                onClick={handleTrade}
                disabled={isTransacting || !amount || Number(amount) <= 0 || isLoadingQuote}
                className="w-full py-4 bg-amber-500 text-black font-bold rounded-2xl hover:bg-amber-400 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:hover:bg-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.2)]"
              >
                {isTransacting ? (
                  <><Loader2 size={18} className="animate-spin" /> {t('trade.transacting') || "Transazione in corso..."}</>
                ) : !amount || Number(amount) <= 0 ? (
                  "Inserisci un importo"
                ) : (
                  mode === 'buy' ? (t('trade.buyBtn') || "Compra GBLIN") : (t('trade.sellBtn') || "Vendi GBLIN")
                )}
              </button>
              <button
                onClick={() => {
                  console.log("Disconnecting wallet...");
                  setAccount(null);
                }}
                className="w-full py-3 bg-white/5 border border-white/10 text-zinc-400 text-xs font-bold uppercase tracking-widest hover:text-white hover:bg-white/10 transition-all rounded-xl"
              >
                {t('trade.disconnect') || "Disconnetti Wallet"}
              </button>
            </div>
          )}
        </div>

        {/* Status Messages */}
        <AnimatePresence>
          {error && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-2 text-red-400 text-xs mt-4"
            >
              <AlertCircle size={14} className="mt-0.5 shrink-0" />
              <p className="break-words">{error}</p>
            </motion.div>
          )}

          {txHash && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-start gap-2 text-emerald-400 text-xs mt-4"
            >
              <CheckCircle2 size={14} className="mt-0.5 shrink-0" />
              <div>
                <p className="font-bold mb-0.5">{t('trade.success') || "Transazione completata!"}</p>
                <a 
                  href={`https://basescan.org/tx/${txHash}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="underline hover:text-emerald-300"
                >
                  {t('trade.viewTx') || "Vedi su Basescan"}
                </a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {isTokenModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#111] border border-[#333] rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl"
            >
              <div className="p-4 border-b border-[#333] flex justify-between items-center">
                <h3 className="text-lg font-bold text-white">Seleziona un token</h3>
                <button onClick={() => setIsTokenModalOpen(false)} className="text-zinc-500 hover:text-white transition-colors">
                  <X size={20} />
                </button>
              </div>
              <div className="p-4">
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                  <input 
                    type="text" 
                    placeholder="Cerca nome o incolla indirizzo" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-[#1a1a1a] border border-[#333] rounded-xl py-3 pl-10 pr-4 text-white outline-none focus:border-amber-500/50 transition-colors"
                  />
                </div>
                
                <div className="max-h-60 overflow-y-auto custom-scrollbar space-y-1">
                  {filteredTokens.map(token => (
                    <button
                      key={token}
                      onClick={() => { setSelectedToken(token); setIsTokenModalOpen(false); }}
                      className="w-full flex items-center justify-between p-3 hover:bg-white/5 rounded-xl transition-colors"
                    >
                      <span className="font-bold text-white">{token}</span>
                      {selectedToken === token && <CheckCircle2 size={16} className="text-amber-500" />}
                    </button>
                  ))}

                  {isSearchingCustom && (
                    <div className="p-4 text-center text-zinc-500 flex items-center justify-center gap-2">
                      <Loader2 size={16} className="animate-spin" /> Ricerca token...
                    </div>
                  )}

                  {customTokenResult && (
                    <button
                      onClick={() => { 
                        setCustomTokenInfo(customTokenResult)
                        setSelectedToken(customTokenResult.symbol)
                        setIsTokenModalOpen(false)
                      }}
                      className="w-full flex items-center justify-between p-3 hover:bg-white/5 rounded-xl transition-colors border border-dashed border-[#333]"
                    >
                      <div className="flex flex-col items-start">
                        <span className="font-bold text-white">{customTokenResult.symbol}</span>
                        <span className="text-xs text-zinc-500">Trovato tramite indirizzo</span>
                      </div>
                      <span className="text-xs bg-amber-500/10 text-amber-500 px-2 py-1 rounded-lg">Importa</span>
                    </button>
                  )}

                  {filteredTokens.length === 0 && !isSearchingCustom && !customTokenResult && (
                    <div className="p-4 text-center text-zinc-500 text-sm">
                      Nessun token trovato. Incolla l&apos;indirizzo del contratto per importarlo.
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {isWalletModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0f111a] border border-[#1e2336] rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl"
            >
              <div className="p-6 text-center border-b border-[#1e2336] relative">
                <h3 className="text-lg font-bold text-white">Connect Wallet</h3>
                <p className="text-sm text-zinc-400 mt-1">You&apos;ll need an <span className="text-blue-500">Ethereum Wallet</span> to continue.</p>
                <button onClick={() => setIsWalletModalOpen(false)} className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors">
                  <X size={20} />
                </button>
              </div>
              <div className="p-4 space-y-2">
                {[
                  { name: 'Browser Wallet', icon: '🦊' },
                  { name: 'WalletConnect', icon: '🔗' },
                  { name: 'Coinbase Wallet', icon: '🔵' },
                  { name: 'Binance Wallet', icon: '🟡' },
                ].map(wallet => (
                  <button
                    key={wallet.name}
                    onClick={connectWallet}
                    className="w-full flex items-center gap-4 p-4 bg-white rounded-2xl hover:bg-gray-100 transition-colors text-black font-bold"
                  >
                    <span className="text-2xl">{wallet.icon}</span>
                    {wallet.name}
                  </button>
                ))}
              </div>
              <div className="p-4 text-center text-xs text-zinc-500 border-t border-[#1e2336]">
                2026 © GBLIN Protocol.
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

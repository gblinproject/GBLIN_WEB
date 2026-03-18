"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { Activity, Database, ShieldAlert, RefreshCw, DollarSign, ListOrdered, Wallet, BarChart3, CreditCard, ExternalLink, TrendingUp } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Interface } from "ethers";
import { useLanguage } from "@/context/LanguageContext";
import { it, es, zhCN, ja, fr, de } from "date-fns/locale";

const locales = {
  en: undefined,
  it: it,
  es: es,
  zh: zhCN,
  ja: ja,
  fr: fr,
  de: de
};

interface Transaction {
  hash: string;
  timeStamp: string;
  from: string;
  to: string;
  value: string;
  type?: string;
  logIndex?: string;
}

export function Dashboard() {
  const { t, language } = useLanguage();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
  // Market Data
  const [priceUsd, setPriceUsd] = useState<number>(0);
  const [volume24h, setVolume24h] = useState<number>(0);
  const [userBalance, setUserBalance] = useState<number>(0);
  const [totalSupply, setTotalSupply] = useState<number>(0);
  const [contractNav, setContractNav] = useState<number>(0);

  const CONTRACT_ADDRESS = "0xc475851f9101A2AC48a84EcF869766A94D301FaA";
  const USER_ADDRESS = "0x9FFa542E369C53af62380296092EC669f329a9ee";
  
  // FLAG DI PRE-LANCIO: Imposta su 'false' DOPO aver creato la pool su Aerodrome
  const IS_PRE_LAUNCH = false; 

  const fetchData = useCallback(async () => {
    setLoading(true);
    
    const RPC_ENDPOINTS = [
      "https://mainnet.base.org",
      "https://base.llamarpc.com",
      "https://base-mainnet.public.blastapi.io",
      "https://base.meowrpc.com",
      "https://base.drpc.org"
    ];

    const rpcRequest = async (method: string, params: any[]) => {
      for (const endpoint of RPC_ENDPOINTS) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        try {
          const res = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              jsonrpc: "2.0",
              method,
              params,
              id: Math.floor(Math.random() * 1000)
            }),
            signal: controller.signal
          });
          clearTimeout(timeoutId);
          if (!res.ok) continue;
          const json = await res.json();
          if (json.result !== undefined) return json.result;
          if (json.error) {
            console.warn(`RPC error from ${endpoint} for ${method}:`, json.error);
            continue;
          }
        } catch (e) {
          clearTimeout(timeoutId);
          console.warn(`RPC call failed for ${endpoint} (${method})`, e);
          continue;
        }
      }
      throw new Error(`All RPC endpoints failed for ${method}`);
    };

    const rpcCall = async (data: string) => {
      return rpcRequest("eth_call", [{ to: CONTRACT_ADDRESS, data }, "latest"]);
    };

    if (IS_PRE_LAUNCH) {
      setPriceUsd(0);
      setVolume24h(0);
    } else {
      // 1. Fetch Market Data (Prioritize DexScreener for real-time tick matching)
      try {
        const dexRes = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${CONTRACT_ADDRESS}`);
        const dexData = await dexRes.json();
        if (dexData.pairs && dexData.pairs.length > 0) {
          // Sort pairs by liquidity to get the most accurate one
          const sortedPairs = dexData.pairs.sort((a: any, b: any) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0));
          // Prioritize the Slipstream pair (0xDaEcC15bF028Bc4d135260D044b87001dafb3c22)
          const pair = sortedPairs.find((p: any) => p.pairAddress.toLowerCase() === '0xdaecc15bf028bc4d135260d044b87001dafb3c22') || sortedPairs.find((p: any) => p.chainId === 'base') || sortedPairs[0];
          setPriceUsd(Number(pair.priceUsd || 0));
          setVolume24h(Number(pair.volume?.h24 || 0));
        } else {
          throw new Error("No pairs found on DexScreener");
        }
      } catch (dexError) {
        console.warn("DexScreener failed, trying GeckoTerminal...", dexError);
        try {
          const marketRes = await fetch(`https://api.geckoterminal.com/api/v2/networks/base/tokens/${CONTRACT_ADDRESS}/pools`);
          if (!marketRes.ok) throw new Error("GeckoTerminal response not ok");
          const marketData = await marketRes.json();
          
          if (marketData.data && marketData.data.length > 0) {
            const pool = marketData.data[0].attributes;
            setPriceUsd(Number(pool.base_token_price_usd || 0));
            setVolume24h(Number(pool.volume_usd?.h24 || 0));
          }
        } catch (geckoError) {
          console.error("Market data fetch failed completely", geckoError);
        }
      }
    }

    // 2. Fetch User Balance & Total Supply via Public RPC
    let currentSupply = 0;
    try {
      // Total Supply (0x18160ddd)
      const supplyHex = await rpcCall("0x18160ddd");
      if (supplyHex && supplyHex !== "0x") {
        currentSupply = Number(BigInt(supplyHex)) / 1e18;
        setTotalSupply(currentSupply);
      }

      // User Balance (0x70a08231 + padded address)
      const paddedAddress = USER_ADDRESS.toLowerCase().replace("0x", "").padStart(64, "0");
      const balanceHex = await rpcCall("0x70a08231" + paddedAddress);
      if (balanceHex && balanceHex !== "0x") {
        setUserBalance(Number(BigInt(balanceHex)) / 1e18);
      }
    } catch (error) {
      console.error("Balance/Supply fetch failed", error);
    }

    // 3. Fetch Contract NAV (quoteSellGBLIN)
    try {
      // Get ETH price first (with fallback)
      let ethPrice = 0;
      try {
        const wethRes = await fetch("https://api.geckoterminal.com/api/v2/networks/base/tokens/0x4200000000000000000000000000000000000006");
        const wethData = await wethRes.json();
        ethPrice = Number(wethData?.data?.attributes?.price_usd || 0);
      } catch (e) {
        console.warn("GeckoTerminal WETH fetch failed, trying fallback...", e);
        const ethRes = await fetch("https://api.binance.com/api/v3/ticker/price?symbol=ETHUSDT");
        const ethData = await ethRes.json();
        ethPrice = Number(ethData.price || 0);
      }

      // quoteSellGBLIN(1e18) signature is 0x2a0a45fd + 1e18 in hex
      const navData = "0x2a0a45fd0000000000000000000000000000000000000000000000000de0b6b3a7640000";
      const navEthHex = await rpcCall(navData);
      
      if (navEthHex && navEthHex !== "0x" && ethPrice > 0) {
        const navEth = Number(BigInt(navEthHex)) / 1e18;
        // If supply is 0, the contract defaults NAV to 1 ETH. We override to 0 for display to match Basescan.
        if (currentSupply === 0) {
          setContractNav(0);
        } else {
          setContractNav(navEth * ethPrice);
        }
      }
    } catch (error) {
      console.error("Failed to fetch Contract NAV", error);
    }

    // 4. Fetch Transactions via RPC Logs (100% Live & Accurate)
    try {
      const currentBlockHex = await rpcRequest("eth_blockNumber", []);
      const currentBlock = Number(BigInt(currentBlockHex));
      const fromBlock = "0x" + (currentBlock - 5000).toString(16);

      const logs = await rpcRequest("eth_getLogs", [{
        address: CONTRACT_ADDRESS,
        fromBlock,
        toBlock: "latest"
      }]);
      
      const txMap = new Map<string, any>();
      
      const eventInterfaces = new Interface([
        "event Minted(address indexed user, uint256 ethIn, uint256 gblinOut)",
        "event Burned(address indexed user, uint256 gblinIn)",
        "event Approval(address indexed owner, address indexed spender, uint256 value)",
        "event Transfer(address indexed from, address indexed to, uint256 value)"
      ]);

      for (const log of logs) {
        try {
          const parsed = eventInterfaces.parseLog(log);
          if (!parsed) continue;

          const existing = txMap.get(log.transactionHash);
          // Prioritize Minted/Burned over Transfer
          if (existing && (existing.type === "Minted" || existing.type === "Burned")) continue;

          let from = "";
          let to = "";
          let value = "0";

          if (parsed.name === "Transfer") {
            from = parsed.args[0];
            to = parsed.args[1];
            value = parsed.args[2].toString();
          } else if (parsed.name === "Approval") {
            from = parsed.args[0];
            to = parsed.args[1];
            value = "0"; // Approvals don't have a "value" in terms of token movement
          } else if (parsed.name === "Minted") {
            from = "0x0000000000000000000000000000000000000000";
            to = parsed.args[0];
            value = parsed.args[2].toString();
          } else if (parsed.name === "Burned") {
            from = parsed.args[0];
            to = "0x0000000000000000000000000000000000000000";
            value = parsed.args[1].toString();
          }

          txMap.set(log.transactionHash, {
            hash: log.transactionHash,
            blockNumber: log.blockNumber,
            type: parsed.name,
            from,
            to,
            value,
            logIndex: log.index
          });
        } catch (e) {
          continue;
        }
      }

      const sortedTxs = Array.from(txMap.values())
        .sort((a, b) => b.blockNumber - a.blockNumber || b.logIndex - a.logIndex)
        .slice(0, 10);

      const uniqueBlocks = Array.from(new Set(sortedTxs.map(tx => tx.blockNumber)));
      const blockData = new Map<number, number>();
      
      await Promise.all(uniqueBlocks.map(async (bn) => {
        try {
          const block = await rpcRequest("eth_getBlockByNumber", ["0x" + bn.toString(16), false]);
          if (block && block.timestamp) {
            blockData.set(bn, Number(BigInt(block.timestamp)));
          }
        } catch (e) {
          console.warn(`Failed to fetch block ${bn}`, e);
        }
      }));

      const finalTxs = sortedTxs.map(tx => ({
        ...tx,
        timeStamp: (blockData.get(tx.blockNumber) || Math.floor(Date.now() / 1000)).toString()
      }));

      setTransactions(finalTxs);
    } catch (error) {
      console.error("RPC Log fetch failed completely", error);
    }

    setLastUpdated(new Date());
    setLoading(false);
  }, [IS_PRE_LAUNCH]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000); // Auto-update every 60s
    return () => clearInterval(interval);
  }, [fetchData]);

  const formatAddress = (addr: string) => `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  const formatValue = (val: string) => (Number(val) / 1e18).toFixed(4);
  const formatCurrency = (val: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

  // Math: LP Fees are 0.3% of volume
  const estimated24hFees = volume24h * 0.003;
  const userBalanceUsd = userBalance * priceUsd;

  return (
    <div className="space-y-6">
      {/* OFFICIAL CONTRACT VERIFICATION */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 p-6 bg-amber-500/10 border border-amber-500/20 rounded-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-amber-500 flex items-center justify-center shadow-[0_0_20px_rgba(245,158,11,0.3)]">
            <ShieldAlert className="w-6 h-6 text-black" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-amber-500 uppercase tracking-tighter">{t('dashboard.contractTitle')}</h3>
            <p className="text-xs text-zinc-400 font-mono select-all">{CONTRACT_ADDRESS}</p>
            <p className="text-[10px] text-zinc-500 mt-1 uppercase tracking-widest font-bold">
              {t('dashboard.verifiedOnBase')}
            </p>
          </div>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <button 
            onClick={() => {
              navigator.clipboard.writeText(CONTRACT_ADDRESS);
            }}
            className="flex-1 md:flex-none px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-sm text-[10px] font-bold uppercase tracking-widest transition-all"
          >
            {t('dashboard.copyAddress')}
          </button>
          <a 
            href={`https://basescan.org/token/${CONTRACT_ADDRESS}`}
            target="_blank"
            rel="noreferrer"
            className="flex-1 md:flex-none px-4 py-2 bg-amber-500 text-black rounded-sm text-[10px] font-bold uppercase tracking-widest hover:bg-amber-400 transition-all text-center"
          >
            {t('dashboard.verifyBasescan')}
          </a>
        </div>
      </div>

      {/* VERIFICATION STATUS TRACKER */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#1A1A1A] border border-[#333] p-4 rounded-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">{t('dashboard.metadata')}</span>
          </div>
          <div className="text-right">
            <span className="block text-[10px] font-bold text-emerald-500 uppercase tracking-widest">{t('dashboard.inReview')}</span>
            <span className="block text-[8px] text-zinc-500 uppercase tracking-tighter">{t('dashboard.ticketVerified')}</span>
          </div>
        </div>
        <div className="bg-[#1A1A1A] border border-[#333] p-4 rounded-sm flex items-center justify-between opacity-50">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-amber-500" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">{t('dashboard.assetHub')}</span>
          </div>
          <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">{t('dashboard.pending')}</span>
        </div>
        <div className="bg-[#1A1A1A] border border-[#333] p-4 rounded-sm flex items-center justify-between opacity-50">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-zinc-500" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">{t('dashboard.dexAds')}</span>
          </div>
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{t('dashboard.postVerification')}</span>
        </div>
      </div>

      {/* TOP METRICS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* PRICE POOL */}
        <div className="bg-[#1A1A1A] border border-[#333] p-4 rounded-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-zinc-500 uppercase tracking-widest">{t('dashboard.pricePool')}</span>
            <DollarSign className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-[#E4E3E0]">
            {formatCurrency(priceUsd)}
          </div>
          <div className="text-xs text-zinc-500 mt-1">{t('dashboard.slipstreamText')}</div>
        </div>

        {/* CONTRACT NAV */}
        <div className="bg-[#1A1A1A] border border-[#333] p-4 rounded-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/10 rounded-bl-full -z-0"></div>
          <div className="flex items-center justify-between mb-2 relative z-10">
            <span className="text-xs text-emerald-500 uppercase tracking-widest font-bold">{t('dashboard.navTitle')}</span>
            <ShieldAlert className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 relative z-10">
            {formatCurrency(contractNav)}
          </div>
          <div className="text-xs text-emerald-500/70 mt-1 relative z-10">{t('dashboard.backing')}</div>
        </div>
        
        {/* VOLUME */}
        <div className="bg-[#1A1A1A] border border-[#333] p-4 rounded-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-zinc-500 uppercase tracking-widest">{t('dashboard.volume')}</span>
            <BarChart3 className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-[#E4E3E0]">
            {formatCurrency(volume24h)}
          </div>
          <div className="text-xs text-zinc-500 mt-1">{t('dashboard.slipstreamText')}</div>
        </div>

        {/* TOTAL SUPPLY */}
        <div className="bg-[#1A1A1A] border border-[#333] p-4 rounded-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-zinc-500 uppercase tracking-widest">{t('dashboard.supply')}</span>
            <Database className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-[#E4E3E0] font-mono">
            {totalSupply > 0 ? totalSupply.toFixed(4) : <span className="text-zinc-500 text-xl tracking-widest">SYNCING...</span>}
          </div>
          <div className="text-xs text-zinc-500 mt-1">{t('dashboard.existence')}</div>
        </div>
      </div>

      {/* ARBITRAGE OPPORTUNITY INDICATOR */}
      {priceUsd > 0 && contractNav > 0 && (
        <div className="bg-[#1A1A1A] border border-amber-500/30 p-6 rounded-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-bl-full -z-0"></div>
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-amber-500" />
                <h3 className="text-lg font-bold text-amber-500 uppercase tracking-tighter">{t('dashboard.arbitrageTitle')}</h3>
              </div>
              <p className="text-sm text-zinc-400 max-w-xl">
                {t('dashboard.arbitrageText')}
              </p>
            </div>
            <div className="text-right">
              <div className="text-xs text-zinc-500 uppercase tracking-widest mb-1">{t('dashboard.currentStatus')}</div>
              <div className={`text-3xl font-bold ${priceUsd < contractNav ? 'text-emerald-500' : 'text-amber-500'}`}>
                {priceUsd < contractNav ? (
                  <>{t('dashboard.undervalued')} <span className="text-sm opacity-60">({((1 - priceUsd/contractNav) * 100).toFixed(2)}% {t('dashboard.discount')})</span></>
                ) : (
                  <>{t('dashboard.fairValue')} <span className="text-sm opacity-60">({t('dashboard.marketAligned')})</span></>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MAIN CONTENT AREA */}
      <div className="bg-[#1A1A1A] border border-[#333] p-6 rounded-sm">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#333]">
          <h3 className="text-sm font-bold text-[#E4E3E0] uppercase flex items-center gap-3">
            <div className="relative w-6 h-6 rounded-full overflow-hidden">
              <Image 
                src="https://raw.githubusercontent.com/gblinproject/GBLIN/main/LOGO_GBLIN.svg"
                alt="GBLIN"
                fill
                unoptimized
                className="object-cover scale-[1.02]"
                referrerPolicy="no-referrer"
              />
            </div>
            {t('dashboard.title')}
          </h3>
          <div className="flex items-center gap-4">
            <a 
              href={`https://aerodrome.finance/swap?from=eth&to=${CONTRACT_ADDRESS}`}
              target="_blank"
              rel="noreferrer"
              className="text-xs border border-amber-500/30 text-amber-500 hover:bg-amber-500/10 px-3 py-1 rounded-sm flex items-center gap-2 transition-colors uppercase tracking-widest font-bold"
            >
              {t('dashboard.trade')}
            </a>
            <div className="text-xs text-zinc-500 hidden md:block">
              {t('dashboard.lastSync')}: {lastUpdated ? lastUpdated.toLocaleTimeString() : '--:--:--'}
            </div>
            <button 
              onClick={fetchData}
              disabled={loading}
              className="text-xs bg-[#333] hover:bg-[#444] text-[#E4E3E0] px-3 py-1 rounded-sm flex items-center gap-2 transition-colors"
            >
              <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
              {t('dashboard.sync')}
            </button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs text-zinc-500 uppercase bg-[#111]">
              <tr>
                <th className="px-4 py-2 font-normal">{t('dashboard.type')}</th>
                <th className="px-4 py-2 font-normal">{t('dashboard.time')}</th>
                <th className="px-4 py-2 font-normal">{t('dashboard.txHash')}</th>
                <th className="px-4 py-2 font-normal">{t('dashboard.from')}</th>
                <th className="px-4 py-2 font-normal">{t('dashboard.to')}</th>
                <th className="px-4 py-2 font-normal text-right">{t('dashboard.amount')} (GBLIN)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#333]">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-zinc-500">
                    {loading ? t('dashboard.scanning') : t('dashboard.noTx')}
                  </td>
                </tr>
              ) : (
                transactions.map((tx, idx) => {
                  let txType = tx.type || "Transfer";
                  let typeColor = "text-zinc-400";
                  const fromLower = tx.from.toLowerCase();
                  const toLower = tx.to.toLowerCase();
                  
                  if (txType === "Minted") {
                    txType = t('dashboard.buy');
                    typeColor = "text-emerald-500";
                  } else if (txType === "Burned") {
                    txType = t('dashboard.sell');
                    typeColor = "text-red-500";
                  } else if (txType === "Approval") {
                    txType = t('dashboard.approve');
                    typeColor = "text-blue-400";
                  } else if (txType === "Transfer") {
                    if (fromLower === "0x0000000000000000000000000000000000000000") {
                      txType = t('dashboard.buy');
                      typeColor = "text-emerald-500";
                    } else if (toLower === "0x0000000000000000000000000000000000000000") {
                      txType = t('dashboard.sell');
                      typeColor = "text-red-500";
                    } else if (fromLower.startsWith("0xdaec") && fromLower.endsWith("3c22")) {
                      txType = t('dashboard.buy') + " (" + t('dashboard.dex') + ")";
                      typeColor = "text-emerald-400";
                    } else if (toLower.startsWith("0xdaec") && toLower.endsWith("3c22")) {
                      txType = t('dashboard.sell') + " (" + t('dashboard.dex') + ")";
                      typeColor = "text-red-400";
                    } else {
                      txType = t('dashboard.transfer');
                      typeColor = "text-blue-400";
                    }
                  }

                  return (
                    <tr key={`${tx.hash}-${tx.logIndex || idx}`} className="hover:bg-[#222] transition-colors">
                      <td className={`px-4 py-3 text-xs font-bold uppercase tracking-widest ${typeColor}`}>
                        {txType}
                      </td>
                      <td className="px-4 py-3 text-zinc-400 whitespace-nowrap">
                        {formatDistanceToNow(new Date(Number(tx.timeStamp) * 1000), { 
                          addSuffix: true,
                          locale: locales[language as keyof typeof locales]
                        })}
                      </td>
                      <td className="px-4 py-3">
                        <a href={`https://basescan.org/tx/${tx.hash}`} target="_blank" rel="noreferrer" className="text-amber-500 hover:underline font-mono text-xs">
                          {formatAddress(tx.hash)}
                        </a>
                      </td>
                      <td className="px-4 py-3 text-zinc-400 font-mono text-xs">
                        {fromLower === "0x0000000000000000000000000000000000000000" ? (
                          <span className="text-yellow-500">NullAddress</span>
                        ) : (
                          formatAddress(tx.from)
                        )}
                      </td>
                      <td className="px-4 py-3 text-zinc-400 font-mono text-xs">
                        {toLower === "0x0000000000000000000000000000000000000000" ? (
                          <span className="text-yellow-500">NullAddress</span>
                        ) : (
                          formatAddress(tx.to)
                        )}
                      </td>
                      <td className="px-4 py-3 text-[#E4E3E0] text-right font-mono">
                        {formatValue(tx.value)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

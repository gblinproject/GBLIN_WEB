"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { Activity, Database, ShieldAlert, RefreshCw, DollarSign, ListOrdered, Wallet, BarChart3 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Transaction {
  hash: string;
  timeStamp: string;
  from: string;
  to: string;
  value: string;
}

export function Dashboard() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
  // Market Data
  const [priceUsd, setPriceUsd] = useState<number>(0);
  const [volume24h, setVolume24h] = useState<number>(0);
  const [userBalance, setUserBalance] = useState<number>(0);

  const CONTRACT_ADDRESS = "0xc475851f9101A2AC48a84EcF869766A94D301FaA";
  const USER_ADDRESS = "0x9FFa542E369C53af62380296092EC669f329a9ee";
  
  // FLAG DI PRE-LANCIO: Imposta su 'false' DOPO aver creato la pool su Uniswap
  const IS_PRE_LAUNCH = true; 

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      if (IS_PRE_LAUNCH) {
        // Forza a 0 durante il pre-lancio per mostrare "AWAITING LP" ed evitare glitch delle API
        setPriceUsd(0);
        setVolume24h(0);
      } else {
        // 1. Fetch Market Data from GeckoTerminal (Base Network)
        const marketRes = await fetch(`https://api.geckoterminal.com/api/v2/networks/base/tokens/${CONTRACT_ADDRESS}`);
        const marketData = await marketRes.json();
        
        if (marketData.data && marketData.data.attributes) {
          const attrs = marketData.data.attributes;
          setPriceUsd(Number(attrs.price_usd || 0));
          setVolume24h(Number(attrs.volume_usd?.h24 || 0));
        } else {
          // Fallback to DexScreener if GeckoTerminal fails
          const dexRes = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${CONTRACT_ADDRESS}`);
          const dexData = await dexRes.json();
          if (dexData.pairs && dexData.pairs.length > 0) {
            const pair = dexData.pairs.find((p: any) => p.chainId === 'base') || dexData.pairs[0];
            setPriceUsd(Number(pair.priceUsd || 0));
            setVolume24h(Number(pair.volume?.h24 || 0));
          }
        }
      }

      // 2. Fetch User Balance from BaseScan
      const balRes = await fetch(`https://api.basescan.org/api?module=account&action=tokenbalance&contractaddress=${CONTRACT_ADDRESS}&address=${USER_ADDRESS}&tag=latest`);
      const balData = await balRes.json();
      if (balData.status === "1") {
        setUserBalance(Number(balData.result) / 1e18);
      }

      // 3. Fetch Transactions from BaseScan
      const txRes = await fetch(`https://api.basescan.org/api?module=account&action=tokentx&contractaddress=${CONTRACT_ADDRESS}&page=1&offset=10&sort=desc`);
      const txData = await txRes.json();
      if (txData.status === "1" && txData.result) {
        setTransactions(txData.result);
      }

      setLastUpdated(new Date());
    } catch (error) {
      console.error("Failed to fetch data", error);
    } finally {
      setLoading(false);
    }
  }, []);

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
      {/* TOP METRICS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* PRICE */}
        <div className="bg-[#1A1A1A] border border-[#333] p-4 rounded-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-zinc-500 uppercase tracking-widest">GBLIN Price</span>
            <DollarSign className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-[#E4E3E0]">
            {priceUsd > 0 ? formatCurrency(priceUsd) : <span className="text-amber-500/50 text-xl tracking-widest">AWAITING LP</span>}
          </div>
          <div className="text-xs text-zinc-500 mt-1">BASESCAN MARKET DATA</div>
        </div>
        
        {/* VOLUME */}
        <div className="bg-[#1A1A1A] border border-[#333] p-4 rounded-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-zinc-500 uppercase tracking-widest">24H Volume</span>
            <BarChart3 className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-[#E4E3E0]">
            {volume24h > 0 ? formatCurrency(volume24h) : <span className="text-amber-500/50 text-xl tracking-widest">AWAITING LP</span>}
          </div>
          <div className="text-xs text-zinc-500 mt-1">UNISWAP V3 POOL</div>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="bg-[#1A1A1A] border border-[#333] p-6 rounded-sm">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#333]">
          <h3 className="text-sm font-bold text-[#E4E3E0] uppercase flex items-center gap-3">
            <div className="relative w-6 h-6 rounded-full overflow-hidden">
              <Image 
                src="https://raw.githubusercontent.com/gblinproject/GBLIN/main/LOGO_GBLIN.png?v=3"
                alt="GBLIN"
                fill
                unoptimized
                className="object-cover scale-[1.02]"
                referrerPolicy="no-referrer"
              />
            </div>
            Live Network Telemetry
          </h3>
          <div className="flex items-center gap-4">
            <div className="text-xs text-zinc-500">
              LAST SYNC: {lastUpdated ? lastUpdated.toLocaleTimeString() : '--:--:--'}
            </div>
            <button 
              onClick={fetchData}
              disabled={loading}
              className="text-xs bg-[#333] hover:bg-[#444] text-[#E4E3E0] px-3 py-1 rounded-sm flex items-center gap-2 transition-colors"
            >
              <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
              SYNC
            </button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs text-zinc-500 uppercase bg-[#111]">
              <tr>
                <th className="px-4 py-2 font-normal">Time</th>
                <th className="px-4 py-2 font-normal">Tx Hash</th>
                <th className="px-4 py-2 font-normal">From</th>
                <th className="px-4 py-2 font-normal">To</th>
                <th className="px-4 py-2 font-normal text-right">Amount (GBLIN)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#333]">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-zinc-500">
                    {loading ? "Scanning blockchain..." : "No transactions found yet."}
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <tr key={tx.hash} className="hover:bg-[#222] transition-colors">
                    <td className="px-4 py-3 text-zinc-400 whitespace-nowrap">
                      {formatDistanceToNow(new Date(Number(tx.timeStamp) * 1000), { addSuffix: true })}
                    </td>
                    <td className="px-4 py-3">
                      <a href={`https://basescan.org/tx/${tx.hash}`} target="_blank" rel="noreferrer" className="text-amber-500 hover:underline font-mono text-xs">
                        {formatAddress(tx.hash)}
                      </a>
                    </td>
                    <td className="px-4 py-3 text-zinc-400 font-mono text-xs">
                      {tx.from.toLowerCase() === "0x0000000000000000000000000000000000000000" ? (
                        <span className="text-yellow-500">NullAddress (Mint)</span>
                      ) : tx.from.toLowerCase() === USER_ADDRESS.toLowerCase() ? (
                        <span className="text-blue-400">You</span>
                      ) : (
                        formatAddress(tx.from)
                      )}
                    </td>
                    <td className="px-4 py-3 text-zinc-400 font-mono text-xs">
                      {tx.to.toLowerCase() === USER_ADDRESS.toLowerCase() ? (
                        <span className="text-blue-400">You</span>
                      ) : (
                        formatAddress(tx.to)
                      )}
                    </td>
                    <td className="px-4 py-3 text-[#E4E3E0] text-right font-mono">
                      {formatValue(tx.value)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

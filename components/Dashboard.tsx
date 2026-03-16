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
  logIndex?: string;
}

export function Dashboard() {
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
    
    if (IS_PRE_LAUNCH) {
      setPriceUsd(0);
      setVolume24h(0);
    } else {
      // 1. Fetch Market Data (GeckoTerminal Pools endpoint for accurate volume)
      try {
        const marketRes = await fetch(`https://api.geckoterminal.com/api/v2/networks/base/tokens/${CONTRACT_ADDRESS}/pools`);
        if (!marketRes.ok) throw new Error("GeckoTerminal response not ok");
        const marketData = await marketRes.json();
        
        if (marketData.data && marketData.data.length > 0) {
          // Find the pool with the highest volume or just the first one (usually Aerodrome)
          const pool = marketData.data[0].attributes;
          setPriceUsd(Number(pool.base_token_price_usd || 0));
          setVolume24h(Number(pool.volume_usd?.h24 || 0));
        } else {
          throw new Error("No pools found for token");
        }
      } catch (geckoError) {
        console.warn("GeckoTerminal Pools failed, trying DexScreener...", geckoError);
        try {
          const dexRes = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${CONTRACT_ADDRESS}`);
          const dexData = await dexRes.json();
          if (dexData.pairs && dexData.pairs.length > 0) {
            const pair = dexData.pairs.find((p: any) => p.chainId === 'base') || dexData.pairs[0];
            setPriceUsd(Number(pair.priceUsd || 0));
            setVolume24h(Number(pair.volume?.h24 || 0));
          }
        } catch (dexError) {
          console.error("Market data fetch failed completely", dexError);
        }
      }
    }

    // 2. Fetch User Balance & Total Supply via Public RPC (Bulletproof)
    try {
      const rpcCall = async (data: string) => {
        const res = await fetch("https://mainnet.base.org", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jsonrpc: "2.0",
            method: "eth_call",
            params: [{ to: CONTRACT_ADDRESS, data }, "latest"],
            id: 1
          })
        });
        const json = await res.json();
        return json.result;
      };

      // Total Supply (0x18160ddd)
      const supplyHex = await rpcCall("0x18160ddd");
      if (supplyHex && supplyHex !== "0x") {
        setTotalSupply(Number(BigInt(supplyHex)) / 1e18);
      }

      // User Balance (0x70a08231 + padded address)
      const paddedAddress = USER_ADDRESS.toLowerCase().replace("0x", "").padStart(64, "0");
      const balanceHex = await rpcCall("0x70a08231" + paddedAddress);
      if (balanceHex && balanceHex !== "0x") {
        setUserBalance(Number(BigInt(balanceHex)) / 1e18);
      }
    } catch (error) {
      console.error("RPC fetch failed", error);
    }

    // 3. Fetch Contract NAV (quoteSellGBLIN) via Public RPC
    try {
      const rpcCall = async (data: string) => {
        const res = await fetch("https://mainnet.base.org", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jsonrpc: "2.0",
            method: "eth_call",
            params: [{ to: CONTRACT_ADDRESS, data }, "latest"],
            id: 1
          })
        });
        const json = await res.json();
        return json.result;
      };

      // Get ETH price first
      const wethRes = await fetch("https://api.geckoterminal.com/api/v2/networks/base/tokens/0x4200000000000000000000000000000000000006");
      const wethData = await wethRes.json();
      const ethPrice = Number(wethData?.data?.attributes?.price_usd || 0);

      // quoteSellGBLIN(1e18) signature is 0x2a0a45fd + 1e18 in hex
      const navData = "0x2a0a45fd0000000000000000000000000000000000000000000000000de0b6b3a7640000";
      const navEthHex = await rpcCall(navData);
      
      if (navEthHex && navEthHex !== "0x" && ethPrice > 0) {
        const navEth = Number(BigInt(navEthHex)) / 1e18;
        setContractNav(navEth * ethPrice);
      }
    } catch (error) {
      console.error("Failed to fetch Contract NAV", error);
    }

    // 4. Fetch Transactions via Blockscout API
    try {
      const res = await fetch(`https://base.blockscout.com/api?module=account&action=tokentx&contractaddress=${CONTRACT_ADDRESS}&page=1&offset=15&sort=desc`);
      const json = await res.json();
      
      if ((json.status === "1" || json.status === "0") && Array.isArray(json.result)) {
        const formattedTxs = json.result.map((tx: any) => ({
          hash: tx.hash,
          timeStamp: tx.timeStamp,
          from: tx.from,
          to: tx.to,
          value: tx.value,
          logIndex: tx.logIndex
        }));
        setTransactions(formattedTxs);
      } else {
        console.error("Blockscout API returned error:", json.message);
      }
    } catch (error) {
      console.error("Failed to fetch transactions via Blockscout", error);
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
      {/* TOP METRICS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* PRICE POOL */}
        <div className="bg-[#1A1A1A] border border-[#333] p-4 rounded-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-zinc-500 uppercase tracking-widest">GBLIN Price Pool</span>
            <DollarSign className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-[#E4E3E0]">
            {priceUsd > 0 ? formatCurrency(priceUsd) : <span className="text-amber-500/50 text-xl tracking-widest">AWAITING LP</span>}
          </div>
          <div className="text-xs text-zinc-500 mt-1">AERODROME MARKET DATA</div>
        </div>

        {/* CONTRACT NAV */}
        <div className="bg-[#1A1A1A] border border-[#333] p-4 rounded-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/10 rounded-bl-full -z-0"></div>
          <div className="flex items-center justify-between mb-2 relative z-10">
            <span className="text-xs text-emerald-500 uppercase tracking-widest font-bold">GBLIN Contract NAV</span>
            <ShieldAlert className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 relative z-10">
            {contractNav > 0 ? formatCurrency(contractNav) : <span className="text-zinc-500 text-xl tracking-widest">CALCULATING...</span>}
          </div>
          <div className="text-xs text-emerald-500/70 mt-1 relative z-10">REAL ASSET BACKING</div>
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
          <div className="text-xs text-zinc-500 mt-1">AERODROME POOL</div>
        </div>

        {/* TOTAL SUPPLY */}
        <div className="bg-[#1A1A1A] border border-[#333] p-4 rounded-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-zinc-500 uppercase tracking-widest">Total Supply</span>
            <Database className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-[#E4E3E0] font-mono">
            {totalSupply > 0 ? totalSupply.toFixed(4) : <span className="text-zinc-500 text-xl tracking-widest">SYNCING...</span>}
          </div>
          <div className="text-xs text-zinc-500 mt-1">GBLIN IN EXISTENCE</div>
        </div>
      </div>

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
                transactions.map((tx, idx) => (
                  <tr key={`${tx.hash}-${tx.logIndex || idx}`} className="hover:bg-[#222] transition-colors">
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

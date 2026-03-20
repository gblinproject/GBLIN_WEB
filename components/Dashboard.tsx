'use client';

import React, { useState, useEffect } from 'react';
import { useReadContract, useAccount, useWriteContract } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { Shield, Activity, Coins, ArrowRightLeft, Loader2 } from 'lucide-react';

const CONTRACT_ADDRESS = '0xc475851f9101A2AC48a84EcF869766A94D301FaA';

// Minimal ABI for the dashboard
const ABI = [
  {
    "inputs": [],
    "name": "totalSupply",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "stabilityFund",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "ethAmount", "type": "uint256" }],
    "name": "quoteBuyGBLIN",
    "outputs": [
      { "internalType": "uint256", "name": "gblinOut", "type": "uint256" },
      { "internalType": "uint256", "name": "founderFee", "type": "uint256" },
      { "internalType": "uint256", "name": "stabFee", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "minGblinOut", "type": "uint256" }],
    "name": "buyGBLIN",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  }
];

export default function Dashboard() {
  const { address, isConnected } = useAccount();
  const [buyAmount, setBuyAmount] = useState('0.01');
  
  const { data: totalSupply } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: ABI,
    functionName: 'totalSupply',
  });

  const { data: stabilityFund } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: ABI,
    functionName: 'stabilityFund',
  });

  const { data: quoteData } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: ABI,
    functionName: 'quoteBuyGBLIN',
    args: [buyAmount ? parseEther(buyAmount) : 0n],
  });

  const { writeContract, isPending } = useWriteContract();

  const handleBuy = () => {
    if (!buyAmount || !quoteData) return;
    
    // Apply 2% slippage tolerance
    const expectedOut = (quoteData as any[])[0];
    const minOut = expectedOut - (expectedOut * 2n / 100n);

    writeContract({
      address: CONTRACT_ADDRESS,
      abi: ABI,
      functionName: 'buyGBLIN',
      args: [minOut],
      value: parseEther(buyAmount),
    });
  };

  return (
    <div className="grid md:grid-cols-2 gap-8">
      {/* Telemetry */}
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-neutral-900/50 border border-neutral-800">
            <div className="flex items-center gap-2 text-neutral-400 mb-2">
              <Coins className="w-4 h-4" />
              <span className="text-sm">Total Supply</span>
            </div>
            <div className="text-2xl font-mono font-bold">
              {totalSupply ? parseFloat(formatEther(totalSupply as bigint)).toLocaleString(undefined, {maximumFractionDigits: 2}) : '---'}
            </div>
          </div>
          <div className="p-4 rounded-xl bg-neutral-900/50 border border-neutral-800">
            <div className="flex items-center gap-2 text-neutral-400 mb-2">
              <Shield className="w-4 h-4" />
              <span className="text-sm">Stability Fund</span>
            </div>
            <div className="text-2xl font-mono font-bold text-emerald-400">
              {stabilityFund ? parseFloat(formatEther(stabilityFund as bigint)).toLocaleString(undefined, {maximumFractionDigits: 4}) : '---'} ETH
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
          <div className="flex items-center gap-2 text-emerald-400 mb-2">
            <Activity className="w-4 h-4" />
            <span className="text-sm font-bold">System Status</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-sm text-neutral-300">Crash Shield: Active & Monitoring</span>
          </div>
        </div>
      </div>

      {/* Interaction */}
      <div className="p-6 rounded-xl bg-neutral-900/50 border border-neutral-800">
        <h4 className="font-bold mb-4 flex items-center gap-2">
          <ArrowRightLeft className="w-4 h-4" />
          Mint GBLIN
        </h4>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-neutral-400 mb-2">Pay with ETH</label>
            <div className="relative">
              <input 
                type="number" 
                value={buyAmount}
                onChange={(e) => setBuyAmount(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg py-3 px-4 text-white font-mono focus:outline-none focus:border-emerald-500 transition-colors"
                placeholder="0.0"
              />
              <span className="absolute right-4 top-3 text-neutral-500 font-bold">ETH</span>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-neutral-950 border border-neutral-800 text-sm">
            <div className="flex justify-between text-neutral-400 mb-1">
              <span>Expected Output:</span>
              <span className="font-mono text-white">
                {quoteData ? parseFloat(formatEther((quoteData as any[])[0])).toLocaleString(undefined, {maximumFractionDigits: 4}) : '0.00'} GBLIN
              </span>
            </div>
            <div className="flex justify-between text-neutral-500 text-xs">
              <span>Protocol Fee:</span>
              <span>0.1%</span>
            </div>
          </div>

          {!isConnected ? (
            <div className="p-4 rounded-lg bg-neutral-800/50 text-center text-sm text-neutral-400">
              Connect wallet to mint GBLIN
            </div>
          ) : (
            <button 
              onClick={handleBuy}
              disabled={isPending || !buyAmount || parseFloat(buyAmount) <= 0}
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 disabled:bg-neutral-800 disabled:text-neutral-500 text-white rounded-lg font-bold transition-all flex items-center justify-center gap-2"
            >
              {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : 'MINT GBLIN'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

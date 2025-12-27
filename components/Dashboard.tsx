import React, { useState, useEffect, useRef, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceArea, TooltipProps, AreaChart, Area } from 'recharts';
import { Cpu, Cloud, Zap, DollarSign, Clock, Globe, Activity, Lock, TrendingUp, CreditCard, ShieldCheck, CheckCircle2, AlertCircle, Loader2, X, Share2, Layers, ChevronRight } from 'lucide-react';

const MAX_LOCAL_MEMORY = 16;
const CRITICAL_THRESHOLD = 0.75;
const SAFE_TARGET_PERCENT = 0.55;

// Usage-based pricing constants (Optimized for 200-1500 INR/month target)
// We charge for: 1. Platform Base, 2. Reserved Capacity (cloudSize), 3. Actual Utilization (cloudUsage)
const BASE_FEE_HR = 0.0008;      // Base platform fee in USD/hr
const CAPACITY_FEE_HR = 0.00008; // Fee for reserved capacity (per GB/hr)
const USAGE_FEE_HR = 0.00025;    // Fee for actual data offloaded (per GB/hr)

const CLOUD_SIZE_OPTIONS = [8, 16, 32, 64, 128];

const CURRENCY_META = {
  USD: { symbol: '$', name: 'USD' },
  EUR: { symbol: '€', name: 'EUR' },
  GBP: { symbol: '£', name: 'GBP' },
  JPY: { symbol: '¥', name: 'JPY' },
  INR: { symbol: '₹', name: 'INR' },
};

type CurrencyCode = keyof typeof CURRENCY_META;

interface StrengthBarProps {
  percent: number;
  color: string;
  label: string;
}

const StrengthBar: React.FC<StrengthBarProps> = ({ percent, color, label }) => {
  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center px-1">
        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-doodle-muted">{label} Load</span>
        <span className="text-[10px] font-mono font-bold text-gray-900 dark:text-doodle-text">{Math.round(percent)}%</span>
      </div>
      <div className="h-3 w-full bg-gray-100 dark:bg-doodle-base rounded-full overflow-hidden border border-gray-200 dark:border-doodle-border p-[1px]">
        <div 
          className="h-full rounded-full transition-all duration-500 relative"
          style={{ 
            width: `${percent}%`, 
            backgroundColor: color,
            boxShadow: percent > 5 ? `0 0 20px ${color}66` : 'none'
          }}
        >
          <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
          <div 
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
            style={{
              animation: 'shimmer 1.5s infinite linear',
              backgroundSize: '200% 100%'
            }}
          />
        </div>
      </div>
    </div>
  );
};

const CustomTooltip: React.FC<TooltipProps<number, string>> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="p-4 border border-gray-200 dark:border-doodle-border rounded-2xl shadow-2xl bg-white/95 dark:bg-doodle-surface/95 backdrop-blur-xl ring-1 ring-black/5 dark:ring-white/5">
        <div className="flex items-center gap-2 mb-3 border-b border-gray-100 dark:border-doodle-border pb-2">
           <Clock className="w-3 h-3 text-doodle-blue" />
           <p className="text-xs font-mono font-bold text-gray-500 dark:text-doodle-muted">{label}</p>
        </div>
        {payload.map((entry, index) => (
          <div key={`tooltip-item-${index}`} className="flex items-center justify-between gap-6 text-sm mb-1.5">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full ring-2 ring-white dark:ring-doodle-base" style={{ backgroundColor: entry.color }} />
              <span className="text-xs font-medium text-gray-700 dark:text-doodle-text">{entry.name}</span>
            </div>
            <span className="font-mono font-bold text-gray-900 dark:text-white">{Number(entry.value).toFixed(2)} GB</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const Dashboard: React.FC = () => {
  const [data, setData] = useState<{ time: string; local: number; cloud: number }[]>([]);
  const [costHistory, setCostHistory] = useState<{ time: string; cost: number }[]>([]);
  const [localUsage, setLocalUsage] = useState(4); 
  const [cloudUsage, setCloudUsage] = useState(0);
  const [cloudSize, setCloudSize] = useState(32);
  const [isSimulationRunning, setIsSimulationRunning] = useState(false);
  const [cloudRamActive, setCloudRamActive] = useState(false);
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const [currency, setCurrency] = useState<CurrencyCode>('USD');
  const [totalCostAccumulated, setTotalCostAccumulated] = useState(0);
  const [accountBalance, setAccountBalance] = useState(1.25); // Mock initial balance
  const [simSpeed, setSimSpeed] = useState(1.0);
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>({
    USD: 1, EUR: 0.92, GBP: 0.79, JPY: 150.5, INR: 83.2,
  });
  const [isRatesLive, setIsRatesLive] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentStep, setPaymentStep] = useState<'form' | 'processing' | 'success'>('form');
  const [selectedGateway, setSelectedGateway] = useState<'razorpay' | 'payu' | null>(null);
  
  const intervalRef = useRef<number | null>(null);
  const currentUsageRef = useRef({ local: 4, cloud: 0, cost: 0, balance: 1.25 });

  useEffect(() => {
    currentUsageRef.current = { 
      local: localUsage, 
      cloud: cloudUsage, 
      cost: totalCostAccumulated,
      balance: accountBalance
    };
  }, [localUsage, cloudUsage, totalCostAccumulated, accountBalance]);

  // Dynamic Hourly Rate based on CURRENT utilization
  const getDynamicHourlyRate = (currentUtilization: number) => {
    return BASE_FEE_HR + (cloudSize * CAPACITY_FEE_HR) + (currentUtilization * USAGE_FEE_HR);
  };

  useEffect(() => {
    const fetchRates = async () => {
      try {
        const response = await fetch('https://open.er-api.com/v6/latest/USD');
        const result = await response.json();
        if (result && result.rates) {
          setExchangeRates(prev => ({
            ...prev,
            EUR: result.rates.EUR,
            GBP: result.rates.GBP,
            JPY: result.rates.JPY,
            INR: result.rates.INR,
          }));
          setIsRatesLive(true);
        }
      } catch (error) {
        setIsRatesLive(false);
      }
    };
    fetchRates();
  }, []);

  useEffect(() => {
    const initData = Array.from({ length: 20 }, (_, i) => ({
      time: `${i}s`,
      local: 4 + Math.random(),
      cloud: 0
    }));
    setData(initData);
    setCostHistory([{ time: '0s', cost: 0 }]);
  }, []);

  useEffect(() => {
    if (isSimulationRunning) {
      const intervalMs = 1000 / simSpeed;

      intervalRef.current = window.setInterval(() => {
        setSessionSeconds(prev => prev + 1);
        
        // Calculate increment based on current usage
        const currentRate = getDynamicHourlyRate(currentUsageRef.current.cloud);
        const sessionIncrement = currentRate / 3600;
        
        const nextTotalCost = currentUsageRef.current.cost + sessionIncrement;
        const nextBalance = currentUsageRef.current.balance + sessionIncrement;
        
        setTotalCostAccumulated(nextTotalCost);
        setAccountBalance(nextBalance);

        const { local: currentLocal, cloud: currentCloud } = currentUsageRef.current;
        
        if (currentLocal / MAX_LOCAL_MEMORY >= CRITICAL_THRESHOLD && !cloudRamActive) {
          setCloudRamActive(true);
        }

        let nextLocal = currentLocal;
        let nextCloud = currentCloud;

        if (cloudRamActive) {
          const targetGB = MAX_LOCAL_MEMORY * SAFE_TARGET_PERCENT;
          if (currentLocal > targetGB) {
            const drainAmount = 0.2 + (Math.random() * 0.1);
            nextLocal = currentLocal - drainAmount;
            nextCloud = Math.min(currentCloud + drainAmount, cloudSize);
          } else {
            const jitter = (Math.random() - 0.5) * 0.1;
            nextLocal = targetGB + jitter;
            nextCloud = Math.min(currentCloud + Math.max(0, (Math.random() * 0.3)), cloudSize);
          }
        } else {
          nextLocal = Math.min(currentLocal + (Math.random() * 0.6), MAX_LOCAL_MEMORY);
        }

        setLocalUsage(nextLocal);
        setCloudUsage(nextCloud);

        const timestamp = new Date().toLocaleTimeString().split(' ')[0];
        
        setData((prevData) => [...prevData.slice(1), {
          time: timestamp,
          local: nextLocal,
          cloud: nextCloud
        }]);

        setCostHistory((prevHistory) => {
          const newHistory = [...prevHistory, { time: timestamp, cost: nextTotalCost }];
          return newHistory.slice(-30);
        });

      }, intervalMs);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isSimulationRunning, cloudRamActive, cloudSize, simSpeed]);

  const resetSimulation = () => {
    setIsSimulationRunning(false);
    setLocalUsage(4);
    setCloudUsage(0);
    setSessionSeconds(0);
    setTotalCostAccumulated(0);
    setCloudRamActive(false);
    setData(Array.from({ length: 20 }, (_, i) => ({ time: `${i}s`, local: 4 + Math.random(), cloud: 0 })));
    setCostHistory([{ time: '0s', cost: 0 }]);
  };

  const formatCost = useCallback((usdAmount: number, digits: number = 2) => {
    const rate = exchangeRates[currency] || 1;
    const { name } = CURRENCY_META[currency];
    const converted = usdAmount * rate;
    return new Intl.NumberFormat('en-US', {
      style: 'currency', currency: name, minimumFractionDigits: digits, maximumFractionDigits: digits,
    }).format(converted);
  }, [currency, exchangeRates]);

  const handlePayment = (gateway: 'razorpay' | 'payu') => {
    setSelectedGateway(gateway);
    setPaymentStep('processing');
    
    // Simulate gateway redirection delay
    setTimeout(() => {
      setPaymentStep('success');
      setAccountBalance(0);
      setTimeout(() => {
        setIsPaymentModalOpen(false);
        setPaymentStep('form');
        setSelectedGateway(null);
      }, 2500);
    }, 3000);
  };

  const localPercent = (localUsage / MAX_LOCAL_MEMORY) * 100;
  const cloudPercent = (cloudUsage / cloudSize) * 100;
  const isCritical = localPercent >= (CRITICAL_THRESHOLD * 100);

  const COLOR_BLUE = '#4285F4';
  const COLOR_PURPLE = '#9C27B0';

  return (
    <div className="space-y-6 relative">
      {/* Top Row Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Physical RAM Card */}
        <div className={`p-8 rounded-[2rem] border transition-all duration-700 bg-white dark:bg-doodle-surface relative overflow-hidden group ${isCritical ? 'border-red-500/50 shadow-[0_0_40px_rgba(239,68,68,0.2)] ring-2 ring-red-500/20' : 'border-gray-200 dark:border-doodle-border hover:border-doodle-blue/30 shadow-xl'}`}>
          <div className="absolute top-0 right-0 w-32 h-32 bg-doodle-blue/5 rounded-full -mr-16 -mt-16 blur-3xl pointer-events-none group-hover:bg-doodle-blue/10 transition-colors"></div>
          
          <div className="flex items-center justify-between mb-6 relative z-10">
            <div className={`p-4 rounded-[1.25rem] border shadow-inner transition-colors ${isCritical ? 'bg-red-500/10 border-red-500/20' : 'bg-gray-50 dark:bg-doodle-base border-gray-100 dark:border-doodle-border'}`}>
              <Cpu className={`w-6 h-6 ${isCritical ? 'text-red-500 animate-pulse' : 'text-doodle-blue'}`} />
            </div>
            <div className="text-right">
              <h3 className="text-gray-500 dark:text-doodle-muted font-black text-[10px] uppercase tracking-[0.2em]">Hardware Layer</h3>
              <p className="text-xs font-bold dark:text-doodle-text opacity-70">Physical RAM</p>
            </div>
          </div>
          
          <div className="flex items-baseline gap-3 mb-6 relative z-10">
             <span className={`text-5xl font-mono font-black tracking-tighter transition-colors ${isCritical ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>
               {localUsage.toFixed(2)}
             </span>
             <span className="text-sm font-bold text-gray-400 dark:text-doodle-muted">GB LOCAL</span>
          </div>
          
          <StrengthBar label="Local Pressure" percent={localPercent} color={isCritical ? '#EF4444' : COLOR_BLUE} />
          
          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-doodle-border flex justify-between items-center relative z-10">
            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Total Capacity</span>
            <span className="text-[10px] font-mono font-bold text-gray-700 dark:text-doodle-text">{MAX_LOCAL_MEMORY} GB DDR4</span>
          </div>
        </div>

        {/* Cloud RAM Card */}
        <div className={`p-8 rounded-[2rem] border transition-all duration-700 bg-white dark:bg-doodle-surface relative overflow-hidden group ${cloudUsage > 0 ? 'border-doodle-purple/50 shadow-[0_0_40px_rgba(156,39,176,0.2)] ring-2 ring-doodle-purple/20' : 'border-gray-200 dark:border-doodle-border hover:border-doodle-purple/30 shadow-xl'}`}>
          <div className="absolute top-0 left-0 w-32 h-32 bg-doodle-purple/5 rounded-full -ml-16 -mt-16 blur-3xl pointer-events-none group-hover:bg-doodle-purple/10 transition-colors"></div>
          
          <div className="flex items-center justify-between mb-6 relative z-10">
            <div className={`p-4 rounded-[1.25rem] border shadow-inner transition-colors ${cloudUsage > 0 ? 'bg-doodle-purple/10 border-doodle-purple/20' : 'bg-gray-50 dark:bg-doodle-base border-gray-100 dark:border-doodle-border'}`}>
              <Cloud className={`w-6 h-6 ${cloudUsage > 0 ? 'text-doodle-purple' : 'text-gray-400 dark:text-doodle-muted'}`} />
            </div>
            <div className="text-right">
              <h3 className="text-gray-500 dark:text-doodle-muted font-black text-[10px] uppercase tracking-[0.2em]">Offload Layer</h3>
              <p className="text-xs font-bold dark:text-doodle-text opacity-70">Cloud RAM</p>
            </div>
          </div>

          <div className="flex items-baseline gap-3 mb-6 relative z-10">
             <span className={`text-5xl font-mono font-black tracking-tighter transition-colors ${cloudUsage > 0 ? 'text-doodle-purple dark:text-purple-400' : 'text-gray-900 dark:text-white'}`}>
               {cloudUsage.toFixed(2)}
             </span>
             <span className="text-sm font-bold text-gray-400 dark:text-doodle-muted">GB CLOUD</span>
          </div>
          
          <div className="mb-6 relative z-10">
            <div className="grid grid-cols-5 gap-1.5 p-1.5 bg-gray-100/50 dark:bg-doodle-base/50 rounded-2xl border border-gray-200 dark:border-doodle-border backdrop-blur-sm">
              {CLOUD_SIZE_OPTIONS.map(size => (
                <button
                  key={size}
                  disabled={isSimulationRunning}
                  onClick={() => setCloudSize(size)}
                  className={`py-2 rounded-xl text-[10px] font-black transition-all ${
                    cloudSize === size 
                      ? 'bg-doodle-purple text-white shadow-lg shadow-purple-500/20 scale-105 z-10' 
                      : 'text-gray-500 dark:text-doodle-muted hover:text-gray-900 dark:hover:text-white disabled:opacity-50'
                  }`}
                >
                  {size}G
                </button>
              ))}
            </div>
          </div>

          <StrengthBar label="Cloud Utilization" percent={cloudPercent} color={COLOR_PURPLE} />

          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-doodle-border flex justify-between items-center relative z-10">
             <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Active Tier</span>
             <div className="flex items-center gap-1.5">
                <Layers className="w-3 h-3 text-doodle-purple" />
                <span className="text-[10px] font-mono font-bold text-gray-700 dark:text-doodle-text">{cloudSize} GB Reserved</span>
             </div>
          </div>
        </div>

        {/* Controls Card */}
        <div className={`p-8 rounded-[2rem] border border-gray-200 dark:border-doodle-border bg-white dark:bg-doodle-surface flex flex-col justify-between shadow-xl relative overflow-hidden`}>
           <div className="absolute bottom-0 right-0 w-32 h-32 bg-gray-500/5 rounded-full -mr-16 -mb-16 blur-3xl pointer-events-none"></div>
           
           <div className="relative z-10">
             <div className="flex items-center justify-between mb-8">
                <div className="bg-gray-50 dark:bg-doodle-base p-4 rounded-2xl border border-gray-100 dark:border-doodle-border shadow-inner">
                  <Zap className={`w-6 h-6 transition-colors ${isSimulationRunning ? 'text-doodle-blue dark:text-white' : 'text-gray-400 dark:text-doodle-muted'}`} />
                </div>
                <div className={`px-4 py-1.5 rounded-full text-[10px] font-black tracking-[0.1em] uppercase border shadow-sm ${isSimulationRunning ? 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20' : 'bg-gray-100 dark:bg-doodle-base text-gray-500 dark:text-doodle-muted border-gray-200 dark:border-doodle-border'}`}>
                  {isSimulationRunning ? 'Simulation Live' : 'System IDLE'}
                </div>
             </div>
             
             <div className="space-y-4 mb-8">
               <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-doodle-muted">
                 <span>Execution Velocity</span>
                 <span className="text-doodle-blue font-mono bg-doodle-blue/10 px-2 py-0.5 rounded">{simSpeed.toFixed(1)}x</span>
               </div>
               <input 
                 type="range" min="0.1" max="3.0" step="0.1" value={simSpeed}
                 onChange={(e) => setSimSpeed(parseFloat(e.target.value))}
                 className="w-full h-1.5 bg-gray-200 dark:bg-doodle-base rounded-full appearance-none cursor-pointer accent-doodle-blue"
               />
             </div>
           </div>
           
           <div className="flex gap-3 relative z-10">
             <button 
                onClick={() => setIsSimulationRunning(!isSimulationRunning)} 
                className={`flex-1 py-4 px-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-xl active:scale-95 flex justify-center items-center gap-2 ${
                  isSimulationRunning 
                    ? 'bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/20' 
                    : 'bg-doodle-blue text-white hover:bg-blue-600 hover:shadow-blue-500/40'
                }`}
              >
               {isSimulationRunning ? 'Halt Process' : 'Initialize'}
             </button>
             <button 
                onClick={resetSimulation} 
                className="py-4 px-6 rounded-2xl text-xs font-black uppercase tracking-widest bg-gray-50 dark:bg-doodle-base text-gray-500 dark:text-doodle-muted hover:text-gray-900 dark:hover:text-white border border-gray-200 dark:border-doodle-border hover:shadow-md transition-all"
             >
               Reset
             </button>
           </div>
        </div>
      </div>

      {/* Charts & Billing Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Line Chart */}
        <div className={`lg:col-span-2 p-8 rounded-[2rem] border border-gray-200 dark:border-doodle-border bg-white dark:bg-doodle-surface h-[520px] flex flex-col relative overflow-hidden shadow-2xl`}>
          <div className="flex justify-between items-center mb-8 shrink-0 relative z-10">
             <div className="flex items-center gap-3">
               <div className="p-2.5 bg-doodle-blue/10 rounded-2xl border border-doodle-blue/20">
                 <Activity className="w-5 h-5 text-doodle-blue" />
               </div>
               <div>
                  <h3 className="text-lg font-black text-gray-900 dark:text-white tracking-tight">Memory Stream</h3>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Real-time Telemetry</p>
               </div>
             </div>
             
             <label className="flex items-center gap-3 cursor-pointer group p-2.5 rounded-2xl hover:bg-gray-50 dark:hover:bg-doodle-base transition-all border border-transparent hover:border-gray-200 dark:hover:border-doodle-border">
                <div className="flex flex-col items-end">
                  <span className="text-[10px] font-black text-gray-700 dark:text-doodle-text uppercase">Auto-Scaling</span>
                  <span className="text-[9px] text-doodle-blue font-mono font-bold tracking-tighter">THRESHOLD: 75%</span>
                </div>
                <div className="relative w-11 h-6 bg-gray-200 dark:bg-doodle-base rounded-full border border-gray-300 dark:border-doodle-border transition-colors">
                  <input type="checkbox" className="sr-only peer" checked={cloudRamActive} onChange={() => setCloudRamActive(!cloudRamActive)} />
                  <div className="absolute top-0.5 left-0.5 bg-gray-400 dark:bg-doodle-muted w-4.5 h-4.5 rounded-full transition-all peer-checked:translate-x-5 peer-checked:bg-doodle-blue"></div>
                </div>
              </label>
          </div>

          <div className="flex-1 w-full relative z-10 min-h-0">
             <div className="absolute inset-0">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} strokeOpacity={0.4} />
                    <XAxis dataKey="time" stroke="#94A3B8" fontSize={10} tickLine={false} axisLine={false} dy={10} />
                    <YAxis stroke="#94A3B8" fontSize={10} tickLine={false} axisLine={false} dx={-10} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line type="monotone" dataKey="local" stroke={COLOR_BLUE} strokeWidth={4} dot={false} isAnimationActive={false} activeDot={{ r: 6, strokeWidth: 0 }} />
                    <Line type="monotone" dataKey="cloud" stroke={COLOR_PURPLE} strokeWidth={4} dot={false} isAnimationActive={false} activeDot={{ r: 6, strokeWidth: 0 }} />
                    {cloudRamActive && (
                      <ReferenceArea y1={MAX_LOCAL_MEMORY * CRITICAL_THRESHOLD} y2={MAX_LOCAL_MEMORY * CRITICAL_THRESHOLD} stroke="#EF4444" strokeDasharray="5 5" opacity={0.3} />
                    )}
                  </LineChart>
                </ResponsiveContainer>
             </div>
          </div>
        </div>

        {/* Improved Billing Card */}
        <div className={`p-8 rounded-[2rem] border border-gray-200 dark:border-doodle-border bg-white dark:bg-doodle-surface flex flex-col relative overflow-hidden h-[520px] shadow-2xl`}>
          <div className="absolute top-0 right-0 w-64 h-64 bg-doodle-glow blur-3xl pointer-events-none opacity-40 dark:opacity-100"></div>

          <div className="flex items-center justify-between mb-8 relative z-10">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-doodle-purple/10 rounded-2xl border border-doodle-purple/20">
                <DollarSign className="w-5 h-5 text-doodle-purple" />
              </div>
              <div>
                <h3 className="text-lg font-black text-gray-900 dark:text-white tracking-tight">Financials</h3>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Usage Billing</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 bg-gray-50 dark:bg-doodle-base border border-gray-200 dark:border-doodle-border rounded-2xl px-3 py-1.5 shadow-sm">
               <Globe className="w-3.5 h-3.5 text-gray-400 dark:text-doodle-muted" />
               <select value={currency} onChange={(e) => setCurrency(e.target.value as CurrencyCode)} className="bg-transparent text-[10px] font-black text-gray-700 dark:text-white outline-none cursor-pointer uppercase tracking-tighter">
                 {Object.keys(CURRENCY_META).map(code => <option key={code} value={code} className="bg-white dark:bg-doodle-base">{code}</option>)}
               </select>
            </div>
          </div>

          <div className="flex-1 flex flex-col justify-between relative z-10 overflow-hidden">
            <div className="mb-4">
              <div className="flex justify-between items-end mb-2">
                <span className="text-[10px] font-black text-gray-400 dark:text-doodle-muted uppercase tracking-[0.2em] block">Session Cost</span>
                <span className="text-[9px] text-green-500 font-black bg-green-500/10 px-2 py-0.5 rounded uppercase tracking-widest border border-green-500/20">Usage-Based</span>
              </div>
              <div className="text-4xl font-mono font-black text-transparent bg-clip-text bg-gradient-to-r from-doodle-blue to-doodle-purple mb-1 tracking-tighter">
                {formatCost(totalCostAccumulated, 4)}
              </div>
            </div>
            
            <div className="h-24 w-full mb-6 bg-gray-100/30 dark:bg-doodle-base/30 rounded-2xl border border-gray-200 dark:border-doodle-border overflow-hidden shrink-0 shadow-inner relative">
                <div className="absolute inset-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={costHistory}>
                        <defs>
                          <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={COLOR_PURPLE} stopOpacity={0.3}/>
                            <stop offset="95%" stopColor={COLOR_PURPLE} stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <Area type="monotone" dataKey="cost" stroke={COLOR_PURPLE} fillOpacity={1} fill="url(#colorCost)" strokeWidth={3} isAnimationActive={false} />
                      </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Account Balance Box */}
            <div className="p-5 rounded-[1.75rem] bg-gray-50 dark:bg-doodle-base border border-gray-200 dark:border-doodle-border space-y-4 mb-4 shadow-sm group hover:border-doodle-blue/30 transition-colors">
                 <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-500 dark:text-doodle-muted flex items-center gap-2 font-bold uppercase tracking-widest text-[10px]">
                      <CreditCard className="w-3.5 h-3.5 text-doodle-blue" /> 
                      Outstanding Balance
                    </span>
                    <span className="font-mono font-black text-gray-900 dark:text-white text-lg">
                      {formatCost(accountBalance, 2)}
                    </span>
                 </div>
                 <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest pt-2 border-t border-gray-200 dark:border-doodle-border">
                    <span className="text-gray-400 dark:text-doodle-muted">Cyclic auto-pay active</span>
                    <button 
                      onClick={() => setIsPaymentModalOpen(true)}
                      className="text-doodle-blue hover:text-blue-500 transition-colors flex items-center gap-1"
                    >
                      Pay Now <Share2 className="w-2.5 h-2.5 rotate-90" />
                    </button>
                 </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest">
                <span className="text-gray-500 dark:text-doodle-muted">Active Burn Rate</span>
                <span className="text-doodle-blue bg-doodle-blue/10 px-2 py-0.5 rounded border border-doodle-blue/20">{formatCost(getDynamicHourlyRate(cloudUsage), 3)}/hr</span>
              </div>
              <div className="flex justify-between items-center pt-3 border-t border-gray-200 dark:border-doodle-border">
                <span className="text-[10px] text-gray-400 dark:text-doodle-muted font-black uppercase tracking-[0.2em]">Estimated monthly</span>
                <span className="font-mono font-black text-gray-900 dark:text-white text-xl tracking-tighter">
                  {formatCost(getDynamicHourlyRate(cloudUsage) * 24 * 30.5, 0)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Gateway Modal */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
          <div 
            className="absolute inset-0 bg-white/20 dark:bg-black/70 backdrop-blur-md"
            onClick={() => setIsPaymentModalOpen(false)}
          ></div>
          <div className="relative w-full max-w-lg bg-white dark:bg-doodle-surface border border-gray-200 dark:border-doodle-border rounded-[3rem] p-12 shadow-[0_0_120px_rgba(0,0,0,0.6)] animate-in zoom-in-95 duration-300">
            <button 
              onClick={() => setIsPaymentModalOpen(false)}
              className="absolute top-8 right-8 p-3 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all bg-gray-100 dark:bg-doodle-base rounded-2xl border border-transparent hover:border-gray-200 dark:hover:border-doodle-border"
            >
              <X className="w-6 h-6" />
            </button>

            {paymentStep === 'form' && (
              <div className="space-y-10">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-24 h-24 rounded-[2.25rem] bg-doodle-blue/10 border border-doodle-blue/20 mb-8 shadow-inner">
                    <ShieldCheck className="w-12 h-12 text-doodle-blue" />
                  </div>
                  <h2 className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter">Secure Payment</h2>
                  <p className="text-gray-500 dark:text-doodle-muted mt-2 font-medium">Settle your RAM Vista account balance.</p>
                </div>

                <div className="bg-gray-50 dark:bg-doodle-base border border-gray-200 dark:border-doodle-border rounded-[2rem] p-8 flex justify-between items-center shadow-inner">
                  <div>
                    <span className="text-[10px] font-black text-gray-400 dark:text-doodle-muted uppercase tracking-[0.2em] block mb-1">Outstanding</span>
                    <span className="text-3xl font-mono font-black text-gray-900 dark:text-white">{formatCost(accountBalance)}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-black text-gray-400 dark:text-doodle-muted uppercase tracking-[0.2em] block mb-1">Status</span>
                    <span className="text-sm font-black text-doodle-purple bg-doodle-purple/10 px-3 py-1 rounded-full border border-doodle-purple/20">PENDING</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <p className="text-xs font-bold text-gray-500 dark:text-doodle-muted uppercase tracking-widest mb-2">Select Payment Method</p>
                  
                  <button
                    onClick={() => handlePayment('razorpay')}
                    className="w-full bg-white dark:bg-[#0f172a] hover:bg-blue-50 dark:hover:bg-[#1e293b] border-2 border-gray-200 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 p-4 rounded-2xl transition-all group flex items-center justify-between"
                  >
                      <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-[#3395FF] flex items-center justify-center shrink-0">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-6 h-6 text-white"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                          </div>
                          <div className="text-left">
                              <div className="text-gray-900 dark:text-white font-black text-sm uppercase tracking-wide">Razorpay</div>
                              <div className="text-gray-400 dark:text-slate-400 text-[10px] font-bold">UPI, Cards, Netbanking</div>
                          </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-blue-500 transition-colors" />
                  </button>

                  <button
                    onClick={() => handlePayment('payu')}
                    className="w-full bg-white dark:bg-[#0f172a] hover:bg-green-50 dark:hover:bg-[#1e293b] border-2 border-gray-200 dark:border-slate-800 hover:border-green-500 dark:hover:border-green-500 p-4 rounded-2xl transition-all group flex items-center justify-between"
                  >
                      <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-[#A5C612] flex items-center justify-center shrink-0">
                               <span className="font-black text-white text-lg italic">P</span>
                          </div>
                          <div className="text-left">
                              <div className="text-gray-900 dark:text-white font-black text-sm uppercase tracking-wide">PayU Money</div>
                              <div className="text-gray-400 dark:text-slate-400 text-[10px] font-bold">Wallets, Checkout</div>
                          </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-green-500 transition-colors" />
                  </button>
                </div>

                <div className="flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-[0.15em] text-gray-400 dark:text-doodle-muted">
                  <div className="h-px w-8 bg-gray-200 dark:bg-doodle-border"></div>
                  <span>PCI-DSS Encrypted Gateway</span>
                  <div className="h-px w-8 bg-gray-200 dark:bg-doodle-border"></div>
                </div>
              </div>
            )}

            {paymentStep === 'processing' && (
              <div className="py-24 flex flex-col items-center justify-center text-center space-y-10 animate-in fade-in zoom-in duration-500">
                <div className="relative">
                   <div className="absolute inset-0 bg-doodle-blue/20 rounded-full blur-[60px] animate-pulse scale-150"></div>
                   <div className="relative z-10 w-28 h-28 border-4 border-doodle-blue/20 border-t-doodle-blue rounded-full animate-spin flex items-center justify-center">
                      <Loader2 className="w-12 h-12 text-doodle-blue animate-pulse" />
                   </div>
                </div>
                <div className="space-y-3">
                  <h3 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Processing Request</h3>
                  <p className="text-gray-500 dark:text-doodle-muted font-medium">
                    Redirecting to {selectedGateway === 'razorpay' ? 'Razorpay' : 'PayU'} Secure Gateway...
                  </p>
                </div>
              </div>
            )}

            {paymentStep === 'success' && (
              <div className="py-24 flex flex-col items-center justify-center text-center space-y-10 animate-in bounce-in duration-600">
                <div className="relative">
                   <div className="absolute inset-0 bg-green-500/20 rounded-full blur-[60px] scale-150"></div>
                   <div className="w-28 h-28 rounded-[2.5rem] bg-green-500 flex items-center justify-center shadow-2xl shadow-green-500/40 relative z-10 rotate-6 hover:rotate-0 transition-transform">
                     <CheckCircle2 className="w-14 h-14 text-white" />
                   </div>
                </div>
                <div className="space-y-3">
                  <h3 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Invoice Cleared</h3>
                  <p className="text-gray-500 dark:text-doodle-muted font-medium px-8">Account balance reset. Your usage limits have been extended.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
"use client"

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ChevronLeft,
  User,
  Clock,
  ChevronDown,
  Loader2,
  History,
  Users,
  Crown,
  ArrowRightLeft,
  BarChart,
  ChevronUp
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useInView } from 'react-intersection-observer'
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FollowOrderSheet } from '@/app/components/FollowOrderSheet';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { useSwipeable } from 'react-swipeable';
import { supabase } from '@/lib/supabase'
import { getTraderAvatar } from '@/lib/trader-avatars'


const PAGE_SIZE = 5;

const RANK_BADGES: {[key: number]: { color: string }} = {
  1: { color: "text-yellow-400" }, // Gold
  2: { color: "text-slate-400" }, // Silver
  3: { color: "text-amber-600" },   // Bronze
}


function InfoPill({ label, value, action }: { label: string; value: string | number | null | undefined, action?: React.ReactNode }) {
  return (
  <div className="flex items-center justify-between text-sm py-2">
    <span className="text-muted-foreground">{label}</span>
    <div className="flex items-center gap-2">
    <span className="font-medium text-foreground">{value || '--'}</span>
    {action}
    </div>
  </div>
  )
}

function MetricItem({ label, value, valueClassName }: { label: string; value: string | number, valueClassName?: string }) {
  return (
    <div className="flex flex-col items-center justify-center space-y-1">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className={`text-xl font-bold ${valueClassName}`}>{value}</p>
    </div>
  )
}

function SignalCard({ signal }: { signal: any }) {
  return (
    <Card className="bg-card/80 border-border/50">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div className="flex flex-col gap-2 items-start">
             <div className="flex items-center gap-2">
              <div className="font-mono text-base text-primary active-signal" style={{ transformOrigin: 'left' }}>{signal.pair}</div>
              <div className="signal-light pulsing-light" />
            </div>
             <div className="flex items-center gap-2">
              <Badge variant="secondary">{signal.orderType}</Badge>
              <Badge variant="secondary">{signal.type}</Badge>
              <Badge variant="secondary">{signal.marginMode}</Badge>
            </div>
          </div>
          <span className={`text-lg font-bold ${signal.directionColor}`}>{signal.direction}</span>
        </div>
        <div className="space-y-2 border-t border-border/50 pt-3">
          <InfoPill label="入场点位" value={signal.entryPrice} />
          <InfoPill label="止盈点位 1" value={signal.takeProfit1} />
          <InfoPill label="止盈点位 2" value={signal.takeProfit2} />
          <InfoPill label="止损点位" value={signal.stopLoss} />
          <InfoPill label="建议盈亏比" value={signal.pnlRatio} />
        </div>
        <div className="flex justify-between items-center mt-3 pt-3 border-t border-border/50">
          <div className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Clock className="w-3 h-3" />
            {signal.createdAt}
          </div>
          <Button size="sm" className="h-8 px-3 rounded-full bg-primary/20 text-primary hover:bg-primary/30">手动跟单</Button>
        </div>
      </CardContent>
    </Card>
  );
}

function HistoricalSignalCard({ signal }: { signal: any }) {
  return (
    <Card className="bg-card/80 border-border/50">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div className="flex flex-col gap-2 items-start">
             <div className="font-mono text-base text-muted-foreground">{signal.pair}</div>
             <div className="flex items-center gap-2">
              <Badge variant="secondary">{signal.orderType}</Badge>
              <Badge variant="secondary">{signal.type}</Badge>
              <Badge variant="secondary">{signal.marginMode}</Badge>
            </div>
          </div>
          <span className={`text-lg font-bold ${signal.directionColor}`}>{signal.direction}</span>
        </div>
        <div className="space-y-2 border-t border-border/50 pt-3">
          <InfoPill label="入场点位" value={signal.entryPrice} />
          <InfoPill label="止盈点位 1" value={signal.takeProfit1} />
          <InfoPill label="止盈点位 2" value={signal.takeProfit2} />
          <InfoPill label="止损点位" value={signal.stopLoss} />
          <InfoPill label="平仓盈亏比" value={signal.pnlRatio} />
        </div>
         <div className="mt-1 pt-3 border-t border-border/50">
          <InfoPill 
            label="开/平仓时间" 
            value={`${signal.createdAt.split(' ')[1]} -> ${signal.endedAt.split(' ')[1]}`} 
            action={<span className="text-sm font-medium text-muted-foreground">{signal.status}</span>}
          />
         </div>
      </CardContent>
    </Card>
  );
}

function FollowerCard({ follower }: { follower: any }) {
  return (
    <Card className="bg-card/80 border-border/50">
      <CardContent className="p-4 flex items-center gap-4">
        <Avatar className="h-12 w-12 bg-muted text-muted-foreground">
          <AvatarFallback>
            <User className="w-6 h-6" />
          </AvatarFallback>
        </Avatar>
        <div className="flex-grow grid grid-cols-3 items-center text-sm">
          <div className="flex flex-col">
            <span className="font-semibold text-foreground">{follower.name}</span>
          </div>
          <div className="flex flex-col text-center">
            <span className="text-muted-foreground text-xs">跟单收益</span>
            <span className="font-semibold text-green-400 mt-1">${follower.profit}</span>
          </div>
           <div className="flex flex-col text-center">
            <span className="text-muted-foreground text-xs">跟单时长</span>
            <span className="font-semibold text-foreground mt-1">{follower.duration}天</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function FilterDropdown({ label, options, onSelect, setLabel }: { label: string; options: string[]; onSelect: (option: string) => void; setLabel?: (label: string) => void; }) {
  return (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
    <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground text-sm p-0 h-auto">
      {label}
      <ChevronDown className="w-4 h-4 ml-1" />
    </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
    {options.map((option) => (
      <DropdownMenuItem key={option} onSelect={() => {
      onSelect(option);
      if (setLabel) setLabel(option);
      }}>
      {option}
      </DropdownMenuItem>
    ))}
    </DropdownMenuContent>
  </DropdownMenu>
  );
}

const TABS = [
  { value: "current", label: "当前信号", icon: User },
  { value: "historical", label: "历史信号", icon: History },
  { value: "followers", label: "跟单用户", icon: Users }
];

export default function TraderDetailPage() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const traderId = String(params.id || '')
  const rank = null;

  type UITrader = { id: string; name: string; description: string | null; yield: number; winRate: number; pnlRatio: number | null; totalOrders: number; avatar: string; tags: string[] | null; followers?: number | null; days?: number | null }
  const [trader, setTrader] = useState<UITrader | null>(null)
  const [loadingTrader, setLoadingTrader] = useState(true)
  const [traderOptions, setTraderOptions] = useState<Array<{ id: string; name: string; avatar: string }>>([])
  const [sheetTraders, setSheetTraders] = useState<Array<{ id: number; name: string }>>([])
  const [defaultSheetTraderId, setDefaultSheetTraderId] = useState<number | null>(null)
  const badge = rank && rank > 0 && rank <= 3 ? RANK_BADGES[rank] : null;

  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(TABS[0].value);
  const [isMetricsOpen, setIsMetricsOpen] = useState(true);

  const [allSignals, setAllSignals] = useState<any[]>([]);
  const [allHistoricalSignals, setAllHistoricalSignals] = useState<any[]>([]);
  const [allFollowers, setAllFollowers] = useState<any[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  // load trader detail
  useEffect(() => {
  if (!traderId) return
  const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  if (!uuidRe.test(traderId)) {
    setTrader(null)
    setLoadingTrader(false)
    return
  }
  ;(async () => {
    setLoadingTrader(true)
    try {
    const { data, error } = await supabase
      .from('traders')
      .select('*')
      .eq('id', traderId)
      .maybeSingle()
    if (error) throw error
    if (data) {
      const t: UITrader = {
      id: data.id,
      name: data.name,
      description: data.description || null,
      yield: data?.yield_rate != null ? Number(data.yield_rate) : 0,
      winRate: data?.win_rate != null ? Number(data.win_rate) : 0,
      pnlRatio: data?.profit_loss_ratio != null ? Number(data.profit_loss_ratio) : null,
      totalOrders: data?.total_signals != null ? Number(data.total_signals) : 0,
      avatar: data?.avatar_url || getTraderAvatar(data.name),
      tags: Array.isArray(data?.tags) ? data.tags : [],
      followers: null,
      days: null,
      }
      setTrader(t)
    } else {
      setTrader(null)
    }
    } catch (e) {
    console.debug('[trader detail] load error', e)
    setTrader(null)
    } finally {
    setLoadingTrader(false)
    }
  })()
  }, [traderId])

  // load options and sheet traders
  useEffect(() => {
  ;(async () => {
    try {
    const { data, error } = await supabase.rpc('get_traders_paged', {
      page: 1,
      page_size: 50,
      q: null,
      sort_by: 'score',
      order_by: 'desc',
    })
    if (error) throw error
  const opts: Array<{ id: string; name: string; avatar: string }> = (data || []).map((r: any) => ({ id: r.id as string, name: r.name as string, avatar: (r.avatar_url as string) || getTraderAvatar(r.name) }))
    setTraderOptions(opts)
  setSheetTraders(opts.map((o: { id: string; name: string }, i: number) => ({ id: i + 1, name: o.name })))
  const idx = opts.findIndex((o: { id: string }) => o.id === traderId)
    setDefaultSheetTraderId(idx >= 0 ? idx + 1 : null)
    } catch (e) {
    console.debug('[trader options] load error', e)
    setTraderOptions([])
    setSheetTraders([])
    setDefaultSheetTraderId(null)
    }
  })()
  }, [traderId])

  useEffect(() => {
  // Generate mock data for signals & followers
  const generatedSignals = Array.from({ length: 25 }, (_, i) => {
    const isLong = Math.random() > 0.5;
    const pair = ['BTC', 'ETH', 'SOL', 'DOGE'][Math.floor(Math.random() * 4)];
    const entryPrice = Math.random() * 50000 + 20000;
    const useRange = Math.random() > 0.7;
    return {
      id: i + 1,
      pair: `${pair}-USDT-SWAP`,
      direction: isLong ? '做多' : '做空',
      directionColor: isLong ? 'text-green-400' : 'text-red-400',
      entryPrice: useRange ? `${(entryPrice * 0.99).toFixed(2)}-${(entryPrice * 1.01).toFixed(2)}` : entryPrice.toFixed(2),
      takeProfit1: i % 4 === 0 ? null : (entryPrice * (isLong ? 1.02 : 0.98)).toFixed(2),
      takeProfit2: i % 5 === 0 ? null : (entryPrice * (isLong ? 1.04 : 0.96)).toFixed(2),
      stopLoss: (entryPrice * (isLong ? 0.99 : 1.01)).toFixed(2),
      pnlRatio: `${(Math.random() * 5 + 1).toFixed(1)}:1`,
      createdAt: `2024-05-2${8-i} 14:0${i % 10}:00`,
      orderType: '限价单',
      type: '永续合约',
      marginMode: '全仓',
    };
  });

  const generatedHistoricalSignals = Array.from({ length: 30 }, (_, i) => {
    const isLong = Math.random() > 0.5;
    const pair = ['ADA', 'XRP', 'BNB', 'LINK'][Math.floor(Math.random() * 4)];
    const entryPrice = Math.random() * 500 + 100;
    const startDate = new Date(2024, 3, 18 - (i % 9), 18, 30 + (i%10), 0);
    const endDate = new Date(startDate.getTime() + (Math.random() * 72 + 8) * 60 * 60 * 1000); // 8-80 hours later
    const formatDate = (date: Date) => date.toISOString().replace('T', ' ').substring(0, 19);

    return {
      id: i + 100, // Avoid key collision
      pair: `${pair}-USDT-SWAP`,
      direction: isLong ? '做多' : '做空',
      directionColor: isLong ? 'text-green-400' : 'text-red-400',
      entryPrice: entryPrice.toFixed(3),
      takeProfit1: (entryPrice * (isLong ? 1.05 : 0.95)).toFixed(3),
      takeProfit2: (entryPrice * (isLong ? 1.10 : 0.90)).toFixed(3),
      stopLoss: (entryPrice * (isLong ? 0.98 : 1.02)).toFixed(3),
      pnlRatio: `${(Math.random() * 5 + 1).toFixed(1)}:1`,
      createdAt: formatDate(startDate),
      endedAt: formatDate(endDate),
      orderType: '限价单',
      type: '永续合约',
      marginMode: '全仓',
      status: Math.random() > 0.3 ? '止盈平仓' : '止损平仓',
    };
  });

  const generatedFollowers = Array.from({ length: 40 }, (_, i) => {
    const name = `用户${(Math.random() + 1).toString(36).substring(7)}`;
    return {
      id: i + 200,
      name: `***${name.slice(-4)}`,
      profit: (Math.random() * 5000).toFixed(2),
      duration: Math.floor(Math.random() * 365) + 1,
    };
  });
  setAllSignals(generatedSignals);
  setAllHistoricalSignals(generatedHistoricalSignals);
  setAllFollowers(generatedFollowers);
  setDataLoading(false);
  }, []);

  const [currentSignals, setCurrentSignals] = useState<(typeof allSignals[0])[]>([]);
  const [currentSignalsPage, setCurrentSignalsPage] = useState(1);
  const [currentSignalsLoading, setCurrentSignalsLoading] = useState(false);
  const [currentSignalsHasMore, setCurrentSignalsHasMore] = useState(true);
  const { ref: currentLoadMoreRef, inView: currentInView } = useInView({ threshold: 0.1 });
  const [currentFilterLabel, setCurrentFilterLabel] = useState('近三个月');

  const [historicalSignals, setHistoricalSignals] = useState<(typeof allHistoricalSignals[0])[]>([]);
  const [historicalSignalsPage, setHistoricalSignalsPage] = useState(1);
  const [historicalSignalsLoading, setHistoricalSignalsLoading] = useState(false);
  const [historicalSignalsHasMore, setHistoricalSignalsHasMore] = useState(true);
  const { ref: historicalLoadMoreRef, inView: historicalInView } = useInView({ threshold: 0.1 });
  const [historicalFilterLabel, setHistoricalFilterLabel] = useState('近三个月');

  const [followers, setFollowers] = useState<(typeof allFollowers[0])[]>([]);
  const [followersPage, setFollowersPage] = useState(1);
  const [followersLoading, setFollowersLoading] = useState(false);
  const [followersHasMore, setFollowersHasMore] = useState(true);
  const { ref: followersLoadMoreRef, inView: followersInView } = useInView({ threshold: 0.1 });

  const [directionFilter, setDirectionFilter] = useState('全部方向');
  const [pairFilter, setPairFilter] = useState('全部币种');
  const [historicalDirectionFilter, setHistoricalDirectionFilter] = useState('全部方向');
  const [historicalPairFilter, setHistoricalPairFilter] = useState('全部币种');

  const swipeHandlers = useSwipeable({
    onSwiped: (eventData) => {
      const currentIndex = TABS.findIndex(t => t.value === activeTab);
      const direction = eventData.dir === 'Left' ? 1 : -1;
      const nextIndex = currentIndex + direction;
      if (nextIndex >= 0 && nextIndex < TABS.length) {
        setActiveTab(TABS[nextIndex].value);
      }
    },
    trackMouse: true
  });
  
  const loadMore = useCallback((type: 'current' | 'historical' | 'followers') => {
  if (type === 'current') {
    if (currentSignalsLoading || !currentSignalsHasMore) return;
    setCurrentSignalsLoading(true);
    setTimeout(() => {
      const newSignals = allSignals.slice((currentSignalsPage - 1) * PAGE_SIZE, currentSignalsPage * PAGE_SIZE);
      setCurrentSignals(prev => [...prev, ...newSignals]);
      setCurrentSignalsPage(prev => prev + 1);
      setCurrentSignalsHasMore(currentSignalsPage * PAGE_SIZE < allSignals.length);
      setCurrentSignalsLoading(false);
    }, 1000);
  } else if (type === 'historical') {
    if (historicalSignalsLoading || !historicalSignalsHasMore) return;
    setHistoricalSignalsLoading(true);
    setTimeout(() => {
      const newSignals = allHistoricalSignals.slice((historicalSignalsPage - 1) * PAGE_SIZE, historicalSignalsPage * PAGE_SIZE);
      setHistoricalSignals(prev => [...prev, ...newSignals]);
      setHistoricalSignalsPage(prev => prev + 1);
      setHistoricalSignalsHasMore(historicalSignalsPage * PAGE_SIZE < allHistoricalSignals.length);
      setHistoricalSignalsLoading(false);
    }, 1000);
  } else if (type === 'followers') {
    if (followersLoading || !followersHasMore) return;
    setFollowersLoading(true);
    setTimeout(() => {
      const newFollowers = allFollowers.slice((followersPage - 1) * PAGE_SIZE, followersPage * PAGE_SIZE);
      setFollowers(prev => [...prev, ...newFollowers]);
      setFollowersPage(prev => prev + 1);
      setFollowersHasMore(followersPage * PAGE_SIZE < allFollowers.length);
      setFollowersLoading(false);
    }, 1000);
  }
  }, [
    currentSignalsLoading, currentSignalsHasMore, currentSignalsPage, allSignals,
    historicalSignalsLoading, historicalSignalsHasMore, historicalSignalsPage, allHistoricalSignals,
    followersLoading, followersHasMore, followersPage, allFollowers
  ]);
  
  useEffect(() => {
  if (dataLoading) return;
  const initialLoad = (type: 'current' | 'historical' | 'followers') => {
    if (type === 'current') {
      setCurrentSignalsLoading(true);
      const newSignals = allSignals.slice(0, PAGE_SIZE);
      setCurrentSignals(newSignals);
      setCurrentSignalsPage(2);
      setCurrentSignalsHasMore(PAGE_SIZE < allSignals.length);
      setCurrentSignalsLoading(false);
    } else if (type === 'historical') {
      setHistoricalSignalsLoading(true);
      const newSignals = allHistoricalSignals.slice(0, PAGE_SIZE);
      setHistoricalSignals(newSignals);
      setHistoricalSignalsPage(2);
      setHistoricalSignalsHasMore(PAGE_SIZE < allHistoricalSignals.length);
      setHistoricalSignalsLoading(false);
    } else if (type === 'followers') {
      setFollowersLoading(true);
      const newFollowers = allFollowers.slice(0, PAGE_SIZE);
      setFollowers(newFollowers);
      setFollowersPage(2);
      setFollowersHasMore(PAGE_SIZE < allFollowers.length);
      setFollowersLoading(false);
    }
  };

  initialLoad('current');
  initialLoad('historical');
  initialLoad('followers');
  }, [dataLoading, allSignals, allHistoricalSignals, allFollowers]);

  useEffect(() => {
  if (currentInView && !currentSignalsLoading) loadMore('current');
  }, [currentInView, currentSignalsLoading, loadMore]);

  useEffect(() => {
  if (historicalInView && !historicalSignalsLoading) loadMore('historical');
  }, [historicalInView, historicalSignalsLoading, loadMore]);
  
  useEffect(() => {
  if (followersInView && !followersLoading) loadMore('followers');
  }, [followersInView, followersLoading, loadMore]);


  if (loadingTrader) {
  return (
    <div className="flex h-screen items-center justify-center">
    <Loader2 className="mr-2 h-8 w-8 animate-spin" />
    <span>加载中...</span>
    </div>
  );
  }

  if (!trader) {
  return (
    <div className="flex h-screen items-center justify-center">
    <div className="text-sm text-muted-foreground">未找到该交易员</div>
    </div>
  );
  }

  const activeTabIndex = TABS.findIndex(tab => tab.value === activeTab);

  const handleTraderChange = (newTraderId: string) => {
  const idx = traderOptions.findIndex(t => t.id === newTraderId)
  const newRank = idx >= 0 ? idx + 1 : ''
  router.push(`/trader/${newTraderId}`);
  };


  return (
  <>
  <div className="bg-background min-h-screen text-foreground flex flex-col">
    {/* Header */}
    <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-border/50 bg-background/80 px-4 backdrop-blur-sm">
      <Link href="/" passHref>
        <Button variant="ghost" size="icon" className="-ml-2">
          <ChevronLeft className="h-6 w-6" />
        </Button>
      </Link>
       <Select value={traderId} onValueChange={handleTraderChange}>
        <SelectTrigger className="w-auto bg-transparent border-0 text-lg font-bold focus:ring-0 focus:ring-offset-0 gap-2 mx-auto">
          <SelectValue>
            <div className="flex items-center gap-2">
              <span>{trader.name}</span>
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
           {traderOptions.map(t => (
            <SelectItem key={t.id} value={t.id}>
              <div className="flex items-center gap-3">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={t.avatar} alt={t.name} />
                  <AvatarFallback>{t.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <span>{t.name}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <div className="w-9"></div> {/* Placeholder for spacing */}
    </header>

    <main className="flex-grow overflow-auto p-4 space-y-3 pb-28">
    {/* Basic Info */}
    <Card className="bg-card/80 border-border/50 overflow-hidden relative">
      <Collapsible open={isMetricsOpen} onOpenChange={setIsMetricsOpen} className="w-full">
        <CardContent className="p-4">
          <div className="flex justify-center">
            <div className="relative">
              <Avatar className="h-20 w-20 border-2 border-primary">
                <AvatarImage src={trader.avatar} alt={trader.name} />
                <AvatarFallback>{trader.name.charAt(0)}</AvatarFallback>
              </Avatar>
              {badge && (
                <Crown className={`absolute -top-1 -left-1 h-7 w-7 transform -rotate-12 ${badge.color}`} fill="currentColor" />
              )}
            </div>
          </div>
          <div className="text-center mt-3">
            <p className="text-sm text-muted-foreground">{trader.description}</p>
            <div className="flex flex-wrap justify-center gap-2 mt-3">
              {trader.tags?.map(tag => (
                <Badge key={tag} variant="secondary">{tag}</Badge>
              ))}
            </div>
          </div>

          <CollapsibleContent>
            <div className="grid grid-cols-3 gap-y-4 pt-6 text-center">
              <MetricItem label="收益率" value={`+${trader.yield}%`} valueClassName="text-green-400" />
              <MetricItem label="胜率" value={`${trader.winRate}%`} valueClassName="text-foreground" />
              <MetricItem label="盈亏比" value={trader.pnlRatio ?? '--'} valueClassName="text-foreground" />
              <MetricItem label="累计信号" value={trader.totalOrders} valueClassName="text-foreground" />
              <MetricItem label="累计跟单" value={trader.followers ?? '--'} valueClassName="text-foreground" />
              <MetricItem label="累计天数(天)" value={trader.days ?? '--'} valueClassName="text-foreground" />
            </div>
          </CollapsibleContent>

          <div className="flex flex-col items-center w-full mt-4">
             <CollapsibleTrigger asChild>
              <button className="flex-shrink-0 p-1 text-muted-foreground hover:bg-muted rounded-md">
                {isMetricsOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </CollapsibleTrigger>
            <div className="flex w-full justify-center gap-4 pt-2">
              <Button className="font-bold text-sm h-10 rounded-full px-5 flex-1" onClick={(e) => { e.stopPropagation(); setIsSheetOpen(true); }}>
                自动跟单
              </Button>
              <Button variant="secondary" className="font-bold text-sm h-10 rounded-full px-5 flex-1">
                策略回测
              </Button>
            </div>
          </div>

        </CardContent>
      </Collapsible>
    </Card>

    { dataLoading ? (
      <div className="flex h-40 items-center justify-center">
        <Loader2 className="mr-2 h-8 w-8 animate-spin" />
        <span>加载中...</span>
      </div>
    ) : (
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          {TABS.map((tab) => (
            <TabsTrigger 
              key={tab.value}
              value={tab.value} 
              >
              <tab.icon className="mr-2 h-4 w-4" /> {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
                
        <div {...swipeHandlers} className="overflow-hidden">
           <div
            className="flex transition-transform duration-300"
            style={{ transform: `translateX(-${activeTabIndex * 100}%)` }}
          >
            <div className="w-full flex-shrink-0">
               <div className="mt-4 space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <FilterDropdown
                      label={directionFilter}
                      options={['全部方向', '做多', '做空']}
                      onSelect={setDirectionFilter}
                      setLabel={setDirectionFilter}
                    />
                    <FilterDropdown
                      label={pairFilter}
                      options={['全部币种', 'BTC', 'ETH', 'SOL', 'DOGE']}
                      onSelect={setPairFilter}
                      setLabel={setPairFilter}
                    />
                  </div>
                  <FilterDropdown
                    label={currentFilterLabel}
                    options={['近三个月', '近半年', '近一年']}
                    onSelect={setCurrentFilterLabel}
                    setLabel={setCurrentFilterLabel}
                  />
                </div>
                <div className="space-y-3">
                  {currentSignals.map(signal => (
                    <SignalCard key={signal.id} signal={signal} />
                  ))}
                </div>
                <div ref={currentLoadMoreRef} className="flex justify-center items-center h-16 text-muted-foreground">
                  {currentSignalsLoading && (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      <span>加载中...</span>
                    </>
                  )}
                  {!currentSignalsLoading && !currentSignalsHasMore && currentSignals.length > 0 && (
                    <span>已经到底了</span>
                  )}
                </div>
              </div>
            </div>

            <div className="w-full flex-shrink-0">
              <div className="mt-4 space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <FilterDropdown
                      label={historicalDirectionFilter}
                      options={['全部方向', '做多', '做空']}
                      onSelect={setHistoricalDirectionFilter}
                      setLabel={setHistoricalDirectionFilter}
                    />
                    <FilterDropdown
                      label={historicalPairFilter}
                      options={['全部币种', 'ADA', 'XRP', 'BNB', 'LINK']}
                      onSelect={setHistoricalPairFilter}
                      setLabel={setHistoricalPairFilter}
                    />
                  </div>
                  <FilterDropdown
                    label={historicalFilterLabel}
                    options={['近三个月', '近半年', '近一年']}
                    onSelect={setHistoricalFilterLabel}
                    setLabel={setHistoricalFilterLabel}
                  />

                </div>
                <div className="space-y-3">
                  {historicalSignals.map(signal => (
                    <HistoricalSignalCard key={signal.id} signal={signal} />
                  ))}
                </div>
                <div ref={historicalLoadMoreRef} className="flex justify-center items-center h-16 text-muted-foreground">
                  {historicalSignalsLoading && (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      <span>加载中...</span>
                    </>
                  )}
                  {!historicalSignalsLoading && !historicalSignalsHasMore && historicalSignals.length > 0 && (
                    <span>已经到底了</span>
                  )}
                </div>
              </div>
            </div>
                        
            <div className="w-full flex-shrink-0">
              <div className="mt-4 space-y-3">
                <div className="space-y-3">
                  {followers.map(follower => (
                    <FollowerCard key={follower.id} follower={follower} />
                  ))}
                </div>
                <div ref={followersLoadMoreRef} className="flex justify-center items-center h-16 text-muted-foreground">
                  {followersLoading && (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      <span>加载中...</span>
                    </>
                  )}
                  {!followersLoading && !followersHasMore && followers.length > 0 && (
                    <span>已经到底了</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Tabs>
    )}
    </main>
      
    {/* Bottom Navigation */}
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border/50 h-16 z-20 flex-shrink-0">
    <div className="grid grid-cols-3 items-center h-full text-center">
      <Link
        href="/"
        passHref
        className="flex flex-col items-center justify-center space-y-1 transition-colors w-full h-full text-muted-foreground"
      >
        <BarChart className="h-6 w-6" />
        <span className="text-xs font-medium">将军榜</span>
      </Link>
      <div className="relative flex flex-col items-center justify-center h-full">
         <Link href="/my-account" passHref className="absolute -top-5 flex items-center justify-center w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-lg border-4 border-background transition-transform active:scale-95">
          <ArrowRightLeft className="w-6 h-6" />
        </Link>
        <span className="text-xs font-medium pt-8 text-muted-foreground">交易</span>
      </div>
      <Link
        href="/profile"
        passHref
        className="flex flex-col items-center justify-center space-y-1 transition-colors w-full h-full text-muted-foreground"
      >
        <User className="h-6 w-6" />
        <span className="text-xs font-medium">我的</span>
      </Link>
    </div>
    </nav>

  </div>
  <FollowOrderSheet 
    isOpen={isSheetOpen} 
    onOpenChange={setIsSheetOpen} 
    traders={sheetTraders}
    defaultTraderId={defaultSheetTraderId}
  />
  </>
  )
}

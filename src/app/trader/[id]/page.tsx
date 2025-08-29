
'use client'

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation'
import {
  ChevronLeft,
  User,
  Clock,
  ChevronDown,
  Loader2,
  History,
  Users
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import useEmblaCarousel from 'embla-carousel-react'


// Mock data - in a real app, you'd fetch this based on the `id` param
const traders = [
    {
    id: 1,
    name: 'WWG-Woods',
    avatar: 'https://i.pravatar.cc/150?u=wwg-woods',
    description: '盈亏同源高收益追涨模式采用指数级复利操作',
    yield: 288.0,
    winRate: 95.0,
    pnlRatio: '22:1',
    totalOrders: 150,
    tags: ['波段高手', '高频交易', 'ETH信徒'],
    followers: 1288,
    days: 180,
  },
  {
    id: 2,
    name: 'WWG-Jonh',
    avatar: 'https://i.pravatar.cc/150?u=jonh',
    description: '寻找超额收益，多策略组合',
    yield: 265.0,
    winRate: 98.0,
    pnlRatio: '20:1',
    totalOrders: 180,
    tags: ['狙击BTC专家', '技术分析', '稳健'],
    followers: 1150,
    days: 210,
  },
  {
    id: 3,
    name: 'WWG-Hbj',
    avatar: 'https://i.pravatar.cc/150?u=hbj',
    description: '深耕以太坊生态，价值发现',
    yield: 250.0,
    winRate: 90.1,
    pnlRatio: '18.5:1',
    totalOrders: 888,
    tags: ['价值投资', 'ETH布道者', '长线'],
    followers: 2300,
    days: 365,
  },
    {
    id: 4,
    name: '量化大师',
    avatar: 'https://i.pravatar.cc/150?u=quant',
    description: '高频交易，算法驱动',
    yield: 150.7,
    winRate: 65.7,
    pnlRatio: '11.2:1',
    totalOrders: 345,
    tags: ['算法交易', '高频', '套利'],
    followers: 890,
    days: 90,
  },
  {
    id: 5,
    name: '趋势猎人',
    avatar: 'https://i.pravatar.cc/150?u=hunter',
    description: '顺势而为，捕捉大趋势行情',
    yield: 120.4,
    winRate: 76.8,
    pnlRatio: '9.1:1',
    totalOrders: 780,
    tags: ['趋势跟踪', '宏观经济', '长线持有'],
    followers: 920,
    days: 410,
  },
  {
    id: 6,
    name: '波段之王',
    avatar: 'https://i.pravatar.cc/150?u=swing',
    description: '高抛低吸，精通市场情绪',
    yield: 95.6,
    winRate: 89.1,
    pnlRatio: '8.5:1',
    totalOrders: 888,
    tags: ['波段交易', '情绪分析', '短线'],
    followers: 1500,
    days: 280,
  },
  {
    id: 7,
    name: '合约常胜军',
    avatar: 'https://i.pravatar.cc/150?u=futures',
    description: '杠杆艺术，风险控制大师',
    yield: 88.0,
    winRate: 95.0,
    pnlRatio: '10:1',
    totalOrders: 450,
    tags: ['合约交易', '高杠杆', '风险控制'],
    followers: 1800,
    days: 150,
  },
  {
    id: 8,
    name: 'BTC信仰者',
    avatar: 'https://i.pravatar.cc/150?u=btc',
    description: '只做比特币，长期持有',
    yield: 75.1,
    winRate: 85.3,
    pnlRatio: '7.5:1',
    totalOrders: 1102,
    tags: ['BTC', '信仰者', '屯币'],
    followers: 5000,
    days: 730,
  },
  {
    id: 9,
    name: '短线快枪手',
    avatar: 'https://i.pravatar.cc/150?u=quick',
    description: '超短线交易，积少成多',
    yield: 68.5,
    winRate: 92.84,
    pnlRatio: '8.2:1',
    totalOrders: 1245,
    tags: ['超短线', '剥头皮', '高频'],
    followers: 760,
    days: 88,
  },
  {
    id: 10,
    name: 'ETH布道者',
    avatar: 'https://i.pravatar.cc/150?u=eth',
    description: '深耕以太坊生态，价值发现',
    yield: 63.2,
    winRate: 82.4,
    pnlRatio: '6.2:1',
    totalOrders: 999,
    tags: ['ETH', 'DEFI', '价值发现'],
    followers: 1340,
    days: 310,
  },
  {
    id: 11,
    name: 'Alpha Seeker',
    avatar: 'https://i.pravatar.cc/150?u=alpha',
    description: '寻找超额收益，多策略组合',
    yield: 52.3,
    winRate: 87.92,
    pnlRatio: '6.8:1',
    totalOrders: 892,
    tags: ['多策略', 'Alpha', '对冲'],
    followers: 650,
    days: 120,
  },
  {
    id: 12,
    name: '狙击涨停板',
    avatar: 'https://i.pravatar.cc/150?u=limit-up',
    description: '专注强势币种，高风险高回报',
    yield: 48.9,
    winRate: 91.5,
    pnlRatio: '5.9:1',
    totalOrders: 1530,
    tags: ['强势币', '追涨', '高风险'],
    followers: 999,
    days: 99,
  },
  {
    id: 13,
    name: '抄底王',
    avatar: 'https://i.pravatar.cc/150?u=dip',
    description: '左侧交易，逆势布局',
    yield: 45.5,
    winRate: 88.0,
    pnlRatio: '5.5:1',
    totalOrders: 789,
    tags: ['左侧交易', '抄底', '逆势'],
    followers: 480,
    days: 200,
  },
  {
    id: 14,
    name: '币圈巴菲特',
    avatar: 'https://i.pravatar.cc/150?u=buffett',
    description: '屯币不动，穿越牛熊',
    yield: 41.6,
    winRate: 78.45,
    pnlRatio: '5.2:1',
    totalOrders: 654,
    tags: ['价值投资', '长持', '屯币'],
    followers: 3000,
    days: 1024,
  }
];

const allSignals = Array.from({ length: 25 }, (_, i) => {
  const isLong = Math.random() > 0.5;
  const pair = ['BTC', 'ETH', 'SOL', 'DOGE'][Math.floor(Math.random() * 4)];
  const entryPrice = Math.random() * 50000 + 20000;
  return {
    id: i + 1,
    pair: `${pair}-USDT-SWAP`,
    direction: isLong ? '做多' : '做空',
    directionColor: isLong ? 'text-green-400' : 'text-red-400',
    entryPrice: entryPrice.toFixed(2),
    takeProfit1: (entryPrice * (isLong ? 1.02 : 0.98)).toFixed(2),
    takeProfit2: (entryPrice * (isLong ? 1.04 : 0.96)).toFixed(2),
    stopLoss: (entryPrice * (isLong ? 0.99 : 1.01)).toFixed(2),
    createdAt: new Date(Date.now() - i * 1000 * 60 * 60 * 8).toISOString().replace('T', ' ').substring(0, 19),
  };
});

const allHistoricalSignals = Array.from({ length: 30 }, (_, i) => {
  const isLong = Math.random() > 0.5;
  const pair = ['ADA', 'XRP', 'BNB', 'LINK'][Math.floor(Math.random() * 4)];
  const entryPrice = Math.random() * 500 + 100;
  const createTime = new Date(Date.now() - (i + 25) * 1000 * 60 * 60 * 8); // Start from after current signals
  const endTime = new Date(createTime.getTime() + Math.random() * 1000 * 60 * 60 * 24);
  return {
    id: i + 100, // Avoid key collision
    pair: `${pair}-USDT-SWAP`,
    direction: isLong ? '做多' : '做空',
    directionColor: isLong ? 'text-green-400' : 'text-red-400',
    entryPrice: entryPrice.toFixed(3),
    takeProfit1: (entryPrice * (isLong ? 1.05 : 0.95)).toFixed(3),
    takeProfit2: (entryPrice * (isLong ? 1.10 : 0.90)).toFixed(3),
    stopLoss: (entryPrice * (isLong ? 0.98 : 1.02)).toFixed(3),
    createdAt: createTime.toISOString().replace('T', ' ').substring(0, 19),
    endedAt: endTime.toISOString().replace('T', ' ').substring(0, 19),
  };
});

const allFollowers = Array.from({ length: 40 }, (_, i) => {
  const name = `用户${(Math.random() + 1).toString(36).substring(7)}`;
  return {
      id: i + 200,
      avatar: `https://i.pravatar.cc/150?u=follower${i}`,
      name: `***${name.slice(-4)}`,
      profit: (Math.random() * 5000).toFixed(2),
      duration: Math.floor(Math.random() * 365) + 1,
  };
});


const PAGE_SIZE = 5;


function InfoPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm py-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground">{value}</span>
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

function SignalCard({ signal }: { signal: typeof allSignals[0] }) {
    return (
        <Card className="bg-card/80 border-border/50">
            <CardContent className="p-4">
                <div className="flex justify-between items-center mb-3">
                    <Badge variant="secondary" className="font-mono">{signal.pair}</Badge>
                    <span className={`text-lg font-bold ${signal.directionColor}`}>{signal.direction}</span>
                </div>
                <div className="space-y-2 border-t border-border/50 pt-3">
                    <InfoPill label="入场点位" value={signal.entryPrice} />
                    <InfoPill label="止盈点位 1" value={signal.takeProfit1} />
                    <InfoPill label="止盈点位 2" value={signal.takeProfit2} />
                    <InfoPill label="止损点位" value={signal.stopLoss} />
                </div>
                <div className="flex justify-between items-end mt-3 pt-3 border-t border-border/50">
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

function HistoricalSignalCard({ signal }: { signal: typeof allHistoricalSignals[0] }) {
    return (
        <Card className="bg-card/80 border-border/50">
            <CardContent className="p-4">
                <div className="flex justify-between items-center mb-3">
                    <Badge variant="secondary" className="font-mono">{signal.pair}</Badge>
                    <span className={`text-lg font-bold ${signal.directionColor}`}>{signal.direction}</span>
                </div>
                <div className="space-y-2 border-t border-border/50 pt-3">
                    <InfoPill label="入场点位" value={signal.entryPrice} />
                    <InfoPill label="止盈点位 1" value={signal.takeProfit1} />
                    <InfoPill label="止盈点位 2" value={signal.takeProfit2} />
                    <InfoPill label="止损点位" value={signal.stopLoss} />
                </div>
                <div className="space-y-2 mt-3 pt-3 border-t border-border/50 text-xs text-muted-foreground">
                   <div className="flex items-center justify-between">
                       <div className="flex items-center gap-1.5">
                           <span>{signal.createdAt} - {signal.endedAt}</span>
                       </div>
                   </div>
                </div>
            </CardContent>
        </Card>
    );
}

function FollowerCard({ follower }: { follower: typeof allFollowers[0] }) {
    return (
        <Card className="bg-card/80 border-border/50">
            <CardContent className="p-4 flex items-center gap-4">
                <Avatar className="h-12 w-12">
                    <AvatarImage src={follower.avatar} alt={follower.name} />
                    <AvatarFallback>{follower.name.charAt(3)}</AvatarFallback>
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
        <Button variant="ghost" size="sm" className="text-muted-foreground">
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


export default function TraderDetailPage() {
  const router = useRouter()
  const params = useParams()
  const traderId = params.id ? parseInt(params.id as string, 10) : null;
  const trader = traders.find(t => t.id === traderId);

  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false });
  const [selectedIndex, setSelectedIndex] = useState(0);

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

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on("select", onSelect);
    return () => emblaApi.off("select", onSelect);
  }, [emblaApi, onSelect]);

  const scrollTo = useCallback((index: number) => {
    if (emblaApi) emblaApi.scrollTo(index);
  }, [emblaApi]);

  const loadMore = useCallback((type: 'current' | 'historical' | 'followers') => {
    if (type === 'current') {
        if (currentSignalsLoading || !currentSignalsHasMore) return;
        setCurrentSignalsLoading(true);
        setTimeout(() => {
            const newSignals = allSignals.slice((currentSignalsPage - 1) * PAGE_SIZE, currentSignalsPage * PAGE_SIZE);
            setCurrentSignals(prev => [...prev, ...newSignals]);
            setCurrentSignalsPage(prev => prev + 1);
            if (((currentSignalsPage - 1) * PAGE_SIZE + newSignals.length) >= allSignals.length) {
                setCurrentSignalsHasMore(false);
            }
            setCurrentSignalsLoading(false);
        }, 1000);
    } else if (type === 'historical') {
        if (historicalSignalsLoading || !historicalSignalsHasMore) return;
        setHistoricalSignalsLoading(true);
        setTimeout(() => {
            const newSignals = allHistoricalSignals.slice((historicalSignalsPage - 1) * PAGE_SIZE, historicalSignalsPage * PAGE_SIZE);
            setHistoricalSignals(prev => [...prev, ...newSignals]);
            setHistoricalSignalsPage(prev => prev + 1);
            if (((historicalSignalsPage - 1) * PAGE_SIZE + newSignals.length) >= allHistoricalSignals.length) {
                setHistoricalSignalsHasMore(false);
            }
            setHistoricalSignalsLoading(false);
        }, 1000);
    } else if (type === 'followers') {
        if (followersLoading || !followersHasMore) return;
        setFollowersLoading(true);
        setTimeout(() => {
            const newFollowers = allFollowers.slice((followersPage - 1) * PAGE_SIZE, followersPage * PAGE_SIZE);
            setFollowers(prev => [...prev, ...newFollowers]);
            setFollowersPage(prev => prev + 1);
            if (((followersPage - 1) * PAGE_SIZE + newFollowers.length) >= allFollowers.length) {
                setFollowersHasMore(false);
            }
            setFollowersLoading(false);
        }, 1000);
    }
  }, [
      currentSignalsLoading, currentSignalsHasMore, currentSignalsPage,
      historicalSignalsLoading, historicalSignalsHasMore, historicalSignalsPage,
      followersLoading, followersHasMore, followersPage
  ]);
  
  useEffect(() => {
    loadMore('current');
    loadMore('historical');
    loadMore('followers');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (currentInView) loadMore('current');
  }, [currentInView, loadMore]);

  useEffect(() => {
    if (historicalInView) loadMore('historical');
  }, [historicalInView, loadMore]);
  
  useEffect(() => {
    if (followersInView) loadMore('followers');
  }, [followersInView, loadMore]);


  if (!trader) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="mr-2 h-8 w-8 animate-spin" />
        <span>加载中...</span>
      </div>
    );
  }
  
  const TABS = [
    { value: "current", label: "当前信号", icon: User },
    { value: "historical", label: "历史信号", icon: History },
    { value: "followers", label: "跟单用户", icon: Users }
  ];

  return (
    <div className="bg-background min-h-screen text-foreground flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-border/50 bg-background/80 px-4 backdrop-blur-sm">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ChevronLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-lg font-bold">{trader.name}</h1>
        <div className="w-9"></div> {/* Placeholder for spacing */}
      </header>

      <main className="flex-grow overflow-auto p-4 space-y-6 pb-28">
        {/* Basic Info */}
        <Card className="bg-card/80 border-border/50">
          <CardContent className="p-4 flex flex-row items-start text-left gap-4">
            <Avatar className="h-24 w-24 border-2 border-primary shrink-0">
              <AvatarImage src={trader.avatar} alt={trader.name} />
              <AvatarFallback>{trader.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="w-full space-y-3">
                <p className="text-sm text-muted-foreground">{trader.description}</p>
                <div className="flex flex-wrap justify-start gap-2">
                    {trader.tags?.map(tag => (
                        <Badge key={tag} variant="secondary">{tag}</Badge>
                    ))}
                </div>
            </div>
          </CardContent>
        </Card>

        {/* Metrics Overview */}
        <Card className="bg-card/80 border-border/50">
           <CardContent className="p-4 grid grid-cols-3 gap-y-4 text-center">
                <MetricItem label="收益率" value={`+${trader.yield}%`} valueClassName="text-green-400" />
                <MetricItem label="胜率" value={`${trader.winRate}%`} valueClassName="text-foreground" />
                <MetricItem label="盈亏比" value={trader.pnlRatio} valueClassName="text-foreground" />
                <MetricItem label="累计信号" value={trader.totalOrders} valueClassName="text-foreground" />
                <MetricItem label="累计跟单" value={trader.followers} valueClassName="text-foreground" />
                <MetricItem label="累计天数(天)" value={trader.days} valueClassName="text-foreground" />
           </CardContent>
        </Card>

        {/* Signals Section */}
        <div>
            <div className="px-1">
                <TabsList className="grid w-full grid-cols-3">
                    {TABS.map((tab, index) => (
                         <TabsTrigger 
                            key={tab.value}
                            value={tab.value} 
                            onClick={() => scrollTo(index)}
                            data-state={selectedIndex === index ? 'active' : 'inactive'}
                            >
                            <tab.icon className="mr-2 h-4 w-4" /> {tab.label}
                        </TabsTrigger>
                    ))}
                </TabsList>
            </div>

            <div className="overflow-hidden mt-4" ref={emblaRef}>
                <div className="flex">
                    {/* Current Signals Slide */}
                    <div className="relative min-w-0 flex-shrink-0 flex-grow-0 basis-full">
                       <div className="flex justify-end items-center mb-3 -mt-2">
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

                    {/* Historical Signals Slide */}
                    <div className="relative min-w-0 flex-shrink-0 flex-grow-0 basis-full">
                        <div className="flex justify-end items-center mb-3 -mt-2">
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

                    {/* Followers Slide */}
                    <div className="relative min-w-0 flex-shrink-0 flex-grow-0 basis-full">
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
      </main>

       {/* Floating Footer */}
      <footer className="fixed bottom-0 left-0 right-0 z-10 bg-background/80 border-t border-border/50 backdrop-blur-sm p-4">
        <Button className="w-full font-bold text-lg h-11 rounded-full">立即跟单</Button>
      </footer>
    </div>
  )
}

    
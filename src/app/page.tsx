
'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import {
  Search,
  ChevronDown,
  BarChart,
  User,
  Plus,
  Loader2,
  Crown
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Card,
  CardContent,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import {
  LineChart,
  Line,
  ResponsiveContainer,
  YAxis,
  Area,
  AreaChart
} from 'recharts'
import { useInView } from 'react-intersection-observer'
import { Badge } from '@/components/ui/badge'

interface Trader {
  id: number
  name: string
  description: string
  yield: number
  winRate: number
  pnlRatio: string
  totalOrders: number
  chartData: { value: number }[]
}

const allTraders: Trader[] = [
    {
    id: 1,
    name: 'WWG-Woods',
    description: '盈亏同源高收益追涨模式采用指数级复利操作',
    yield: 288.0,
    winRate: 95.0,
    pnlRatio: '22:1',
    totalOrders: 150,
    chartData: [{ value: 10 }, { value: 20 }, { value: 50 }, { value: 80 }, { value: 120 }, { value: 180 }, { value: 220 }, { value: 288 }],
  },
  {
    id: 2,
    name: 'WWG-Jonh',
    description: '寻找超额收益，多策略组合',
    yield: 265.0,
    winRate: 98.0,
    pnlRatio: '20:1',
    totalOrders: 180,
    chartData: [{ value: 10 }, { value: 25 }, { value: 55 }, { value: 85 }, { value: 125 }, { value: 185 }, { value: 225 }, { value: 265 }],
  },
  {
    id: 3,
    name: 'WWG-Hbj',
    description: '深耕以太坊生态，价值发现',
    yield: 250.0,
    winRate: 90.1,
    pnlRatio: '18.5:1',
    totalOrders: 888,
    chartData: [{ value: 10 }, { value: 20 }, { value: 30 }, { value: 45 }, { value: 60 }, { value: 100 }, { value: 180 }, { value: 250 }],
  },
    {
    id: 4,
    name: '量化大师',
    description: '高频交易，算法驱动',
    yield: 150.7,
    winRate: 65.7,
    pnlRatio: '11.2:1',
    totalOrders: 345,
    chartData: [{ value: 10 }, { value: 40 }, { value: 20 }, { value: 80 }, { value: 50 }, { value: 110 }, { value: 90 }, { value: 150.7 }],
  },
  {
    id: 5,
    name: '趋势猎人',
    description: '顺势而为，捕捉大趋势行情',
    yield: 120.4,
    winRate: 76.8,
    pnlRatio: '9.1:1',
    totalOrders: 780,
    chartData: [{ value: 10 }, { value: 30 }, { value: 20 }, { value: 50 }, { value: 70 }, { value: 90 }, { value: 110 }, { value: 120.4 }],
  },
  {
    id: 6,
    name: '波段之王',
    description: '高抛低吸，精通市场情绪',
    yield: 95.6,
    winRate: 89.1,
    pnlRatio: '8.5:1',
    totalOrders: 888,
    chartData: [{ value: 10 }, { value: 20 }, { value: 30 }, { value: 45 }, { value: 60 }, { value: 70 }, { value: 80 }, { value: 95.6 }],
  },
  {
    id: 7,
    name: '合约常胜军',
    description: '杠杆艺术，风险控制大师',
    yield: 88.0,
    winRate: 95.0,
    pnlRatio: '10:1',
    totalOrders: 450,
    chartData: [{ value: 10 }, { value: 12 }, { value: 20 }, { value: 30 }, { value: 50 }, { value: 60 }, { value: 75 }, { value: 88 }],
  },
  {
    id: 8,
    name: 'BTC信仰者',
    description: '只做比特币，长期持有',
    yield: 75.1,
    winRate: 85.3,
    pnlRatio: '7.5:1',
    totalOrders: 1102,
    chartData: [{ value: 10 }, { value: 15 }, { value: 25 }, { value: 35 }, { value: 45 }, { value: 55 }, { value: 65 }, { value: 75.1 }],
  },
  {
    id: 9,
    name: '短线快枪手',
    description: '超短线交易，积少成多',
    yield: 68.5,
    winRate: 92.84,
    pnlRatio: '8.2:1',
    totalOrders: 1245,
    chartData: [
      { value: 10 }, { value: 20 }, { value: 15 }, { value: 30 }, { value: 25 },
      { value: 40 }, { value: 35 }, { value: 50 }, { value: 60 }, { value: 68.5 },
    ],
  },
  {
    id: 10,
    name: 'ETH布道者',
    description: '深耕以太坊生态，价值发现',
    yield: 63.2,
    winRate: 82.4,
    pnlRatio: '6.2:1',
    totalOrders: 999,
    chartData: [{ value: 10 }, { value: 15 }, { value: 22 }, { value: 30 }, { value: 40 }, { value: 45 }, { value: 55 }, { value: 63.2 }],
  },
  {
    id: 11,
    name: 'Alpha Seeker',
    description: '寻找超额收益，多策略组合',
    yield: 52.3,
    winRate: 87.92,
    pnlRatio: '6.8:1',
    totalOrders: 892,
    chartData: [
      { value: 10 }, { value: 12 }, { value: 18 }, { value: 15 }, { value: 25 },
      { value: 22 }, { value: 30 }, { value: 35 }, { value: 45 }, { value: 52.3 },
    ],
  },
  {
    id: 12,
    name: '狙击涨停板',
    description: '专注强势币种，高风险高回报',
    yield: 48.9,
    winRate: 91.5,
    pnlRatio: '5.9:1',
    totalOrders: 1530,
    chartData: [{ value: 10 }, { value: 20 }, { value: 15 }, { value: 30 }, { value: 25 }, { value: 40 }, { value: 35 }, { value: 48.9 }],
  },
  {
    id: 13,
    name: '抄底王',
    description: '左侧交易，逆势布局',
    yield: 45.5,
    winRate: 88.0,
    pnlRatio: '5.5:1',
    totalOrders: 789,
    chartData: [{ value: 10 }, { value: 5 }, { value: 15 }, { value: 12 }, { value: 25 }, { value: 20 }, { value: 35 }, { value: 45.5 }],
  },
  {
    id: 14,
    name: '币圈巴菲特',
    description: '屯币不动，穿越牛熊',
    yield: 41.6,
    winRate: 78.45,
    pnlRatio: '5.2:1',
    totalOrders: 654,
    chartData: [
      { value: 10 }, { value: 11 }, { value: 13 }, { value: 12 }, { value: 15 },
      { value: 18 }, { value: 22 }, { value: 28 }, { value: 35 }, { value: 41.6 },
    ],
  }
];

const PAGE_SIZE = 10;
const RANK_BADGES: {[key: number]: { color: string, shadow: string }} = {
    1: { color: "bg-yellow-400 text-yellow-900", shadow: "shadow-yellow-400/50" }, // Gold
    2: { color: "bg-slate-300 text-slate-800", shadow: "shadow-slate-300/50" }, // Silver
    3: { color: "bg-amber-600 text-amber-100", shadow: "shadow-amber-600/50" },   // Bronze
}

function TraderCard({ trader, rank, is综合排序 }: { trader: Trader, rank: number, is综合排序: boolean }) {
    const badge = is综合排序 && rank > 0 && rank <= 3 ? RANK_BADGES[rank] : null;

    return (
        <Card className="bg-card/80 backdrop-blur-sm border-border/50 overflow-hidden">
        <CardContent className="p-4">
            <div className="flex items-start gap-4">
            <div className="relative shrink-0">
                <Avatar>
                    <AvatarFallback className="bg-muted text-muted-foreground">{trader.name.charAt(0)}</AvatarFallback>
                </Avatar>
                {badge && (
                    <div className={`absolute -top-2 left-1/2 -translate-x-1/2 z-10 rounded-full p-0.5 ${badge.color} shadow-lg ${badge.shadow}`}>
                        <Crown className="w-4 h-4" />
                    </div>
                )}
            </div>
            <div className="flex-grow">
                <div className="flex justify-between items-center">
                <h3 className="font-bold text-lg text-foreground">{trader.name}</h3>
                <Button size="sm" variant="outline" className="bg-transparent text-primary border-primary hover:bg-primary/10 rounded-full px-4">
                    跟单
                </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{trader.description}</p>
            </div>
            </div>

            <div className="grid grid-cols-4 gap-2 text-center mt-4">
            <div>
                <p className="text-xs text-muted-foreground">收益率</p>
                <p className="text-sm font-semibold text-green-400 mt-1">+{trader.yield}%</p>
            </div>
            <div>
                <p className="text-xs text-muted-foreground">胜率</p>
                <p className="text-sm font-semibold text-foreground mt-1">{trader.winRate}%</p>
            </div>
            <div>
                <p className="text-xs text-muted-foreground">盈亏比</p>
                <p className="text-sm font-semibold text-foreground mt-1">{trader.pnlRatio}</p>
            </div>
            <div>
                <p className="text-xs text-muted-foreground">累计信号</p>
                <p className="text-sm font-semibold text-foreground mt-1">{trader.totalOrders}</p>
            </div>
            </div>

            <div className="h-20 mt-2 -mb-2 -ml-4 -mr-4">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trader.chartData} margin={{ top: 5, right: 0, left: 0, bottom: 5 }}>
                <defs>
                    <linearGradient id={`gradient-${trader.id}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                    </defs>
                <YAxis domain={['dataMin - 10', 'dataMax + 10']} hide={true} />
                <Area
                    type="monotone"
                    dataKey="value"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    fill={`url(#gradient-${trader.id})`}
                    fillOpacity={1}
                />
                </AreaChart>
            </ResponsiveContainer>
            </div>
        </CardContent>
        </Card>
    )
}

function FilterDropdown({ label }: { label: string }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="text-muted-foreground hover:text-foreground p-0 h-auto">
          {label}
          <ChevronDown className="ml-1 h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="bg-card">
        <DropdownMenuItem>由高到低</DropdownMenuItem>
        <DropdownMenuItem>由低到高</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default function LeaderboardPage() {
    const [activeTab, setActiveTab] = useState('leaderboard');
    const [page, setPage] = useState(1);
    const [traders, setTraders] = useState<Trader[]>([]);
    const [loading, setLoading] = useState(true);
    const [hasMore, setHasMore] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const { ref: loadMoreRef, inView } = useInView({ threshold: 0.1 });
    const headerTitleRef = useRef<HTMLDivElement>(null);
    const mainContentRef = useRef<HTMLElement>(null);
    const [sortedTraders, setSortedTraders] = useState<Trader[]>([]);

    useEffect(() => {
        // Start with loading true
        setLoading(true);
        const sorted = [...allTraders].sort((a, b) => b.yield - a.yield);
        setSortedTraders(sorted);
        // Directly load the first page of traders
        const initialTraders = sorted.slice(0, PAGE_SIZE);
        setTraders(initialTraders);
        setPage(2); // Next page to load will be page 2
        if (initialTraders.length >= sorted.length) {
            setHasMore(false);
        }
        setLoading(false);
    }, []);

    const loadMoreTraders = () => {
        if (loading || !hasMore || searchQuery) return;
        setLoading(true);

        setTimeout(() => {
            const newTraders = sortedTraders.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
            if (newTraders.length > 0) {
                setTraders(prev => [...prev, ...newTraders]);
                setPage(prev => prev + 1);
            }
            
            // This check should use the most up-to-date state
            setTraders(currentTraders => {
                 if (currentTraders.length >= sortedTraders.length) {
                    setHasMore(false);
                }
                return currentTraders;
            });
            setLoading(false);
        }, 1000); 
    };

    useEffect(() => {
        if (inView && hasMore && !loading && !searchQuery) {
            loadMoreTraders();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [inView, hasMore, loading, searchQuery]);
    
    useEffect(() => {
        const headerTitle = headerTitleRef.current;
        const mainContent = mainContentRef.current;

        if (!mainContent || !headerTitle) return;

        const handleScroll = () => {
            if (mainContent.scrollTop > 10) {
                headerTitle.style.height = '0';
                headerTitle.style.opacity = '0';
                headerTitle.style.marginTop = '0';
            } else {
                headerTitle.style.height = '3.5rem';
                headerTitle.style.opacity = '1';
                headerTitle.style.marginTop = '0';
            }
        };

        mainContent.addEventListener('scroll', handleScroll);
        return () => mainContent.removeEventListener('scroll', handleScroll);
    }, []);

    const filteredTraders = useMemo(() => {
        if (!searchQuery) return traders;
        return sortedTraders.filter(
            trader =>
                trader.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                trader.description.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [searchQuery, traders, sortedTraders]);

  return (
    <div className="bg-background min-h-screen text-foreground flex flex-col h-screen">
      
      <header className="flex-shrink-0">
        <div ref={headerTitleRef} className="flex items-center justify-center p-4 h-14 transition-all duration-300 ease-in-out overflow-hidden">
          <h1 className="font-bold text-lg">将军榜单</h1>
        </div>

        <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-sm">
            {/* Search Bar */}
            <div className="px-4 pb-2">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                type="search"
                placeholder="请输入交易员名称和描述"
                className="pl-10 w-full bg-card border-border/60 rounded-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
            </div>

            {/* Filters */}
            <div className="flex items-center justify-between px-4 pb-3 text-sm">
                <div className="flex items-center gap-4">
                <Button variant="ghost" className="text-foreground p-0 h-auto font-bold">
                    综合排序
                </Button>
                <FilterDropdown label="收益率" />
                <FilterDropdown label="胜率" />
                </div>
            <Button variant="ghost" className="text-muted-foreground p-0 h-auto">
                更多 <ChevronDown className="ml-1 h-4 w-4" />
            </Button>
            </div>
        </div>
      </header>


      {/* Trader List */}
      <main ref={mainContentRef} className="flex-grow overflow-auto px-4 pt-2 pb-24">
        <div className="space-y-8">
            {filteredTraders.map((trader, index) => (
              <Link href={`/trader/${trader.id}`} key={`${trader.id}-${index}`}>
                <TraderCard 
                    trader={trader} 
                    rank={sortedTraders.findIndex(t => t.id === trader.id) + 1}
                    is综合排序={!searchQuery} // Only show ranks if not searching
                />
              </Link>
            ))}
        </div>
        {!searchQuery && (
             <div ref={loadMoreRef} className="flex justify-center items-center h-16 text-muted-foreground">
                {loading && (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        <span>加载中...</span>
                    </>
                )}
                {!loading && !hasMore && traders.length > 0 && (
                    <span>已经到底了</span>
                )}
            </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border/50 h-16 z-20 flex-shrink-0">
        <div className="flex justify-around items-center h-full">
            <Link href="/" passHref className="flex-1 contents">
                <button
                    onClick={() => setActiveTab('leaderboard')}
                    className={`flex flex-col items-center justify-center space-y-1 transition-colors ${
                    activeTab === 'leaderboard' ? 'text-primary' : 'text-muted-foreground'
                    }`}
                >
                    <BarChart className="h-6 w-6" />
                    <span className="text-xs font-medium">将军榜</span>
                </button>
            </Link>
            <Link href="/profile" passHref className="flex-1 contents">
              <button
                  onClick={() => setActiveTab('profile')}
                  className={`flex flex-col items-center justify-center space-y-1 transition-colors ${
                  activeTab === 'profile' ? 'text-primary' : 'text-muted-foreground'
                  }`}
              >
                  <User className="h-6 w-6" />
                  <span className="text-xs font-medium">我的</span>
              </button>
            </Link>
        </div>
      </nav>
    </div>
  )
}

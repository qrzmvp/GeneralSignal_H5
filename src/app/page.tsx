
'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import {
  Search,
  ChevronDown,
  BarChart,
  User,
  Plus,
  Loader2,
  Crown,
  ArrowRightLeft,
  X,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
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
import { FollowOrderSheet } from './components/FollowOrderSheet'
import { allTraders, Trader } from '@/lib/data'
import { cn } from '@/lib/utils'

const PAGE_SIZE = 10;
const RANK_BADGES: {[key: number]: { color: string }} = {
    1: { color: "text-yellow-400" }, // Gold
    2: { color: "text-slate-400" }, // Silver
    3: { color: "text-amber-600" },   // Bronze
}

function TraderCard({ trader, rank, is综合排序, onFollowClick }: { trader: Trader, rank: number, is综合排序: boolean, onFollowClick: () => void }) {
    const badge = is综合排序 && rank > 0 && rank <= 3 ? RANK_BADGES[rank] : null;

    return (
        <Card className="bg-card/80 backdrop-blur-sm border-border/50 overflow-hidden">
        <CardContent className="p-4">
            <div className="flex items-start gap-4">
             <div className="relative shrink-0">
                <Avatar className="h-16 w-16">
                    <AvatarImage src={trader.avatar} alt={trader.name} />
                    <AvatarFallback className="bg-muted text-muted-foreground">{trader.name.charAt(0)}</AvatarFallback>
                </Avatar>
                {badge && (
                     <Crown className={`absolute -top-1 -left-1 h-6 w-6 transform -rotate-12 ${badge.color}`} fill="currentColor" />
                )}
            </div>
            <div className="flex-grow">
                <div className="flex justify-between items-center">
                    <Link href={{ pathname: `/trader/${trader.id}`, query: { rank } }} className="flex-grow">
                        <h3 className="font-bold text-lg text-foreground hover:underline">{trader.name}</h3>
                    </Link>
                    <Button 
                        size="sm" 
                        variant="outline" 
                        className="bg-transparent text-primary border-primary hover:bg-primary/10 rounded-full px-4"
                        onClick={(e) => {
                            e.stopPropagation();
                            onFollowClick();
                        }}
                    >
                        跟单
                    </Button>
                </div>
                <Link href={{ pathname: `/trader/${trader.id}`, query: { rank } }}>
                    <p className="text-xs text-muted-foreground mt-1 hover:underline">{trader.description}</p>
                </Link>
            </div>
            </div>
            <Link href={{ pathname: `/trader/${trader.id}`, query: { rank } }}>
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
            </Link>
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
    const [page, setPage] = useState(1);
    const [traders, setTraders] = useState<Trader[]>([]);
    const [loading, setLoading] = useState(true);
    const [hasMore, setHasMore] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const { ref: loadMoreRef, inView } = useInView({ threshold: 0.1 });
    const mainContentRef = useRef<HTMLElement>(null);
    const [sortedTraders, setSortedTraders] = useState<Trader[]>([]);
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [selectedTraderId, setSelectedTraderId] = useState<number | null>(null);
    const [isHeaderVisible, setIsHeaderVisible] = useState(true);

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

    const handleFollowClick = (traderId: number) => {
        setSelectedTraderId(traderId);
        setIsSheetOpen(true);
    };

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
        const mainContent = mainContentRef.current;
        if (!mainContent) return;

        const handleScroll = () => {
            const isScrolled = mainContent.scrollTop > 10;
            setIsHeaderVisible(!isScrolled);
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
    <>
    <div className="bg-background min-h-screen text-foreground flex flex-col h-screen">
      
      <header className="flex-shrink-0">
        <div 
          className="flex items-center justify-center p-4 transition-all duration-300 ease-in-out overflow-hidden"
          style={{ 
            height: isHeaderVisible ? '3.5rem' : '0rem',
            opacity: isHeaderVisible ? 1 : 0,
            marginTop: isHeaderVisible ? '0' : '0',
          }}
        >
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
                className="pl-10 pr-10 w-full bg-card border-border/60 rounded-full [&::-webkit-search-cancel-button]:hidden"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                />
                 {searchQuery && (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 text-foreground"
                        onClick={() => setSearchQuery('')}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                )}
            </div>
            </div>

            {/* Filters */}
            <div className="flex items-center justify-start gap-4 px-4 pb-3 text-sm">
                <Button variant="ghost" className="text-foreground p-0 h-auto font-bold">
                    综合排序
                </Button>
                <FilterDropdown label="收益率" />
                <FilterDropdown label="胜率" />
            </div>
        </div>
      </header>


      {/* Trader List */}
      <main ref={mainContentRef} className="flex-grow overflow-auto px-4 pt-2 pb-24">
        <div className="grid grid-cols-1 gap-3">
            {filteredTraders.map((trader) => {
              const rank = sortedTraders.findIndex(t => t.id === trader.id) + 1;
              return (
                <TraderCard 
                    key={trader.id}
                    trader={trader} 
                    rank={rank}
                    is综合排序={!searchQuery} // Only show ranks if not searching
                    onFollowClick={() => handleFollowClick(trader.id)}
                />
              )
            })}
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
        <div className="grid grid-cols-3 items-center h-full text-center">
            <Link 
                href="/" 
                passHref
                className="flex flex-col items-center justify-center space-y-1 transition-colors w-full h-full text-primary"
            >
                <BarChart className="h-6 w-6" />
                <span className="text-xs font-medium">将军榜</span>
            </Link>
             <Link href="/trade" passHref className="relative flex flex-col items-center justify-center h-full text-muted-foreground">
                 <div className="absolute -top-5 flex items-center justify-center w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-lg border-4 border-background transition-transform active:scale-95">
                    <ArrowRightLeft className="w-6 h-6" />
                </div>
                <span className="text-xs font-medium pt-8">交易</span>
            </Link>
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
        traders={allTraders}
        defaultTraderId={selectedTraderId}
    />
    </>
  )
}

    
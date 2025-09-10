"use client"

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
    LogOut,
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
// import { useRouter } from 'next/navigation'
import {
    ResponsiveContainer,
    YAxis,
    Area,
    AreaChart
} from 'recharts'
import { useInView } from 'react-intersection-observer'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { supabase } from '@/lib/supabase'
import { getTraderAvatar } from '@/lib/trader-avatars'
import { FollowOrderSheet } from '@/app/components/FollowOrderSheet'

const PAGE_SIZE = 10;
const RANK_BADGES: {[key: number]: { color: string }} = {
        1: { color: "text-yellow-400" }, // Gold
        2: { color: "text-slate-400" }, // Silver
        3: { color: "text-amber-600" },   // Bronze
}

// Shape the DB row into the UI's expected Trader-like data
type HomeTrader = {
    id: string
    name: string
    description: string
    avatar: string
    yield: number
    winRate: number
    pnlRatio: number | null
    totalOrders: number
    chartData: { value: number }[]
}

function makeChartData(seed: number): { value: number }[] {
    // lightweight pseudo-random series for sparkline; deterministic from seed
    const out: { value: number }[] = []
    let v = (seed % 20) + 10
    for (let i = 0; i < 16; i++) {
        v += ((seed * (i + 7)) % 7) - 3
        if (v < 5) v = 5
        if (v > 60) v = 60
        out.push({ value: v })
    }
    return out
}

function TraderCard({ trader, rank, is综合排序, onFollowClick }: { trader: HomeTrader, rank: number, is综合排序: boolean, onFollowClick: () => void }) {
        // const router = useRouter()
        const badge = is综合排序 && rank > 0 && rank <= 3 ? RANK_BADGES[rank] : null;

        return (
                <Card className="bg-card/80 backdrop-blur-sm border-border/50 overflow-hidden relative">
                        <CardContent className="p-4 relative">
                        {/* 覆盖全卡片的可点击区域（直接导航，避免预取挂起） */}
                        <button
                                type="button"
                                onClick={() => {
                                        const url = `/trader/${trader.id}`
                                        if (typeof window !== 'undefined') {
                                                window.location.assign(url)
                                        }
                                }}
                                        className="absolute inset-0 z-30 block cursor-pointer"
                                aria-label={`查看 ${trader.name} 详情`}
                        />
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
                                        <h3 className="font-bold text-lg text-foreground hover:underline">{trader.name}</h3>
                                        <Button 
                                                size="sm" 
                                                variant="outline" 
                                                className="bg-transparent text-primary border-primary hover:bg-primary/10 rounded-full px-4 relative z-50"
                                                onClick={(e) => {
                                                        e.stopPropagation();
                                                        onFollowClick();
                                                }}
                                        >
                                                跟单
                                        </Button>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1 hover:underline">{trader.description || '——'}</p>
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
                                        <p className="text-sm font-semibold text-foreground mt-1">{trader.pnlRatio ?? '--'}</p>
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

type SortDirection = 'asc' | 'desc';
type SortKey = 'yield' | 'winRate' | 'default';

export default function LeaderboardPage() {
        const { user, signOut } = useAuth();
        const [page, setPage] = useState(1);
        const [traders, setTraders] = useState<HomeTrader[]>([]);
                const [loading, setLoading] = useState(false);
        const [hasMore, setHasMore] = useState(true);
        const [searchQuery, setSearchQuery] = useState('');
        const { ref: loadMoreRef, inView } = useInView({ threshold: 0.1 });
        const mainContentRef = useRef<HTMLElement>(null);
        const [isSheetOpen, setIsSheetOpen] = useState(false);
        const [selectedTraderId, setSelectedTraderId] = useState<string | null>(null);
        const [isHeaderVisible, setIsHeaderVisible] = useState(true);
        const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection }>({
                key: 'default',
                direction: 'desc',
        });

        const rpcSortBy = useMemo(() => {
            if (sortConfig.key === 'yield') return 'yield' as const
            if (sortConfig.key === 'winRate') return 'win' as const
            return 'score' as const
        }, [sortConfig.key])

        const mapRow = (r: any): HomeTrader => ({
            id: r.id,
            name: r.name,
            description: r.description || '',
            avatar: r.avatar_url || getTraderAvatar(r.name),
            yield: r?.yield_rate != null ? Number(r.yield_rate) : 0,
            winRate: r?.win_rate != null ? Number(r.win_rate) : 0,
            pnlRatio: r?.profit_loss_ratio != null ? Number(r.profit_loss_ratio) : null,
            totalOrders: r?.total_signals != null ? Number(r.total_signals) : 0,
            chartData: makeChartData(Math.abs((r.id || '').split('-').join('').slice(-6).split('').reduce((s:number,c:string)=>s + c.charCodeAt(0),0)))
        })

        const load = async (nextPage: number, reset = false) => {
            if (loading) return
            setLoading(true)
            try {
                const { data, error } = await supabase.rpc('get_traders_paged', {
                    page: nextPage,
                    page_size: PAGE_SIZE,
                    q: searchQuery ? searchQuery : null,
                    sort_by: rpcSortBy,
                    order_by: sortConfig.direction,
                })
                if (error) throw error
                const items: HomeTrader[] = (data || []).map(mapRow)
                setTraders(prev => reset ? items : [...prev, ...items])
                setHasMore(items.length >= PAGE_SIZE)
                setPage(nextPage)
            } catch (e) {
                console.debug('[home] load traders error', e)
            } finally {
                setLoading(false)
            }
        }

        // initial and when filter changes
        useEffect(() => {
            load(1, true)
            // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [searchQuery, rpcSortBy, sortConfig.direction])

        // infinite scroll
        useEffect(() => {
                if (inView && hasMore && !loading) {
                        load(page + 1)
                }
        // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [inView, hasMore, loading, page])

        const handleFollowClick = (traderId: string) => {
                setSelectedTraderId(traderId);
                setIsSheetOpen(true);
        };
    
        const handleSort = (key: SortKey) => {
                setSortConfig(prev => ({
                        key,
                        direction: prev.key === key ? (prev.direction === 'asc' ? 'desc' : 'asc') : 'desc',
                }));
        };

        const handleSortDirection = (key: SortKey, direction: SortDirection) => {
                setSortConfig({ key, direction });
        };

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

        const filteredTraders = traders // server already filtered/sorted

    return (
        <ProtectedRoute>
        <div className="bg-background min-h-screen text-foreground flex flex-col h-screen">
      
            <header className="flex-shrink-0">
                <div 
                    className="flex items-center justify-between p-4 transition-all duration-300 ease-in-out overflow-hidden"
                    style={{ 
                        height: isHeaderVisible ? '3.5rem' : '0rem',
                        opacity: isHeaderVisible ? 1 : 0,
                        marginTop: isHeaderVisible ? '0' : '0',
                    }}
                >
                    <h1 className="font-bold text-lg">将军榜单</h1>
                    <div className="flex items-center space-x-2">
                        <span className="text-sm text-muted-foreground">
                            {user?.user_metadata?.username || user?.email}
                        </span>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 rounded-full">
                                    <Avatar className="h-6 w-6">
                                        <AvatarFallback className="text-xs">
                                            {(user?.user_metadata?.username || user?.email || 'U').charAt(0).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => signOut()}>
                                    <LogOut className="mr-2 h-4 w-4" />
                                    退出登录
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
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
                                <Button variant="ghost" className={cn("p-0 h-auto", sortConfig.key === 'default' ? "text-foreground font-bold" : "text-muted-foreground")} onClick={() => handleSort('default')}>
                                        综合排序
                                </Button>
                                <div className="flex items-center">
                                        <Button variant="ghost" className={cn("p-0 h-auto", sortConfig.key === 'yield' ? "text-foreground font-bold" : "text-muted-foreground")} onClick={() => handleSort('yield')}>
                                                收益率
                                        </Button>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="text-muted-foreground hover:text-foreground p-0 h-auto">
                                                    <ChevronDown className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="start" className="bg-card">
                                                <DropdownMenuItem onSelect={() => handleSortDirection('yield', 'desc')}>由高到低</DropdownMenuItem>
                                                <DropdownMenuItem onSelect={() => handleSortDirection('yield', 'asc')}>由低到高</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                </div>
                                 <div className="flex items-center">
                                        <Button variant="ghost" className={cn("p-0 h-auto", sortConfig.key === 'winRate' ? "text-foreground font-bold" : "text-muted-foreground")} onClick={() => handleSort('winRate')}>
                                                胜率
                                        </Button>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="text-muted-foreground hover:text-foreground p-0 h-auto">
                                                    <ChevronDown className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="start" className="bg-card">
                                                <DropdownMenuItem onSelect={() => handleSortDirection('winRate', 'desc')}>由高到低</DropdownMenuItem>
                                                <DropdownMenuItem onSelect={() => handleSortDirection('winRate', 'asc')}>由低到高</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                </div>
                        </div>
                </div>
            </header>


            {/* Trader List */}
            <main ref={mainContentRef as any} className="flex-grow overflow-auto px-4 pt-2 pb-24">
                <div className="grid grid-cols-1 gap-3">
                        {filteredTraders.map((trader, idx) => {
                            const rank = idx + 1;
                            return (
                                <TraderCard 
                                        key={trader.id}
                                        trader={trader} 
                                        rank={rank}
                                        is综合排序={sortConfig.key === 'default' && !searchQuery}
                                        onFollowClick={() => handleFollowClick(trader.id)}
                                />
                            )
                        })}
                </div>
                <div ref={loadMoreRef} className="flex justify-center items-center h-16 text-muted-foreground">
                        {loading ? (
                                <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        <span>加载中...</span>
                                </>
                        ) : hasMore ? (
                                <span>上拉加载更多</span>
                        ) : (
                                <span>{traders.length > 0 ? '已经到底了' : '暂无数据'}</span>
                        )}
                </div>
            </main>

            {/* Bottom Navigation */}
            <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border/50 h-16 z-20 flex-shrink-0">
                <div className="grid grid-cols-3 items-center h-full text-center">
                        <button 
                                onClick={() => {
                                        if (typeof window !== 'undefined') {
                                                window.location.assign('/')
                                        }
                                }}
                                className="flex flex-col items-center justify-center space-y-1 transition-colors w-full h-full text-primary cursor-pointer"
                        >
                                <BarChart className="h-6 w-6" />
                                <span className="text-xs font-medium">将军榜</span>
                        </button>
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
        {(() => {
                // Map DB traders (uuid) to sheet traders (number ids)
                const sheetTraders = traders.map((t, i) => ({ id: i + 1, name: t.name }))
                const defaultSheetTraderId = selectedTraderId ? (() => {
                        const idx = traders.findIndex(t => t.id === selectedTraderId)
                        return idx >= 0 ? idx + 1 : null
                })() : null
                return (
                        <FollowOrderSheet 
                                isOpen={isSheetOpen} 
                                onOpenChange={setIsSheetOpen} 
                                traders={sheetTraders} 
                                defaultTraderId={defaultSheetTraderId as any}
                        />
                )
        })()}
        </ProtectedRoute>
    )
}

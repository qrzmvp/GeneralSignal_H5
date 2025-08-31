
'use client'

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useInView } from 'react-intersection-observer'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { BarChart, User, ArrowRightLeft, Plus, ChevronUp, ChevronDown, Settings, Edit, Loader2, RefreshCw, Layers, Upload, Bot, ClipboardCopy } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuCheckboxItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { FollowOrderSheet } from '@/app/components/FollowOrderSheet';
import { allTraders } from '@/lib/data';
import { motion, AnimatePresence } from 'framer-motion';
import { useSwipeable } from 'react-swipeable';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';


const PAGE_SIZE = 5;

function MetricItem({ label, value, subValue, valueColor }: { label: string, value: string, subValue?: string, valueColor?: string }) {
  return (
    <div className="flex flex-col space-y-1">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className={`text-lg font-semibold ${valueColor}`}>{value}</p>
      {subValue && <p className="text-xs text-muted-foreground">{subValue}</p>}
    </div>
  )
}

function PositionCard({ position }: { position: any }) {
    return (
        <Card className="bg-card/50 border-border/30">
            <CardContent className="p-4 space-y-3">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <h3 className="font-bold text-base">{position.pair}</h3>
                         <Badge variant={position.sourceType === 'auto' ? 'default' : 'secondary'} className={cn(
                            'text-xs flex items-center gap-1',
                            position.sourceType === 'auto' ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'
                        )}>
                            {position.sourceType === 'auto' ? <Bot className="w-3 h-3" /> : <ClipboardCopy className="w-3 h-3" />}
                        </Badge>
                    </div>
                   <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        {position.sourceAvatar && (
                            <Avatar className="h-5 w-5">
                                <AvatarImage src={position.sourceAvatar} alt={position.sourceName} />
                                <AvatarFallback>{position.sourceName?.charAt(0)}</AvatarFallback>
                            </Avatar>
                        )}
                        <span className="truncate text-xs">{position.sourceName}</span>
                    </div>
                </div>

                <div className="flex items-center gap-2 text-xs">
                    <Badge className={cn('px-2 py-0.5 text-xs', position.direction === '多' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400')}>
                        {position.direction}
                    </Badge>
                    <Badge variant="secondary" className="px-2 py-0.5 text-xs">{position.marginMode}</Badge>
                    <Badge variant="secondary" className="px-2 py-0.5 text-xs">{position.leverage}</Badge>
                </div>

                 <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-left border-t border-border/30 pt-3">
                    <div>
                        <p className="text-xs text-muted-foreground">收益额 (USDT)</p>
                        <p className={`text-sm font-semibold mt-1 ${position.pnl > 0 ? 'text-green-400' : 'text-red-400'}`}>{position.pnl > 0 ? '+' : ''}{position.pnl.toFixed(2)}</p>
                    </div>
                     <div className="text-right">
                        <p className="text-xs text-muted-foreground">收益率</p>
                        <p className={`text-sm font-semibold mt-1 ${position.pnlRate > 0 ? 'text-green-400' : 'text-red-400'}`}>{position.pnlRate > 0 ? '+' : ''}{position.pnlRate.toFixed(2)}%</p>
                    </div>
                </div>


                <div className="grid grid-cols-3 gap-4 text-left border-t border-border/30 pt-3">
                    <div>
                        <p className="text-xs text-muted-foreground">持仓量 (USDT)</p>
                        <p className="text-sm font-semibold text-foreground mt-1">{position.positionSize.toLocaleString()}</p>
                    </div>
                     <div>
                        <p className="text-xs text-muted-foreground">保证金 (USDT)</p>
                        <p className="text-sm font-semibold text-foreground mt-1">{position.margin.toLocaleString()}</p>
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground">维持保证金率</p>
                        <p className="text-sm font-semibold text-foreground mt-1">{position.maintenanceMarginRate}%</p>
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground">开仓均价</p>
                        <p className="text-sm font-semibold text-foreground mt-1">{position.entryPrice.toLocaleString()}</p>
                    </div>
                     <div>
                        <p className="text-xs text-muted-foreground">标记价格</p>
                        <p className="text-sm font-semibold text-foreground mt-1">{position.markPrice.toLocaleString()}</p>
                    </div>
                     <div>
                        <p className="text-xs text-muted-foreground">预估强平价</p>
                        <p className="text-sm font-semibold text-foreground mt-1">{position.liqPrice || '--'}</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}


function PendingOrderCard({ order }: { order: any }) {
    return (
        <Card className="bg-card/50 border-border/30">
            <CardContent className="p-4 space-y-3">
                <div className="flex justify-between items-center">
                     <h3 className="font-bold text-base flex items-center gap-2">
                        {order.pair}
                        <Badge variant={order.sourceType === 'auto' ? 'default' : 'secondary'} className={cn(
                            'text-xs flex items-center gap-1',
                            order.sourceType === 'auto' ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'
                        )}>
                            {order.sourceType === 'auto' ? <Bot className="w-3 h-3" /> : <ClipboardCopy className="w-3 h-3" />}
                        </Badge>
                    </h3>
                    <div className="text-sm text-muted-foreground flex items-center gap-1.5">
                        {order.sourceAvatar && (
                            <Avatar className="w-5 h-5">
                                <AvatarImage src={order.sourceAvatar} alt={order.sourceName} />
                                <AvatarFallback>{order.sourceName?.charAt(0)}</AvatarFallback>
                            </Avatar>
                        )}
                        <span className="text-xs truncate">{order.sourceName}</span>
                    </div>
                </div>

                <div className="flex justify-between items-center text-xs">
                   <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="secondary" className="px-2 py-0 text-xs">限价</Badge>
                        <Badge className={`px-2 py-0 text-xs ${order.direction === '开多' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>{order.direction}</Badge>
                        <Badge variant="secondary" className="px-2 py-0 text-xs">{order.marginMode}</Badge>
                        <Badge variant="secondary" className="px-2 py-0 text-xs">{order.leverage}</Badge>
                    </div>
                    <span className="text-muted-foreground">{order.timestamp}</span>
                </div>

                <div className="grid grid-cols-3 gap-4 text-center border-t border-border/30 pt-3">
                    <div>
                        <p className="text-xs text-muted-foreground">委托数量 (USDT)</p>
                        <p className="text-sm font-semibold text-foreground mt-1">{order.amount}</p>
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground">已成交量 (USDT)</p>
                        <p className="text-sm font-semibold text-foreground mt-1">{order.filled}</p>
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground">委托价格</p>
                        <p className="text-sm font-semibold text-foreground mt-1">{order.price}</p>
                    </div>
                </div>

                <div className="border-t border-border/30 pt-3">
                    <div className="flex justify-between items-start">
                         <div>
                            <p className="text-xs text-muted-foreground">止盈/止损</p>
                            <p className="text-sm font-semibold text-foreground mt-1">
                                <span className="text-green-400">{order.takeProfit || '--'}</span>
                                <span className="text-muted-foreground mx-1">/</span>
                                <span className="text-red-400">{order.stopLoss}</span>
                            </p>
                         </div>
                         <div className="text-right">
                            <p className="text-xs text-muted-foreground">预计盈亏比</p>
                            <p className="text-sm font-semibold text-foreground mt-1">{order.pnlRatio}</p>
                         </div>
                    </div>
                </div>

            </CardContent>
        </Card>
    );
}

interface Account {
    id: string;
    name: string;
    type: 'live' | 'demo';
    exchange: 'okx' | 'binance';
    status: 'running' | 'stopped';
}

const accounts: Account[] = [
    { id: 'okx-10001', name: '10001', type: 'live', exchange: 'okx', status: 'running' },
    { id: 'binance-20002', name: '20002', type: 'live', exchange: 'binance', status: 'stopped' },
]

const mockAccountData: { [key: string]: any } = {
    'okx-10001': {
        totalAssets: 88238.39,
        pnl: 54.00,
        availableMargin: 10000.00,
        usedMargin: 10000.00,
        winRate: 84.00,
        totalSignals: 50,
        pnlRatio: '7.8:1',
        pendingOrders: Array.from({ length: 8 }, (_, i) => {
            const sourceTrader = allTraders[i % allTraders.length];
            return {
                id: `okx-${i}`, pair: 'BTC/USDT 永续', direction: i % 2 === 0 ? '开多' : '开空', 
                sourceType: i % 3 === 0 ? 'auto' : 'manual',
                sourceName: sourceTrader.name,
                sourceAvatar: sourceTrader.avatar,
                marginMode: '全仓', leverage: '10x', timestamp: `08/23 1${i}:00:12`, amount: (1000 + Math.random() * 500).toFixed(2), filled: 0, price: (68000 + Math.random() * 1000).toFixed(2), takeProfit: (70000).toFixed(2), stopLoss: (67000).toFixed(2), pnlRatio: '2:1'
            }
        }),
        currentPositions: Array.from({ length: 3 }, (_, i) => {
            const isLong = i % 2 === 0;
            const entryPrice = 68000 - i * 500;
            const sourceTrader = allTraders[(i + 2) % allTraders.length];
            return {
                id: `okx-pos-${i}`,
                pair: 'BTC/USDT 永续',
                direction: isLong ? '多' : '空',
                marginMode: '全仓',
                leverage: '10x',
                pnl: isLong ? (240.5 - i * 100) : (-50.2 + i * 20),
                pnlRate: isLong ? (5.19 - i) : (-2.3 + i),
                positionSize: 98.54 + i * 10,
                margin: 49.25 + i * 5,
                maintenanceMarginRate: (22000 + Math.random() * 1000).toFixed(2),
                entryPrice: entryPrice,
                markPrice: entryPrice * (isLong ? 1.01 : 0.99),
                liqPrice: entryPrice * (isLong ? 0.9 : 1.1),
                sourceName: sourceTrader.name,
                sourceAvatar: sourceTrader.avatar,
                sourceType: i % 2 === 0 ? 'auto' : 'manual',
            }
        }),
    },
    'binance-20002': {
        totalAssets: 150345.12,
        pnl: 125.50,
        availableMargin: 50000.00,
        usedMargin: 25000.00,
        winRate: 92.30,
        totalSignals: 120,
        pnlRatio: '12.5:1',
        pendingOrders: Array.from({ length: 4 }, (_, i) => {
            const sourceTrader = allTraders[i % allTraders.length];
            return {
                id: `binance-${i}`, pair: 'ETH/USDT 永续', direction: i % 2 === 0 ? '开多' : '开空', 
                sourceType: 'auto', 
                sourceName: sourceTrader.name,
                sourceAvatar: sourceTrader.avatar,
                marginMode: '逐仓', leverage: '20x', timestamp: `08/23 1${i+2}:00:12`, amount: (20 + Math.random() * 10).toFixed(2), filled: 0, price: (3900 + Math.random() * 100).toFixed(2), takeProfit: (4000).toFixed(2), stopLoss: (3800).toFixed(2), pnlRatio: '5:1'
            }
        }),
        currentPositions: Array.from({ length: 1 }, (_, i) => {
            const isLong = true;
            const entryPrice = 3850;
            const sourceTrader = allTraders[3];
            return {
                id: `b-pos-${i}`,
                pair: 'ETH/USDT 永续',
                direction: isLong ? '多' : '空',
                marginMode: '逐仓',
                leverage: '20x',
                pnl: 45.8,
                pnlRate: 11.2,
                positionSize: 400.00,
                margin: 20.00,
                maintenanceMarginRate: '3500.00',
                entryPrice: entryPrice,
                markPrice: entryPrice * 1.012,
                liqPrice: entryPrice * 0.92,
                sourceName: sourceTrader.name,
                sourceAvatar: sourceTrader.avatar,
                sourceType: 'auto',
            }
        }),
    },
};

function ExchangeIcon({ exchange, className }: { exchange: 'okx' | 'binance', className?: string }) {
    const logos: { [key: string]: React.ReactNode } = {
        okx: (
             <svg className={cn("w-5 h-5", className)} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="40" height="40" fill="black"/>
                <rect x="8" y="8" width="8" height="8" fill="white"/>
                <rect x="24" y="8" width="8" height="8" fill="white"/>
                <rect x="16" y="16" width="8" height="8" fill="white"/>
                <rect x="8" y="24" width="8" height="8" fill="white"/>
                <rect x="24" y="24" width="8" height="8" fill="white"/>
            </svg>
        ),
        binance: (
            <svg className={cn("w-5 h-5", className)} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="24" height="24" rx="2" fill="#1E2026"/>
                <path d="M6.60781 12.6961L9.3039 15.3922L12 12.6961L9.3039 10L6.60781 12.6961Z" fill="#F0B90B"/>
                <path d="M12 7.3039L14.6961 10.0001L17.3922 7.3039L14.6961 4.60781L12 7.3039Z" fill="#F0B90B" />
                <path d="M12 7.3039L9.3039 10.0001L12 12.6963L14.6961 10.0001L12 7.3039Z" fill="#F0B90B"/>
                <path d="M14.6961 10L17.3922 12.6961L14.6961 15.3922L12 12.6961L14.6961 10Z" fill="#F0B90B"/>
                <path d="M12 18.0882L9.3039 15.3921L12 12.6959L14.6961 15.3921L12 18.0882Z" fill="#F0B90B"/>
                <path d="M12 12.6961L10.652 14.0441L12 15.3922L13.348 14.0441L12 12.6961Z" fill="#F0B90B"/>
            </svg>
        ),
    };
    return logos[exchange] || null;
}


const TABS = ['current', 'positions'];

export default function TradePage() {
    const [activeTab, setActiveTab] = useState('current');
    const [selectedAccountId, setSelectedAccountId] = useState(accounts[0].id);
    const [isMetricsOpen, setIsMetricsOpen] = useState(true);
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    
    // Filters for Current Orders
    const [directionFilter, setDirectionFilter] = useState('全部方向');
    const [pairFilter, setPairFilter] = useState('全部币种');
    const [timeFilterLabel, setTimeFilterLabel] = useState('近三个月');

    // Filters for Current Positions
    const [posDirectionFilter, setPosDirectionFilter] = useState('全部方向');
    const [posPairFilter, setPosPairFilter] = useState('全部币种');
    const [posTimeFilterLabel, setPosTimeFilterLabel] = useState('近三个月');

    const [accountData, setAccountData] = useState<any>(null);
    const [isSwitchingAccount, setIsSwitchingAccount] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const selectedAccount = accounts.find(acc => acc.id === selectedAccountId);

    useEffect(() => {
        setIsSwitchingAccount(true);
        // Simulate API call
        const timer = setTimeout(() => {
            const data = mockAccountData[selectedAccountId];
            setAccountData(data);
            setIsSwitchingAccount(false);
        }, 500); // 0.5 second delay to simulate network

        return () => clearTimeout(timer);
    }, [selectedAccountId]);

    const handleRefresh = () => {
        if (isRefreshing) return;
        setIsRefreshing(true);
        // In a real app, you would re-fetch data here.
        // For now, just simulate a delay.
        setTimeout(() => {
            setIsRefreshing(false);
        }, 1000);
    };


    const swipeHandlers = useSwipeable({
        onSwipedLeft: () => {
            const currentIndex = TABS.indexOf(activeTab);
            if (currentIndex < TABS.length - 1) {
                setActiveTab(TABS[currentIndex + 1]);
            }
        },
        onSwipedRight: () => {
             const currentIndex = TABS.indexOf(activeTab);
            if (currentIndex > 0) {
                setActiveTab(TABS[currentIndex - 1]);
            }
        },
        trackMouse: true,
    });


    return (
        <>
        <div className="bg-background min-h-screen text-foreground flex flex-col h-screen">
            <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-border/50 bg-background/80 px-4 backdrop-blur-sm">
                <div className="w-16 flex-shrink-0"></div>
                <div className="flex-grow flex justify-center">
                    <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
                        <SelectTrigger className="w-auto bg-transparent border-0 text-lg font-bold focus:ring-0 focus:ring-offset-0 gap-2">
                            <SelectValue>
                                <div className="flex items-center gap-2">
                                     {selectedAccount && <ExchangeIcon exchange={selectedAccount.exchange} />}
                                    <span>{selectedAccount?.name}</span>
                                </div>
                            </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                             {accounts.map(account => (
                                <SelectItem key={account.id} value={account.id}>
                                    <div className="flex items-center gap-3">
                                        <ExchangeIcon exchange={account.exchange} />
                                        <span>{account.name}</span>
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                 <div className="w-16 flex-shrink-0 flex justify-end">
                    <Link href="/my-api">
                        <Button variant="link" className="text-primary px-0 hover:no-underline">新增</Button>
                    </Link>
                </div>
            </header>

            <main className="flex-grow overflow-auto p-4 space-y-4 pb-24">
                <Card className="bg-card/50 border-border/30">
                    <Collapsible open={isMetricsOpen} onOpenChange={setIsMetricsOpen} asChild>
                        <CardContent className="p-4 pb-2">
                            {isSwitchingAccount ? (
                                <div className="flex justify-center items-center h-48">
                                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                </div>
                            ) : (
                            <>
                            <div className="flex justify-between items-start pb-0">
                                <div className="text-left space-y-1 flex-grow">
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm text-muted-foreground">
                                            账户总资产 (USDT)
                                        </p>
                                        {selectedAccount && (
                                            <Badge
                                                className={cn(
                                                    'text-xs px-1.5 py-0.5 border-0',
                                                    selectedAccount.type === 'live' && selectedAccount.status === 'running' && "bg-green-500/20 text-green-400",
                                                    selectedAccount.type === 'live' && selectedAccount.status === 'stopped' && "bg-muted text-muted-foreground",
                                                    selectedAccount.type === 'demo' && "bg-secondary text-secondary-foreground"
                                                )}
                                            >
                                                {selectedAccount.type === 'live' 
                                                    ? (selectedAccount.status === 'running' ? '实盘 · 运行中' : '实盘 · 已停止')
                                                    : '模拟'
                                                }
                                            </Badge>
                                        )}
                                    </div>
                                    <p className="text-2xl font-bold tracking-tight break-all">{accountData?.totalAssets.toLocaleString()}</p>
                                </div>
                                <Button variant="ghost" size="icon" className="text-muted-foreground -mr-2 -mt-1" onClick={() => setIsSheetOpen(true)}>
                                    <Settings className="w-5 h-5" />
                                </Button>
                            </div>
                            
                            <CollapsibleContent className="grid grid-cols-3 gap-x-4 gap-y-0 text-left pt-2">
                                <MetricItem label="总收益率" value={`+${accountData?.pnl}%`} valueColor="text-green-400" />
                                <MetricItem label="可用保证金" value={accountData?.availableMargin.toLocaleString()} />
                                <MetricItem label="累计信号" value={`${accountData?.totalSignals}`} />
                                <MetricItem label="胜率" value={`${accountData?.winRate}%`} />
                                <MetricItem label="占用保证金" value={accountData?.usedMargin.toLocaleString()} />
                                <MetricItem label="累计盈亏比" value={accountData?.pnlRatio} />
                            </CollapsibleContent>

                            <CollapsibleTrigger asChild>
                                <button className="w-full flex justify-center items-center text-muted-foreground py-1 mt-1 hover:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0">
                                    {isMetricsOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                    <span className="sr-only">Toggle</span>
                                </button>
                            </CollapsibleTrigger>
                            </>
                            )}
                        </CardContent>
                    </Collapsible>
                </Card>

                 <Tabs defaultValue="current" value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="current">当前挂单</TabsTrigger>
                        <TabsTrigger value="positions">当前持仓</TabsTrigger>
                    </TabsList>
                    <div {...swipeHandlers} className="overflow-hidden">
                        <div className={cn("flex transition-transform duration-300", {
                                "transform -translate-x-full": activeTab === 'positions',
                                "transform translate-x-0": activeTab === 'current'
                            })}>
                            <div className="w-full flex-shrink-0">
                                <div className="mt-4 space-y-3">
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-2">
                                            <FilterDropdown
                                                label={directionFilter === '全部方向' ? '方向' : directionFilter}
                                                options={['全部方向', '做多', '做空']}
                                                onSelect={setDirectionFilter}
                                            />
                                            <FilterDropdown
                                                label={pairFilter === '全部币种' ? '币种' : pairFilter}
                                                options={['全部币种', 'BTC', 'ETH', 'SOL', 'DOGE']}
                                                onSelect={setPairFilter}
                                            />
                                            <FollowTypeFilterDropdown title="跟单" />
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <FilterDropdown
                                                label={timeFilterLabel}
                                                options={['近三个月', '近半年', '近一年']}
                                                onSelect={setTimeFilterLabel}
                                            />
                                            <Button variant="ghost" size="icon" onClick={handleRefresh} className="h-8 w-8 text-muted-foreground">
                                                <RefreshCw className={cn('w-4 h-4', isRefreshing && 'animate-spin')} />
                                            </Button>
                                        </div>
                                    </div>
                                    {isSwitchingAccount ? (
                                        <div className="flex justify-center items-center h-40">
                                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                        </div>
                                    ) : accountData?.pendingOrders?.length > 0 ? (
                                        <div className="space-y-3">
                                            {accountData.pendingOrders.map((order:any) => (
                                                <PendingOrderCard key={order.id} order={order} />
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center text-muted-foreground py-10">
                                            暂无挂单
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            <div className="w-full flex-shrink-0">
                                <div className="mt-4 space-y-3">
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-2">
                                            <FilterDropdown
                                                label={posDirectionFilter === '全部方向' ? '方向' : posDirectionFilter}
                                                options={['全部方向', '做多', '做空']}
                                                onSelect={setPosDirectionFilter}
                                            />
                                            <FilterDropdown
                                                label={posPairFilter === '全部币种' ? '币种' : posPairFilter}
                                                options={['全部币种', 'BTC', 'ETH', 'SOL', 'DOGE']}
                                                onSelect={setPosPairFilter}
                                            />
                                            <FollowTypeFilterDropdown title="跟单" />
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <FilterDropdown
                                                label={posTimeFilterLabel}
                                                options={['近三个月', '近半年', '近一年']}
                                                onSelect={setPosTimeFilterLabel}
                                            />
                                             <Button variant="ghost" size="icon" onClick={handleRefresh} className="h-8 w-8 text-muted-foreground">
                                                <RefreshCw className={cn('w-4 h-4', isRefreshing && 'animate-spin')} />
                                            </Button>
                                        </div>
                                    </div>
                                    {isSwitchingAccount ? (
                                         <div className="flex justify-center items-center h-40">
                                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                        </div>
                                    ) : accountData?.currentPositions?.length > 0 ? (
                                        <div className="space-y-3">
                                            {accountData.currentPositions.map((position:any) => (
                                                <PositionCard key={position.id} position={position} />
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center text-muted-foreground py-10">
                                            暂无持仓
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </Tabs>

            </main>

            <nav className="fixed bottom-0 left-0 right-0 z-20 h-16 flex-shrink-0 border-t border-border/50 bg-card">
                <div className="grid h-full grid-cols-3 text-center">
                    <Link
                        href="/"
                        passHref
                        className="flex flex-col items-center justify-center space-y-1 text-muted-foreground transition-colors"
                    >
                        <BarChart className="h-6 w-6" />
                        <span className="text-xs font-medium">将军榜</span>
                    </Link>
                    <div className="flex flex-col items-center justify-center">
                         <Link
                            href="/trade"
                            passHref
                            className="relative -top-5 flex h-14 w-14 items-center justify-center rounded-full border-4 border-background bg-primary text-primary-foreground shadow-lg transition-transform active:scale-95"
                        >
                            <ArrowRightLeft className="w-6 h-6" />
                        </Link>
                        <span className="relative -top-5 text-xs font-medium text-primary">交易</span>
                    </div>
                    <Link
                        href="/profile"
                        passHref
                        className="flex flex-col items-center justify-center space-y-1 text-muted-foreground transition-colors"
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
            defaultTraderId={null}
        />
        </>
    )
}

function FilterDropdown({ label, options, onSelect }: { label: string; options: string[]; onSelect: (option: string) => void; }) {
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
          <DropdownMenuItem key={option} onSelect={() => onSelect(option)}>
            {option}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function FollowTypeFilterDropdown({ title }: { title: string }) {
    const [selectedType, setSelectedType] = useState('全部');

    const getLabel = () => {
        if (selectedType === '全部') return title;
        return selectedType;
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground text-sm p-0 h-auto">
                    {getLabel()}
                    <ChevronDown className="w-4 h-4 ml-1" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
                <DropdownMenuItem onSelect={() => setSelectedType('全部')}>
                    全部
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setSelectedType('自动')}>
                    自动
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setSelectedType('手动')}>
                    手动
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

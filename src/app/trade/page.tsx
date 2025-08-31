
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
import { BarChart, User, ArrowRightLeft, Plus, ChevronUp, ChevronDown, Settings, Edit, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { FollowOrderSheet } from '@/app/components/FollowOrderSheet';
import { allTraders } from '@/lib/data';
import { motion, AnimatePresence } from 'framer-motion';
import { useSwipeable } from 'react-swipeable';
import { cn } from '@/lib/utils';


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

function PendingOrderCard({ order }: { order: any }) {
    return (
        <Card className="bg-card/50 border-border/30">
            <CardContent className="p-4 space-y-3">
                <div className="flex justify-between items-center">
                     <h3 className="font-bold text-base flex items-center gap-2">
                        {order.pair}
                        <Badge variant={order.sourceType === 'auto' ? 'default' : 'secondary'} className={cn(
                            'text-xs',
                            order.sourceType === 'auto' ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'
                        )}>
                            {order.sourceType === 'auto' ? '自动' : '手动'}
                        </Badge>
                    </h3>
                    <div className="flex items-center gap-2 text-sm">
                        <Button variant="ghost" size="sm" className="p-0 h-auto text-primary">编辑</Button>
                        <Button variant="ghost" size="sm" className="p-0 h-auto text-primary">撤单</Button>
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
    exchange: 'okx' | 'binance' | 'bitget';
}

const accounts: Account[] = [
    { id: 'okx-10001', name: '10001', type: 'live', exchange: 'okx' },
    { id: 'binance-20002', name: '20002', type: 'live', exchange: 'binance' },
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
        pendingOrders: Array.from({ length: 8 }, (_, i) => ({
            id: `okx-${i}`, pair: 'BTC/USDT 永续', direction: i % 2 === 0 ? '开多' : '开空', sourceType: i % 3 === 0 ? 'auto' : 'manual', marginMode: '全仓', leverage: '10x', timestamp: `08/23 1${i}:00:12`, amount: (1000 + Math.random() * 500).toFixed(2), filled: 0, price: (68000 + Math.random() * 1000).toFixed(2), takeProfit: (70000).toFixed(2), stopLoss: (67000).toFixed(2), pnlRatio: '2:1'
        }))
    },
    'binance-20002': {
        totalAssets: 150345.12,
        pnl: 125.50,
        availableMargin: 50000.00,
        usedMargin: 25000.00,
        winRate: 92.30,
        totalSignals: 120,
        pnlRatio: '12.5:1',
        pendingOrders: Array.from({ length: 4 }, (_, i) => ({
            id: `binance-${i}`, pair: 'ETH/USDT 永续', direction: i % 2 === 0 ? '开多' : '开空', sourceType: 'auto', marginMode: '逐仓', leverage: '20x', timestamp: `08/23 1${i+2}:00:12`, amount: (20 + Math.random() * 10).toFixed(2), filled: 0, price: (3900 + Math.random() * 100).toFixed(2), takeProfit: (4000).toFixed(2), stopLoss: (3800).toFixed(2), pnlRatio: '5:1'
        }))
    },
    'demo-1': {
        totalAssets: 10000.00,
        pnl: 10.2,
        availableMargin: 8000.00,
        usedMargin: 2000.00,
        winRate: 60.00,
        totalSignals: 15,
        pnlRatio: '1.5:1',
        pendingOrders: Array.from({ length: 2 }, (_, i) => ({
            id: `demo-${i}`, pair: 'SOL/USDT 永续', direction: '开多', sourceType: 'manual', marginMode: '全仓', leverage: '5x', timestamp: `08/23 1${i+5}:00:12`, amount: (100 + Math.random() * 50).toFixed(2), filled: 0, price: (170 + Math.random() * 5).toFixed(2), takeProfit: null, stopLoss: (160).toFixed(2), pnlRatio: '--'
        }))
    }
};

function ExchangeIcon({ exchange, className }: { exchange: 'okx' | 'binance' | 'bitget', className?: string }) {
    const logos: { [key: string]: React.ReactNode } = {
        okx: (
            <svg className={cn("w-5 h-5", className)} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="10" cy="10" r="10" fill="black"/>
                <path d="M5 5L7.5 10L5 15H7.8L10 10.8L12.2 15H15L12.5 10L15 5H12.2L10 9.2L7.8 5H5Z" fill="white"/>
            </svg>
        ),
        binance: (
             <svg className={cn("w-5 h-5", className)} viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M48 0C21.49 0 0 21.49 0 48C0 74.51 21.49 96 48 96C74.51 96 96 74.51 96 48C96 21.49 74.51 0 48 0Z" fill="#F0B90B"/>
                <path d="M25.32 48.01L48.02 70.69L70.72 48.01L48.02 25.33L25.32 48.01Z" fill="white"/>
                <path d="M48.02 56.84L56.86 48.01L48.02 39.18L39.18 48.01L48.02 56.84Z" fill="white"/>
                <path d="M19.82 48.01L14.42 42.62H31.02L19.82 48.01Z" fill="white"/>
                <path d="M76.22 48.01L81.62 53.4H65.02L76.22 48.01Z" fill="white"/>
                <path d="M48.02 31.01L42.62 25.62V36.41L48.02 31.01Z" fill="white"/>
                <path d="M48.02 65.01L53.42 70.4V59.61L48.02 65.01Z" fill="white"/>
            </svg>
        ),
        bitget: (
            <svg className={cn("w-5 h-5", className)} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="10" cy="10" r="10" fill="#2166E5"/>
                <path d="M12.8083 6.08209C12.4419 5.71573 11.8581 5.71573 11.4917 6.08209L7.19173 10.3821C6.82537 10.7485 6.82537 11.3322 7.19173 11.6986L11.4917 16.0001C11.8581 16.3664 12.4419 16.3664 12.8083 16.0001C13.1746 15.6337 13.1746 15.05 12.8083 14.6836L9.12463 11.0303L12.8083 7.4566C13.1746 7.09024 13.1746 6.50645 12.8083 6.08209Z" fill="white"/>
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


    const swipeHandlers = useSwipeable({
        onSwiped: (eventData) => {
            const direction = eventData.dir === 'Left' ? 1 : -1;
            const currentIndex = TABS.indexOf(activeTab);
            const nextIndex = currentIndex + direction;
            if (nextIndex >= 0 && nextIndex < TABS.length) {
                setActiveTab(TABS[nextIndex]);
            }
        },
        trackMouse: true,
    });


    return (
        <>
        <div className="bg-background min-h-screen text-foreground flex flex-col h-screen">
            <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-border/50 bg-background/80 px-4 backdrop-blur-sm">
                <div className="w-9"></div>
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
                <Button variant="ghost" size="icon">
                    <Plus className="w-5 h-5"/>
                </Button>
            </header>

            <main className="flex-grow overflow-auto p-4 space-y-4">
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
                                                className={`text-xs px-1.5 py-0.5 border-0 ${
                                                    selectedAccount.type === 'live'
                                                    ? "bg-green-500/20 text-green-400"
                                                    : "bg-secondary text-secondary-foreground"
                                                }`}
                                            >
                                                {selectedAccount.type === 'live' ? '实盘' : '模拟'}
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
                                            label={timeFilterLabel}
                                            options={['近三个月', '近半年', '近一年']}
                                            onSelect={setTimeFilterLabel}
                                            setLabel={setTimeFilterLabel}
                                        />
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
                                                label={posDirectionFilter}
                                                options={['全部方向', '做多', '做空']}
                                                onSelect={setPosDirectionFilter}
                                                setLabel={setPosDirectionFilter}
                                            />
                                            <FilterDropdown
                                                label={posPairFilter}
                                                options={['全部币种', 'BTC', 'ETH', 'SOL', 'DOGE']}
                                                onSelect={setPosPairFilter}
                                                setLabel={setPosPairFilter}
                                            />
                                        </div>
                                        <FilterDropdown
                                            label={posTimeFilterLabel}
                                            options={['近三个月', '近半年', '近一年']}
                                            onSelect={setPosTimeFilterLabel}
                                            setLabel={setPosTimeFilterLabel}
                                        />
                                    </div>
                                    {isSwitchingAccount ? (
                                         <div className="flex justify-center items-center h-40">
                                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
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

            {/* Bottom Navigation */}
            <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border/50 h-16 z-20 flex-shrink-0">
                <div className="grid grid-cols-3 items-center h-full text-center">
                    <Link
                        href="/"
                        passHref
                        className={`flex flex-col items-center justify-center space-y-1 transition-colors w-full h-full text-muted-foreground`}
                    >
                        <BarChart className="h-6 w-6" />
                        <span className="text-xs font-medium">将军榜</span>
                    </Link>
                    <Link href="/trade" passHref className="relative flex flex-col items-center justify-center h-full">
                         <div className="absolute -top-5 flex items-center justify-center w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-lg border-4 border-background transition-transform active:scale-95">
                            <ArrowRightLeft className="w-6 h-6" />
                        </div>
                        <span className="text-xs font-medium text-primary pt-8">交易</span>
                    </Link>
                    <Link
                        href="/profile"
                        passHref
                        className={`flex flex-col items-center justify-center space-y-1 transition-colors w-full h-full text-muted-foreground`}
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

    

    


'use client'

import { useState } from 'react';
import Link from 'next/link';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { BarChart, User, ArrowRightLeft, Plus, ChevronUp, ChevronDown, Settings, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { FollowOrderSheet } from '@/app/components/FollowOrderSheet';
import { allTraders } from '@/app/page';

function MetricItem({ label, value, subValue, valueColor }: { label: string, value: string, subValue?: string, valueColor?: string }) {
  return (
    <div className="flex flex-col space-y-1">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className={`text-lg font-semibold ${valueColor}`}>{value}</p>
      {subValue && <p className="text-xs text-muted-foreground">{subValue}</p>}
    </div>
  )
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
    { id: 'demo-1', name: '模拟账户', type: 'demo', exchange: 'bitget' },
]

function ExchangeIcon({ exchange }: { exchange: Account['exchange']}) {
    if (exchange === 'okx') {
        return (
            <svg width="20" height="20" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><g clipPath="url(#clip0_105_186)"><path d="M13 21H21V13H13V21Z" fill="currentColor"></path><path d="M27 21H35V13H27V21Z" fill="currentColor"></path><path d="M13 35H21V27H13V35Z" fill="currentColor"></path><path d="M27 35H35V27H27V35Z" fill="currentColor"></path><path fillRule="evenodd" clipRule="evenodd" d="M38 6H10C7.79086 6 6 7.79086 6 10V38C6 40.2091 7.79086 42 10 42H38C40.2091 42 42 40.2091 42 38V10C42 7.79086 40.2091 6 38 6ZM10 40H38C39.1046 40 40 39.1046 40 38V10C40 8.89543 39.1046 8 38 8H10C8.89543 8 8 8.89543 8 10V38C8 39.1046 8.89543 40 10 40Z" fill="currentColor"></path></g><defs><clipPath id="clip0_105_186"><rect width="48" height="48" fill="white"></rect></clipPath></defs></svg>
        )
    }
    if (exchange === 'binance') {
        return (
             <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-foreground">
                <path d="M12 15.0625L15.0625 12L12 8.9375L8.9375 12L12 15.0625Z" fill="currentColor"/>
                <path d="M18.125 12L15.0625 8.9375L16.5938 7.40625L19.6562 10.4688L21.1875 12L19.6562 13.5312L18.125 12Z" fill="currentColor"/>
                <path d="M5.875 12L8.9375 15.0625L7.40625 16.5938L4.34375 13.5312L2.8125 12L4.34375 10.4688L5.875 12Z" fill="currentColor"/>
                <path d="M12 18.125L8.9375 15.0625L7.40625 16.5938L10.4688 19.6562L12 21.1875L13.5312 19.6562L16.5938 16.5938L15.0625 15.0625L12 18.125Z" fill="currentColor"/>
                <path d="M12 5.875L15.0625 8.9375L16.5938 7.40625L13.5312 4.34375L12 2.8125L10.4688 4.34375L7.40625 7.40625L8.9375 8.9375L12 5.875Z" fill="currentColor"/>
            </svg>
        )
    }
    if (exchange === 'bitget') {
        return (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5.33398 5.33301L8.00065 2.66634L10.6673 5.33301H5.33398Z" fill="#FFAA00"/>
                <path d="M14.6667 5.33301L17.3333 7.99967L14.6667 10.6663H9.33333L12 7.99967L9.33333 5.33301H14.6667Z" fill="#FFAA00"/>
                <path d="M5.33398 14.667L8.00065 17.3337L10.6673 14.667H5.33398Z" fill="#FFAA00"/>
                <path d="M5.33398 9.33301L2.66732 11.9997L5.33398 14.6663V9.33301Z" fill="#FFAA00"/>
            </svg>
        )
    }
    return null;
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


export default function TradePage() {
    const [activeTab, setActiveTab] = useState('trade');
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

    const selectedAccount = accounts.find(acc => acc.id === selectedAccountId);

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
                                    <p className="text-2xl font-bold tracking-tight break-all">88,238.39</p>
                                </div>
                                <Button variant="ghost" size="icon" className="text-muted-foreground -mr-2 -mt-1" onClick={() => setIsSheetOpen(true)}>
                                    <Settings className="w-5 h-5" />
                                </Button>
                            </div>
                            
                            <CollapsibleContent className="grid grid-cols-3 gap-x-4 gap-y-0 text-left pt-2">
                                <MetricItem label="总收益率" value="+54.00%" valueColor="text-green-400" />
                                <MetricItem label="可用保证金" value="10,000.00" />
                                <MetricItem label="累计信号" value="50" />
                                <MetricItem label="胜率" value="84.00%" />
                                <MetricItem label="占用保证金" value="10,000.00" />
                                <MetricItem label="累计盈亏比" value="7.8: 1" />
                            </CollapsibleContent>

                            <CollapsibleTrigger asChild>
                                <button className="w-full flex justify-center items-center text-muted-foreground py-1 mt-1 hover:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0">
                                    {isMetricsOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                    <span className="sr-only">Toggle</span>
                                </button>
                            </CollapsibleTrigger>
                        </CardContent>
                    </Collapsible>
                </Card>

                 <Tabs defaultValue="current" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="current">当前挂单</TabsTrigger>
                        <TabsTrigger value="positions">当前持仓</TabsTrigger>
                    </TabsList>
                    <TabsContent value="current" className="mt-4 space-y-3">
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
                        <div className="text-center text-muted-foreground py-10">
                            暂无挂单
                        </div>
                    </TabsContent>
                    <TabsContent value="positions" className="mt-4 space-y-3">
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
                        <div className="text-center text-muted-foreground py-10">
                            暂无持仓
                        </div>
                    </TabsContent>
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
                         <div className="absolute -top-5 flex items-center justify-center w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-lg border border-border/50 transition-transform active:scale-95">
                            <ArrowRightLeft className="w-6 h-6" />
                        </div>
                        <span className="text-xs font-medium text-muted-foreground pt-8">交易</span>
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

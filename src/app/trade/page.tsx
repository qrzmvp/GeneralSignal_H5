
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
import { ChevronLeft, BarChart, User, ArrowRightLeft, Settings, ChevronUp, ChevronDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"

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
    exchange: 'okx' | 'binance' | 'demo';
}

const accounts: Account[] = [
    { id: 'okx-10001', name: '10001', type: 'live', exchange: 'okx' },
    { id: 'binance-20002', name: '20002', type: 'live', exchange: 'binance' },
    { id: 'demo-1', name: '模拟账户', type: 'demo', exchange: 'demo' },
]

function ExchangeIcon({ exchange }: { exchange: Account['exchange']}) {
    if (exchange === 'okx') {
        return (
             <svg width="20" height="20" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M13 21h8v-8h-8v8Zm14 0h8v-8h-8v8ZM13 35h8v-8h-8v8Zm14 0h8v-8h-8v8Z" fill="currentColor"></path><path d="M6 9C6 7.343 7.343 6 9 6h30c1.657 0 3 1.343 3 3v30c0 1.657-1.343 3-3 3H9c-1.657 0-3-1.343-3-3V9Z" stroke="currentColor" strokeWidth="4"></path></svg>
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
    return null;
}


export default function TradePage() {
    const [activeTab, setActiveTab] = useState('trade');
    const [selectedAccountId, setSelectedAccountId] = useState(accounts[0].id);
    const [isMetricsOpen, setIsMetricsOpen] = useState(true);

    const selectedAccount = accounts.find(acc => acc.id === selectedAccountId);

    return (
        <div className="bg-background min-h-screen text-foreground flex flex-col h-screen">
            <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-border/50 bg-background/80 px-4 backdrop-blur-sm">
                <Link href="/" passHref>
                    <Button variant="ghost" size="icon" className="-ml-2">
                        <ChevronLeft className="h-6 w-6" />
                    </Button>
                </Link>
                <div className="flex-grow flex justify-center">
                    <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
                        <SelectTrigger className="w-auto bg-transparent border-0 text-lg font-bold focus:ring-0 focus:ring-offset-0 gap-2">
                            <SelectValue>
                                <div className="flex items-center gap-2">
                                     {selectedAccount && <ExchangeIcon exchange={selectedAccount.exchange} />}
                                    <span>{selectedAccount?.name}</span>
                                    {selectedAccount && (
                                        <Badge
                                            variant="outline"
                                            className={
                                                selectedAccount.type === 'live'
                                                ? "bg-green-500/20 text-green-400 border-green-500/30 text-xs px-1 py-0"
                                                : "bg-secondary text-secondary-foreground border-border text-xs px-1 py-0"
                                            }
                                        >
                                            {selectedAccount.type === 'live' ? '实盘' : '模拟'}
                                        </Badge>
                                    )}
                                </div>
                            </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                             {accounts.map(account => (
                                <SelectItem key={account.id} value={account.id}>
                                    <div className="flex items-center gap-3">
                                        <ExchangeIcon exchange={account.exchange} />
                                        <span>{account.name}</span>
                                        <Badge
                                            variant="outline"
                                            className={
                                                account.type === 'live'
                                                ? "bg-green-500/20 text-green-400 border-green-500/30 text-xs px-1 py-0"
                                                : "bg-secondary text-secondary-foreground border-border text-xs px-1 py-0"
                                            }
                                        >
                                            {account.type === 'live' ? '实盘' : '模拟'}
                                        </Badge>
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="w-9"></div> {/* Placeholder for spacing */}
            </header>

            <main className="flex-grow overflow-auto p-4 space-y-4">
                <Card className="bg-card/50 border-border/30">
                    <CardContent className="p-4">
                         <Collapsible open={isMetricsOpen} onOpenChange={setIsMetricsOpen}>
                            <div className="flex justify-between items-start">
                                <div className="text-left space-y-1">
                                    <p className="text-sm text-muted-foreground">
                                        账户总资产 (USDT)
                                    </p>
                                    <p className="text-2xl font-bold tracking-tight break-all">88,238.39</p>
                                </div>
                                <Button variant="outline" size="sm" className="gap-2">
                                    <Settings className="w-4 h-4"/>
                                    跟单设置
                                </Button>
                            </div>

                            <CollapsibleContent>
                                <div className="grid grid-cols-3 gap-x-4 gap-y-6 text-left pt-6 pb-4">
                                    <MetricItem label="总收益率" value="+54.00%" valueColor="text-green-400" />
                                    <MetricItem label="可用保证金" value="10,000.00" />
                                    <MetricItem label="累计信号" value="50" />
                                    <MetricItem label="胜率" value="84.00%" />
                                    <MetricItem label="占用保证金" value="10,000.00" />
                                    <MetricItem label="累计盈亏比" value="7.8: 1" />
                                </div>
                            </CollapsibleContent>

                            <CollapsibleTrigger asChild>
                                <button className="w-full flex justify-center py-1 text-muted-foreground hover:bg-accent rounded-md transition-colors">
                                    {isMetricsOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                                    <span className="sr-only">Toggle</span>
                                </button>
                            </CollapsibleTrigger>
                        </Collapsible>
                    </CardContent>
                </Card>
            </main>

            {/* Bottom Navigation */}
            <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border/50 h-16 z-20 flex-shrink-0">
                <div className="grid grid-cols-3 items-center h-full text-center">
                    <Link href="/" passHref className="flex flex-col items-center justify-center space-y-1 h-full">
                        <button
                            onClick={() => setActiveTab('leaderboard')}
                            className={`flex flex-col items-center justify-center space-y-1 transition-colors w-full h-full text-muted-foreground`}
                        >
                            <BarChart className="h-6 w-6" />
                            <span className="text-xs font-medium">将军榜</span>
                        </button>
                    </Link>
                    <div className="relative flex flex-col items-center justify-center h-full">
                        <Link href="/trade" passHref className="absolute -top-5 flex items-center justify-center">
                             <div className="flex items-center justify-center w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-lg border border-border/50 transition-transform active:scale-95">
                                <ArrowRightLeft className="w-7 h-7" />
                            </div>
                        </Link>
                        <span className="text-xs font-medium text-muted-foreground pt-8">交易</span>
                    </div>
                    <Link href="/profile" passHref className="flex flex-col items-center justify-center space-y-1 h-full">
                    <button
                        onClick={() => setActiveTab('profile')}
                        className={`flex flex-col items-center justify-center space-y-1 transition-colors w-full h-full text-muted-foreground`}
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

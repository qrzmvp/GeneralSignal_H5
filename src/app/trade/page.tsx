
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
import { ChevronLeft, BarChart, User, ArrowRightLeft } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

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
}

const accounts: Account[] = [
    { id: 'okx-10001', name: 'OKX-10001', type: 'live' },
    { id: 'binance-20002', name: 'Binance-20002', type: 'live' },
    { id: 'demo-1', name: '模拟账户', type: 'demo' },
]

export default function TradePage() {
    const [activeTab, setActiveTab] = useState('trade');
    const [selectedAccountId, setSelectedAccountId] = useState(accounts[0].id);

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
                        <SelectTrigger className="w-auto bg-transparent border-0 text-lg font-bold focus:ring-0 gap-2">
                            <SelectValue>
                                <div className="flex items-center gap-2">
                                    <span>{selectedAccount?.name}</span>
                                    {selectedAccount && (
                                        <Badge variant={selectedAccount.type === 'live' ? 'default' : 'secondary'} className="bg-green-500/20 text-green-400 border-green-500/30">
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
                                        <span>{account.name}</span>
                                        <Badge variant={account.type === 'live' ? 'default' : 'secondary'} className="bg-green-500/20 text-green-400 border-green-500/30">
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
                    <CardContent className="p-4 space-y-6">
                        <div className="text-left space-y-1">
                            <p className="text-lg text-muted-foreground">
                                账户总资产 (USDT)
                            </p>
                            <p className="text-2xl font-bold tracking-tight break-all">88,238.39</p>
                        </div>
                        <div className="grid grid-cols-3 gap-x-4 gap-y-6 text-left">
                            <MetricItem label="总收益率" value="+54.00%" valueColor="text-green-400" />
                            <MetricItem label="可用保证金" value="10,000.00" />
                            <MetricItem label="累计信号" value="50" />
                            <MetricItem label="胜率" value="84.00%" />
                            <MetricItem label="占用保证金" value="10,000.00" />
                            <MetricItem label="累计盈亏比" value="7.8: 1" />
                        </div>
                    </CardContent>
                </Card>
            </main>

            {/* Bottom Navigation */}
            <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border/50 h-16 z-20 flex-shrink-0">
                <div className="grid grid-cols-3 items-center h-full text-center">
                    <Link href="/" passHref className="flex flex-col items-center justify-center space-y-1 h-full">
                        <button
                            onClick={() => setActiveTab('leaderboard')}
                            className={`flex flex-col items-center justify-center space-y-1 transition-colors w-full h-full ${
                            activeTab === 'leaderboard' ? 'text-primary' : 'text-muted-foreground'
                            }`}
                        >
                            <BarChart className="h-6 w-6" />
                            <span className="text-xs font-medium">将军榜</span>
                        </button>
                    </Link>
                     <Link href="/trade" passHref className="flex flex-col items-center justify-center h-full">
                        <div className="relative flex flex-col items-center justify-center w-full h-full">
                            <div className="absolute -top-7 flex items-center justify-center w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-lg border border-border/50 transition-transform active:scale-95">
                                <ArrowRightLeft className="w-7 h-7" />
                            </div>
                            <span className="text-xs font-medium text-muted-foreground pt-8">交易</span>
                        </div>
                    </Link>
                    <Link href="/profile" passHref className="flex flex-col items-center justify-center space-y-1 h-full">
                    <button
                        onClick={() => setActiveTab('profile')}
                        className={`flex flex-col items-center justify-center space-y-1 transition-colors w-full h-full ${
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


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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ChevronLeft, ChevronDown, BarChart, User, ArrowRightLeft } from 'lucide-react';

function MetricItem({ label, value, subValue, valueColor }: { label: string, value: string, subValue?: string, valueColor?: string }) {
  return (
    <div className="flex flex-col space-y-1">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className={`text-lg font-semibold ${valueColor}`}>{value}</p>
      {subValue && <p className="text-xs text-muted-foreground">{subValue}</p>}
    </div>
  )
}

export default function TradePage() {
    const [activeTab, setActiveTab] = useState('trade');
    const [selectedAccount, setSelectedAccount] = useState('okx-10001');

    return (
        <div className="bg-background min-h-screen text-foreground flex flex-col h-screen">
            <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-border/50 bg-background/80 px-4 backdrop-blur-sm">
                <Link href="/" passHref>
                    <Button variant="ghost" size="icon" className="-ml-2">
                        <ChevronLeft className="h-6 w-6" />
                    </Button>
                </Link>
                <div className="flex-grow flex justify-center">
                    <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                        <SelectTrigger className="w-auto bg-transparent border-0 text-lg font-bold focus:ring-0 gap-2">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="okx-10001">OKX-10001</SelectItem>
                            <SelectItem value="binance-20002">Binance-20002</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="w-9"></div> {/* Placeholder for spacing */}
            </header>

            <main className="flex-grow overflow-auto p-4 space-y-4">
                <Card className="bg-card/50 border-border/30">
                    <CardContent className="p-4 space-y-6">
                        <div className="text-center">
                            <p className="text-lg text-muted-foreground flex items-center justify-center">
                                账户总资产
                                <Button variant="ghost" size="sm" className="ml-1 h-auto p-1 text-xs">
                                    USDT <ChevronDown className="w-3 h-3 ml-0.5"/>
                                </Button>
                            </p>
                            <p className="text-4xl font-bold tracking-tight break-all">88,238.39</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-card/50 border-border/30">
                    <CardContent className="p-4 grid grid-cols-3 gap-x-4 gap-y-6 text-left">
                        <MetricItem label="总收益率" value="+54.00%" valueColor="text-green-400" />
                        <MetricItem label="可用保证金" value="10,000.00" />
                        <MetricItem label="累计信号" value="50" />
                        <MetricItem label="胜率" value="84.00%" />
                        <MetricItem label="占用保证金" value="10,000.00" />
                        <MetricItem label="累计盈亏比" value="7.8: 1" />
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
                    <div className="relative flex justify-center">
                        <Link href="/trade" passHref className="absolute -top-7 flex flex-col items-center justify-center space-y-1 transition-transform active:scale-90">
                             <div className="flex items-center justify-center w-14 h-14 bg-card rounded-full shadow-lg border-2 border-border/50">
                                <ArrowRightLeft className="w-7 h-7 text-primary" />
                            </div>
                            <span className="text-xs font-medium text-muted-foreground">交易</span>
                        </Link>
                    </div>
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

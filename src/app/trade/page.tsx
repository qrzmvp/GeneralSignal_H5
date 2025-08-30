
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

    return (
        <div className="bg-background min-h-screen text-foreground flex flex-col h-screen">
            <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-border/50 bg-background/80 px-4 backdrop-blur-sm">
                <Link href="/" passHref>
                    <Button variant="ghost" size="icon" className="-ml-2">
                        <ChevronLeft className="h-6 w-6" />
                    </Button>
                </Link>
                <h1 className="text-lg font-bold">账户详情</h1>
                <div className="w-9"></div> {/* Placeholder for spacing */}
            </header>

            <main className="flex-grow overflow-auto p-4 space-y-4">
                <Card className="bg-card/50 border-border/30">
                    <CardContent className="p-4">
                         <Select defaultValue="okx-10001">
                            <SelectTrigger className="w-full bg-card border-border/60 text-lg font-semibold">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="okx-10001">OKX-10001</SelectItem>
                                <SelectItem value="binance-20002">Binance-20002</SelectItem>
                            </SelectContent>
                        </Select>

                        <div className="mt-6 text-center">
                            <p className="text-sm text-muted-foreground flex items-center justify-center">
                                账户总资产
                                <Button variant="ghost" size="sm" className="ml-1 h-auto p-1 text-xs">
                                    USDT <ChevronDown className="w-3 h-3 ml-0.5"/>
                                </Button>
                            </p>
                            <p className="text-4xl font-bold tracking-tight break-all">88,238,882,388,823.39</p>
                        </div>
                        
                        <div className="mt-6 grid grid-cols-3 gap-x-4 gap-y-6 text-left pt-6 border-t border-border/30">
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
                    <Link href="/trade" passHref className="contents">
                        <button className="flex items-center justify-center w-16 h-16 bg-primary text-primary-foreground rounded-full -mt-8 shadow-lg transform transition-transform active:scale-90">
                            <ArrowRightLeft className="w-7 h-7" />
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

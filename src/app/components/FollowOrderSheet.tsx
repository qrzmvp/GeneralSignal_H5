
"use client"

import { useState, useMemo, useEffect } from 'react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Slider } from "@/components/ui/slider"
import { X, Plus, AlertCircle } from "lucide-react"
import Link from 'next/link'
import { Checkbox } from '@/components/ui/checkbox'

interface Trader {
    id: number
    name: string
}

interface ExchangeAccount {
    id: string
    name: string
}

interface TradingPair {
    id: number
    pair: string
    leverage: number
}

interface FollowOrderSheetProps {
    isOpen: boolean
    onOpenChange: (isOpen: boolean) => void
    traders: Trader[]
    defaultTraderId: number | null
}

const mockAccounts: ExchangeAccount[] = [
    { id: 'binance-1', name: 'Binance (***1234)' },
    { id: 'okx-1', name: 'OKX (***5678)' },
]

export function FollowOrderSheet({ isOpen, onOpenChange, traders, defaultTraderId }: FollowOrderSheetProps) {
    const [selectedTraders, setSelectedTraders] = useState<number[]>([]);
    const [selectedAccount, setSelectedAccount] = useState<string | undefined>(mockAccounts.length > 0 ? mockAccounts[0].id : undefined);
    const [tradingPairs, setTradingPairs] = useState<TradingPair[]>([{ id: 1, pair: 'BTC/USDT 永续', leverage: 20 }]);
    const [fundStrategy, setFundStrategy] = useState('ratio');
    const [ratioAmount, setRatioAmount] = useState('100');

    useEffect(() => {
        if (isOpen && defaultTraderId !== null && !selectedTraders.includes(defaultTraderId)) {
            setSelectedTraders([defaultTraderId]);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, defaultTraderId]);

     const handleTraderSelectionChange = (traderId: number) => {
        setSelectedTraders(prev => 
            prev.includes(traderId) 
                ? prev.filter(id => id !== traderId)
                : [...prev, traderId]
        );
    };

    const addTradingPair = () => {
        setTradingPairs([...tradingPairs, { id: Date.now(), pair: '', leverage: 10 }]);
    };

    const removeTradingPair = (id: number) => {
        setTradingPairs(tradingPairs.filter(p => p.id !== id));
    };

    const handlePairChange = (id: number, value: string) => {
        setTradingPairs(tradingPairs.map(p => p.id === id ? { ...p, pair: value } : p));
    };

    const handleLeverageChange = (id: number, value: number[]) => {
        setTradingPairs(tradingPairs.map(p => p.id === id ? { ...p, leverage: value[0] } : p));
    };

    const selectedTraderNames = useMemo(() => {
        const names = traders.filter(t => selectedTraders.includes(t.id)).map(t => t.name);
        if (names.length === 0) return "请选择交易信号";
        if (names.length > 2) return `${names.slice(0, 2).join(', ')}等${names.length}位`;
        return names.join(', ');
    }, [selectedTraders, traders]);

    return (
        <Sheet open={isOpen} onOpenChange={onOpenChange}>
            <SheetContent side="bottom" className="rounded-t-lg max-h-[90vh] flex flex-col">
                <SheetHeader className="text-center py-4 border-b">
                    <SheetTitle>跟单设置</SheetTitle>
                </SheetHeader>

                <div className="flex-grow overflow-y-auto p-4 space-y-6">
                    {/* Trader Selection */}
                    <div className="space-y-2">
                        <Label>交易信号</Label>
                         <Select>
                            <SelectTrigger>
                                <SelectValue placeholder={selectedTraderNames} />
                            </SelectTrigger>
                            <SelectContent>
                                {traders.map(trader => (
                                     <div key={trader.id} className="flex items-center px-2 py-1.5"
                                         // Prevent dropdown from closing when clicking checkbox
                                        onClick={(e) => e.stopPropagation()}
                                     >
                                        <Checkbox
                                            id={`trader-${trader.id}`}
                                            checked={selectedTraders.includes(trader.id)}
                                            onCheckedChange={() => handleTraderSelectionChange(trader.id)}
                                        />
                                        <Label htmlFor={`trader-${trader.id}`} className="ml-2 font-normal cursor-pointer flex-grow">
                                            {trader.name}
                                        </Label>
                                    </div>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Exchange Account */}
                    <div className="space-y-2">
                        <Label htmlFor="exchange-account">交易所账户</Label>
                        {mockAccounts.length > 0 ? (
                             <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                                <SelectTrigger id="exchange-account">
                                    <SelectValue placeholder="选择交易所账户" />
                                </SelectTrigger>
                                <SelectContent>
                                    {mockAccounts.map(account => (
                                        <SelectItem key={account.id} value={account.id}>{account.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        ) : (
                            <div className="flex items-center justify-between p-3 rounded-md bg-destructive/10 border border-destructive/20 text-sm">
                                <div className="flex items-center gap-2 text-destructive">
                                    <AlertCircle className="w-5 h-5"/>
                                    <p>暂无可用账户</p>
                                </div>
                                <Link href="/profile">
                                    <Button variant="link" className="p-0 h-auto text-destructive" onClick={() => onOpenChange(false)}>
                                        前往绑定
                                    </Button>
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Trading Pairs */}
                    <div className="space-y-4">
                        <Label>交易对设置</Label>
                        <div className="space-y-4">
                            {tradingPairs.map((tp, index) => (
                                <div key={tp.id} className="p-3 rounded-md border space-y-4 relative">
                                    {tradingPairs.length > 1 && (
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="absolute -top-3 -right-3 h-6 w-6 bg-background rounded-full"
                                            onClick={() => removeTradingPair(tp.id)}
                                        >
                                            <X className="w-4 h-4" />
                                        </Button>
                                    )}
                                    <div className="space-y-2">
                                        <Label htmlFor={`pair-${tp.id}`}>交易对</Label>
                                        <Input 
                                            id={`pair-${tp.id}`} 
                                            placeholder="例如 BTC/USDT 永续"
                                            value={tp.pair}
                                            onChange={(e) => handlePairChange(tp.id, e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <Label htmlFor={`leverage-${tp.id}`}>杠杆</Label>
                                            <span className="text-primary font-semibold">{tp.leverage}x</span>
                                        </div>
                                        <Slider
                                            id={`leverage-${tp.id}`}
                                            min={1}
                                            max={125}
                                            step={1}
                                            value={[tp.leverage]}
                                            onValueChange={(value) => handleLeverageChange(tp.id, value)}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                        <Button variant="outline" className="w-full" onClick={addTradingPair}>
                            <Plus className="mr-2 h-4 w-4" />
                            添加交易对
                        </Button>
                    </div>

                    {/* Fund Management */}
                    <div className="space-y-3">
                        <Label>资金管理</Label>
                        <RadioGroup value={fundStrategy} onValueChange={setFundStrategy}>
                            <div className="flex items-center justify-between p-3 rounded-md border has-[:checked]:border-primary">
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="ratio" id="ratio" />
                                    <Label htmlFor="ratio" className="font-normal">按比例复投</Label>
                                </div>
                                {fundStrategy === 'ratio' && (
                                    <div className="relative w-24">
                                        <Input 
                                            type="number" 
                                            className="pr-6" 
                                            value={ratioAmount}
                                            onChange={(e) => setRatioAmount(e.target.value)}
                                        />
                                        <span className="absolute inset-y-0 right-2 flex items-center text-muted-foreground">%</span>
                                    </div>
                                )}
                            </div>
                             <div className="flex items-center space-x-2 p-3 rounded-md border has-[:checked]:border-primary">
                                <RadioGroupItem value="fixed" id="fixed" />
                                <Label htmlFor="fixed" className="font-normal">按固定金额</Label>
                            </div>
                        </RadioGroup>
                    </div>
                </div>

                <SheetFooter className="p-4 border-t">
                    <Button type="submit" className="w-full h-11" onClick={() => onOpenChange(false)}>确认</Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    )
}

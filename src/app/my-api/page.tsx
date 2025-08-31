
'use client'

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ChevronLeft, Plus, Trash2, Edit } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useSwipeable } from 'react-swipeable';

// Mock Data
const mockApiKeys = [
    { 
        id: 'okx-1', 
        exchange: 'okx', 
        name: '我的主力OKX', 
        apiKey: 'abc...xyz',
        apiSecret: 'sec...ret',
        passphrase: 'pass...ase',
        createdAt: '2023-08-01 10:30:15',
        updatedAt: '2023-08-20 14:05:22'
    },
    { 
        id: 'binance-1', 
        exchange: 'binance', 
        name: 'Binance小号', 
        apiKey: '123...789',
        apiSecret: 'scr...t12',
        passphrase: '',
        createdAt: '2023-07-15 09:00:41',
        updatedAt: '2023-07-15 09:00:41'
    }
];


function ExchangeIcon({ exchange, className }: { exchange: 'okx' | 'binance', className?: string }) {
    const logos: { [key: string]: React.ReactNode } = {
        okx: (
             <svg className={cn("w-8 h-8", className)} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="40" height="40" fill="black"/>
                <rect x="8" y="8" width="8" height="8" fill="white"/>
                <rect x="24" y="8" width="8" height="8" fill="white"/>
                <rect x="16" y="16" width="8" height="8" fill="white"/>
                <rect x="8" y="24" width="8" height="8" fill="white"/>
                <rect x="24" y="24" width="8" height="8" fill="white"/>
            </svg>
        ),
        binance: (
            <svg className={cn("w-8 h-8", className)} viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="96" height="96" fill="black"/>
                <path d="M64.2197 48.002L76.8016 35.4201L64.2197 22.8382L51.6378 35.4201L64.2197 48.002Z" fill="#F0B90B"/>
                <path d="M51.6378 60.5839L64.2197 73.1658L76.8016 60.5839L64.2197 48.002L51.6378 60.5839Z" fill="#F0B90B"/>
                <path d="M39.0559 48.002L51.6378 35.4201L39.0559 22.8382L26.474 35.4201L39.0559 48.002Z" fill="#F0B90B"/>
                <path d="M51.6378 60.5839L39.0559 48.002L26.474 60.5839L39.0559 73.1658L51.6378 60.5839Z" fill="#F0B90B"/>
                <path d="M51.6378 48.002L57.9288 41.7111L51.6378 35.4201L45.3469 41.7111L51.6378 48.002Z" fill="#F0B90B"/>
            </svg>
        ),
    };
    return logos[exchange] || null;
}

function AddApiDialog() {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button className="w-full h-12 text-base font-bold">
                    <Plus className="mr-2 h-5 w-5" />
                    新增API
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[90vw] sm:max-w-md rounded-lg">
                <DialogHeader>
                    <DialogTitle>新增交易所API</DialogTitle>
                    <DialogDescription>请填写您的交易所API信息以绑定账户。</DialogDescription>
                </DialogHeader>
                <form onSubmit={(e) => {
                    // Basic form validation handled by `required` attribute
                    // In a real app, you'd handle form submission logic here.
                    console.log('Form submitted');
                }}>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="exchange">交易所</Label>
                            <Select required>
                                <SelectTrigger id="exchange">
                                    <SelectValue placeholder="请选择交易所" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="okx">OKX</SelectItem>
                                    <SelectItem value="binance">Binance</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="name">账户名称</Label>
                            <Input id="name" placeholder="为您的API起一个名称" required />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="api-key">API Key</Label>
                            <Input id="api-key" placeholder="请输入API Key" required />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="api-secret">API Secret</Label>
                            <Input id="api-secret" type="password" placeholder="请输入API Secret" required />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="passphrase">Passphrase</Label>
                            <Input id="passphrase" type="password" placeholder="请输入Passphrase (如有)" required />
                        </div>
                    </div>
                    <DialogFooter className="flex-row justify-end gap-2">
                        <DialogClose asChild>
                            <Button type="button" variant="secondary">取消</Button>
                        </DialogClose>
                        <DialogClose asChild>
                            <Button type="submit">确认绑定</Button>
                        </DialogClose>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

function ApiCard({ apiKey }: { apiKey: typeof mockApiKeys[0] }) {
  return (
    <Card className="bg-card/50 border-border/30">
      <CardContent className="p-4 space-y-3">
        <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
                <ExchangeIcon exchange={apiKey.exchange as 'okx' | 'binance'} />
                <h3 className="font-bold text-lg">{apiKey.name}</h3>
            </div>
            <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:text-primary/80">
                    <Edit className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:text-primary/80">
                    <Trash2 className="h-4 w-4" />
                </Button>
            </div>
        </div>
        <div className="border-t border-border/30 pt-3 text-sm space-y-2 font-mono">
            <div className="flex justify-between">
                <span className="text-muted-foreground">API Key:</span>
                <span className="text-foreground">{apiKey.apiKey}</span>
            </div>
            <div className="flex justify-between">
                <span className="text-muted-foreground">API Secret:</span>
                <span className="text-foreground">{apiKey.apiSecret}</span>
            </div>
             {apiKey.passphrase && (
                 <div className="flex justify-between">
                    <span className="text-muted-foreground">Passphrase:</span>
                    <span className="text-foreground">{apiKey.passphrase}</span>
                </div>
            )}
        </div>
        <div className="border-t border-border/30 pt-3 text-xs text-muted-foreground space-y-1.5">
             <div className="flex justify-between">
                <span>创建时间:</span>
                <span>{apiKey.createdAt}</span>
            </div>
             <div className="flex justify-between">
                <span>更新时间:</span>
                <span>{apiKey.updatedAt}</span>
            </div>
        </div>
      </CardContent>
    </Card>
  )
}

const TABS = ['okx', 'binance'];

export default function MyApiPage() {
    const [apiKeys, setApiKeys] = useState(mockApiKeys);
    const [activeTab, setActiveTab] = useState('okx');

    const okxKeys = apiKeys.filter(key => key.exchange === 'okx');
    const binanceKeys = apiKeys.filter(key => key.exchange === 'binance');

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
        <div className="bg-background min-h-screen text-foreground flex flex-col">
            <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-border/50 bg-background/80 px-4 backdrop-blur-sm">
                <Link href="/profile" passHref>
                    <Button variant="ghost" size="icon">
                        <ChevronLeft className="h-6 w-6" />
                    </Button>
                </Link>
                <h1 className="text-lg font-bold">我的API</h1>
                <div className="w-9"></div> {/* Placeholder for spacing */}
            </header>
            
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex flex-col flex-grow">
                <div className="px-4 pt-4">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="okx">OKX</TabsTrigger>
                        <TabsTrigger value="binance">Binance</TabsTrigger>
                    </TabsList>
                </div>
                
                <main className="flex-grow overflow-auto p-4" >
                    <div {...swipeHandlers} className="overflow-hidden">
                        <div className={cn("flex transition-transform duration-300", {
                            "transform -translate-x-full": activeTab === 'binance',
                            "transform translate-x-0": activeTab === 'okx'
                        })}>
                             <div className="w-full flex-shrink-0">
                                <TabsContent value="okx" className="mt-0 space-y-4">
                                    {okxKeys.length === 0 ? (
                                        <div className="text-center text-muted-foreground pt-20">
                                            <p>您还没有绑定任何OKX API。</p>
                                            <p>请点击下方按钮新增。</p>
                                        </div>
                                    ) : (
                                        okxKeys.map(key => (
                                            <ApiCard key={key.id} apiKey={key} />
                                        ))
                                    )}
                                </TabsContent>
                            </div>
                            <div className="w-full flex-shrink-0">
                                <TabsContent value="binance" className="mt-0 space-y-4">
                                    {binanceKeys.length === 0 ? (
                                        <div className="text-center text-muted-foreground pt-20">
                                            <p>您还没有绑定任何Binance API。</p>
                                            <p>请点击下方按钮新增。</p>
                                        </div>
                                    ) : (
                                        binanceKeys.map(key => (
                                            <ApiCard key={key.id} apiKey={key} />
                                        ))
                                    )}
                                </TabsContent>
                            </div>
                        </div>
                    </div>
                </main>
            </Tabs>

            <footer className="sticky bottom-0 z-10 p-4 border-t border-border/50 bg-background/80 backdrop-blur-sm">
                <AddApiDialog />
            </footer>
        </div>
    );
}

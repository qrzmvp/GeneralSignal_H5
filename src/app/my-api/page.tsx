
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
import { ChevronLeft, Plus, Trash2, Edit } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

// Mock Data
const mockApiKeys = [
    { 
        id: 'okx-1', 
        exchange: 'okx', 
        name: '我的主力OKX', 
        apiKey: 'abc...xyz',
        apiSecret: 'sec...ret',
        passphrase: 'pass...ase'
    },
    { 
        id: 'binance-1', 
        exchange: 'binance', 
        name: 'Binance小号', 
        apiKey: '123...789',
        apiSecret: 'scr...t12',
        passphrase: ''
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
            <div className="flex items-center gap-1 p-1 bg-background/50 rounded-full">
                <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:bg-primary/20 hover:text-primary rounded-full">
                    <Edit className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/20 hover:text-destructive rounded-full">
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
      </CardContent>
    </Card>
  )
}

export default function MyApiPage() {
    const [apiKeys, setApiKeys] = useState(mockApiKeys);

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

            <main className="flex-grow overflow-auto p-4 space-y-4">
                {apiKeys.length === 0 ? (
                    <div className="text-center text-muted-foreground pt-20">
                        <p>您还没有绑定任何API。</p>
                        <p>请点击下方按钮新增。</p>
                    </div>
                ) : (
                    apiKeys.map(key => (
                        <ApiCard key={key.id} apiKey={key} />
                    ))
                )}
            </main>

            <footer className="sticky bottom-0 z-10 p-4 border-t border-border/50 bg-background/80 backdrop-blur-sm">
                <AddApiDialog />
            </footer>
        </div>
    );
}

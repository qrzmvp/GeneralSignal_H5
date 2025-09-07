
'use client'

import { useState, useEffect } from 'react';
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
import { ChevronLeft, Plus, Trash2, Edit, Eye, EyeOff } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useSwipeable } from 'react-swipeable';
import { Badge } from '@/components/ui/badge';

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
        updatedAt: '2023-08-20 14:05:22',
        status: 'running' as 'running' | 'stopped'
    },
    { 
        id: 'binance-1', 
        exchange: 'binance', 
        name: 'Binance小号', 
        apiKey: '123...789',
        apiSecret: 'scr...t12',
        passphrase: '',
        createdAt: '2023-07-15 09:00:41',
        updatedAt: '2023-07-15 09:00:41',
        status: 'stopped' as 'running' | 'stopped'
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
            <svg className={cn("w-8 h-8", className)} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
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

function ApiDialog({ apiKey, children }: { apiKey?: (typeof mockApiKeys)[0] | null, children: React.ReactNode }) {
    const isEditMode = !!apiKey;

    // Use state to manage form inputs
    const [exchange, setExchange] = useState(apiKey?.exchange || '');
    const [name, setName] = useState(apiKey?.name || '');
    const [key, setKey] = useState(apiKey?.apiKey || '');
    const [secret, setSecret] = useState(apiKey?.apiSecret || '');
    const [passphrase, setPassphrase] = useState(apiKey?.passphrase || '');
    const [open, setOpen] = useState(false);
    const [showKey, setShowKey] = useState(false);
    const [showSecret, setShowSecret] = useState(false);
    const [showPass, setShowPass] = useState(false);

    // Effect to update form when dialog opens for editing
    useEffect(() => {
        if (open && isEditMode) {
            setExchange(apiKey?.exchange || '');
            setName(apiKey?.name || '');
            setKey(apiKey?.apiKey || '');
            setSecret(apiKey?.apiSecret || '');
            setPassphrase(apiKey?.passphrase || '');
        }
        if (!open) {
             // Reset form on close
            setExchange('');
            setName('');
            setKey('');
            setSecret('');
            setPassphrase('');
            setShowKey(false);
            setShowSecret(false);
            setShowPass(false);
        }
    }, [open, apiKey, isEditMode]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // In a real app, you would handle form submission logic here.
        // For now, we just log it and close the dialog.
        console.log({ exchange, name, key, secret, passphrase });
        setOpen(false); // Close dialog on submit
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="max-w-[90vw] sm:max-w-md rounded-lg">
                <DialogHeader>
                    <DialogTitle>{isEditMode ? "编辑API" : "新增交易所API"}</DialogTitle>
                    <DialogDescription>
                        {isEditMode ? "请修改您的API信息。" : "请填写您的交易所API信息以绑定账户。"}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="exchange">交易所</Label>
                            <Select required value={exchange} onValueChange={setExchange}>
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
                            <Input id="name" placeholder="为您的API起一个名称" required value={name} onChange={e => setName(e.target.value)} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="api-key">API Key</Label>
                            <div className="relative">
                                <Input id="api-key" type={showKey ? 'text' : 'password'} placeholder="请输入API Key" required value={key} onChange={e => setKey(e.target.value)} />
                                <button type="button" aria-label={showKey ? '隐藏' : '显示'} onClick={() => setShowKey(v => !v)} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground">
                                    {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="api-secret">API Secret</Label>
                            <div className="relative">
                                <Input id="api-secret" type={showSecret ? 'text' : 'password'} placeholder="请输入API Secret" required value={secret} onChange={e => setSecret(e.target.value)} />
                                <button type="button" aria-label={showSecret ? '隐藏' : '显示'} onClick={() => setShowSecret(v => !v)} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground">
                                    {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="passphrase">Passphrase</Label>
                            <div className="relative">
                                <Input id="passphrase" type={showPass ? 'text' : 'password'} placeholder="请输入Passphrase (如有)" value={passphrase} onChange={e => setPassphrase(e.target.value)} />
                                <button type="button" aria-label={showPass ? '隐藏' : '显示'} onClick={() => setShowPass(v => !v)} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground">
                                    {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>
                    </div>
                    <DialogFooter className="flex-row justify-end gap-2">
                        <Button type="button" variant="secondary" onClick={() => setOpen(false)}>取消</Button>
                        <Button type="submit">{isEditMode ? '确认修改' : '确认绑定'}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function maskMiddle(txt: string, left = 3, right = 3) {
    if (!txt) return ''
    if (txt.length <= left + right) return txt
    return `${txt.slice(0, left)}...${txt.slice(-right)}`
}

function ApiCard({ apiKey }: { apiKey: (typeof mockApiKeys)[0] }) {
    const [showKey, setShowKey] = useState(false)
    const [showSecret, setShowSecret] = useState(false)
    const [showPass, setShowPass] = useState(false)
    return (
    <Card className="bg-card/50 border-border/30">
      <CardContent className="p-4 space-y-3">
        <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
                <ExchangeIcon exchange={apiKey.exchange as 'okx' | 'binance'} />
                <h3 className="font-bold text-lg">{apiKey.name}</h3>
                <Badge
                    className={cn(
                        'text-xs px-2 py-1 border-0 flex items-center gap-1.5',
                        apiKey.status === 'running'
                        ? "bg-green-500/20 text-green-400"
                        : "bg-muted text-muted-foreground"
                    )}
                >
                    <div className={cn("w-2 h-2 rounded-full", apiKey.status === 'running' ? 'bg-green-500' : 'bg-muted-foreground/50')} />
                    {apiKey.status === 'running' ? '运行中' : '已停止'}
                </Badge>
            </div>
            <div className="flex items-center gap-1">
                <ApiDialog apiKey={apiKey}>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:text-primary/80">
                        <Edit className="h-4 w-4" />
                    </Button>
                </ApiDialog>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:text-primary/80">
                    <Trash2 className="h-4 w-4" />
                </Button>
            </div>
        </div>
                <div className="border-t border-border/30 pt-3 text-sm space-y-2 font-mono">
                    <div className="flex items-center justify-between gap-2">
                        <span className="text-muted-foreground">API Key:</span>
                        <div className="flex items-center gap-2">
                            <span className="text-foreground select-all">{showKey ? apiKey.apiKey : maskMiddle(apiKey.apiKey)}</span>
                            <button aria-label={showKey ? '隐藏' : '显示'} className="text-muted-foreground" onClick={() => setShowKey(v => !v)}>
                                {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                        <span className="text-muted-foreground">API Secret:</span>
                        <div className="flex items-center gap-2">
                            <span className="text-foreground select-all">{showSecret ? apiKey.apiSecret : '••••••••'}</span>
                            <button aria-label={showSecret ? '隐藏' : '显示'} className="text-muted-foreground" onClick={() => setShowSecret(v => !v)}>
                                {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                    </div>
                    {apiKey.passphrase !== undefined && apiKey.passphrase !== null && apiKey.passphrase !== '' && (
                        <div className="flex items-center justify-between gap-2">
                            <span className="text-muted-foreground">Passphrase:</span>
                            <div className="flex items-center gap-2">
                                <span className="text-foreground select-all">{showPass ? apiKey.passphrase : '••••••••'}</span>
                                <button aria-label={showPass ? '隐藏' : '显示'} className="text-muted-foreground" onClick={() => setShowPass(v => !v)}>
                                    {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
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
                <ApiDialog>
                    <Button className="w-full h-12 text-base font-bold">
                        <Plus className="mr-2 h-5 w-5" />
                        新增API
                    </Button>
                </ApiDialog>
            </footer>
        </div>
    );
}

    
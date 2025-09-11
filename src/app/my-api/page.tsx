
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
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ChevronLeft, Plus, Trash2, Edit, Eye, EyeOff, Loader2 } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useSwipeable } from 'react-swipeable';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'

type ApiKeyPublic = {
    id: string
    user_id: string
    name: string
    exchange: 'okx' | 'binance'
    api_key: string
    api_secret: string
    passphrase: string | null
    status: 'running' | 'stopped'
    created_at: string
    updated_at: string
}


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
            <svg className={cn("w-8 h-8", className)} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="32" height="32" rx="4" fill="#1E2026"/>
                {/* Binance BNB Logo - 经典5钻石排列 */}
                <g transform="translate(4, 4)">
                    {/* 顶部钻石 */}
                    <path d="M12 3L15.5 6.5L12 10L8.5 6.5L12 3Z" fill="#F0B90B"/>
                    {/* 左侧钻石 */}
                    <path d="M4.5 10.5L8 7L11.5 10.5L8 14L4.5 10.5Z" fill="#F0B90B"/>
                    {/* 右侧钻石 */}
                    <path d="M12.5 10.5L16 7L19.5 10.5L16 14L12.5 10.5Z" fill="#F0B90B"/>
                    {/* 底部钻石 */}
                    <path d="M12 14L15.5 17.5L12 21L8.5 17.5L12 14Z" fill="#F0B90B"/>
                    {/* 中央钻石 */}
                    <path d="M12 7L15.5 10.5L12 14L8.5 10.5L12 7Z" fill="#F0B90B"/>
                </g>
            </svg>
        ),
    };
    return logos[exchange] || null;
}

function ApiDialog({ apiKey, onSaved, children }: { apiKey?: ApiKeyPublic | null, onSaved: () => void, children: React.ReactNode }) {
    const isEditMode = !!apiKey;
    const { user } = useAuth()
    const { toast } = useToast()

    // Use state to manage form inputs
    const [exchange, setExchange] = useState<ApiKeyPublic['exchange']>(apiKey?.exchange || 'okx');
    const [name, setName] = useState(apiKey?.name || '');
    const [key, setKey] = useState('');
    const [secret, setSecret] = useState('');
    const [passphrase, setPassphrase] = useState('');
    const [open, setOpen] = useState(false);
    const [showKey, setShowKey] = useState(false);
    const [showSecret, setShowSecret] = useState(false);
    const [showPass, setShowPass] = useState(false);
    const [submitting, setSubmitting] = useState(false)

    // Effect to update form when dialog opens for editing
    useEffect(() => {
        if (open && isEditMode) {
            setExchange(apiKey?.exchange || 'okx');
            setName(apiKey?.name || '');
            // 编辑态：默认以密文展示，但值预填（小眼睛可切换为明文）
            setKey(apiKey?.api_key || '');
            setSecret((apiKey as any)?.api_secret || '');
            setPassphrase((apiKey as any)?.passphrase || '');
        }
        if (!open) {
             // Reset form on close
            setExchange('okx');
            setName('');
            setKey('');
            setSecret('');
            setPassphrase('');
            setShowKey(false);
            setShowSecret(false);
            setShowPass(false);
        }
    }, [open, apiKey, isEditMode]);

        const handleSubmit = async (e: React.FormEvent) => {
                e.preventDefault();
                setSubmitting(true)
                try {
                    if (!user?.id) {
                        toast({ title: '未登录', description: '请先登录后再操作', variant: 'destructive' as any })
                        return
                    }
                    if (!key.trim() || !secret.trim()) {
                        toast({ title: '校验失败', description: '请填写 API Key 和 API Secret', variant: 'destructive' as any })
                        return
                    }
                    if (exchange === 'okx' && !passphrase.trim()) {
                        toast({ title: '校验失败', description: 'OKX 需要填写 Passphrase', variant: 'destructive' as any })
                        return
                    }
                    const normalizedPass = passphrase.trim() === '' ? null : passphrase
                    if (isEditMode && apiKey) {
                        // 编辑模式强制三项必填并全部更新
                        const update: any = { name, exchange, api_key: key, api_secret: secret, passphrase: normalizedPass }
                        const { error } = await supabase.from('api_keys').update(update).eq('id', apiKey.id)
                        if (error) throw error
                    } else {
                        const insert = {
                            user_id: user?.id,
                            name,
                            exchange,
                            api_key: key,
                            api_secret: secret,
                            passphrase: normalizedPass,
                            status: 'running' as const,
                        }
                        const { error } = await supabase.from('api_keys').insert(insert as any)
                        if (error) throw error
                    }
                    toast({ title: isEditMode ? '修改成功' : '绑定成功' })
                    onSaved()
                    setOpen(false)
                } catch (err) {
                        console.error('save api key error', err)
                        const anyErr = err as any
                        if (anyErr?.code === '23505') {
                        toast({ title: '绑定失败', description: '该交易所下该 API Key 已存在', variant: 'destructive' as any })
                    } else {
                            toast({ title: '操作失败', description: (anyErr?.message as string) || '请稍后重试', variant: 'destructive' as any })
                    }
                } finally {
                    setSubmitting(false)
                }
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
                            <Select required value={exchange} onValueChange={(v) => setExchange(v as ApiKeyPublic['exchange'])}>
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
                <Input id="passphrase" type={showPass ? 'text' : 'password'} placeholder="请输入Passphrase（OKX 必填，Binance 可选）" required={exchange === 'okx'} value={passphrase} onChange={e => setPassphrase(e.target.value)} />
                                <button type="button" aria-label={showPass ? '隐藏' : '显示'} onClick={() => setShowPass(v => !v)} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground">
                                    {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>
                    </div>
                                        <DialogFooter className="flex-row justify-end gap-2">
                                                <Button type="button" variant="secondary" onClick={() => setOpen(false)}>取消</Button>
                                                <Button type="submit" disabled={submitting}>
                                                    {submitting ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />提交中</>) : (isEditMode ? '确认修改' : '确认绑定')}
                                                </Button>
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

function ApiCard({ apiKey, onEdit, onDelete, onToggle }: { apiKey: ApiKeyPublic, onEdit: (k: ApiKeyPublic) => void, onDelete: (k: ApiKeyPublic) => void, onToggle: (k: ApiKeyPublic) => void }) {
    const [showKey, setShowKey] = useState(false)
    const [showSecret, setShowSecret] = useState(false)
    const [showPass, setShowPass] = useState(false)
    return (
    <Card className="bg-card/50 border-border/30">
      <CardContent className="p-4 space-y-3">
        <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
                <ExchangeIcon exchange={apiKey.exchange as 'okx' | 'binance'} className="flex-shrink-0" />
                <h3 className="font-bold text-lg">{apiKey.name}</h3>
                <Badge
                    onClick={() => onToggle(apiKey)}
                    className={cn(
                        'text-xs px-2 py-1 border-0 flex items-center gap-1.5 cursor-pointer select-none',
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
                <ApiDialog apiKey={apiKey} onSaved={() => onEdit(apiKey)}>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:text-primary/80">
                        <Edit className="h-4 w-4" />
                    </Button>
                </ApiDialog>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:text-primary/80">
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>确定要删除该API吗?</AlertDialogTitle>
                                            <AlertDialogDescription>您确认删除吗，删除后将无法跟单。</AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel variant="secondary">取消</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => onDelete(apiKey)} className="bg-primary hover:bg-primary/90">确认删除</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
            </div>
        </div>
                <div className="border-t border-border/30 pt-3 text-sm space-y-2 font-mono">
                    <div className="flex items-center justify-between gap-2">
                        <span className="text-muted-foreground">API Key:</span>
                        <div className="flex items-center gap-2">
                              <span className="text-foreground select-all">{showKey ? apiKey.api_key : '••••••••'}</span>
                            <button aria-label={showKey ? '隐藏' : '显示'} className="text-muted-foreground" onClick={() => setShowKey(v => !v)}>
                                {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                        <span className="text-muted-foreground">API Secret:</span>
                        <div className="flex items-center gap-2">
                              <span className="text-foreground select-all">{showSecret ? apiKey.api_secret : '••••••••'}</span>
                            <button aria-label={showSecret ? '隐藏' : '显示'} className="text-muted-foreground" onClick={() => setShowSecret(v => !v)}>
                                {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                    </div>
                    {apiKey.passphrase && (
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
                <span>{new Date(apiKey.created_at).toLocaleString()}</span>
            </div>
             <div className="flex justify-between">
                <span>更新时间:</span>
                <span>{new Date(apiKey.updated_at).toLocaleString()}</span>
            </div>
        </div>
      </CardContent>
    </Card>
  )
}

const TABS = ['okx', 'binance'];

export default function MyApiPage() {
    const { user, loading: authLoading, isConfigured } = useAuth()
    const [apiKeys, setApiKeys] = useState<ApiKeyPublic[]>([]);
    const [loading, setLoading] = useState(false)
    const [activeTab, setActiveTab] = useState<'okx' | 'binance'>('okx');

    const fetchKeys = async () => {
        if (!isConfigured || !user) return
        setLoading(true)
        try {
            const base = await supabase
                .from('api_keys')
                .select('id,user_id,name,exchange,api_key,api_secret,passphrase,status,created_at,updated_at')
                .eq('user_id', user.id)
                .order('updated_at', { ascending: false })
            if (base.error) throw base.error
            setApiKeys((base.data || []) as ApiKeyPublic[])
        } catch (e) {
            console.error('加载 API Keys 失败:', e)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (!authLoading && user) {
            fetchKeys()
        }
    }, [authLoading, user])

    const okxKeys = apiKeys.filter(key => key.exchange === 'okx');
    const binanceKeys = apiKeys.filter(key => key.exchange === 'binance');

    const handleDelete = async (k: ApiKeyPublic) => {
        try {
            const { error } = await supabase.from('api_keys').delete().eq('id', k.id)
            if (error) throw error
            fetchKeys()
        } catch (e) {
            console.error('删除失败:', e)
        }
    }

    const handleToggle = async (k: ApiKeyPublic) => {
        try {
            const next = k.status === 'running' ? 'stopped' : 'running'
            const { error } = await supabase.from('api_keys').update({ status: next }).eq('id', k.id)
            if (error) throw error
            fetchKeys()
        } catch (e) {
            console.error('切换状态失败:', e)
        }
    }

    const swipeHandlers = useSwipeable({
        onSwiped: (eventData) => {
            const direction = eventData.dir === 'Left' ? 1 : -1;
            const currentIndex = TABS.indexOf(activeTab);
            const nextIndex = currentIndex + direction;
            if (nextIndex >= 0 && nextIndex < TABS.length) {
                setActiveTab(TABS[nextIndex] as 'okx' | 'binance');
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
            
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'okx' | 'binance')} className="w-full flex flex-col flex-grow">
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
                                    {loading ? (
                                        <div className="text-center text-muted-foreground pt-20">加载中...</div>
                                    ) : okxKeys.length === 0 ? (
                                        <div className="text-center text-muted-foreground pt-20">
                                            <p>您还没有绑定任何OKX API。</p>
                                            <p>请点击下方按钮新增。</p>
                                        </div>
                                    ) : (
                                        okxKeys.map(key => (
                                            <ApiCard key={key.id} apiKey={key} onEdit={() => fetchKeys()} onDelete={handleDelete} onToggle={handleToggle} />
                                        ))
                                    )}
                                </TabsContent>
                            </div>
                            <div className="w-full flex-shrink-0">
                                <TabsContent value="binance" className="mt-0 space-y-4">
                                    {loading ? (
                                        <div className="text-center text-muted-foreground pt-20">加载中...</div>
                                    ) : binanceKeys.length === 0 ? (
                                        <div className="text-center text-muted-foreground pt-20">
                                            <p>您还没有绑定任何Binance API。</p>
                                            <p>请点击下方按钮新增。</p>
                                        </div>
                                    ) : (
                                        binanceKeys.map(key => (
                                            <ApiCard key={key.id} apiKey={key} onEdit={() => fetchKeys()} onDelete={handleDelete} onToggle={handleToggle} />
                                        ))
                                    )}
                                </TabsContent>
                            </div>
                        </div>
                    </div>
                </main>
            </Tabs>

            <footer className="sticky bottom-0 z-10 p-4 border-t border-border/50 bg-background/80 backdrop-blur-sm">
                <ApiDialog onSaved={() => fetchKeys()}>
                    <Button className="w-full h-12 text-base font-bold">
                        <Plus className="mr-2 h-5 w-5" />
                        新增API
                    </Button>
                </ApiDialog>
            </footer>
        </div>
    );
}

    

'use client'

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { ChevronLeft, ShieldCheck, Zap, Bot, BarChart4, TrendingUp, Gem, Check, X, Wallet, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { useSwipeable } from 'react-swipeable';
import { SimpleToast } from '../components/SimpleToast';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

interface Plan {
  id: string;
  duration: string;
  price: string;
  originalPrice: string;
  description: string;
  duration_months: number;
  price_usdt: number;
  original_price_usdt: number;
}

interface MembershipPlan {
  id: string;
  plan_type: 'manual' | 'auto';
  duration_months: number;
  price_usdt: number;
  original_price_usdt: number;
  title: string;
  description: string;
  features: string[];
  is_active: boolean;
  sort_order: number;
}

interface PaymentConfig {
  id: string;
  payment_method: 'TRC20' | 'ERC20';
  wallet_address: string;
  network_name?: string;
  is_active: boolean;
}

const comparisonData = [
  { feature: '跟单方式', manual: '手动', auto: '自动' },
  { feature: '交易延迟', manual: '视手动操作速度', auto: '毫秒级' },
  { feature: '仓位管理', manual: '手动管理', auto: 'AI智能管理' },
  { feature: '专业交易信号', manual: true, auto: true },
  { feature: '大师策略分析', manual: true, auto: true },
  { feature: '主流币种覆盖', manual: true, auto: true },
  { feature: '社区专属活动', manual: true, auto: true },
];

// 支付方式数据将从数据库动态获取

function PaymentSection() {
    const [selectedMethod, setSelectedMethod] = useState('TRC20');
    const [showToast, setShowToast] = useState(false);
    
    // 使用硬编码数据，避免复杂的异步逻辑
    const paymentConfigs = [
        { id: '1', payment_method: 'TRC20' as const, wallet_address: 'TXYZ...abcd...efgh', network_name: 'TRON', is_active: true },
        { id: '2', payment_method: 'ERC20' as const, wallet_address: '0x12...cdef...3456', network_name: 'Ethereum', is_active: true }
    ];

    const handleCopy = (address: string) => {
        navigator.clipboard.writeText(address);
        setShowToast(true);
    };
    
    const currentConfig = paymentConfigs.find(config => config.payment_method === selectedMethod);
    const currentAddress = currentConfig?.wallet_address || '';

    return (
        <>
        {showToast && <SimpleToast message="地址已复制" onDismiss={() => setShowToast(false)} />}
        <Card className="bg-card/50 border-border/30">
            <CardHeader className="flex-row items-center gap-3 space-y-0 p-4">
                <Wallet className="w-6 h-6 text-primary" />
                <CardTitle className="text-lg">支付方式</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
                <RadioGroup value={selectedMethod} onValueChange={setSelectedMethod}>
                    <div className="space-y-3">
                        {paymentConfigs.map((config) => (
                            <Label
                                key={config.id}
                                htmlFor={config.payment_method}
                                className={cn(
                                    'flex items-center justify-between rounded-lg border p-3 cursor-pointer transition-all',
                                    'bg-muted/30 border-transparent',
                                    {'bg-primary/10 border-primary': selectedMethod === config.payment_method}
                                )}
                            >
                                <div className="flex flex-col">
                                    <div className="font-semibold">{config.payment_method}</div>
                                    {config.network_name && (
                                        <div className="text-xs text-muted-foreground">{config.network_name}</div>
                                    )}
                                </div>
                                <RadioGroupItem value={config.payment_method} id={config.payment_method} />
                            </Label>
                        ))}
                    </div>
                </RadioGroup>
                
                <div className="mt-4 rounded-lg bg-muted/30 p-3 space-y-2">
                    <div className="text-sm text-muted-foreground">收款地址</div>
                    <div className="flex items-center justify-between gap-2">
                        <p className="font-mono text-base text-foreground break-all">{currentAddress}</p>
                        <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0" onClick={() => handleCopy(currentAddress)}>
                            <Copy className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
        </>
    );
}

function PlanSelector({ plans, selectedPlan, setSelectedPlan }: { plans: Plan[], selectedPlan: string, setSelectedPlan: (id: string) => void }) {
    return (
        <div className="w-full space-y-6">
            <RadioGroup
                value={selectedPlan}
                onValueChange={setSelectedPlan}
                className="grid grid-cols-3 gap-3"
            >
                {plans.map((plan) => (
                    <Label
                        key={plan.id}
                        htmlFor={plan.id}
                        className={cn(
                            'block rounded-lg border-2 p-3 text-center cursor-pointer transition-all',
                            'bg-muted/30 border-transparent',
                            {'bg-primary/10 border-primary': selectedPlan === plan.id}
                        )}
                    >
                        <RadioGroupItem value={plan.id} id={plan.id} className="sr-only" />
                        <p className="text-xl font-bold text-primary">
                          {plan.price}
                        </p>
                        <p className="text-xs text-muted-foreground line-through">
                           {plan.originalPrice}
                        </p>
                        <p className="mt-2 text-sm font-semibold text-foreground">{plan.duration}</p>
                    </Label>
                ))}
            </RadioGroup>
            <div className="space-y-4">
                <PaymentSection />
                <ContactServiceDialog>
                    <Button className="w-full h-12 text-base font-bold">
                        立即开通
                    </Button>
                </ContactServiceDialog>
            </div>
        </div>
    );
}

function ComparisonSection() {
    return (
        <div className="space-y-4">
            <div className="rounded-lg border border-border/50 bg-card/50 overflow-hidden">
                <div className="grid grid-cols-3 p-4 bg-muted/30 font-semibold">
                    <span className="col-span-1">功能</span>
                    <span className="col-span-1 text-center">手动跟单</span>
                    <div className="col-span-1 text-center bg-primary/10 rounded-md py-1">
                        <span>自动跟单</span>
                    </div>
                </div>
                <div className="divide-y divide-border/30">
                    {comparisonData.map(({ feature, manual, auto }, index) => (
                        <div key={index} className="grid grid-cols-3 p-4 text-sm items-center">
                            <span className="col-span-1 text-muted-foreground">{feature}</span>
                            <div className="col-span-1 flex justify-center">
                                {typeof manual === 'boolean' ? (
                                    manual ? <Check className="w-5 h-5 text-green-500" /> : <X className="w-5 h-5 text-red-500" />
                                ) : <span className="text-center">{manual}</span>}
                            </div>
                            <div className="col-span-1 flex justify-center">
                                <div className="bg-primary/5 rounded-md py-2 px-4 w-full text-center">
                                    {typeof auto === 'boolean' ? (
                                        auto ? <Check className="w-5 h-5 text-green-500 mx-auto" /> : <X className="w-5 h-5 text-red-500 mx-auto" />
                                    ) : <span className="font-semibold text-primary">{auto}</span>}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// 联系客服弹窗组件
function ContactServiceDialog({ children }: { children: React.ReactNode }) {
    return (
        <Dialog>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="max-w-[90vw] sm:max-w-xs rounded-lg">
                <DialogHeader>
                    <DialogTitle>联系客服</DialogTitle>
                    <DialogDescription>
                        通过Telegram联系我们的客服团队。
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="flex flex-col items-center justify-center gap-4">
                        <Image
                            src="/support-qr.png"
                            alt="Telegram QR Code"
                            width={200}
                            height={200}
                            priority
                            unoptimized
                            data-ai-hint="qr code"
                            className="rounded-md"
                        />
                        <div className="text-center">
                            <p className="text-sm text-muted-foreground">扫描二维码或搜索下方账号</p>
                            <p className="font-mono text-lg text-primary mt-2">@Michael_Qin</p>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

const TABS = ['auto', 'manual'];

function MembershipPageContent() {
    const router = useRouter();
    const [selectedTab, setSelectedTab] = useState('auto');
    const [manualSelectedPlan, setManualSelectedPlan] = useState('');
    const [autoSelectedPlan, setAutoSelectedPlan] = useState('');
    const [manualPlans, setManualPlans] = useState<Plan[]>([]);
    const [autoPlans, setAutoPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    // const { toast } = useToast(); // 暂时注释掉toast

    useEffect(() => {
        fetchMembershipPlans();
    }, []);

    const fetchMembershipPlans = async () => {
        console.log('开始获取会员套餐数据...');
        
        // 设置5秒超时
        const timeoutId = setTimeout(() => {
            console.error('请求超时');
            setError('请求超时，请检查网络连接');
            setLoading(false);
        }, 5000);
        
        try {
            const { data, error } = await supabase
                .from('membership_plans')
                .select('*')
                .eq('is_active', true)
                .order('sort_order');

            clearTimeout(timeoutId);
            console.log('Supabase响应:', { data, error });

            if (error) {
                console.error('Supabase查询错误:', error);
                throw error;
            }

            const plans = data || [];
            console.log('获取到的套餐数据:', plans);
            
            if (plans.length === 0) {
                setError('暂无套餐数据，请联系管理员');
                return;
            }
            
            // 转换数据格式
            const convertPlan = (plan: MembershipPlan): Plan => ({
                id: plan.id,
                duration: getDurationText(plan.duration_months),
                price: `${plan.price_usdt}U`,
                originalPrice: `${plan.original_price_usdt}U`,
                description: plan.description,
                duration_months: plan.duration_months,
                price_usdt: plan.price_usdt,
                original_price_usdt: plan.original_price_usdt
            });

            const manualPlansData = plans
                .filter(plan => plan.plan_type === 'manual')
                .map(convertPlan);
            
            const autoPlansData = plans
                .filter(plan => plan.plan_type === 'auto')
                .map(convertPlan);

            console.log('转换后的数据:', { manualPlansData, autoPlansData });

            setManualPlans(manualPlansData);
            setAutoPlans(autoPlansData);

            // 设置默认选中的套餐
            if (manualPlansData.length > 0) {
                setManualSelectedPlan(manualPlansData[0].id);
            }
            if (autoPlansData.length > 0) {
                setAutoSelectedPlan(autoPlansData[0].id);
            }
        } catch (error: any) {
            clearTimeout(timeoutId);
            console.error('获取会员套餐失败:', error);
            setError(`获取会员套餐失败: ${error.message || '未知错误'}`);
        } finally {
            setLoading(false);
        }
    };

    const getDurationText = (months: number): string => {
        if (months >= 12) {
            return `${months / 12}年`;
        }
        return `${months}个月`;
    };

    const swipeHandlers = useSwipeable({
        onSwipedLeft: () => {
            const currentIndex = TABS.indexOf(selectedTab);
            if (currentIndex < TABS.length - 1) {
                setSelectedTab(TABS[currentIndex + 1]);
            }
        },
        onSwipedRight: () => {
            const currentIndex = TABS.indexOf(selectedTab);
            if (currentIndex > 0) {
                setSelectedTab(TABS[currentIndex - 1]);
            }
        },
        trackMouse: true
    });

    return (
        <div className="bg-background min-h-screen text-foreground flex flex-col">
            <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-border/50 bg-background/80 px-4 backdrop-blur-sm">
                <Link href="/profile" passHref>
                    <Button variant="ghost" size="icon">
                        <ChevronLeft className="h-6 w-6" />
                    </Button>
                </Link>
                <h1 className="text-lg font-bold">会员中心</h1>
                <Link href="/payment-details">
                    <Button variant="link" className="text-primary px-0 hover:no-underline">付费明细</Button>
                </Link>
            </header>

            <main className="flex-grow overflow-auto p-4 space-y-8">
                <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="auto">自动跟单</TabsTrigger>
                        <TabsTrigger value="manual">手动跟单</TabsTrigger>
                    </TabsList>
                    <div {...swipeHandlers}>
                        {loading ? (
                            <div className="flex justify-center items-center py-20">
                                <div className="text-center">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                                    <p className="text-muted-foreground">加载套餐信息...</p>
                                </div>
                            </div>
                        ) : error ? (
                            <div className="flex justify-center items-center py-20">
                                <div className="text-center">
                                    <p className="text-red-500 mb-4">{error}</p>
                                    <Button onClick={() => { setError(null); setLoading(true); fetchMembershipPlans(); }}>重试</Button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <TabsContent value="auto" className="mt-6">
                                    {autoPlans.length > 0 ? (
                                        <PlanSelector
                                            plans={autoPlans}
                                            selectedPlan={autoSelectedPlan}
                                            setSelectedPlan={setAutoSelectedPlan}
                                        />
                                    ) : (
                                        <div className="text-center py-10 text-muted-foreground">
                                            暂无自动跟单套餐
                                        </div>
                                    )}
                                </TabsContent>
                                <TabsContent value="manual" className="mt-6">
                                    {manualPlans.length > 0 ? (
                                        <PlanSelector
                                            plans={manualPlans}
                                            selectedPlan={manualSelectedPlan}
                                            setSelectedPlan={setManualSelectedPlan}
                                        />
                                    ) : (
                                        <div className="text-center py-10 text-muted-foreground">
                                            暂无手动跟单套餐
                                        </div>
                                    )}
                                </TabsContent>
                            </>
                        )}
                    </div>
                </Tabs>
                <ComparisonSection />
            </main>
        </div>
    )
}

// 错误边界组件
class ErrorBoundary extends React.Component<
    { children: React.ReactNode },
    { hasError: boolean; error?: Error }
> {
    constructor(props: { children: React.ReactNode }) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error) {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: any) {
        console.error('会员中心页面错误:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="bg-background min-h-screen text-foreground flex flex-col">
                    <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-border/50 bg-background/80 px-4 backdrop-blur-sm">
                        <Link href="/profile" passHref>
                            <Button variant="ghost" size="icon">
                                <ChevronLeft className="h-6 w-6" />
                            </Button>
                        </Link>
                        <h1 className="text-lg font-bold">会员中心</h1>
                        <div className="w-10"></div>
                    </header>
                    <main className="flex-grow overflow-auto p-4 space-y-8">
                        <div className="flex justify-center items-center py-20">
                            <div className="text-center">
                                <p className="text-red-500 mb-4">页面加载出错</p>
                                <p className="text-muted-foreground mb-4">请刷新页面重试</p>
                                <Button onClick={() => window.location.reload()}>刷新页面</Button>
                            </div>
                        </div>
                    </main>
                </div>
            );
        }

        return this.props.children;
    }
}

export default function MembershipPage() {
    return (
        <ErrorBoundary>
            <MembershipPageContent />
        </ErrorBoundary>
    );
}

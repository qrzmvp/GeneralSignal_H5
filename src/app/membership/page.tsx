
'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChevronLeft, ShieldCheck, Zap, Bot, BarChart4, TrendingUp, Gem, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from '@/components/ui/label';

interface Plan {
  id: string;
  duration: string;
  price: string;
  originalPrice: string;
  description: string;
}

const manualPlans: Plan[] = [
  { id: 'manual-yearly', duration: '1年', price: '119.9U', originalPrice: '140U', description: '长期投资者的选择' },
  { id: 'manual-quarterly', duration: '3个月', price: '29.9U', originalPrice: '35U', description: '最具性价比' },
  { id: 'manual-monthly', duration: '1个月', price: '9.9U', originalPrice: '12U', description: '适合短期体验' },
];

const autoPlans: Plan[] = [
  { id: 'auto-yearly', duration: '1年', price: '240U', originalPrice: '280U', description: '一劳永逸，全年无忧' },
  { id: 'auto-quarterly', duration: '3个月', price: '60U', originalPrice: '70U', description: '省心省力的选择' },
  { id: 'auto-monthly', duration: '1个月', price: '20U', originalPrice: '25U', description: '灵活的自动跟单' },
];

const comparisonData = [
  { feature: '跟单方式', manual: '手动', auto: '自动' },
  { feature: '交易延迟', manual: '视手动操作速度', auto: '毫秒级' },
  { feature: '仓位管理', manual: '手动管理', auto: 'AI智能管理' },
  { feature: '专业交易信号', manual: true, auto: true },
  { feature: '大师策略分析', manual: true, auto: true },
  { feature: '主流币种覆盖', manual: true, auto: true },
  { feature: '社区专属活动', manual: true, auto: true },
];

function PlanSelector({ plans, defaultPlanId }: { plans: Plan[], defaultPlanId: string }) {
    const [selectedPlan, setSelectedPlan] = useState(defaultPlanId);
    return (
        <div className="w-full space-y-6">
            <RadioGroup
                defaultValue={selectedPlan}
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
                            'has-[:checked]:bg-primary/10 has-[:checked]:border-primary'
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
            <Button className="w-full h-12 text-base font-bold">
                立即开通
            </Button>
        </div>
    );
}

function ComparisonSection() {
    return (
        <div className="space-y-4">
            <h3 className="text-center font-bold text-lg text-foreground">跟单对比</h3>
            <div className="rounded-lg border border-border/50 bg-card/50 overflow-hidden">
                <div className="grid grid-cols-3 p-4 bg-muted/30 font-semibold">
                    <span className="col-span-1">功能</span>
                    <span className="col-span-1 text-center">手动跟单</span>
                    <span className="col-span-1 text-center">自动跟单</span>
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
                                {typeof auto === 'boolean' ? (
                                    auto ? <Check className="w-5 h-5 text-green-500" /> : <X className="w-5 h-5 text-red-500" />
                                ) : <span className="text-center font-semibold text-primary">{auto}</span>}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default function MembershipPage() {
    const router = useRouter();

    return (
        <div className="bg-background min-h-screen text-foreground flex flex-col">
            <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-border/50 bg-background/80 px-4 backdrop-blur-sm">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ChevronLeft className="h-6 w-6" />
                </Button>
                <h1 className="text-lg font-bold">会员中心</h1>
                <div className="w-9"></div> {/* Placeholder for spacing */}
            </header>

            <main className="flex-grow overflow-auto p-4 space-y-8">
                <Tabs defaultValue="auto" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="auto">自动跟单</TabsTrigger>
                        <TabsTrigger value="manual">手动跟单</TabsTrigger>
                    </TabsList>
                    <TabsContent value="auto" className="mt-6">
                        <PlanSelector plans={autoPlans} defaultPlanId="auto-yearly"/>
                    </TabsContent>
                    <TabsContent value="manual" className="mt-6">
                        <PlanSelector plans={manualPlans} defaultPlanId="manual-yearly"/>
                    </TabsContent>
                </Tabs>
                <ComparisonSection />
            </main>
        </div>
    )
}

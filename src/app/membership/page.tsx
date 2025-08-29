
'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChevronLeft, ShieldCheck, Zap, Bot, BarChart4, TrendingUp, Gem } from 'lucide-react';
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
  { id: 'manual-yearly', duration: '1年', price: '119.9', originalPrice: '140', description: '长期投资者的选择' },
  { id: 'manual-quarterly', duration: '3个月', price: '29.9', originalPrice: '35', description: '最具性价比' },
  { id: 'manual-monthly', duration: '1个月', price: '9.9', originalPrice: '12', description: '适合短期体验' },
];

const autoPlans: Plan[] = [
  { id: 'auto-yearly', duration: '1年', price: '240', originalPrice: '280', description: '一劳永逸，全年无忧' },
  { id: 'auto-quarterly', duration: '3个月', price: '60', originalPrice: '70', description: '省心省力的选择' },
  { id: 'auto-monthly', duration: '1个月', price: '20', originalPrice: '25', description: '灵活的自动跟单' },
];

const memberPrivileges = [
    { icon: <TrendingUp className="w-6 h-6 text-primary" />, title: '专业交易信号' },
    { icon: <BarChart4 className="w-6 h-6 text-primary" />, title: '大师策略分析' },
    { icon: <ShieldCheck className="w-6 h-6 text-primary" />, title: '主流币种覆盖' },
    { icon: <Gem className="w-6 h-6 text-primary" />, title: '社区专属活动' },
]

const superMemberPrivileges = [
    ...memberPrivileges,
    { icon: <Zap className="w-6 h-6 text-yellow-400" />, title: '毫秒级自动跟单' },
    { icon: <Bot className="w-6 h-6 text-yellow-400" />, title: 'AI智能仓位管理' },
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
                            <span className="text-sm">U$</span>{plan.price}
                        </p>
                        <p className="text-xs text-muted-foreground line-through">
                           U${plan.originalPrice}
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

function PrivilegesSection({ title, privileges }: { title: string, privileges: { icon: React.ReactNode, title: string }[] }) {
    return (
        <div className="space-y-4">
            <h3 className="font-bold text-foreground">{title}</h3>
            <div className="grid grid-cols-4 gap-4 text-center">
                {privileges.map(({ icon, title }, index) => (
                    <div key={index} className="flex flex-col items-center space-y-2">
                        <div className="flex items-center justify-center h-12 w-12 rounded-full bg-muted/50">
                            {icon}
                        </div>
                        <p className="text-xs text-muted-foreground">{title}</p>
                    </div>
                ))}
            </div>
        </div>
    )
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
                <Tabs defaultValue="manual" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="manual" className="data-[state=active]:text-yellow-700 data-[state=active]:border-b-yellow-600">会员</TabsTrigger>
                        <TabsTrigger value="auto" className="data-[state=active]:text-yellow-700 data-[state=active]:border-b-yellow-600">超级会员</TabsTrigger>
                    </TabsList>
                    <TabsContent value="manual" className="mt-6">
                        <PlanSelector plans={manualPlans} defaultPlanId="manual-yearly"/>
                        <div className="mt-8">
                           <PrivilegesSection title="会员尊享特权" privileges={memberPrivileges} />
                        </div>
                    </TabsContent>
                    <TabsContent value="auto" className="mt-6">
                        <PlanSelector plans={autoPlans} defaultPlanId="auto-yearly"/>
                         <div className="mt-8">
                           <PrivilegesSection title="超级会员尊享特权" privileges={superMemberPrivileges} />
                        </div>
                    </TabsContent>
                </Tabs>
            </main>
        </div>
    )
}

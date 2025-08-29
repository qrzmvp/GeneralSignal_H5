
'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, ChevronLeft, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface Plan {
  id: string;
  name: string;
  price: string;
  originalPrice?: string;
  description: string;
  isCurrent?: boolean;
  isPopular?: boolean;
}

const manualPlans: Plan[] = [
  { id: 'manual-monthly', name: '月度会员', price: '9.9/月', description: '适合短期体验' },
  { id: 'manual-quarterly', name: '季度会员', price: '29.9/季', originalPrice: '¥210', description: '最具性价比', isPopular: true },
  { id: 'manual-yearly', name: '年度会员', price: '119.9/年', description: '长期投资者的选择', isCurrent: true },
];

const autoPlans: Plan[] = [
  { id: 'auto-monthly', name: '月度会员', price: '20/月', description: '灵活的自动跟单' },
  { id: 'auto-quarterly', name: '季度会员', price: '60/季', description: '省心省力的选择', isPopular: true },
  { id: 'auto-yearly', name: '年度会员', price: '240/年', description: '一劳永逸，全年无忧' },
];

const features = [
  { feature: '信号来源', manual: '专业交易员', auto: 'AI策略+专业交易员' },
  { feature: '执行方式', manual: '手动点击跟单', auto: '全自动跟单' },
  { feature: '跟单速度', manual: '取决于用户操作', auto: '毫秒级响应' },
  { feature: '仓位管理', manual: '用户自行决定', auto: '智能仓位分配' },
  { feature: '风险控制', manual: '用户自行设置止盈止损', auto: '动态风控模型' },
  { feature: '交易对数量', manual: '无限制', auto: '根据策略自动筛选' },
  { feature: '适用人群', manual: '有经验的交易者', auto: '所有用户，尤其适合新手' },
];


function PlanCard({ plan, type }: { plan: Plan, type: 'manual' | 'auto' }) {
  return (
    <Card className={cn(
      "flex flex-col text-center transition-all duration-300",
      plan.isCurrent ? "border-primary ring-2 ring-primary" : "border-border/50",
      plan.isPopular ? "shadow-lg" : ""
    )}>
      {plan.isPopular && (
        <div className="absolute -top-3 right-4 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1 z-10">
          <Star className="w-3 h-3" />
          热门
        </div>
      )}
      <CardHeader className="pt-8 pb-4">
        <CardTitle className="text-xl font-bold">{plan.name}</CardTitle>
        <CardDescription>{plan.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="text-4xl font-extrabold text-primary">
          <span className="text-2xl font-normal">U$</span>
          {plan.price.split('/')[0]}
          <span className="text-base font-normal text-muted-foreground">/{plan.price.split('/')[1]}</span>
        </p>
        {plan.originalPrice && (
            <p className="text-sm text-muted-foreground line-through mt-1">原价: {plan.originalPrice}</p>
        )}
      </CardContent>
      <CardFooter>
        <Button className="w-full font-bold" disabled={plan.isCurrent}>
          {plan.isCurrent ? "当前方案" : "立即订阅"}
        </Button>
      </CardFooter>
    </Card>
  );
}


export default function MembershipPage() {
    const router = useRouter();
    const [currentPlan] = useState('年度会员');

    return (
        <div className="bg-background min-h-screen text-foreground flex flex-col">
            <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-border/50 bg-background/80 px-4 backdrop-blur-sm">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ChevronLeft className="h-6 w-6" />
                </Button>
                <h1 className="text-lg font-bold">会员套餐</h1>
                <div className="w-9"></div> {/* Placeholder for spacing */}
            </header>

            <main className="flex-grow overflow-auto p-4 space-y-6">
                <Card className="bg-card/80 border-border/50">
                    <CardContent className="p-4 text-center">
                        <p className="text-sm text-muted-foreground">当前订阅</p>
                        <p className="text-lg font-semibold text-primary mt-1">{currentPlan}</p>
                    </CardContent>
                </Card>

                <Tabs defaultValue="manual" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="manual">手动跟单</TabsTrigger>
                        <TabsTrigger value="auto">自动跟单</TabsTrigger>
                    </TabsList>
                    <TabsContent value="manual" className="mt-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {manualPlans.map(plan => <PlanCard key={plan.id} plan={plan} type="manual" />)}
                        </div>
                    </TabsContent>
                    <TabsContent value="auto" className="mt-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                             {autoPlans.map(plan => <PlanCard key={plan.id} plan={plan} type="auto" />)}
                        </div>
                    </TabsContent>
                </Tabs>

                <Card className="bg-card/80 border-border/50">
                    <CardHeader>
                        <CardTitle>功能对比</CardTitle>
                        <CardDescription>查看不同跟单类型的详细功能差异</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                <TableHead className="w-[120px]">功能</TableHead>
                                <TableHead className="text-center">手动跟单</TableHead>
                                <TableHead className="text-center">自动跟单</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {features.map((item) => (
                                <TableRow key={item.feature}>
                                    <TableCell className="font-medium">{item.feature}</TableCell>
                                    <TableCell className="text-center text-muted-foreground">{item.manual}</TableCell>
                                    <TableCell className="text-center text-primary font-semibold flex items-center justify-center gap-1">
                                        <CheckCircle className="w-4 h-4" />
                                        {item.auto}
                                    </TableCell>
                                </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

            </main>
        </div>
    )
}

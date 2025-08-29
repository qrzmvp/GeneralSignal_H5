
'use client'

import { useParams, useRouter } from 'next/navigation'
import {
  ChevronLeft,
  ChevronsUpDown,
  TrendingUp,
  Target,
  BarChart,
  User,
  Clock,
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

// Mock data - in a real app, you'd fetch this based on the `id` param
const traders = [
    {
    id: 1,
    name: 'WWG-Woods',
    avatar: 'https://i.pravatar.cc/150?u=wwg-woods',
    description: '盈亏同源高收益追涨模式采用指数级复利操作',
    yield: 288.0,
    winRate: 95.0,
    pnlRatio: '22:1',
    totalOrders: 150,
    tags: ['波段高手', '高频交易', 'ETH信徒'],
  },
  {
    id: 2,
    name: 'WWG-Jonh',
    avatar: 'https://i.pravatar.cc/150?u=jonh',
    description: '寻找超额收益，多策略组合',
    yield: 265.0,
    winRate: 98.0,
    pnlRatio: '20:1',
    totalOrders: 180,
    tags: ['狙击BTC专家', '技术分析', '稳健'],
  },
  {
    id: 3,
    name: 'WWG-Hbj',
    avatar: 'https://i.pravatar.cc/150?u=hbj',
    description: '深耕以太坊生态，价值发现',
    yield: 250.0,
    winRate: 90.1,
    pnlRatio: '18.5:1',
    totalOrders: 888,
    tags: ['价值投资', 'ETH布道者', '长线'],
  },
    {
    id: 4,
    name: '量化大师',
    avatar: 'https://i.pravatar.cc/150?u=quant',
    description: '高频交易，算法驱动',
    yield: 150.7,
    winRate: 65.7,
    pnlRatio: '11.2:1',
    totalOrders: 345,
    tags: ['算法交易', '高频', '套利'],
  },
  {
    id: 5,
    name: '趋势猎人',
    avatar: 'https://i.pravatar.cc/150?u=hunter',
    description: '顺势而为，捕捉大趋势行情',
    yield: 120.4,
    winRate: 76.8,
    pnlRatio: '9.1:1',
    totalOrders: 780,
    tags: ['趋势跟踪', '宏观经济', '长线持有'],
  },
  {
    id: 6,
    name: '波段之王',
    avatar: 'https://i.pravatar.cc/150?u=swing',
    description: '高抛低吸，精通市场情绪',
    yield: 95.6,
    winRate: 89.1,
    pnlRatio: '8.5:1',
    totalOrders: 888,
    tags: ['波段交易', '情绪分析', '短线'],
  },
  {
    id: 7,
    name: '合约常胜军',
    avatar: 'https://i.pravatar.cc/150?u=futures',
    description: '杠杆艺术，风险控制大师',
    yield: 88.0,
    winRate: 95.0,
    pnlRatio: '10:1',
    totalOrders: 450,
    tags: ['合约交易', '高杠杆', '风险控制'],
  },
  {
    id: 8,
    name: 'BTC信仰者',
    avatar: 'https://i.pravatar.cc/150?u=btc',
    description: '只做比特币，长期持有',
    yield: 75.1,
    winRate: 85.3,
    pnlRatio: '7.5:1',
    totalOrders: 1102,
    tags: ['BTC', '信仰者', '屯币'],
  },
  {
    id: 9,
    name: '短线快枪手',
    avatar: 'https://i.pravatar.cc/150?u=quick',
    description: '超短线交易，积少成多',
    yield: 68.5,
    winRate: 92.84,
    pnlRatio: '8.2:1',
    totalOrders: 1245,
    tags: ['超短线', '剥头皮', '高频'],
  },
  {
    id: 10,
    name: 'ETH布道者',
    avatar: 'https://i.pravatar.cc/150?u=eth',
    description: '深耕以太坊生态，价值发现',
    yield: 63.2,
    winRate: 82.4,
    pnlRatio: '6.2:1',
    totalOrders: 999,
    tags: ['ETH', 'DEFI', '价值发现'],
  },
  {
    id: 11,
    name: 'Alpha Seeker',
    avatar: 'https://i.pravatar.cc/150?u=alpha',
    description: '寻找超额收益，多策略组合',
    yield: 52.3,
    winRate: 87.92,
    pnlRatio: '6.8:1',
    totalOrders: 892,
    tags: ['多策略', 'Alpha', '对冲'],
  },
  {
    id: 12,
    name: '狙击涨停板',
    avatar: 'https://i.pravatar.cc/150?u=limit-up',
    description: '专注强势币种，高风险高回报',
    yield: 48.9,
    winRate: 91.5,
    pnlRatio: '5.9:1',
    totalOrders: 1530,
    tags: ['强势币', '追涨', '高风险'],
  },
  {
    id: 13,
    name: '抄底王',
    avatar: 'https://i.pravatar.cc/150?u=dip',
    description: '左侧交易，逆势布局',
    yield: 45.5,
    winRate: 88.0,
    pnlRatio: '5.5:1',
    totalOrders: 789,
    tags: ['左侧交易', '抄底', '逆势'],
  },
  {
    id: 14,
    name: '币圈巴菲特',
    avatar: 'https://i.pravatar.cc/150?u=buffett',
    description: '屯币不动，穿越牛熊',
    yield: 41.6,
    winRate: 78.45,
    pnlRatio: '5.2:1',
    totalOrders: 654,
    tags: ['价值投资', '长持', '屯币'],
  }
];

const currentSignals = [
  {
    id: 1,
    pair: 'BTC-USDT-SWAP',
    direction: '做多',
    directionColor: 'text-green-400',
    entryPrice: '70,123.45',
    takeProfit1: '71,500.00',
    takeProfit2: '72,800.00',
    stopLoss: '69,500.00',
    createdAt: '2024-07-28 10:30:15',
  },
  {
    id: 2,
    pair: 'ETH-USDT-SWAP',
    direction: '做空',
    directionColor: 'text-red-400',
    entryPrice: '3,456.78',
    takeProfit1: '3,400.00',
    takeProfit2: '3,350.00',
    stopLoss: '3,500.00',
    createdAt: '2024-07-28 08:15:45',
  },
    {
    id: 3,
    pair: 'SOL-USDT-SWAP',
    direction: '做多',
    directionColor: 'text-green-400',
    entryPrice: '165.20',
    takeProfit1: '170.00',
    takeProfit2: '175.50',
    stopLoss: '162.00',
    createdAt: '2024-07-27 22:45:00',
  },
]

function InfoPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm py-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  )
}


export default function TraderDetailPage() {
  const router = useRouter()
  const params = useParams()
  const traderId = params.id ? parseInt(params.id as string, 10) : null;

  // Find the trader data from the mock array
  const trader = traders.find(t => t.id === traderId);

  if (!trader) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p>Trader not found.</p>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen text-foreground flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-border/50 bg-background/80 px-4 backdrop-blur-sm">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ChevronLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-lg font-bold">{trader.name}</h1>
        <div className="w-9"></div> {/* Placeholder for spacing */}
      </header>

      <main className="flex-grow overflow-auto p-4 space-y-6 pb-28">
        {/* Basic Info */}
        <Card className="bg-card/80 border-border/50">
          <CardContent className="p-4 flex flex-col items-center text-center gap-4">
            <Avatar className="h-20 w-20 border-2 border-primary">
              <AvatarImage src={trader.avatar} alt={trader.name} />
              <AvatarFallback>{trader.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="w-full">
                <p className="text-sm text-muted-foreground">{trader.description}</p>
                <div className="flex flex-wrap justify-center gap-2 mt-3">
                    {trader.tags?.map(tag => (
                        <Badge key={tag} variant="secondary">{tag}</Badge>
                    ))}
                </div>
            </div>
          </CardContent>
        </Card>

        {/* Metrics Overview */}
        <Card className="bg-card/80 border-border/50">
           <CardHeader>
             <CardTitle className="text-base font-bold flex items-center gap-2">
                <BarChart className="w-5 h-5 text-primary" />
                指标总览
             </CardTitle>
           </CardHeader>
           <CardContent className="grid grid-cols-2 gap-x-6 gap-y-4">
            <div className="space-y-1">
                <p className="text-sm text-muted-foreground">收益率</p>
                <p className="text-xl font-bold text-green-400">+{trader.yield}%</p>
            </div>
            <div className="space-y-1">
                <p className="text-sm text-muted-foreground">胜率</p>
                <p className="text-xl font-bold text-foreground">{trader.winRate}%</p>
            </div>
            <div className="space-y-1">
                <p className="text-sm text-muted-foreground">盈亏比</p>
                <p className="text-xl font-bold text-foreground">{trader.pnlRatio}</p>
            </div>
            <div className="space-y-1">
                <p className="text-sm text-muted-foreground">累计信号</p>
                <p className="text-xl font-bold text-foreground">{trader.totalOrders}</p>
            </div>
           </CardContent>
        </Card>

        {/* Current Signals */}
        <div>
            <h2 className="text-base font-bold flex items-center gap-2 mb-3">
                <User className="w-5 h-5 text-primary"/>
                当前信号
            </h2>
            <div className="space-y-3">
                {currentSignals.map(signal => (
                    <Card key={signal.id} className="bg-card/80 border-border/50">
                        <CardContent className="p-4">
                            <div className="flex justify-between items-center mb-3">
                                <Badge variant="secondary" className="font-mono">{signal.pair}</Badge>
                                <span className={`text-lg font-bold ${signal.directionColor}`}>{signal.direction}</span>
                            </div>
                            <div className="space-y-2 border-t border-border/50 pt-3">
                                <InfoPill label="入场点位" value={signal.entryPrice} />
                                <InfoPill label="止盈点位 1" value={signal.takeProfit1} />
                                <InfoPill label="止盈点位 2" value={signal.takeProfit2} />
                                <InfoPill label="止损点位" value={signal.stopLoss} />
                            </div>
                            <div className="text-xs text-muted-foreground mt-3 pt-3 border-t border-border/50 flex items-center gap-1.5">
                                <Clock className="w-3 h-3" />
                                {signal.createdAt}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
      </main>

       {/* Floating Footer */}
      <footer className="fixed bottom-0 left-0 right-0 z-10 bg-background/80 border-t border-border/50 backdrop-blur-sm p-4">
        <Button className="w-full font-bold text-lg h-11 rounded-full">立即跟单</Button>
      </footer>
    </div>
  )
}

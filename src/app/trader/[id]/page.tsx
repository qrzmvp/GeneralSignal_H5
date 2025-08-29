
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
    yield: 68.5,
    winRate: 92.84,
    pnlRatio: '8.2:1',
    totalOrders: 1245,
    tags: ['波段高手', '高频交易', 'ETH信徒'],
  },
  {
    id: 2,
    name: '金融狙击手',
    avatar: 'https://i.pravatar.cc/150?u=sniper',
    description: '专注短线精准狙击，技术分析与资全管理并重',
    yield: 52.3,
    winRate: 87.92,
    pnlRatio: '6.8:1',
    totalOrders: 892,
    tags: ['狙击BTC专家', '技术分析', '稳健'],
  },
  // Add other traders here...
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
        <Button className="w-full font-bold text-lg h-12">立即跟单</Button>
      </footer>
    </div>
  )
}

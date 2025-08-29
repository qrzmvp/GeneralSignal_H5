'use client'

import { useState } from 'react'
import {
  Search,
  ChevronDown,
  BarChart,
  User,
  Plus,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Card,
  CardContent,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import {
  LineChart,
  Line,
  ResponsiveContainer,
  YAxis,
} from 'recharts'

interface Trader {
  id: number
  name: string
  description: string
  yield: number
  winRate: number
  pnlRatio: string
  totalOrders: number
  chartData: { value: number }[]
}

const traders: Trader[] = [
  {
    id: 1,
    name: 'WWG-Woods',
    description: '盈亏同源高收益追涨模式采用指数级复利操作',
    yield: 68.5,
    winRate: 92.84,
    pnlRatio: '8.2:1',
    totalOrders: 1245,
    chartData: [
      { value: 10 }, { value: 20 }, { value: 15 }, { value: 30 }, { value: 25 },
      { value: 40 }, { value: 35 }, { value: 50 }, { value: 60 }, { value: 68.5 },
    ],
  },
  {
    id: 2,
    name: '金融狙击手',
    description: '专注短线精准狙击，技术分析与资全管理并重',
    yield: 52.3,
    winRate: 87.92,
    pnlRatio: '6.8:1',
    totalOrders: 892,
    chartData: [
      { value: 10 }, { value: 12 }, { value: 18 }, { value: 15 }, { value: 25 },
      { value: 22 }, { value: 30 }, { value: 35 }, { value: 45 }, { value: 52.3 },
    ],
  },
  {
    id: 3,
    name: '稳健投资者',
    description: '价值投资理念，稳健长期增长策略',
    yield: 41.6,
    winRate: 78.45,
    pnlRatio: '5.2:1',
    totalOrders: 654,
    chartData: [
      { value: 10 }, { value: 11 }, { value: 13 }, { value: 12 }, { value: 15 },
      { value: 18 }, { value: 22 }, { value: 28 }, { value: 35 }, { value: 41.6 },
    ],
  },
    {
    id: 4,
    name: '量化大师',
    description: '高频交易，算法驱动',
    yield: 35.2,
    winRate: 81.2,
    pnlRatio: '4.1:1',
    totalOrders: 2310,
    chartData: [
      { value: 10 }, { value: 15 }, { value: 12 }, { value: 20 }, { value: 25 },
      { value: 23 }, { value: 30 }, { value: 28 }, { value: 33 }, { value: 35.2 },
    ],
  },
];

function TraderCard({ trader }: { trader: Trader }) {
  return (
    <Card className="bg-card/80 backdrop-blur-sm border-border/50">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <Avatar>
            <AvatarFallback className="bg-muted text-muted-foreground">{trader.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex-grow">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-lg text-foreground">{trader.name}</h3>
              <Button size="sm" variant="outline" className="bg-transparent text-primary border-primary hover:bg-primary/10">
                <Plus className="mr-1 h-4 w-4" />
                跟单
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">{trader.description}</p>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2 text-center mt-4">
          <div>
            <p className="text-xs text-muted-foreground">收益率</p>
            <p className="text-sm font-semibold text-green-400 mt-1">+{trader.yield}%</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">胜率</p>
            <p className="text-sm font-semibold text-foreground mt-1">{trader.winRate}%</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">累计盈亏比</p>
            <p className="text-sm font-semibold text-foreground mt-1">{trader.pnlRatio}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">累计指令</p>
            <p className="text-sm font-semibold text-foreground mt-1">{trader.totalOrders}</p>
          </div>
        </div>

        <div className="h-20 mt-2 -mb-2 -ml-4 -mr-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trader.chartData} margin={{ top: 5, right: 0, left: 0, bottom: 5 }}>
              <defs>
                  <linearGradient id={`gradient-${trader.id}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
              <YAxis domain={['dataMin - 10', 'dataMax + 10']} hide={true} />
              <Line
                type="monotone"
                dataKey="value"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={false}
                fill={`url(#gradient-${trader.id})`}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

function FilterDropdown({ label }: { label: string }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="text-muted-foreground hover:text-foreground p-0 h-auto">
          {label}
          <ChevronDown className="ml-1 h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="bg-card">
        <DropdownMenuItem>由高到低</DropdownMenuItem>
        <DropdownMenuItem>由低到高</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default function LeaderboardPage() {
    const [activeTab, setActiveTab] = useState('leaderboard');
  return (
    <div className="bg-background min-h-screen text-foreground flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-sm">
        <div className="flex items-center justify-center p-4 h-14">
          <h1 className="font-bold text-lg">牛人榜单</h1>
        </div>

        {/* Search Bar */}
        <div className="px-4 pb-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="请输入交易员名称和描述"
              className="pl-10 w-full bg-card border-border/60 rounded-full"
            />
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center justify-between px-4 pb-3 text-sm">
            <div className="flex items-center gap-4">
              <Button variant="ghost" className="text-foreground p-0 h-auto font-bold">
                  综合排序
              </Button>
              <FilterDropdown label="收益率" />
              <FilterDropdown label="胜率" />
            </div>
          <Button variant="ghost" className="text-muted-foreground p-0 h-auto">
            更多 <ChevronDown className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Trader List */}
      <main className="flex-grow overflow-auto px-4 pt-2 pb-24 space-y-3">
        {traders.map((trader) => (
          <TraderCard key={trader.id} trader={trader} />
        ))}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border/50 h-16 z-20">
        <div className="flex justify-around items-center h-full">
            <button
                onClick={() => setActiveTab('leaderboard')}
                className={`flex flex-col items-center justify-center space-y-1 transition-colors ${
                activeTab === 'leaderboard' ? 'text-primary' : 'text-muted-foreground'
                }`}
            >
                <BarChart className="h-6 w-6" />
                <span className="text-xs font-medium">牛人榜</span>
            </button>
            <Link href="/login" passHref className="flex-1 contents">
              <button
                  onClick={() => setActiveTab('profile')}
                  className={`flex flex-col items-center justify-center space-y-1 transition-colors ${
                  activeTab === 'profile' ? 'text-primary' : 'text-muted-foreground'
                  }`}
              >
                  <User className="h-6 w-6" />
                  <span className="text-xs font-medium">我的</span>
              </button>
            </Link>
        </div>
      </nav>
    </div>
  )
}

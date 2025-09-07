'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import { ChevronDown, ChevronUp, RefreshCcw, Search } from 'lucide-react'

type Row = {
  id: string
  name: string
  description: string | null
  yield_rate: number
  win_rate: number
  profit_loss_ratio: number | null
  total_signals: number
  avatar_key: string | null
  score: number
}

type SortBy = 'score' | 'yield' | 'win'
type OrderBy = 'asc' | 'desc'

const pageSize = 10

function useDebounced<T>(value: T, delay = 500) {
  const [v, setV] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return v
}

export default function TraderListPage() {
  const [q, setQ] = useState('')
  const qDebounced = useDebounced(q)
  const [sortBy, setSortBy] = useState<SortBy>('score')
  const [orderBy, setOrderBy] = useState<OrderBy>('desc')
  const [rows, setRows] = useState<Row[]>([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(false)

  const load = async (nextPage: number, reset = false) => {
    if (loading) return
    setLoading(true)
    try {
      const { data, error } = await supabase.rpc('get_traders_paged', {
        page: nextPage,
        page_size: pageSize,
        q: qDebounced || null,
        sort_by: sortBy,
        order_by: orderBy,
      })
      if (error) throw error
      const items: Row[] = data || []
      const merged = reset ? items : [...rows, ...items]
      setRows(merged)
      setHasMore(items.length >= pageSize)
      setPage(nextPage)
    } catch (e) {
      console.debug('[traders] load error', e)
    } finally {
      setLoading(false)
    }
  }

  // 首次 & 依赖变化时重新拉第一页
  useEffect(() => {
    load(1, true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qDebounced, sortBy, orderBy])

  // 触底加载
  const sentinelRef = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const io = new IntersectionObserver(entries => {
      const entry = entries[0]
      if (entry.isIntersecting && hasMore && !loading) {
        load(page + 1)
      }
    })
    io.observe(el)
    return () => io.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sentinelRef.current, hasMore, loading, page])

  const toggleYieldOrder = () => {
    setSortBy('yield')
    setOrderBy(prev => (prev === 'desc' ? 'asc' : 'desc'))
  }
  const toggleWinOrder = () => {
    setSortBy('win')
    setOrderBy(prev => (prev === 'desc' ? 'asc' : 'desc'))
  }

  const avatarUrl = (key: string | null) =>
    key ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/trader-avatars/${key}` : '/avatar-default.svg'

  return (
    <div className="min-h-screen bg-background text-foreground p-4">
      <header className="flex items-center gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="请输入交易员名称和描述"
            className="pl-8"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <Button variant="outline" onClick={() => { setSortBy('score'); setOrderBy('desc'); }} className="ml-2">综合排序</Button>
      </header>

      <div className="flex items-center gap-2 mb-2">
        <Button variant="secondary" onClick={toggleYieldOrder}>
          收益率 {sortBy==='yield' ? (orderBy==='desc' ? <ChevronDown className="w-4 h-4 ml-1"/> : <ChevronUp className="w-4 h-4 ml-1"/>) : null}
        </Button>
        <Button variant="secondary" onClick={toggleWinOrder}>
          胜率 {sortBy==='win' ? (orderBy==='desc' ? <ChevronDown className="w-4 h-4 ml-1"/> : <ChevronUp className="w-4 h-4 ml-1"/>) : null}
        </Button>
        <Button variant="ghost" size="icon" className="ml-auto" onClick={() => load(1, true)} title="下拉刷新">
          <RefreshCcw className="w-4 h-4"/>
        </Button>
      </div>

      <div className="space-y-3">
        {rows.map((r) => (
          <Card key={r.id} className="bg-card/50">
            <CardContent className="p-4 flex gap-3">
              <div className="relative w-14 h-14 flex-shrink-0">
                <Image src={avatarUrl(r.avatar_key)} alt={r.name} fill className="object-cover rounded-full border"/>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="font-semibold truncate">{r.name}</div>
                </div>
                <div className="text-xs text-muted-foreground line-clamp-1">{r.description || '——'}</div>
                <div className="mt-2 grid grid-cols-4 gap-2 text-sm">
                  <div>收益率 <span className="text-green-500 font-semibold">{r.yield_rate}%</span></div>
                  <div>胜率 <span className="font-semibold">{r.win_rate}%</span></div>
                  <div>盈亏比 <span className="font-semibold">{r.profit_loss_ratio ?? '--'}</span></div>
                  <div>累计信号 <span className="font-semibold">{r.total_signals}</span></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        <div ref={sentinelRef} />
        <div className="text-center text-xs text-muted-foreground py-3">
          {loading ? '加载中…' : hasMore ? '上拉加载更多' : (rows.length ? '已到底' : '暂无数据')}
        </div>
      </div>
    </div>
  )
}

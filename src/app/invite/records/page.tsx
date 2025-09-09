
"use client"

import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ChevronLeft, Loader2, Copy, RefreshCcw, Search, ChevronDown, X } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface Invitee {
  email: string | null
  username: string | null
  invited_at: string
  invitee_id?: string
}

function InfoRow({ label, value, copyValue }: { label: string; value: string; copyValue?: string }) {
  const [copied, setCopied] = useState(false)
  const doCopy = async () => {
    if (!copyValue) return
    try {
      await navigator.clipboard.writeText(copyValue)
      setCopied(true)
      setTimeout(() => setCopied(false), 800)
    } catch {}
  }
  return (
    <div className="flex items-center justify-between text-sm py-2 gap-3">
      <span className="text-muted-foreground whitespace-nowrap">{label}</span>
      <div className="flex items-center gap-2 min-w-0">
        <span className="font-medium text-foreground truncate max-w-[65vw] text-right">{value}</span>
        {copyValue && (
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={doCopy} title="复制">
            <Copy className="h-3 w-3" />
          </Button>
        )}
      </div>
    </div>
  )
}

function InviteeCard({ item }: { item: Invitee }) {
  const dt = format(new Date(item.invited_at), 'yyyy/MM/dd HH:mm:ss')
  return (
    <Card className="bg-card/50 border-border/30 overflow-hidden">
      <CardContent className="p-4">
        <div className="border-t border-border/30 pt-1">
          <InfoRow label="用户名" value={item.username || '—'} copyValue={item.username || undefined} />
          <InfoRow label="邮箱" value={item.email || '—'} copyValue={item.email || undefined} />
          <InfoRow label="邀请时间" value={dt} />
        </div>
      </CardContent>
    </Card>
  )
}

export default function InviteRecordsPage() {
  const { user } = useAuth()
  const [items, setItems] = useState<Invitee[]>([])
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const PAGE_SIZE = 10
  const [page, setPage] = useState(1)
  const inFlightRef = useRef(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [pullDistance, setPullDistance] = useState(0)
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const touchStartYRef = useRef(0)
  const pullingRef = useRef(false)
  const totalRef = useRef<number | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const loadPage = useCallback(async (targetPage: number) => {
    if (!user || inFlightRef.current) return
    inFlightRef.current = true
    setLoading(true)
    
    const res = await supabase.rpc('get_invitees_paged', {
      page: targetPage,
      page_size: PAGE_SIZE,
      q: searchQuery || null,
      start_at: null,
      end_at: null,
    })

    if (res.error) {
      console.error('get_invitees_paged RPC error:', res.error)
      setErrorMsg('加载失败：后台接口未就绪或无权限。请稍后重试。')
      setHasMore(false)
    } else {
      const rows = (res.data as any[]) || []
      const data: Invitee[] = rows.map(r => ({
        email: r.email ?? null,
        username: r.username ?? null,
        invited_at: r.invited_at,
        invitee_id: r.invitee_id,
      }))
      setItems(prev => (targetPage === 1 ? data : [...prev, ...data]))
      const total = rows.length > 0 ? Number(rows[0].total_count) : (totalRef.current ?? 0)
      totalRef.current = total
      const loaded = (targetPage - 1) * PAGE_SIZE + data.length
      setHasMore(total > 0 ? loaded < total : data.length === PAGE_SIZE)
      setPage(targetPage)
    }
    setLoading(false)
    inFlightRef.current = false
  }, [PAGE_SIZE, user, searchQuery])

  const resetAndLoadFirstPage = useCallback(async () => {
    if (!user) return
    setItems([])
    setHasMore(true)
    setErrorMsg(null)
    inFlightRef.current = false
    totalRef.current = null
    setPage(1)
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => {
        Promise.resolve(loadPage(1)).finally(() => resolve())
      })
    })
  }, [user, loadPage])

  const doRefresh = useCallback(async () => {
    if (loading || isRefreshing) return
    setIsRefreshing(true)
    await resetAndLoadFirstPage()
    setIsRefreshing(false)
  }, [loading, isRefreshing, resetAndLoadFirstPage])

  const initialLoadDoneRef = useRef(false)
  useEffect(() => {
    // initial load (guard against StrictMode double-invoke)
    if (!user || initialLoadDoneRef.current) return
    initialLoadDoneRef.current = true
    void resetAndLoadFirstPage()
  }, [user, resetAndLoadFirstPage])
  
  // Trigger reload when filters change
  useEffect(() => {
    if (initialLoadDoneRef.current) {
        void resetAndLoadFirstPage();
    }
  }, [searchQuery, resetAndLoadFirstPage]);


  return (
    <div className="bg-background min-h-screen text-foreground flex flex-col">
      <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-border/50 bg-background/80 px-4 backdrop-blur-sm">
        <Link href="/invite" passHref>
          <Button variant="ghost" size="icon">
            <ChevronLeft className="h-6 w-6" />
          </Button>
        </Link>
        <h1 className="text-lg font-bold">邀请记录</h1>
        <div className="w-10 flex justify-end">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => void doRefresh()}
            disabled={loading || isRefreshing}
            title="刷新"
          >
            {loading || isRefreshing ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <RefreshCcw className="h-5 w-5" />
            )}
          </Button>
        </div>
      </header>

      <div className="flex-shrink-0 sticky top-14 z-10 bg-background/80 backdrop-blur-sm px-4 pt-4 pb-3 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="search"
            placeholder="搜索用户名或邮箱"
            className="pl-10 pr-10 w-full bg-card border-border/60 rounded-full [&::-webkit-search-cancel-button]:hidden"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 text-foreground"
              onClick={() => setSearchQuery('')}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <main
        ref={scrollRef}
        className="flex-grow overflow-auto p-4 space-y-3"
        onTouchStart={(e) => {
          const el = scrollRef.current
          if (!el) return
          pullingRef.current = el.scrollTop <= 0
          touchStartYRef.current = e.touches[0]?.clientY ?? 0
        }}
        onTouchMove={(e) => {
          if (!pullingRef.current || loading || isRefreshing) return
          const currentY = e.touches[0]?.clientY ?? 0
          let dy = currentY - touchStartYRef.current
          if (dy > 0) {
            dy = Math.min(80, dy / 2)
            setPullDistance(dy)
            e.preventDefault()
          } else {
            setPullDistance(0)
          }
        }}
        onTouchEnd={() => {
          if (!pullingRef.current) return
          const threshold = 50
          const shouldRefresh = pullDistance >= threshold
          setPullDistance(0)
          pullingRef.current = false
          if (shouldRefresh) void doRefresh()
        }}
      >
        <div
          aria-hidden
          style={{ height: pullDistance, transition: pullDistance === 0 ? 'height 150ms ease-out' : 'none' }}
          className="-mt-4 flex items-center justify-center text-muted-foreground"
        >
          {pullDistance > 0 && (
            <div className="text-xs flex items-center gap-2">
              {pullDistance < 50 ? (
                <span>下拉刷新</span>
              ) : (
                <span className="text-foreground">松开刷新</span>
              )}
            </div>
          )}
        </div>
        {items.length === 0 && !loading ? (
          <div className="text-center text-muted-foreground pt-20">
            {errorMsg ? errorMsg : '暂无邀请记录'}
          </div>
        ) : (
          items.map((it, idx) => <InviteeCard key={idx} item={it} />)
        )}
        <div className="flex flex-col items-center gap-3 py-4 text-muted-foreground">
          {loading && (
            <div className="flex items-center">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              <span>加载中...</span>
            </div>
          )}
          {!loading && hasMore && (
            <Button variant="secondary" onClick={() => void loadPage(page + 1)}>
              加载更多
            </Button>
          )}
          {!loading && !hasMore && items.length > 0 && (
            <span>已经到底了</span>
          )}
        </div>
      </main>
    </div>
  )
}

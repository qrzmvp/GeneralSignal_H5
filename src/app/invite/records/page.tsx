"use client"

import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ChevronLeft, Loader2, Copy, RefreshCcw } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'
import { useInView } from 'react-intersection-observer'

interface Invitee {
  email: string | null
  username: string | null
  invited_at: string
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
  const [page, setPage] = useState(0)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const PAGE_SIZE = 10
  const inFlightRef = useRef(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [pullDistance, setPullDistance] = useState(0)
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const touchStartYRef = useRef(0)
  const pullingRef = useRef(false)
  const seenKeysRef = useRef<Set<string>>(new Set())
  const { ref: loadMoreRef, inView } = useInView({ threshold: 0.1, root: scrollRef.current as Element | null })

  const loadPage = useCallback(async () => {
    if (!user || loading || !hasMore || inFlightRef.current) return
    inFlightRef.current = true
    setLoading(true)
    const offset = page * PAGE_SIZE
  let data: Invitee[] | null = null
    let error: any = null
    // Prefer named params (requires RPC installed), fallback to default call
    let res = await supabase.rpc('get_invitees', { offset_arg: offset, limit_arg: PAGE_SIZE })
    if (res.error) {
      // fallback try without params (first page only)
      if (page === 0) {
        const res2 = await supabase.rpc('get_invitees')
        error = res2.error
        data = (res2.data as Invitee[]) || []
      } else {
        error = res.error
        // 分页参数不可用，立即停止进一步分页以避免死循环
        setHasMore(false)
      }
    } else {
      data = (res.data as Invitee[]) || []
    }

    if (error) {
      console.error('get_invitees RPC error:', error)
      setErrorMsg('加载失败：后台接口未就绪或无权限。请稍后重试。')
      if (!data || data.length === 0) {
        setHasMore(false)
      }
    }
    if (data) {
      // 去重与“无进展”检测：当后端忽略 offset/limit 时，同一页数据会重复返回
      const filtered = data.filter((it) => {
        const key = `${it.email ?? ''}|${it.username ?? ''}|${it.invited_at}`
        if (seenKeysRef.current.has(key)) return false
        seenKeysRef.current.add(key)
        return true
      })

      if (filtered.length === 0) {
        // 没有新数据，视为“到底了”，防止无限请求
        setHasMore(false)
      } else {
        setItems(prev => [...prev, ...filtered])
        setPage(prev => prev + 1)
        if (filtered.length < PAGE_SIZE) setHasMore(false)
      }
    }
    setLoading(false)
    inFlightRef.current = false
  }, [PAGE_SIZE, hasMore, loading, page, user])

  const resetAndLoadFirstPage = useCallback(async () => {
    if (!user) return
    setItems([])
    setPage(0)
    setHasMore(true)
    setErrorMsg(null)
    inFlightRef.current = false
  seenKeysRef.current.clear()
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => {
        Promise.resolve(loadPage()).finally(() => resolve())
      })
    })
  }, [user, loadPage])

  const doRefresh = useCallback(async () => {
    if (loading || isRefreshing) return
    setIsRefreshing(true)
    await resetAndLoadFirstPage()
    setIsRefreshing(false)
  }, [loading, isRefreshing, resetAndLoadFirstPage])

  useEffect(() => {
    // initial load
    if (user) {
      void resetAndLoadFirstPage()
    }
  }, [user, resetAndLoadFirstPage])

  useEffect(() => {
    if (inView && !loading) {
      void loadPage()
    }
  }, [inView, loading, loadPage])

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

      <main
        ref={scrollRef}
        className="flex-grow overflow-auto p-4 space-y-3"
        onTouchStart={(e) => {
          const el = scrollRef.current
          if (!el) return
          // 仅在列表滚动到顶部时允许下拉
          pullingRef.current = el.scrollTop <= 0
          touchStartYRef.current = e.touches[0]?.clientY ?? 0
        }}
        onTouchMove={(e) => {
          if (!pullingRef.current || loading || isRefreshing) return
          const currentY = e.touches[0]?.clientY ?? 0
          let dy = currentY - touchStartYRef.current
          if (dy > 0) {
            // 阻尼效果，限制最大拉动距离
            dy = Math.min(80, dy / 2)
            setPullDistance(dy)
            // 阻止页面整体滚动
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
        {/* 下拉刷新指示器占位 */}
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
        <div ref={loadMoreRef} className="flex justify-center items-center h-14 text-muted-foreground">
          {loading && (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              <span>加载中...</span>
            </>
          )}
          {!loading && !hasMore && items.length > 0 && (
            <span>已经到底了</span>
          )}
        </div>
      </main>
    </div>
  )
}

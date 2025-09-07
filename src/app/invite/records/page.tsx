"use client"

import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ChevronLeft, Loader2, Copy, RefreshCcw } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'
// 移除 IntersectionObserver，改用稳定的 onScroll 触底检测

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
  const inFlightRef = useRef(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [pullDistance, setPullDistance] = useState(0)
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const touchStartYRef = useRef(0)
  const pullingRef = useRef(false)
  const lastCursorRef = useRef<{ invited_at: string | null; invitee_id: string | null }>({ invited_at: null, invitee_id: null })
  const lastScrollTriggerAtRef = useRef<number>(0)

  const loadPage = useCallback(async () => {
    if (!user || loading || !hasMore || inFlightRef.current) return
    inFlightRef.current = true
    setLoading(true)
    const cursor_created_at = lastCursorRef.current.invited_at
    const cursor_invitee_id = lastCursorRef.current.invitee_id
    const res = await supabase.rpc('get_invitees_v2', {
      cursor_created_at,
      cursor_invitee_id,
      limit_arg: PAGE_SIZE,
    })
    if (res.error) {
      console.error('get_invitees_v2 RPC error:', res.error)
      setErrorMsg('加载失败：后台接口未就绪或无权限。请稍后重试。')
      setHasMore(false)
    } else {
      const data = (res.data as Invitee[]) || []
      setItems(prev => [...prev, ...data])
      if (data.length > 0) {
        const last = data[data.length - 1]
        lastCursorRef.current = { invited_at: last.invited_at, invitee_id: (last as any).invitee_id ?? null }
      }
      if (data.length < PAGE_SIZE) setHasMore(false)
    }
    setLoading(false)
    inFlightRef.current = false
  }, [PAGE_SIZE, hasMore, loading, user])

  const resetAndLoadFirstPage = useCallback(async () => {
    if (!user) return
    setItems([])
    setHasMore(true)
    setErrorMsg(null)
    inFlightRef.current = false
  lastCursorRef.current = { invited_at: null, invitee_id: null }
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

  // 容器滚动触底检测（稳定、可控）
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const onScroll = () => {
      if (!hasMore || loading) return
      const now = Date.now()
      if (now - lastScrollTriggerAtRef.current < 300) return
      if (el.scrollTop + el.clientHeight >= el.scrollHeight - 80) {
        lastScrollTriggerAtRef.current = now
        void loadPage()
      }
    }
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [hasMore, loading, loadPage])

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
  <div className="flex justify-center items-center h-14 text-muted-foreground">
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

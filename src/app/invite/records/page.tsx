"use client"

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ChevronLeft, Loader2, Copy } from 'lucide-react'
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
          <InfoRow label="用户名" value={item.username || '—'} />
          <InfoRow label="邮箱" value={item.email || '—'} />
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
  const { ref: loadMoreRef, inView } = useInView({ threshold: 0.1 })
  const PAGE_SIZE = 10

  const loadPage = useCallback(async () => {
    if (!user || loading || !hasMore) return
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
      }
    } else {
      data = (res.data as Invitee[]) || []
    }

    if (error) {
      console.error('get_invitees RPC error:', error)
    }
    if (data) {
      setItems(prev => [...prev, ...data!])
      setPage(prev => prev + 1)
      setHasMore(data.length === PAGE_SIZE)
    }
    setLoading(false)
  }, [PAGE_SIZE, hasMore, loading, page, user])

  useEffect(() => {
    // initial load
    if (user) {
      setItems([])
      setPage(0)
      setHasMore(true)
      // use microtask to call loadPage after state set
      setTimeout(() => void loadPage(), 0)
    }
  }, [user, loadPage])

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
        <div className="w-10" />
      </header>

      <main className="flex-grow overflow-auto p-4 space-y-3">
        {items.length === 0 && !loading ? (
          <div className="text-center text-muted-foreground pt-20">暂无邀请记录</div>
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

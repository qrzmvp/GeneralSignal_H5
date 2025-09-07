"use client"

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ChevronLeft, Loader2 } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'

interface Invitee {
  email: string | null
  username: string | null
  invited_at: string
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm py-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground truncate max-w-[70%] text-right">{value}</span>
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
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      if (!user) return
      setLoading(true)
      const { data, error } = await supabase.rpc('get_invitees')
      if (error) {
        console.error('get_invitees RPC error:', error)
      }
      if (!error && data) setItems(data as Invitee[])
      setLoading(false)
    }
    load()
  }, [user])

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
        {loading ? (
          <div className="flex items-center justify-center h-40 text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 加载中...
          </div>
        ) : items.length === 0 ? (
          <div className="text-center text-muted-foreground pt-20">暂无邀请记录</div>
        ) : (
          items.map((it, idx) => <InviteeCard key={idx} item={it} />)
        )}
      </main>
    </div>
  )
}

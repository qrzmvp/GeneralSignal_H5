"use client"

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function ExampleTraderRedirect() {
  const router = useRouter()
  const search = useSearchParams()
  const [msg, setMsg] = useState('正在定位交易员并跳转…')
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
  const idParam = search.get('id') || ''
    const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

    const go = (id: string) => {
      const url = `/trader/${id}`
      setMsg(`跳转到 ${url} …`)
      if (typeof window !== 'undefined') window.location.assign(url)
    }

    // 1) If user provided a valid id, prefer it and exit
    if (uuidRe.test(idParam)) {
      go(idParam)
      return
    }

    // 2) Kick off an immediate fallback to a known sample so页面不会卡住
  const sample = '549d9ac8-e8f6-43b0-9a65-20e3c813fa3e'
    setMsg('准备跳转到示例交易员…')
    setTimeout(() => go(sample), 100) // quick fallback

    // 3) In parallel, try to fetch the first real trader; if得到结果更快，优先跳真实 id
    ;(async () => {
      try {
  const { data } = await supabase.rpc('get_traders_paged', {
          page: 1,
          page_size: 1,
          q: null,
          sort_by: 'score',
          order_by: 'desc',
        })
        const first = Array.isArray(data) && data.length > 0 ? data[0] : null
        if (first?.id) go(first.id)
      } catch (e: any) {
        setErr(e?.message || String(e))
      }
    })()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground p-6">
      <div className="max-w-md w-full text-center space-y-3">
        <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
        <div className="text-sm text-muted-foreground">{msg}</div>
        {err && (
          <div className="text-xs text-red-400 break-words">{err}</div>
        )}
        <div className="pt-2 text-xs text-muted-foreground">
          如果没有自动跳转，你也可以手动访问：
          <div className="mt-1 space-y-1">
            <div>
              <code className="bg-card px-1.5 py-0.5 rounded">/trader/549d9ac8-e8f6-43b0-9a65-20e3c813fa3e</code>
            </div>
            <div>
              或传入指定 id：
              <code className="bg-card px-1.5 py-0.5 rounded ml-1">/trader/example?id=&lt;uuid&gt;</code>
            </div>
          </div>
          <div className="mt-3">
            <Link className="underline" href="/">返回首页</Link>
          </div>
        </div>
      </div>
    </div>
  )
}

'use client'

import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ChevronLeft, Loader2, RefreshCcw, Search, X } from 'lucide-react'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { useToast } from '@/hooks/use-toast'
import { getFeedbackHistory, type FeedbackRecord } from '@/lib/feedback'
import { FeedbackCard } from '@/components/FeedbackCard'

export default function FeedbackHistoryPage() {
  const [items, setItems] = useState<FeedbackRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [pullDistance, setPullDistance] = useState(0)

  const inFlightRef = useRef(false)
  const initialLoadDoneRef = useRef(false)
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const touchStartYRef = useRef(0)
  const pullingRef = useRef(false)
  const { toast } = useToast()

  const PAGE_SIZE = 10

  const loadPage = useCallback(async (targetPage: number) => {
    if (inFlightRef.current) return
    inFlightRef.current = true
    setLoading(true)
    setErrorMsg(null)

    try {
      const result = await getFeedbackHistory({
        page: targetPage,
        limit: PAGE_SIZE,
        search: searchQuery || undefined
      })

      setItems(prev => targetPage === 1 ? result.data : [...prev, ...result.data])
      setTotal(result.total)
      setHasMore(result.hasMore)
      setPage(targetPage)
    } catch (error: any) {
      console.error('getFeedbackHistory error:', error)
      let message = '加载失败，请稍后重试'
      
      // 更细致的错误处理
      if (error?.message) {
        if (error.message.includes('请先登录')) {
          message = '请先登录后再查看反馈记录'
        } else if (error.message.includes('JWT')) {
          message = '登录已过期，请重新登录'
        } else {
          message = error.message
        }
      }
      
      setErrorMsg(message)
      toast({
        title: '加载失败',
        description: message,
        variant: 'destructive'
      })
      setHasMore(false)
    } finally {
      setLoading(false)
      inFlightRef.current = false
    }
  }, [searchQuery, toast])

  const resetAndLoadFirstPage = useCallback(async () => {
    setItems([])
    setHasMore(true)
    setErrorMsg(null)
    setTotal(0)
    inFlightRef.current = false
    setPage(1)
    
    try {
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => {
          Promise.resolve(loadPage(1))
            .catch((error) => {
              console.error('resetAndLoadFirstPage error:', error)
              // 错误已经在 loadPage 中处理了
            })
            .finally(() => resolve())
        })
      })
    } catch (error) {
      console.error('resetAndLoadFirstPage wrapper error:', error)
    }
  }, [loadPage])

  const doRefresh = useCallback(async () => {
    if (loading || isRefreshing) return
    setIsRefreshing(true)
    
    try {
      await resetAndLoadFirstPage()
    } catch (error) {
      console.error('doRefresh error:', error)
    } finally {
      setIsRefreshing(false)
    }
  }, [loading, isRefreshing, resetAndLoadFirstPage])

  // 初始加载
  useEffect(() => {
    if (!initialLoadDoneRef.current) {
      initialLoadDoneRef.current = true
      void resetAndLoadFirstPage()
    }
  }, [resetAndLoadFirstPage])

  // 搜索变化时重新加载
  useEffect(() => {
    if (initialLoadDoneRef.current) {
      void resetAndLoadFirstPage()
    }
  }, [searchQuery, resetAndLoadFirstPage])

  return (
    <ProtectedRoute>
      <div className="bg-background min-h-screen text-foreground flex flex-col">
        {/* Header */}
        <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-border/50 bg-background/80 px-4 backdrop-blur-sm">
          <Link href="/profile/feedback" passHref>
            <Button variant="ghost" size="icon">
              <ChevronLeft className="h-6 w-6" />
            </Button>
          </Link>
          <h1 className="text-lg font-bold">反馈记录</h1>
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

        {/* Search Filter */}
        <div className="flex-shrink-0 sticky top-14 z-10 bg-background/80 backdrop-blur-sm px-4 pt-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="搜索问题描述"
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
          {total > 0 && (
            <p className="text-xs text-muted-foreground mt-2 text-center">
              找到 {total} 条反馈记录
            </p>
          )}
        </div>

        {/* Main Content */}
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
          {/* Pull to Refresh Indicator */}
          <div
            aria-hidden
            style={{ 
              height: pullDistance, 
              transition: pullDistance === 0 ? 'height 150ms ease-out' : 'none' 
            }}
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

          {/* Content */}
          {items.length === 0 && !loading ? (
            <div className="text-center text-muted-foreground pt-20">
              {errorMsg ? (
                <div className="space-y-2">
                  <p>{errorMsg}</p>
                  <Button variant="outline" size="sm" onClick={() => void doRefresh()}>
                    重试
                  </Button>
                </div>
              ) : searchQuery ? (
                <div className="space-y-2">
                  <p>未找到相关反馈记录</p>
                  <Button variant="outline" size="sm" onClick={() => setSearchQuery('')}>
                    清除搜索
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <p>暂无反馈记录</p>
                  <Link href="/profile/feedback" passHref>
                    <Button variant="outline" size="sm">
                      提交反馈
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          ) : (
            items.map((feedback) => (
              <FeedbackCard
                key={feedback.id}
                feedback={feedback}
              />
            ))
          )}

          {/* Load More / Loading */}
          <div className="flex flex-col items-center gap-3 py-4 text-muted-foreground">
            {loading && (
              <div className="flex items-center">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                <span>加载中...</span>
              </div>
            )}
            {!loading && hasMore && items.length > 0 && (
              <Button 
                variant="secondary" 
                onClick={() => void loadPage(page + 1)}
                disabled={loading}
              >
                加载更多
              </Button>
            )}
            {!loading && !hasMore && items.length > 0 && (
              <span>已经到底了</span>
            )}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
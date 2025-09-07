
"use client"

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ChevronLeft, Copy, Clock, Download } from 'lucide-react'
import { SimpleToast } from '../components/SimpleToast'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { QRCodeSVG, QRCodeCanvas } from 'qrcode.react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'

export default function InvitePage() {
    const [showToast, setShowToast] = useState(false)
    const { user } = useAuth()
    const [code, setCode] = useState('')
    const [link, setLink] = useState('')
    const [showQrPreview, setShowQrPreview] = useState(false)
    const [qrSize, setQrSize] = useState(360)
    const qrCanvasRef = useRef<HTMLCanvasElement | null>(null)

    useEffect(() => {
        const load = async () => {
            if (!user) return
            let invite = (user as any)?.user_metadata?.invitation_code || ''
            if (!invite) {
                const { data } = await supabase
                    .from('profiles')
                    .select('invitation_code')
                    .eq('id', user.id)
                    .maybeSingle()
                invite = data?.invitation_code || ''
            }
            setCode(invite)
            const base = typeof window !== 'undefined' ? window.location.origin : 'https://signal-auth.com'
            setLink(`${base}/login?ref=${invite}`)
        }
        void load()
    }, [user])

    const handleCopy = (text: string) => {
        if (!text) return
        navigator.clipboard.writeText(text)
        setShowToast(true)
    }

    const handleDownload = () => {
        const canvas = qrCanvasRef.current
        if (!canvas) return
        const dataUrl = canvas.toDataURL('image/png')
        const a = document.createElement('a')
        a.href = dataUrl
        a.download = `invite-qr-${code || 'code'}.png`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
    }

    return (
        <div className="bg-background min-h-screen text-foreground flex flex-col">
            {showToast && <SimpleToast message="复制成功" onDismiss={() => setShowToast(false)} />}
            <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-border/50 bg-background/80 px-4 backdrop-blur-sm">
                <Link href="/profile" passHref>
                    <Button variant="ghost" size="icon">
                        <ChevronLeft className="h-6 w-6" />
                    </Button>
                </Link>
                <h1 className="text-lg font-bold">邀请好友</h1>
                <Link href="/invite/records">
                    <Button variant="ghost" size="icon" title="邀请记录">
                        <Clock className="h-5 w-5" />
                    </Button>
                </Link>
            </header>

            <main className="flex-grow overflow-auto p-4 space-y-6">
                <Card className="bg-card/50 border-border/30 text-center">
                    <CardHeader>
                        <CardTitle className="text-2xl">分享给好友</CardTitle>
                        <CardDescription>邀请好友加入，一起探索加密世界！</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex flex-col items-center justify-center gap-4">
                            <button
                                aria-label="预览二维码"
                                className="rounded-lg border-4 border-primary/50 p-2 bg-white"
                                onClick={() => setShowQrPreview(true)}
                            >
                                <QRCodeSVG value={link || 'https://signal-auth.com'} size={176} includeMargin />
                            </button>
                            <div className="flex items-center gap-3">
                                <p className="text-sm text-muted-foreground">扫描二维码分享</p>
                                <Button variant="secondary" size="sm" onClick={() => setShowQrPreview(true)} disabled={!link}>
                                    <Download className="w-4 h-4 mr-1" /> 下载
                                </Button>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2 text-left">
                                <Label htmlFor="invite-code">我的邀请码</Label>
                                <div className="flex items-center gap-2">
                                    <Input id="invite-code" value={code || '——'} readOnly className="bg-muted/50 font-mono text-base" />
                                    <Button size="icon" variant="secondary" onClick={() => handleCopy(code)} disabled={!code}>
                                        <Copy className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                            <div className="space-y-2 text-left">
                                <Label htmlFor="invite-link">我的邀请链接</Label>
                                <div className="flex items-center gap-2">
                                    <Input id="invite-link" value={link || ''} readOnly className="bg-muted/50 text-base" />
                                    <Button size="icon" variant="secondary" onClick={() => handleCopy(link)} disabled={!link}>
                                        <Copy className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-card/50 border-border/30">
                    <CardHeader>
                        <CardTitle className="text-lg">邀请规则</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm text-muted-foreground">
                        <p>1. 好友通过您的邀请链接或邀请码成功注册后，即视为邀请成功。</p>
                        <p>2. 每成功邀请一位好友，您和您的好友都将获得神秘奖励。</p>
                        <p>3. 奖励将自动发放到您的账户中，可在“我的奖励”中查看。</p>
                        <p>4. 平台保留对邀请规则的最终解释权。</p>
                    </CardContent>
                </Card>
            </main>

            <Dialog open={showQrPreview} onOpenChange={setShowQrPreview}>
                <DialogContent className="sm:max-w-[520px]">
                    <DialogHeader>
                        <DialogTitle>二维码预览</DialogTitle>
                        <DialogDescription>长按保存或点击下载，滑动调节尺寸</DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-col items-center gap-4">
                        <div className="bg-white p-3 rounded-lg border">
                            <QRCodeCanvas value={link || ''} size={qrSize} includeMargin ref={qrCanvasRef as any} />
                        </div>
                        <div className="flex items-center gap-3 w-full">
                            <span className="text-xs text-muted-foreground w-12">尺寸</span>
                            <input type="range" min={200} max={720} step={20} value={qrSize} onChange={e => setQrSize(parseInt(e.target.value))} className="w-full" />
                            <span className="text-xs w-12 text-right">{qrSize}px</span>
                        </div>
                        <div className="flex gap-3 w-full">
                            <Button className="flex-1" variant="secondary" onClick={() => handleCopy(link)} disabled={!link}>复制链接</Button>
                            <Button className="flex-1" onClick={handleDownload}>下载图片</Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}

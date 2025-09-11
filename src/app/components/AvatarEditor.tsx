"use client"

import { useEffect, useRef, useState } from "react"
import ReactCrop, { PercentCrop } from "react-image-crop"
import "react-image-crop/dist/ReactCrop.css"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Label } from "@/components/ui/label"
import { AlertCircle, Camera, ImageIcon, UploadIcon } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import { 
    validateAvatarFile, 
    uploadAvatar, 
    updateUserAvatarUrl, 
    AVATAR_CONFIG 
} from "@/lib/avatar-utils"

type Props = {
    open: boolean
    onOpenChange: (open: boolean) => void
    userId: string
    currentUrl?: string | null
    onUploaded: (url: string) => void
}

export default function AvatarEditor({ open, onOpenChange, userId, currentUrl, onUploaded }: Props) {
    const [fileUrl, setFileUrl] = useState<string | null>(null)
    const [imgEl, setImgEl] = useState<HTMLImageElement | null>(null)
    const [crop, setCrop] = useState<PercentCrop>(AVATAR_CONFIG.DEFAULT_CROP)
    const [scale, setScale] = useState(AVATAR_CONFIG.DEFAULT_SCALE)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const cameraInputRef = useRef<HTMLInputElement | null>(null)
    const galleryInputRef = useRef<HTMLInputElement | null>(null)
    const previewRef = useRef<HTMLCanvasElement | null>(null)
    const { toast } = useToast()

    useEffect(() => {
        if (!open) {
            // reset state when closed
            if (fileUrl) URL.revokeObjectURL(fileUrl)
            setFileUrl(null)
            setImgEl(null)
            setCrop(AVATAR_CONFIG.DEFAULT_CROP)
            setScale(AVATAR_CONFIG.DEFAULT_SCALE)
            setError(null)
        }
    }, [open])

    const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0]
        if (!f) return
        
        // 使用工具函数验证文件
        const validation = validateAvatarFile(f)
        if (!validation.isValid) {
            setError(validation.error!)
            toast({ description: validation.error!, variant: 'destructive' })
            return
        }
        
        setError(null)
        const url = URL.createObjectURL(f)
        setFileUrl(url)
        e.target.value = '' // 清空input以便重复选择同一文件
    }

    const openCamera = () => cameraInputRef.current?.click()
    const openGallery = () => galleryInputRef.current?.click()

    // Draw the cropped image to a canvas and return a blob
    const getCroppedBlob = async (): Promise<Blob | null> => {
    if (!imgEl || !crop.width || !crop.height) return null
    const image = imgEl
    const canvas = document.createElement("canvas")

    const naturalW = image.naturalWidth
    const naturalH = image.naturalHeight

    // convert percent crop to pixel coords on the natural image
    const xPx = (crop.x || 0) * naturalW / 100
    const yPx = (crop.y || 0) * naturalH / 100
    const wPx = (crop.width || 0) * naturalW / 100
    const hPx = (crop.height || 0) * naturalH / 100

    // Apply zoom: reduce source rect size around center when scale > 1
    const centerX = xPx + wPx / 2
    const centerY = yPx + hPx / 2
    const srcW = Math.max(1, wPx / Math.max(1, scale))
    const srcH = Math.max(1, hPx / Math.max(1, scale))
    let srcX = centerX - srcW / 2
    let srcY = centerY - srcH / 2
    // clamp to image bounds
    srcX = Math.max(0, Math.min(srcX, naturalW - srcW))
    srcY = Math.max(0, Math.min(srcY, naturalH - srcH))

    // Output to a square canvas (avatar)
    canvas.width = AVATAR_CONFIG.OUTPUT_SIZE
    canvas.height = AVATAR_CONFIG.OUTPUT_SIZE
        const ctx = canvas.getContext("2d")!
        ctx.imageSmoothingQuality = "high"

        ctx.drawImage(image, srcX, srcY, srcW, srcH, 0, 0, canvas.width, canvas.height)

        return await new Promise<Blob | null>((resolve) => 
            canvas.toBlob((b) => resolve(b), "image/jpeg", AVATAR_CONFIG.JPEG_QUALITY)
        )
    }

    // live round preview (small)
    useEffect(() => {
        if (!imgEl || !fileUrl || !previewRef.current || !crop.width || !crop.height) return
        const canvas = previewRef.current
        const image = imgEl
        const naturalW = image.naturalWidth
        const naturalH = image.naturalHeight
        const xPx = (crop.x || 0) * naturalW / 100
        const yPx = (crop.y || 0) * naturalH / 100
        const wPx = (crop.width || 0) * naturalW / 100
        const hPx = (crop.height || 0) * naturalH / 100
        const centerX = xPx + wPx / 2
        const centerY = yPx + hPx / 2
        const srcW = Math.max(1, wPx / Math.max(1, scale))
        const srcH = Math.max(1, hPx / Math.max(1, scale))
        let srcX = centerX - srcW / 2
        let srcY = centerY - srcH / 2
        srcX = Math.max(0, Math.min(srcX, naturalW - srcW))
        srcY = Math.max(0, Math.min(srcY, naturalH - srcH))

        const size = AVATAR_CONFIG.PREVIEW_SIZE
        canvas.width = size
        canvas.height = size
        const ctx = canvas.getContext("2d")!
        ctx.clearRect(0, 0, size, size)
        ctx.save()
        // round mask
        ctx.beginPath()
        ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2)
        ctx.closePath()
        ctx.clip()
        ctx.imageSmoothingQuality = "high"
        ctx.drawImage(image, srcX, srcY, srcW, srcH, 0, 0, size, size)
        ctx.restore()
    }, [fileUrl, imgEl, crop, scale])

    const handleSave = async () => {
        setSaving(true)
        setError(null)
        
        try {
            const blob = await getCroppedBlob()
            if (!blob) throw new Error("无法生成头像数据")

            // 使用工具函数上传头像
            const uploadResult = await uploadAvatar({
                userId,
                blob,
                deleteOldAvatar: currentUrl
            })

            if (!uploadResult.success) {
                throw new Error(uploadResult.error || "上传失败")
            }

            // 更新用户资料
            const updateResult = await updateUserAvatarUrl(userId, uploadResult.url!)
            if (!updateResult.success) {
                throw new Error(updateResult.error || "更新资料失败")
            }

            toast({ description: '头像更新成功！' })
            onUploaded(uploadResult.url!)
            onOpenChange(false)
        } catch (e) {
            const msg = (e as any)?.message || String(e)
            console.error("保存头像失败:", e)
            setError(`保存失败：${msg}`)
            toast({ 
                description: `保存头像失败：${msg}`, 
                variant: 'destructive' 
            })
        } finally {
            setSaving(false)
        }
    }

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="bottom" className="p-0 pb-safe overflow-hidden">
                <SheetHeader className="p-4 pb-2">
                    <SheetTitle>编辑头像</SheetTitle>
                    <SheetDescription>支持缩放与裁剪（圆形预览，保存为正方形）</SheetDescription>
                </SheetHeader>

                <div className="px-4 pb-4">
                    {error && (
                        <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 text-destructive" />
                            <span className="text-sm text-destructive">{error}</span>
                        </div>
                    )}
                    
                    {!fileUrl ? (
                        <div className="mx-auto w-full max-w-sm">
                            <div className="rounded-xl overflow-hidden bg-white text-foreground dark:bg-neutral-900 border border-border/50 text-center">
                                <button 
                                    className="w-full py-4 text-base active:bg-black/5 dark:active:bg-white/10 flex items-center justify-center gap-2" 
                                    onClick={openCamera}
                                >
                                    <Camera className="h-5 w-5" />
                                    拍摄
                                </button>
                                <div className="h-px bg-border/70" />
                                <button 
                                    className="w-full py-4 text-base active:bg-black/5 dark:active:bg-white/10 flex items-center justify-center gap-2" 
                                    onClick={openGallery}
                                >
                                    <ImageIcon className="h-5 w-5" />
                                    从手机相册选择
                                </button>
                            </div>
                            <div className="h-2" />
                            <div className="rounded-xl overflow-hidden bg-white text-foreground dark:bg-neutral-900 border border-border/50 text-center">
                                <button className="w-full py-3 text-base active:bg-black/5 dark:active:bg-white/10" onClick={() => onOpenChange(false)}>取消</button>
                            </div>
                            <input ref={cameraInputRef} type="file" accept={AVATAR_CONFIG.ALLOWED_TYPES.join(',')} capture="user" className="hidden" onChange={onFileChange} />
                            <input ref={galleryInputRef} type="file" accept={AVATAR_CONFIG.ALLOWED_TYPES.join(',')} className="hidden" onChange={onFileChange} />
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            <div className="avatar-crop">
                                <ReactCrop crop={crop} onChange={(_c, percent) => setCrop(percent)} aspect={1}>
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={fileUrl}
                                        alt="to-crop"
                                        ref={(el) => setImgEl(el)}
                                        className="max-h-[48vh] w-full object-contain"
                                        style={{ transform: `scale(${scale})`, transformOrigin: "center center" }}
                                    />
                                </ReactCrop>
                            </div>
                            <div className="flex items-center gap-3 mb-4">
                                <Label className="text-sm text-muted-foreground w-14">缩放</Label>
                                <input
                                    type="range"
                                    min={0.5}
                                    max={3}
                                    step={0.1}
                                    value={scale}
                                    onChange={(e) => setScale(parseFloat(e.target.value))}
                                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                                />
                                <span className="text-sm w-12 text-right text-muted-foreground">{scale.toFixed(1)}x</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <Label className="text-sm text-muted-foreground">预览效果</Label>
                                <div className="flex items-center gap-2">
                                    <canvas ref={previewRef} className="rounded-full border-2 border-primary/20 size-16" />
                                    <span className="text-xs text-muted-foreground">{AVATAR_CONFIG.OUTPUT_SIZE}×{AVATAR_CONFIG.OUTPUT_SIZE}</span>
                                </div>
                            </div>
                            {/* 保存按钮 - 只在有图片时显示 */}
                            <div className="mt-4">
                                <Button 
                                    className="w-full" 
                                    onClick={handleSave} 
                                    disabled={saving}
                                >
                                    {saving ? (
                                        <div className="flex items-center gap-2">
                                            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                            保存中...
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <UploadIcon className="w-4 h-4" />
                                            保存头像
                                        </div>
                                    )}
                                </Button>
                            </div>
                        </div>
                    )}
                </div>

                {/* circular crop selection style */}
                <style jsx global>{`
                  .avatar-crop .ReactCrop__crop-selection { border-radius: 9999px; }
                `}</style>
            </SheetContent>
        </Sheet>
    )
}
 
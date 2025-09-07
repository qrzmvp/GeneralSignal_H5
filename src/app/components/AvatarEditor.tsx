"use client"

import { useEffect, useRef, useState } from "react"
import ReactCrop, { PercentCrop } from "react-image-crop"
import "react-image-crop/dist/ReactCrop.css"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { supabase } from "@/lib/supabase"

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
    const [crop, setCrop] = useState<PercentCrop>({ unit: "%", width: 70, height: 70, x: 15, y: 15 })
    const [scale, setScale] = useState(1)
    const [saving, setSaving] = useState(false)
    const cameraInputRef = useRef<HTMLInputElement | null>(null)
    const galleryInputRef = useRef<HTMLInputElement | null>(null)
    const previewRef = useRef<HTMLCanvasElement | null>(null)

    useEffect(() => {
        if (!open) {
            // reset state when closed
        if (fileUrl) URL.revokeObjectURL(fileUrl)
        setFileUrl(null)
            setImgEl(null)
            setCrop({ unit: "%", width: 70, height: 70, x: 15, y: 15 })
            setScale(1)
        }
    }, [open])

    const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0]
        if (!f) return
        if (f.size > 5 * 1024 * 1024) {
            alert("图片大小需小于 5MB")
            return
        }
        const url = URL.createObjectURL(f)
        setFileUrl(url)
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
    canvas.width = 400
    canvas.height = 400
        const ctx = canvas.getContext("2d")!
        ctx.imageSmoothingQuality = "high"

        ctx.drawImage(image, srcX, srcY, srcW, srcH, 0, 0, canvas.width, canvas.height)

        return await new Promise<Blob | null>((resolve) => canvas.toBlob((b) => resolve(b), "image/jpeg", 0.9))
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

        const size = 160
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
        try {
            const blob = await getCroppedBlob()
            if (!blob) throw new Error("无法生成头像数据")

            const filePath = `${userId}/${Date.now()}.jpg`
            const { error: upErr } = await supabase.storage.from("avatars").upload(filePath, blob, {
                cacheControl: "3600",
                upsert: true,
                contentType: "image/jpeg",
            })
            if (upErr) throw upErr

            const { data } = supabase.storage.from("avatars").getPublicUrl(filePath)
            const publicUrl = data.publicUrl

            const { error: dbErr } = await supabase
                .from("profiles")
                .update({ avatar_url: publicUrl })
                .eq("id", userId)
            if (dbErr) throw dbErr

            onUploaded(publicUrl)
            onOpenChange(false)
        } catch (e) {
            console.error("保存头像失败:", e)
            alert("保存头像失败：请稍后重试，或确认已在 Supabase Storage 创建公开的 avatars 存储桶")
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

                <div className="px-4 pb-24">
                    {!fileUrl ? (
                        <div className="grid gap-3">
                            {currentUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={currentUrl} alt="current avatar" className="mx-auto w-20 h-20 rounded-full object-cover" />
                            ) : null}
                            <div className="grid grid-cols-2 gap-3">
                                <Button variant="secondary" onClick={openCamera}>拍摄</Button>
                                <Button onClick={openGallery}>从相册选择</Button>
                                <input ref={cameraInputRef} type="file" accept="image/*" capture="user" className="hidden" onChange={onFileChange} />
                                <input ref={galleryInputRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />
                            </div>
                            <p className="text-xs text-muted-foreground text-center">建议 400x400 以上清晰图片，小于 5MB</p>
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
                            <div className="flex items-center gap-3">
                                <span className="text-xs text-muted-foreground w-14">缩放</span>
                                <input
                                    type="range"
                                    min={0.5}
                                    max={3}
                                    step={0.1}
                                    value={scale}
                                    onChange={(e) => setScale(parseFloat(e.target.value))}
                                    className="w-full"
                                />
                                <span className="text-xs w-10 text-right">{scale.toFixed(1)}x</span>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className="text-xs text-muted-foreground">圆形预览</span>
                                <canvas ref={previewRef} className="rounded-full border size-16" />
                            </div>
                        </div>
                    )}
                </div>

                <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-3 flex gap-3">
                    <Button variant="secondary" className="flex-1" onClick={() => onOpenChange(false)} disabled={saving}>取消</Button>
                    <Button className="flex-1" onClick={handleSave} disabled={!fileUrl || saving}>{saving ? "保存中..." : "保存"}</Button>
                </div>

                {/* circular crop selection style */}
                <style jsx global>{`
                  .avatar-crop .ReactCrop__crop-selection { border-radius: 9999px; }
                `}</style>
            </SheetContent>
        </Sheet>
    )
}
 
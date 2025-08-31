
"use client"

import React, { useState, useRef, ReactNode } from 'react'
import ReactCrop, {
  centerCrop,
  makeAspectCrop,
  Crop,
  PixelCrop,
} from 'react-image-crop'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Label } from '@/components/ui/label'

import 'react-image-crop/dist/ReactCrop.css'

function centerAspectCrop(
  mediaWidth: number,
  mediaHeight: number,
  aspect: number
) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: '%',
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight
    ),
    mediaWidth,
    mediaHeight
  )
}

function getCroppedImg(
    image: HTMLImageElement,
    crop: PixelCrop,
    scale = 1
): Promise<string> {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
        return Promise.reject(new Error('No 2d context'));
    }

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    
    canvas.width = crop.width;
    canvas.height = crop.height;

    ctx.save();
    const
     cropX = crop.x * scaleX;
    const cropY = crop.y * scaleY;

    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.scale(scale, scale);
    ctx.translate(-canvas.width / 2, -canvas.height / 2);
    ctx.drawImage(
        image,
        cropX,
        cropY,
        crop.width * scaleX,
        crop.height * scaleY,
        0,
        0,
        crop.width,
        crop.height
    );
    ctx.restore();

    return new Promise((resolve) => {
        resolve(canvas.toDataURL("image/png"));
    });
}


interface AvatarEditorProps {
  children: ReactNode;
  onSave: (newAvatar: string) => void;
}

export function AvatarEditor({ children, onSave }: AvatarEditorProps) {
  const [imgSrc, setImgSrc] = useState('')
  const previewCanvasRef = useRef<HTMLCanvasElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const [crop, setCrop] = useState<Crop>()
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>()
  const [scale, setScale] = useState(1)
  const [rotate, setRotate] = useState(0)
  const [aspect, setAspect] = useState<number | undefined>(1)
  const [open, setOpen] = useState(false);

  function onSelectFile(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) {
      setCrop(undefined) // Makes crop preview update between images.
      const reader = new FileReader()
      reader.addEventListener('load', () =>
        setImgSrc(reader.result?.toString() || ''),
      )
      reader.readAsDataURL(e.target.files[0])
    }
  }

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    if (aspect) {
      const { width, height } = e.currentTarget
      setCrop(centerAspectCrop(width, height, aspect))
    }
  }
  
  async function handleSave() {
    if (
      completedCrop?.width &&
      completedCrop?.height &&
      imgRef.current 
    ) {
      const croppedImageUrl = await getCroppedImg(
        imgRef.current,
        completedCrop,
        scale
      );
      onSave(croppedImageUrl);
      setOpen(false);
      setImgSrc('');
    }
  }


  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>编辑头像</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
            <div className="flex justify-center">
                 <input type="file" accept="image/*" onChange={onSelectFile} className="hidden" id="avatar-upload" />
                <Button asChild>
                   <Label htmlFor="avatar-upload">选择图片</Label>
                </Button>
            </div>
          {imgSrc && (
            <>
              <div className="flex justify-center bg-muted rounded-md overflow-hidden">
                <ReactCrop
                  crop={crop}
                  onChange={(_, percentCrop) => setCrop(percentCrop)}
                  onComplete={(c) => setCompletedCrop(c)}
                  aspect={aspect}
                  circularCrop
                >
                  <img
                    ref={imgRef}
                    alt="Crop me"
                    src={imgSrc}
                    style={{ transform: `scale(${scale}) rotate(${rotate}deg)` }}
                    onLoad={onImageLoad}
                  />
                </ReactCrop>
              </div>

              <div className="space-y-2">
                <Label htmlFor="scale-slider">缩放</Label>
                <Slider
                  id="scale-slider"
                  defaultValue={[1]}
                  min={0.5}
                  max={2}
                  step={0.01}
                  onValueChange={(value) => setScale(value[0])}
                />
              </div>

              <div className="flex items-center gap-4">
                <Label>预览</Label>
                 {!!completedCrop && (
                    <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-primary">
                         <img
                            src={imgSrc}
                            style={{
                                width: `${100/ (completedCrop.width / 100)}%`,
                                height: 'auto',
                                transform: `translate(-${(completedCrop.x / completedCrop.width) * 100}%, -${(completedCrop.y / completedCrop.width) * 100}%) scale(${scale})`,
                                objectFit: 'cover'
                            }}
                            alt="Preview"
                        />
                    </div>
                )}
              </div>
            </>
          )}
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="secondary">取消</Button>
          </DialogClose>
          <Button onClick={handleSave} disabled={!completedCrop}>保存</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}


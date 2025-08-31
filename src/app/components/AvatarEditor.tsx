
"use client"

import React, { useState, useRef, ReactNode, useEffect } from 'react'
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
  imgSrc: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (newAvatar: string) => void;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function AvatarEditor({ imgSrc, open, onOpenChange, onSave, onFileSelect }: AvatarEditorProps) {
  const imgRef = useRef<HTMLImageElement>(null)
  const [crop, setCrop] = useState<Crop>()
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>()
  const [scale, setScale] = useState(1)
  const aspect = 1;


  useEffect(() => {
    // Reset state when a new image is loaded or dialog is closed
    if (!open || !imgSrc) {
        setCrop(undefined);
        setCompletedCrop(undefined);
        setScale(1);
    }
  }, [imgSrc, open]);


  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const { width, height } = e.currentTarget
    setCrop(centerAspectCrop(width, height, aspect))
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
      onOpenChange(false);
    }
  }


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>编辑头像</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {!imgSrc && (
             <div className="flex justify-center">
                 <input type="file" accept="image/*" onChange={onFileSelect} className="hidden" id="avatar-upload-dialog" />
                <Button asChild>
                   <Label htmlFor="avatar-upload-dialog">选择图片</Label>
                </Button>
            </div>
          )}
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
                    style={{ transform: `scale(${scale})` }}
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
                                width: `${100/ (completedCrop.width / imgRef.current!.width)}%`,
                                height: 'auto',
                                transform: `translate(-${(completedCrop.x / completedCrop.width) * 100}%, -${(completedCrop.y / completedCrop.height) * 100}%) scale(${scale})`,
                                objectFit: 'cover',
                                imageRendering: 'pixelated'
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
          <Button variant="secondary" onClick={() => onOpenChange(false)}>取消</Button>
          <Button onClick={handleSave} disabled={!completedCrop}>保存</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

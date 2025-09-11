'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import { format } from 'date-fns'
import { FeedbackRecord, FEEDBACK_TYPE_LABELS, FEEDBACK_STATUS_LABELS } from '@/lib/feedback'
import { FeedbackImage } from './FeedbackImage'

interface FeedbackDetailDialogProps {
  feedback: FeedbackRecord | null
  isOpen: boolean
  onClose: () => void
}

interface ImageViewerProps {
  images: string[]
  currentIndex: number
  onClose: () => void
  onPrevious: () => void
  onNext: () => void
}

function ImageViewer({ images, currentIndex, onClose, onPrevious, onNext }: ImageViewerProps) {
  const currentImage = images[currentIndex]

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 bg-black/90">
        <div className="relative w-full h-full flex items-center justify-center">
          {/* Close button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 z-50 text-white hover:bg-white/20"
            onClick={onClose}
          >
            <X className="h-6 w-6" />
          </Button>

          {/* Navigation buttons */}
          {images.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-4 top-1/2 -translate-y-1/2 z-50 text-white hover:bg-white/20"
                onClick={onPrevious}
                disabled={currentIndex === 0}
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 top-1/2 -translate-y-1/2 z-50 text-white hover:bg-white/20"
                onClick={onNext}
                disabled={currentIndex === images.length - 1}
              >
                <ChevronRight className="h-6 w-6" />
              </Button>
            </>
          )}

          {/* Image counter */}
          {images.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 bg-black/60 text-white px-3 py-1 rounded-full text-sm">
              {currentIndex + 1} / {images.length}
            </div>
          )}

          {/* Image */}
          <div className="relative w-full h-full flex items-center justify-center p-8">
            <FeedbackImage
              imagePath={currentImage}
              alt={`反馈图片 ${currentIndex + 1}`}
              className="max-w-full max-h-full object-contain"
              width={800}
              height={600}
              loading="eager"
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function FeedbackDetailDialog({ feedback, isOpen, onClose }: FeedbackDetailDialogProps) {
  const [imageViewerIndex, setImageViewerIndex] = useState<number | null>(null)

  if (!feedback) return null

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'yyyy年MM月dd日 HH:mm:ss')
    } catch {
      return dateString
    }
  }

  const openImageViewer = (index: number) => {
    setImageViewerIndex(index)
  }

  const closeImageViewer = () => {
    setImageViewerIndex(null)
  }

  const goToPreviousImage = () => {
    if (imageViewerIndex !== null && imageViewerIndex > 0) {
      setImageViewerIndex(imageViewerIndex - 1)
    }
  }

  const goToNextImage = () => {
    if (imageViewerIndex !== null && feedback.images && imageViewerIndex < feedback.images.length - 1) {
      setImageViewerIndex(imageViewerIndex + 1)
    }
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-[90vw] sm:max-w-2xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>反馈详情</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 max-h-[70vh] overflow-y-auto">
            {/* 问题类型 */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">问题类型</h4>
              <div className="flex flex-wrap gap-2">
                {feedback.categories.map((category, index) => (
                  <Badge key={index} variant="outline">
                    {FEEDBACK_TYPE_LABELS[category as keyof typeof FEEDBACK_TYPE_LABELS] || category}
                  </Badge>
                ))}
              </div>
            </div>

            {/* 问题描述 */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">问题描述</h4>
              <div className="p-3 bg-muted/50 rounded-md">
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {feedback.description}
                </p>
              </div>
            </div>

            {/* 反馈图片 */}
            {feedback.images && feedback.images.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">
                  反馈图片 ({feedback.images.length})
                </h4>
                <div className="grid grid-cols-3 gap-2">
                  {feedback.images.map((imagePath, index) => (
                    <div key={index} className="relative aspect-square group cursor-pointer">
                      <FeedbackImage
                        imagePath={imagePath}
                        alt={`反馈图片 ${index + 1}`}
                        className="object-cover rounded-md"
                        onClick={() => openImageViewer(index)}
                        fill
                      />
                      <div 
                        className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-md flex items-center justify-center"
                        onClick={() => openImageViewer(index)}
                      >
                        <span className="text-white text-xs">点击放大</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 反馈信息 */}
            <div className="space-y-3 pt-4 border-t">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">状态</span>
                <Badge variant="outline">
                  {FEEDBACK_STATUS_LABELS[feedback.status as keyof typeof FEEDBACK_STATUS_LABELS] || feedback.status}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">提交时间</span>
                <span className="text-sm">{formatDate(feedback.created_at)}</span>
              </div>
              {feedback.updated_at !== feedback.created_at && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">更新时间</span>
                  <span className="text-sm">{formatDate(feedback.updated_at)}</span>
                </div>
              )}
              {feedback.contact && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">联系方式</span>
                  <span className="text-sm">{feedback.contact}</span>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 图片查看器 */}
      {imageViewerIndex !== null && feedback.images && (
        <ImageViewer
          images={feedback.images}
          currentIndex={imageViewerIndex}
          onClose={closeImageViewer}
          onPrevious={goToPreviousImage}
          onNext={goToNextImage}
        />
      )}
    </>
  )
}
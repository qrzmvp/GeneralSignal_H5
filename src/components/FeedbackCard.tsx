'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Clock, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { FeedbackRecord, FEEDBACK_TYPE_LABELS, FEEDBACK_STATUS_LABELS } from '@/lib/feedback'
import { FeedbackImage } from './FeedbackImage'

interface FeedbackCardProps {
  feedback: FeedbackRecord
}

function getStatusIcon(status: string) {
  switch (status) {
    case 'pending':
      return <Clock className="h-3 w-3" />
    case 'processing':
      return <Loader2 className="h-3 w-3 animate-spin" />
    case 'resolved':
      return <CheckCircle className="h-3 w-3" />
    case 'closed':
      return <XCircle className="h-3 w-3" />
    default:
      return <Clock className="h-3 w-3" />
  }
}

function getStatusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case 'pending':
      return 'secondary'
    case 'processing':
      return 'default'
    case 'resolved':
      return 'outline'
    case 'closed':
      return 'destructive'
    default:
      return 'secondary'
  }
}

export function FeedbackCard({ feedback }: FeedbackCardProps) {
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'yyyy/MM/dd HH:mm')
    } catch {
      return dateString
    }
  }

  const truncateDescription = (text: string, maxLength: number = 80) => {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + '...'
  }

  // 限制显示的图片数量，避免加载过多
  const displayImages = feedback.images ? feedback.images.slice(0, 3) : []
  const hasMoreImages = feedback.images && feedback.images.length > 3

  return (
    <Card className="bg-card/50 border-border/30 overflow-hidden">
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Description - 移到最上方 */}
          <div className="space-y-2">
            <p className="text-sm text-foreground leading-relaxed">
              {truncateDescription(feedback.description)}
            </p>
            
            {/* Images - 在描述下方显示 */}
            {displayImages.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {displayImages.map((imagePath, index) => (
                  <div key={index} className="relative w-16 h-16 rounded-md overflow-hidden">
                    <FeedbackImage
                      imagePath={imagePath}
                      alt={`反馈图片 ${index + 1}`}
                      className="object-cover w-full h-full"
                      sizes="64px"
                      width={64}
                      height={64}
                    />
                  </div>
                ))}
                {hasMoreImages && (
                  <div className="w-16 h-16 rounded-md bg-muted/80 flex items-center justify-center text-xs text-muted-foreground border border-dashed border-muted-foreground/30">
                    +{feedback.images!.length - 3}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Types and Status - 移到描述下方 */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex flex-wrap gap-1">
              {feedback.categories.map((category, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {FEEDBACK_TYPE_LABELS[category as keyof typeof FEEDBACK_TYPE_LABELS] || category}
                </Badge>
              ))}
            </div>
            <Badge variant={getStatusVariant(feedback.status)} className="flex items-center gap-1 text-xs whitespace-nowrap">
              {getStatusIcon(feedback.status)}
              {FEEDBACK_STATUS_LABELS[feedback.status as keyof typeof FEEDBACK_STATUS_LABELS] || feedback.status}
            </Badge>
          </div>

          {/* Footer: Time */}
          <div className="flex items-center justify-start pt-1">
            <span className="text-xs text-muted-foreground">
              {formatDate(feedback.created_at)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
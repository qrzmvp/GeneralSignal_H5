'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { ChevronLeft, ImagePlus, X, Clock } from 'lucide-react'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { useToast } from '@/hooks/use-toast'
import { submitFeedback, type FeedbackCategory } from '@/lib/feedback'

const feedbackTypes = [
  { id: 'feature-suggestion', label: '功能建议' },
  { id: 'ui-issue', label: '界面问题' },
  { id: 'account-issue', label: '账号问题' },
  { id: 'other', label: '其他问题' },
]

export default function FeedbackSubmitPage() {
  const [selectedTypes, setSelectedTypes] = useState<string[]>([])
  const [description, setDescription] = useState('')
  const [previews, setPreviews] = useState<string[]>([])
  const [files, setFiles] = useState<File[]>([])
  const [submitting, setSubmitting] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return
    const picked = Array.from(e.target.files)
    const next: File[] = []
    const nextPreviews: string[] = []
    const current = files.length

    for (let i = 0; i < picked.length && current + next.length < 3; i++) {
      const f = picked[i]
      const okType = /image\/(png|jpe?g|webp)/i.test(f.type)
      const okSize = f.size <= 5 * 1024 * 1024 // 5MB
      if (!okType || !okSize) {
        toast({ 
          title: '文件格式错误',
          description: '仅支持 PNG、JPG、WebP 格式，且单张图片不超过 5MB' 
        })
        continue
      }
      next.push(f)
      nextPreviews.push(URL.createObjectURL(f))
    }

    setFiles(prev => [...prev, ...next].slice(0, 3))
    setPreviews(prev => [...prev, ...nextPreviews].slice(0, 3))
    e.currentTarget.value = ''
  }

  const removeImage = (index: number) => {
    setPreviews(prev => {
      const url = prev[index]
      try { 
        URL.revokeObjectURL(url) 
      } catch {}
      return prev.filter((_, i) => i !== index)
    })
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleTypeChange = (typeId: string) => {
    setSelectedTypes(prev =>
      prev.includes(typeId)
        ? prev.filter(id => id !== typeId)
        : [...prev, typeId]
    )
  }

  const categoryMap: Record<string, FeedbackCategory> = {
    'feature-suggestion': 'feature',
    'ui-issue': 'ui',
    'account-issue': 'account',
    'other': 'other',
  }

  const resetForm = () => {
    setSelectedTypes([])
    setDescription('')
    setFiles([])
    setPreviews(prev => {
      prev.forEach(u => {
        try {
          URL.revokeObjectURL(u)
        } catch {}
      })
      return []
    })
  }

  const handleSubmit = async () => {
    if (!selectedTypes.length) {
      toast({ 
        title: '验证失败',
        description: '请选择问题类型' 
      })
      return
    }
    if (!description || description.trim().length < 10) {
      toast({ 
        title: '验证失败',
        description: '问题描述至少需要 10 个字符' 
      })
      return
    }

    setSubmitting(true)
    try {
      const categories = selectedTypes.map(id => categoryMap[id]).filter(Boolean) as FeedbackCategory[]
      const result = await submitFeedback({
        categories,
        description: description.trim(),
        images: files,
        env: { 
          ua: navigator.userAgent, 
          viewport: { w: window.innerWidth, h: window.innerHeight } 
        }
      })
      
      console.log('反馈提交成功:', result)
      
      toast({ 
        title: '提交成功',
        description: '感谢您的反馈，我们会尽快处理' 
      })
      resetForm()
      
      // 跳转到历史记录页面
      router.push('/profile/feedback/history')
    } catch (error: any) {
      console.error('反馈提交错误:', error)
      
      let message = '提交失败，请稍后重试'
      
      // 更细致的错误处理
      if (error instanceof Error) {
        message = error.message
      } else if (error?.message) {
        message = error.message
      } else if (error?.error_description) {
        message = error.error_description
      } else if (error?.hint) {
        message = error.hint
      } else if (typeof error === 'string') {
        message = error
      }
      
      toast({ 
        title: '提交失败',
        description: message,
        variant: 'destructive' 
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <ProtectedRoute>
      <div className="bg-background min-h-screen text-foreground flex flex-col">
        {/* Header */}
        <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-border/50 bg-background/80 px-4 backdrop-blur-sm">
          <Link href="/profile" passHref>
            <Button variant="ghost" size="icon">
              <ChevronLeft className="h-6 w-6" />
            </Button>
          </Link>
          <h1 className="text-lg font-bold">问题反馈</h1>
          <div className="w-10 flex justify-end">
            <Link href="/profile/feedback/history" passHref>
              <Button variant="ghost" size="icon" title="反馈记录">
                <Clock className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-grow overflow-auto p-4 space-y-6">
          {/* 反馈表单 */}
          <Card>
            <CardHeader>
              <CardTitle>提交反馈</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 问题类型 */}
              <div className="space-y-3">
                <Label>问题类型 *</Label>
                <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                  {feedbackTypes.map((type) => (
                    <div key={type.id} className="flex items-center gap-2">
                      <Checkbox
                        id={type.id}
                        checked={selectedTypes.includes(type.id)}
                        onCheckedChange={() => handleTypeChange(type.id)}
                      />
                      <Label htmlFor={type.id} className="font-normal text-sm cursor-pointer">
                        {type.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* 问题描述 */}
              <div className="space-y-2">
                <Label htmlFor="description">问题描述 *</Label>
                <Textarea
                  id="description"
                  placeholder="请详细描述您遇到的问题或建议..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  maxLength={500}
                  className="h-32 resize-none"
                />
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">至少 10 个字符</span>
                  <span className={`${description.length > 500 ? 'text-destructive' : 'text-muted-foreground'}`}>
                    {description.length} / 500
                  </span>
                </div>
              </div>

              {/* 上传图片 */}
              <div className="space-y-2">
                <Label>上传图片 (可选)</Label>
                <p className="text-xs text-muted-foreground">
                  最多可上传 3 张图片，支持 PNG、JPG、WebP 格式，单张不超过 5MB
                </p>
                <div className="flex items-center gap-2 flex-wrap">
                  {previews.map((img, index) => (
                    <div key={index} className="relative w-20 h-20">
                      <Image 
                        src={img} 
                        alt={`反馈图片 ${index + 1}`} 
                        fill
                        className="object-cover rounded-md" 
                      />
                      <button 
                        onClick={() => removeImage(index)} 
                        className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-0.5 shadow-lg"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  {previews.length < 3 && (
                    <Label 
                      htmlFor="file-upload" 
                      className="w-20 h-20 bg-muted border-2 border-dashed border-muted-foreground/30 rounded-md flex items-center justify-center cursor-pointer hover:bg-muted/80 hover:border-muted-foreground/50 transition-colors"
                    >
                      <ImagePlus className="w-8 h-8 text-muted-foreground" />
                    </Label>
                  )}
                </div>
                <Input 
                  id="file-upload" 
                  type="file" 
                  className="hidden" 
                  accept="image/png, image/jpeg, image/jpg, image/webp" 
                  multiple 
                  onChange={handleFileChange} 
                />
              </div>

              {/* 提交按钮 */}
              <div className="flex gap-3 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={resetForm}
                  disabled={submitting}
                  className="flex-1"
                >
                  重置表单
                </Button>
                <Button 
                  type="submit" 
                  onClick={handleSubmit} 
                  disabled={submitting || !selectedTypes.length || description.trim().length < 10}
                  className="flex-1"
                >
                  {submitting ? '提交中…' : '提交反馈'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 反馈须知 */}
          <Card className="bg-muted/30">
            <CardHeader>
              <CardTitle className="text-base">反馈须知</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>• 请详细描述您遇到的问题，这有助于我们更快地定位和解决问题</p>
              <p>• 如有相关截图，请一并上传，图片信息对问题诊断很有帮助</p>
              <p>• 我们会在 1-3 个工作日内处理您的反馈</p>
              <p>• 您可以在"反馈记录"中查看处理进度</p>
              <p>• 如有紧急问题，建议通过"联系客服"获得更快的响应</p>
            </CardContent>
          </Card>
        </main>
      </div>
    </ProtectedRoute>
  )
}
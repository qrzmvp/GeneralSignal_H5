'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface FeedbackImageProps {
  imagePath: string
  alt: string
  className?: string
  onClick?: () => void
  sizes?: string
  loading?: 'lazy' | 'eager'
  fill?: boolean
  width?: number
  height?: number
}

export function FeedbackImage({ 
  imagePath, 
  alt, 
  className = '', 
  onClick, 
  sizes = '64px',
  loading = 'lazy',
  fill = false,
  width,
  height
}: FeedbackImageProps) {
  const [imageUrl, setImageUrl] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    const getImageUrl = async () => {
      if (!imagePath) {
        setIsLoading(false)
        return
      }

      // 如果已经是完整URL，直接使用
      if (imagePath.startsWith('http')) {
        setImageUrl(imagePath)
        setIsLoading(false)
        return
      }

      try {
        // 对于私有桶，生成签名URL（有效期1小时）
        const { data, error } = await supabase.storage
          .from('feedback-attachments')
          .createSignedUrl(imagePath, 3600)
        
        if (error) {
          console.error('Error creating signed URL:', error)
          setHasError(true)
        } else {
          setImageUrl(data?.signedUrl || '')
        }
      } catch (error) {
        console.error('Error getting image URL:', error)
        setHasError(true)
      } finally {
        setIsLoading(false)
      }
    }

    getImageUrl()
  }, [imagePath])

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center bg-muted ${className}`}>
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (hasError || !imageUrl) {
    return (
      <div className={`flex items-center justify-center bg-muted ${className}`}>
        <span className="text-xs text-muted-foreground">加载失败</span>
      </div>
    )
  }

  const imageProps = {
    src: imageUrl,
    alt,
    className,
    onClick,
    sizes,
    loading,
    placeholder: 'blur' as const,
    blurDataURL: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkrHB0f/EABQBAQAAAAAAAAAAAAAAAAAAAAD/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmvz',
    onError: () => setHasError(true)
  }

  if (fill) {
    return <Image {...imageProps} fill />
  }

  return (
    <Image 
      {...imageProps} 
      width={width || 64} 
      height={height || 64}
    />
  )
}
/**
 * 头像相关的工具函数和类型定义
 */

import { supabase } from './supabase'

// 头像配置常量
export const AVATAR_CONFIG = {
  BUCKET_NAME: 'avatars',
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  OUTPUT_SIZE: 400, // 输出头像尺寸 400x400
  PREVIEW_SIZE: 160, // 预览尺寸 160x160
  DEFAULT_CROP: { unit: '%' as const, width: 70, height: 70, x: 15, y: 15 },
  DEFAULT_SCALE: 1,
  JPEG_QUALITY: 0.9
}

// 头像文件验证
export interface AvatarValidationResult {
  isValid: boolean
  error?: string
}

export function validateAvatarFile(file: File): AvatarValidationResult {
  // 检查文件类型
  if (!AVATAR_CONFIG.ALLOWED_TYPES.includes(file.type)) {
    return {
      isValid: false,
      error: '仅支持 JPG、PNG、WebP 格式的图片'
    }
  }

  // 检查文件大小
  if (file.size > AVATAR_CONFIG.MAX_FILE_SIZE) {
    return {
      isValid: false,
      error: `图片大小不能超过 ${AVATAR_CONFIG.MAX_FILE_SIZE / (1024 * 1024)}MB`
    }
  }

  return { isValid: true }
}

// 头像上传参数
export interface AvatarUploadOptions {
  userId: string
  blob: Blob
  deleteOldAvatar?: string | null
}

// 头像上传结果
export interface AvatarUploadResult {
  success: boolean
  url?: string
  error?: string
}

/**
 * 上传头像到Supabase存储桶
 */
export async function uploadAvatar({
  userId,
  blob,
  deleteOldAvatar
}: AvatarUploadOptions): Promise<AvatarUploadResult> {
  try {
    // 删除旧头像（如果存在）
    if (deleteOldAvatar) {
      try {
        const oldPath = deleteOldAvatar.split(`/${AVATAR_CONFIG.BUCKET_NAME}/`)[1]
        if (oldPath) {
          await supabase.storage.from(AVATAR_CONFIG.BUCKET_NAME).remove([oldPath])
        }
      } catch (deleteError) {
        console.warn('删除旧头像失败:', deleteError)
        // 不阻断流程，继续上传新头像
      }
    }

    // 生成文件路径
    const filePath = `${userId}/${Date.now()}.jpg`
    
    // 上传新头像
    const { error: uploadError } = await supabase.storage
      .from(AVATAR_CONFIG.BUCKET_NAME)
      .upload(filePath, blob, {
        cacheControl: '3600',
        upsert: true,
        contentType: 'image/jpeg',
      })

    if (uploadError) {
      return { success: false, error: uploadError.message }
    }

    // 获取公开URL
    const { data } = supabase.storage
      .from(AVATAR_CONFIG.BUCKET_NAME)
      .getPublicUrl(filePath)

    return { success: true, url: data.publicUrl }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '上传失败' 
    }
  }
}

/**
 * 更新用户资料中的头像URL
 */
export async function updateUserAvatarUrl(userId: string, avatarUrl: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ avatar_url: avatarUrl })
      .eq('id', userId)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '更新失败' 
    }
  }
}

/**
 * 删除用户头像
 */
export async function deleteUserAvatar(userId: string, avatarUrl: string): Promise<{ success: boolean; error?: string }> {
  try {
    // 从存储桶删除文件
    const filePath = avatarUrl.split(`/${AVATAR_CONFIG.BUCKET_NAME}/`)[1]
    if (filePath) {
      const { error: deleteError } = await supabase.storage
        .from(AVATAR_CONFIG.BUCKET_NAME)
        .remove([filePath])
        
      if (deleteError) {
        return { success: false, error: deleteError.message }
      }
    }

    // 更新数据库
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: null })
      .eq('id', userId)

    if (updateError) {
      return { success: false, error: updateError.message }
    }

    return { success: true }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '删除失败' 
    }
  }
}

/**
 * 获取头像的显示URL，如果没有则返回默认头像
 */
export function getAvatarDisplayUrl(avatarUrl?: string | null): string {
  return avatarUrl || '/avatar-default.svg'
}

/**
 * 检查是否为默认头像
 */
export function isDefaultAvatar(avatarUrl?: string | null): boolean {
  return !avatarUrl || avatarUrl === '/avatar-default.svg'
}

/**
 * 生成头像文件名
 */
export function generateAvatarFileName(userId: string): string {
  return `${userId}/${Date.now()}.jpg`
}

/**
 * 从URL提取文件路径
 */
export function extractFilePathFromUrl(url: string, bucketName: string = AVATAR_CONFIG.BUCKET_NAME): string | null {
  const parts = url.split(`/${bucketName}/`)
  return parts.length > 1 ? parts[1] : null
}
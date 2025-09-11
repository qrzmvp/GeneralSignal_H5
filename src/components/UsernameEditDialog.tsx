'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase'

interface UsernameEditDialogProps {
  isOpen: boolean
  onClose: () => void
  currentUsername: string
  userId: string
  onUpdate: (newUsername: string) => void
}

export function UsernameEditDialog({
  isOpen,
  onClose,
  currentUsername,
  userId,
  onUpdate
}: UsernameEditDialogProps) {
  const [username, setUsername] = useState(currentUsername)
  const [submitting, setSubmitting] = useState(false)
  const { toast } = useToast()

  const validateUsername = (value: string): string | null => {
    if (!value || value.trim().length === 0) {
      return '用户名不能为空'
    }
    if (value.trim().length > 6) {
      return '用户名输入过长，请重新输入（最多6个字符）'
    }
    return null
  }

  const handleSubmit = async () => {
    const trimmedUsername = username.trim()
    const error = validateUsername(trimmedUsername)
    
    if (error) {
      toast({
        title: '验证失败',
        description: error,
        variant: 'destructive'
      })
      return
    }

    if (trimmedUsername === currentUsername) {
      toast({
        title: '提示',
        description: '用户名未发生变化',
        variant: 'default'
      })
      onClose()
      return
    }

    setSubmitting(true)
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({ 
          username: trimmedUsername,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select('username')
        .single()

      if (error) {
        throw error
      }

      toast({
        title: '更新成功',
        description: '用户名已成功更新'
      })
      
      onUpdate(trimmedUsername)
      onClose()
    } catch (error: any) {
      console.error('Update username error:', error)
      toast({
        title: '更新失败',
        description: error?.message || '用户名更新失败，请重试',
        variant: 'destructive'
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleOpenChange = (open: boolean) => {
    if (!open && !submitting) {
      setUsername(currentUsername) // 重置为当前用户名
      onClose()
    }
  }

  const currentError = validateUsername(username)

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-[90vw] sm:max-w-md rounded-lg">
        <DialogHeader>
          <DialogTitle>编辑用户名</DialogTitle>
          <DialogDescription>
            用户名最多6个字符
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="username">用户名</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              maxLength={6}
              placeholder="请输入用户名"
              className={currentError ? 'border-destructive' : ''}
            />
            <div className="flex justify-between items-center text-xs">
              {currentError && (
                <span className="text-destructive">{currentError}</span>
              )}
              <span className={`ml-auto ${username.length > 6 ? 'text-destructive' : 'text-muted-foreground'}`}>
                {username.length} / 6
              </span>
            </div>
          </div>
        </div>
        
        <DialogFooter className="flex-col gap-3 pt-6">
          <Button 
            type="submit" 
            onClick={handleSubmit} 
            disabled={submitting || !!currentError || username.trim() === currentUsername}
            className="w-full h-12 text-base font-medium"
          >
            {submitting ? '保存中…' : '保存'}
          </Button>
          <Button 
            type="button" 
            variant="ghost" 
            onClick={() => handleOpenChange(false)}
            disabled={submitting}
            className="w-full h-12 text-base font-medium text-muted-foreground hover:text-foreground"
          >
            取消
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
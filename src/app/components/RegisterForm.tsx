
"use client";

import { useState, useEffect } from "react";
import type { FormEvent } from "react";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";

interface RegisterFormProps {
    onSwitchToLogin: () => void;
    onRegisterSuccess: () => void;
    invitationCode?: string | null;
}

export function RegisterForm({ onSwitchToLogin, onRegisterSuccess, invitationCode }: RegisterFormProps) {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [code, setCode] = useState(invitationCode || "");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [username, setUsername] = useState("");
  const [showResendOption, setShowResendOption] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const { signUp, resendEmailConfirmation, checkEmailExists } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (invitationCode) {
      setCode(invitationCode);
    }
  }, [invitationCode]);

  // 邮箱格式验证
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // 密码格式验证
  const validatePassword = (password: string) => {
    return password.length >= 6;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    
    // 1. 必填项校验
    if (!email.trim()) {
      toast({
        title: "注册失败",
        description: "请输入邮箱地址",
        variant: "destructive",
      });
      return;
    }

    if (!username.trim()) {
      toast({
        title: "注册失败", 
        description: "请输入用户名",
        variant: "destructive",
      });
      return;
    }

    if (!password.trim()) {
      toast({
        title: "注册失败",
        description: "请输入密码",
        variant: "destructive",
      });
      return;
    }

    if (!confirmPassword.trim()) {
      toast({
        title: "注册失败",
        description: "请重新输入密码",
        variant: "destructive",
      });
      return;
    }

    // 2. 用户名长度校验
    if (username.length > 6) {
      toast({
        title: "注册失败",
        description: "用户名输入过长，请重新输入（最多6个字符）",
        variant: "destructive",
      });
      return;
    }

    // 3. 邮箱格式校验
    if (!validateEmail(email)) {
      toast({
        title: "注册失败",
        description: "邮箱格式不正确，请检查后重试",
        variant: "destructive",
      });
      return;
    }

    // 4. 密码格式校验
    if (!validatePassword(password)) {
      toast({
        title: "注册失败",
        description: "密码格式不正确，请使用至少6个字符",
        variant: "destructive",
      });
      return;
    }

    // 5. 两次密码输入一致性校验
    if (password !== confirmPassword) {
      toast({
        title: "注册失败",
        description: "两次密码输入不一致，请重新输入",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // 0. 若填了邀请码，先校验有效性（存在即有效）
      let inviterId: string | null = null;
      if (code && code.trim().length > 0) {
        const { data, error } = await supabase.rpc('validate_invitation_code', { code });
        if (error) {
          toast({ title: '注册失败', description: '邀请码校验失败，请稍后重试', variant: 'destructive' });
          setLoading(false);
          return;
        }
        if (!data) {
          toast({ title: '注册失败', description: '邀请码无效，请检查后重试', variant: 'destructive' });
          setLoading(false);
          return;
        }
        inviterId = data as string;
      }
  // 6. 注册前先精确检查邮箱是否已存在（RPC）
  const check = await checkEmailExists(email)
      if (check?.error) {
        console.warn('邮箱存在性RPC检查失败，继续走注册流程', check.error)
      } else if (check?.exists) {
        if (check.confirmed) {
          toast({
            title: '该邮箱已被注册',
            description: '请直接登录，或使用其他邮箱注册',
            variant: 'destructive',
          })
          setLoading(false)
          return
        } else {
          toast({
            title: '该邮箱已注册但未完成验证',
            description: '请前往邮箱查收验证邮件，或点击下方按钮重新发送验证邮件',
          })
          setShowResendOption(true)
          setLoading(false)
          return
        }
      }

  // 7. 未命中重复邮箱，执行注册（用户名允许重复）
  const result = await signUp(email, password, username, code || undefined);
      
      if (result.error) {
        let errorMessage = "注册失败，请重试";
        
        if (result.error.message) {
          if (result.error.message.includes("User already registered") || 
              result.error.message.includes("已被注册")) {
            errorMessage = "该邮箱已被注册，请使用其他邮箱或尝试登录";
          } else if (result.error.message.includes("rate limit")) {
            errorMessage = "请求过于频繁，请稍后重试";
          } else {
            errorMessage = result.error.message;
          }
        }
        
        toast({
          title: "注册失败",
          description: errorMessage,
          variant: "destructive",
        });
      } else {
  // 注册成功
        let successMessage = "注册成功！";
        
        if (result.needsEmailConfirmation) {
          successMessage = "注册成功！请查收邮箱中的验证链接（包括垃圾邮件文件夹）";
        }
        
        toast({
          title: "注册成功",
          description: successMessage,
        });
        
        // 如果需要邮箱验证，显示重发选项
        if (result.needsEmailConfirmation) {
          setShowResendOption(true);
        } else {
          // 将 referrer_code 一并保存到用户元数据（便于后端触发器绑定）
          if (inviterId) {
            try {
              await supabase.auth.updateUser({
                data: { referrer_code: code }
              });
            } catch {}
          }
          // 清空表单
          setEmail("");
          setPassword("");
          setConfirmPassword("");
          setUsername("");
          setCode("");
          
          onRegisterSuccess();
        }
      }
    } catch (error: any) {
      console.error('注册异常:', error);
      toast({
        title: "注册失败",
        description: "网络错误或服务异常，请稍后重试",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResendEmail = async () => {
    if (!email) {
      toast({
        title: "重发失败",
        description: "请先输入邮箱地址",
        variant: "destructive",
      });
      return;
    }

    setResendLoading(true);
    try {
      const { error } = await resendEmailConfirmation(email);
      
      if (error) {
        toast({
          title: "重发失败",
          description: error.message || "重发验证邮件失败，请稍后重试",
          variant: "destructive",
        });
      } else {
        toast({
          title: "重发成功",
          description: "验证邮件已重新发送，请查收邮箱（包括垃圾邮件文件夹）",
        });
      }
    } catch (error) {
      toast({
        title: "重发失败",
        description: "网络错误，请稍后重试",
        variant: "destructive",
      });
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <Card className="rounded-lg shadow-2xl border-0 bg-transparent">
      <CardHeader className="text-center space-y-2">
        <CardTitle className="text-3xl font-headline font-bold">创建账户</CardTitle>
        <CardDescription>输入您的信息以创建一个新帐户</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="email-register">邮箱</Label>
            <Input 
              id="email-register" 
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="请输入您的邮箱"
              required 
              autoComplete="email" 
              className="bg-background/50"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="username-register">用户名</Label>
            <Input 
              id="username-register" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="请输入用户名"
              required 
              autoComplete="username" 
              className="bg-background/50"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password-register">密码</Label>
            <div className="relative">
              <Input 
                id="password-register" 
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="请输入密码（至少6位）"
                required 
                autoComplete="new-password" 
                className="bg-background/50 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="confirm-password-register">再次输入密码</Label>
             <div className="relative">
              <Input 
                id="confirm-password-register" 
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="请再次输入密码"
                required 
                autoComplete="new-password" 
                className="bg-background/50 pr-10"
              />
               <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground"
              >
                {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>
           <div className="grid gap-2">
            <Label htmlFor="invitation-code">邀请码 (可选)</Label>
            <Input 
              id="invitation-code" 
              value={code} 
              onChange={(e) => setCode(e.target.value)} 
              placeholder="请输入邀请码"
              className="bg-background/50"
            />
          </div>
        </CardContent>
        <CardFooter className="flex-col gap-4">
          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            注册
          </Button>
          
          {showResendOption && (
            <div className="w-full space-y-2">
              <p className="text-sm text-muted-foreground text-center">
                没有收到验证邮件？
              </p>
              <Button 
                type="button" 
                variant="outline" 
                className="w-full" 
                onClick={handleResendEmail}
                disabled={resendLoading}
              >
                {resendLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                重新发送验证邮件
              </Button>
            </div>
          )}
          
          <p className="text-sm text-muted-foreground">
            已经有帐户了？{" "}
            <button type="button" onClick={onSwitchToLogin} className="underline underline-offset-4 hover:text-primary transition-colors">
              登录
            </button>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}

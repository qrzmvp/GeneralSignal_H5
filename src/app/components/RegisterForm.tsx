
"use client";

import { useState, useEffect } from "react";
import type { FormEvent } from "react";
import { Loader2, Eye, EyeOff } from "lucide-react";
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

  useEffect(() => {
    if (invitationCode) {
      setCode(invitationCode);
    }
  }, [invitationCode]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      onRegisterSuccess();
    }, 2000);
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
            <Label htmlFor="username-register">用户名</Label>
            <Input id="username-register" required autoComplete="username" className="bg-background/50"/>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password-register">密码</Label>
            <div className="relative">
              <Input 
                id="password-register" 
                type={showPassword ? "text" : "password"}
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
                required 
                autoComplete="new-password" 
                className="bg-background/50 pr-10"
              />
               <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground"
              >
                {showConfirmWord ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
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

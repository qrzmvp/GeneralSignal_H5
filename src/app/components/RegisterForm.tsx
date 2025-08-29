"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { Loader2 } from "lucide-react";
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
}

export function RegisterForm({ onSwitchToLogin, onRegisterSuccess }: RegisterFormProps) {
  const [loading, setLoading] = useState(false);

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
            <Label htmlFor="email-register">邮箱</Label>
            <Input id="email-register" type="email" required autoComplete="email" className="bg-background/50"/>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password-register">密码</Label>
            <Input id="password-register" type="password" required autoComplete="new-password" className="bg-background/50"/>
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
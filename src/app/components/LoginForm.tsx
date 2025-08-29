"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { Mail, User, Loader2, Bitcoin } from "lucide-react";

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";

interface LoginFormProps {
  onSwitchToRegister: () => void;
  onLoginSuccess: () => void;
}

export function LoginForm({ onSwitchToRegister, onLoginSuccess }: LoginFormProps) {
  const [loading, setLoading] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      onLoginSuccess();
    }, 2000);
  };

  return (
    <Card className="rounded-lg shadow-2xl border-0 bg-transparent">
      <CardHeader className="text-center space-y-2">
        <Link href="/" className="flex items-center justify-center">
          <CardTitle className="text-3xl font-headline font-bold flex items-center justify-center">
            <div className="bg-primary text-primary-foreground p-1.5 rounded-md mr-3">
              <Bitcoin className="h-6 w-6" />
            </div>
            将军令
          </CardTitle>
        </Link>
        <CardDescription>
          币圈跟单神器
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <Tabs defaultValue="username" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="username">
                <User className="mr-2 h-4 w-4" />
                账号
              </TabsTrigger>
              <TabsTrigger value="email">
                <Mail className="mr-2 h-4 w-4" />
                邮箱
              </TabsTrigger>
            </TabsList>
            <TabsContent value="username" className="m-0 pt-4">
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="username">
                    账号
                  </Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="请输入您的账号"
                    required
                    autoComplete="username"
                    className="bg-background/50"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password-login">密码</Label>
                  <Input 
                    id="password-login" 
                    type="password" 
                    placeholder="请输入您的密码"
                    required 
                    autoComplete="current-password"
                    className="bg-background/50"
                  />
                </div>
              </div>
            </TabsContent>
            <TabsContent value="email" className="m-0 pt-4">
                <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="email">
                    邮箱
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="m@example.com"
                    required
                    autoComplete="email"
                    className="bg-background/50"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password-email">密码</Label>
                  <Input 
                    id="password-email" 
                    type="password" 
                    placeholder="请输入您的密码"
                    required 
                    autoComplete="current-password"
                    className="bg-background/50"
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex-col gap-4">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              登录
            </Button>
            <p className="text-sm text-muted-foreground">
              还没有帐户？{" "}
              <button type="button" onClick={onSwitchToRegister} className="underline underline-offset-4 hover:text-primary transition-colors">
                注册
              </button>
            </p>
        </CardFooter>
      </form>
    </Card>
  );
}
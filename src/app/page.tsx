"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { Mail, User, Loader2 } from "lucide-react";
import Link from "next/link";

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

function LoginForm({ loginType }: { loginType: "username" | "email" }) {
  return (
    <div className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor={loginType}>
          {loginType === "username" ? "用户名" : "邮箱"}
        </Label>
        <Input
          id={loginType}
          type={loginType === "email" ? "email" : "text"}
          placeholder={
            loginType === "username" ? "您的用户名" : "m@example.com"
          }
          required
          autoComplete={loginType}
          className="bg-background/50"
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="password">密码</Label>
        <Input 
          id="password" 
          type="password" 
          required 
          autoComplete="current-password"
          className="bg-background/50"
        />
      </div>
    </div>
  );
}

export default function SignalAuthPage() {
  const [loading, setLoading] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 2000);
  };

  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-transparent p-4">
      <Tabs defaultValue="username" className="w-full max-w-sm">
        <Card className="rounded-lg shadow-2xl bg-card/80 backdrop-blur-sm">
          <CardHeader className="text-center space-y-2">
            <CardTitle className="text-3xl font-headline font-bold">
              通用信号
            </CardTitle>
            <CardDescription>
              输入您的凭据以访问您的帐户
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="username">
                <User className="mr-2 h-4 w-4" />
                用户名
              </TabsTrigger>
              <TabsTrigger value="email">
                <Mail className="mr-2 h-4 w-4" />
                邮箱
              </TabsTrigger>
            </TabsList>
            <form onSubmit={handleSubmit}>
              <TabsContent value="username" className="m-0">
                <LoginForm loginType="username" />
              </TabsContent>
              <TabsContent value="email" className="m-0">
                <LoginForm loginType="email" />
              </TabsContent>
               <Button type="submit" className="w-full mt-4" disabled={loading}>
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                登录
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center">
            <p className="text-sm text-muted-foreground">
              还没有帐户？{" "}
              <Link href="#" className="underline underline-offset-4 hover:text-primary transition-colors">
                注册
              </Link>
            </p>
          </CardFooter>
        </Card>
      </Tabs>
    </main>
  );
}

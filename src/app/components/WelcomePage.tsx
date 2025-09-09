"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface WelcomePageProps {
    onLogout: () => void;
}

export function WelcomePage({ onLogout }: WelcomePageProps) {
  return (
    <Card className="rounded-lg shadow-2xl bg-card/80 backdrop-blur-sm w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="text-3xl font-headline font-bold">欢迎！</CardTitle>
        <CardDescription>您已成功登录。</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center space-y-6">
        <p className="text-center text-muted-foreground">感谢您使用 SignalAuth。</p>
        <Button onClick={onLogout} className="w-full max-w-xs">
          登出
        </Button>
      </CardContent>
    </Card>
  );
}


'use client'

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { BarChart, ChevronRight, Copy, Edit, Headset, KeyRound, Mail, Settings, User, Wallet } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";


function ProfileItem({ icon, label, value, action, onClick }: { icon: React.ReactNode, label: string, value?: string, action?: React.ReactNode, onClick?: () => void }) {
    const isClickable = !!onClick;
    const Component = isClickable ? 'button' : 'div';

    return (
        <Component onClick={onClick} className={`flex items-center p-4 w-full text-left ${isClickable ? 'hover:bg-accent/50 transition-colors' : ''}`}>
            {icon}
            <span className="ml-4 text-sm font-medium">{label}</span>
            <div className="ml-auto flex items-center gap-2">
                {value && <span className="text-sm text-muted-foreground">{value}</span>}
                {action}
            </div>
        </Component>
    )
}

export default function ProfilePage() {
    const [activeTab, setActiveTab] = useState('profile');
    const { toast } = useToast();

    // Mock data
    const user = {
        name: 'CryptoKing',
        id: '88888888',
        email: 'crypto.king@example.com',
        avatar: 'https://i.pravatar.cc/150?u=cryptoking'
    }

    const handleCopyId = () => {
        navigator.clipboard.writeText(user.id);
        toast({
            title: "复制成功",
            description: `ID ${user.id} 已复制到剪贴板。`,
        });
    }

  return (
    <div className="bg-background min-h-screen text-foreground flex flex-col h-screen">
      <header className="flex-shrink-0 flex items-center justify-center p-4 h-14">
        <h1 className="font-bold text-lg">我的</h1>
      </header>

      <main className="flex-grow overflow-auto px-4 pt-2 pb-24">
        <div className="space-y-6">
            {/* User Info Card */}
            <Card className="bg-card/50 border-0 shadow-none">
                <CardContent className="p-4 flex items-center gap-4">
                    <div className="relative">
                        <Avatar className="h-16 w-16 border-2 border-primary/50">
                            <AvatarImage src={user.avatar} alt={user.name} />
                            <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <button className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-1.5 hover:bg-primary/80 transition-colors">
                            <Edit className="h-3 w-3" />
                            <span className="sr-only">编辑头像</span>
                        </button>
                    </div>
                    <div className="space-y-1">
                        <h2 className="text-xl font-bold">{user.name}</h2>
                        <div className="flex items-center text-xs text-muted-foreground">
                            <span>ID: {user.id}</span>
                            <Button variant="ghost" size="icon" className="h-6 w-6 ml-1" onClick={handleCopyId}>
                                <Copy className="h-3 w-3" />
                            </Button>
                        </div>
                         <div className="flex items-center text-xs text-muted-foreground">
                            <span>邮箱: {user.email || '--'}</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Common Functions */}
            <Card className="bg-card/50 border-border/30">
                 <CardContent className="p-0">
                    <div className="divide-y divide-border/30">
                        <ProfileItem icon={<Wallet className="text-primary"/>} label="我的资产" action={<ChevronRight className="h-4 w-4 text-muted-foreground"/>} />
                        <ProfileItem icon={<Settings className="text-primary"/>} label="跟单设置" action={<ChevronRight className="h-4 w-4 text-muted-foreground"/>} />
                    </div>
                 </CardContent>
            </Card>

            {/* Account & Security */}
            <Card className="bg-card/50 border-border/30">
                <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-base">账户与安全</CardTitle>
                </CardHeader>
                 <CardContent className="p-0">
                    <div className="divide-y divide-border/30">
                        <ProfileItem icon={<Mail className="text-primary"/>} label="修改邮箱" action={<ChevronRight className="h-4 w-4 text-muted-foreground"/>} />
                        <ProfileItem icon={<KeyRound className="text-primary"/>} label="修改密码" action={<ChevronRight className="h-4 w-4 text-muted-foreground"/>} />
                    </div>
                 </CardContent>
            </Card>


             {/* Support */}
             <Dialog>
                <Card className="bg-card/50 border-border/30">
                    <CardContent className="p-0">
                        <DialogTrigger asChild>
                            <div className="divide-y divide-border/30">
                                <ProfileItem icon={<Headset className="text-primary"/>} label="联系客服" action={<ChevronRight className="h-4 w-4 text-muted-foreground"/>} onClick={() => {}}/>
                            </div>
                        </DialogTrigger>
                    </CardContent>
                </Card>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                    <DialogTitle>联系客服</DialogTitle>
                    <DialogDescription>
                        通过Telegram联系我们的客服团队。
                    </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="flex flex-col items-center justify-center gap-4">
                             <Image
                                src="https://picsum.photos/200/200"
                                alt="Telegram QR Code"
                                width={200}
                                height={200}
                                data-ai-hint="qr code"
                                className="rounded-md"
                            />
                            <div className="text-center">
                                <p className="text-sm text-muted-foreground">扫描二维码或搜索下方账号</p>
                                <p className="font-mono text-lg text-primary mt-2">@SignalAuthSupport</p>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
      </main>


      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border/50 h-16 z-20 flex-shrink-0">
        <div className="flex justify-around items-center h-full">
            <Link href="/" passHref className="flex-1 contents">
                <button
                    onClick={() => setActiveTab('leaderboard')}
                    className={`flex flex-col items-center justify-center space-y-1 transition-colors ${
                    activeTab === 'leaderboard' ? 'text-primary' : 'text-muted-foreground'
                    }`}
                >
                    <BarChart className="h-6 w-6" />
                    <span className="text-xs font-medium">将军榜</span>
                </button>
            </Link>
            <Link href="/profile" passHref className="flex-1 contents">
              <button
                  onClick={() => setActiveTab('profile')}
                  className={`flex flex-col items-center justify-center space-y-1 transition-colors ${
                  activeTab === 'profile' ? 'text-primary' : 'text-muted-foreground'
                  }`}
              >
                  <User className="h-6 w-6" />
                  <span className="text-xs font-medium">我的</span>
              </button>
            </Link>
        </div>
      </nav>
    </div>
  );
}

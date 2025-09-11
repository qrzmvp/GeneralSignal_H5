
'use client'

import { useState, useEffect } from 'react';
import { useRouter }from 'next/navigation';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { 
    ArrowRightLeft,
    BarChart, 
    ChevronRight, 
    Copy, 
    Crown, 
    FileQuestion, 
    Headset, 
    ImagePlus, 
    KeyRound, 
    LogOut,
    Mail, 
    ReceiptText, 
    Settings, 
    User, 
    Wallet,
    X,
    Users,
    Ticket,
    Edit3,
    Camera
} from 'lucide-react';
import { SimpleToast } from '../components/SimpleToast';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import AvatarEditor from '../components/AvatarEditor';
import { MembershipBadge, type MembershipLevel } from '@/components/ui/membership-badge';
import { getAvatarDisplayUrl } from '@/lib/avatar-utils';
import { UsernameEditDialog } from '@/components/UsernameEditDialog';


function ProfileItem({ icon, label, value, action, onClick, href }: { icon: React.ReactNode, label: string, value?: string, action?: React.ReactNode, onClick?: () => void, href?: string }) {
        const isClickable = !!onClick || !!href;
        const className = `flex items-center p-4 w-full text-left ${isClickable ? 'hover:bg-accent/50 transition-colors' : ''}`;

        if (href) {
            return (
                <Link href={href} className={className}>
                    {icon}
                    <span className="ml-4 text-sm font-medium">{label}</span>
                    <div className="ml-auto flex items-center gap-2">
                        {value && <span className="text-sm text-muted-foreground">{value}</span>}
                        {action}
                    </div>
                </Link>
            )
        }

        if (onClick) {
            return (
                <button onClick={onClick} className={className}>
                    {icon}
                    <span className="ml-4 text-sm font-medium">{label}</span>
                    <div className="ml-auto flex items-center gap-2">
                        {value && <span className="text-sm text-muted-foreground">{value}</span>}
                        {action}
                    </div>
                </button>
            )
        }

        return (
            <div className={className}>
                {icon}
                <span className="ml-4 text-sm font-medium">{label}</span>
                <div className="ml-auto flex items-center gap-2">
                    {value && <span className="text-sm text-muted-foreground">{value}</span>}
                    {action}
                </div>
            </div>
        )
}

const feedbackTypes = [
    { id: 'feature-suggestion', label: '功能建议' },
    { id: 'ui-issue', label: '界面问题' },
    { id: 'account-issue', label: '账号问题' },
    { id: 'other', label: '其他问题' },
];

// 移除feedbackTypes定义，因为它现在没有被使用
export default function ProfilePage() {
        const [activeTab, setActiveTab] = useState('profile');
        const [showToast, setShowToast] = useState(false);
        const [avatarEditorOpen, setAvatarEditorOpen] = useState(false);
    const [usernameEditOpen, setUsernameEditOpen] = useState(false);
        const router = useRouter();
        const { user: authUser, signOut, loading } = useAuth();

        const [profile, setProfile] = useState<{ 
            name: string;
            id: string;
            invitationCode?: string | null;
            avatar?: string | null;
            membership?: string | null;
        }>({
            name: '',
            id: '',
            invitationCode: null,
            avatar: null,
            membership: null,
        });

    useEffect(() => {
            if (!authUser) return;

            // 1) 先用 auth user 填充用户名/ID/头像（元数据）
            const meta = (authUser as any)?.user_metadata || {};
            setProfile(prev => ({
                ...prev,
                name: meta.username || authUser.email?.split('@')[0] || '用户',
                id: authUser.id,
                avatar: meta.avatar_url || null,
                invitationCode: meta.invitation_code || null,
            }));

            // 2) 再从 profiles 表补全更权威的信息
            supabase
                .from('profiles')
                .select('username, avatar_url, invitation_code, membership_level')
                .eq('id', authUser.id)
                .maybeSingle()
                .then(({ data, error }) => {
                    if (error) return;
                    if (data) {
                        setProfile(prev => ({
                            ...prev,
                            name: data.username || prev.name,
                            avatar: data.avatar_url || prev.avatar,
                            invitationCode: data.invitation_code ?? prev.invitationCode,
                            membership: data.membership_level || prev.membership,
                        }));
                    }
                });
        }, [authUser]);

        // 如果邀请码依然缺失，客户端兜底生成 8 位数字码并保存（重试避免冲突）
        useEffect(() => {
            const ensureInviteCode = async () => {
                if (!authUser) return;
                if (profile.invitationCode) return;
                try {
                    // 最多重试 5 次，避免唯一冲突
                    for (let i = 0; i < 5; i++) {
                        const code = String(Math.floor(Math.random() * 100000000)).padStart(8, '0');
                        const { data, error } = await supabase
                            .from('profiles')
                            .update({ invitation_code: code })
                            .eq('id', authUser.id)
                            .select('invitation_code')
                            .maybeSingle();
                        if (!error && data?.invitation_code) {
                            setProfile(prev => ({ ...prev, invitationCode: data.invitation_code }));
                            return;
                        }
                        // 若唯一约束冲突则继续重试，否则终止
                        if (error && !/duplicate key value|unique constraint/i.test(error.message)) {
                            break;
                        }
                    }
                } catch {
                    /* ignore */
                }
            };
            void ensureInviteCode();
        }, [authUser, profile.invitationCode]);

    const handleCopy = (text: string) => {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text);
            setShowToast(true);
        }
    }

    const handleLogout = async () => {
        await signOut();
    }

    const handleAvatarUploaded = (newAvatarUrl: string) => {
        setProfile(prev => ({ ...prev, avatar: newAvatarUrl }));
    }

    const handleUsernameUpdate = (newUsername: string) => {
        setProfile(prev => ({ ...prev, name: newUsername }));
    }

    // 将字符串会员类型转换为 MembershipLevel
    const getMembershipLevel = (membership: string | null): MembershipLevel => {
        if (!membership) {
            // 如果没有会员数据，默认显示 basic 等级作为演示
            return 'basic';
        }
        const membershipLower = membership.toLowerCase();
        if (['basic', 'pro', 'vip'].includes(membershipLower)) {
            return membershipLower as MembershipLevel;
        }
        return 'basic'; // 默认显示 basic 等级
    };

  return (
    <>
    <ProtectedRoute>
    <div className="bg-background min-h-screen text-foreground flex flex-col h-screen">
      {showToast && <SimpleToast message="复制成功" onDismiss={() => setShowToast(false)} />}
      <header className="flex-shrink-0 flex items-center justify-center p-4 h-14">
        <h1 className="font-bold text-lg">我的</h1>
      </header>

      <main className="flex-grow overflow-auto px-4 pt-2 pb-24">
        <div className="space-y-6">
            {/* User Profile Card */}
            <Card className="bg-card/50 border-0 shadow-none">
                <CardContent className="p-4 flex items-center gap-4">
                    <div className="relative group">
                        <Avatar className="h-16 w-16 border-2 border-primary/50">
                            <AvatarImage 
                                src={getAvatarDisplayUrl(profile.avatar)} 
                                alt={profile.name || '用户'} 
                            />
                            <AvatarFallback>{(profile.name || '用').charAt(0)}</AvatarFallback>
                        </Avatar>
                        {/* 头像编辑按钮 */}
                        <button
                            onClick={() => setAvatarEditorOpen(true)}
                            className="absolute inset-0 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center"
                            aria-label="编辑头像"
                        >
                            <Edit3 className="h-4 w-4" />
                        </button>
                        {/* 右下角编辑图标提示 */}
                        <button
                            onClick={() => setAvatarEditorOpen(true)}
                            className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground p-1.5 rounded-full shadow-lg hover:bg-primary/90 transition-colors"
                            aria-label="编辑头像"
                        >
                            <Camera className="h-3 w-3" />
                        </button>
                    </div>
                    <div className="space-y-1">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <h2 className="text-xl font-bold">
                                    {profile.name}
                                </h2>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 text-muted-foreground hover:text-foreground"
                                    onClick={() => setUsernameEditOpen(true)}
                                    title="编辑用户名"
                                >
                                    <Edit3 className="h-3 w-3" />
                                </Button>
                            </div>
                            <MembershipBadge 
                                level={getMembershipLevel(profile.membership)}
                                membershipType={profile.membership || undefined}
                                size="md"
                                showText={true}
                            />
                        </div>
                        <div className="flex items-center text-xs text-muted-foreground no-underline">
                            <span>邮箱: {authUser?.email || '——'}</span>
                            {authUser?.email && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 ml-1"
                                    onClick={() => handleCopy(authUser.email!)}
                                >
                                    <Copy className="h-3 w-3" />
                                </Button>
                            )}
                        </div>
                        <div className="flex items-center text-xs text-muted-foreground gap-1">
                            <Ticket className="w-3 h-3" />
                            <span>邀请码: {profile.invitationCode || '——'} </span>
                            {profile.invitationCode && (
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleCopy(profile.invitationCode!)}>
                                    <Copy className="h-3 w-3" />
                                </Button>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Common Functions */}
            <Card className="bg-card/50 border-border/30">
                <CardContent className="p-0">
                    <div className="divide-y divide-border/30">
                        <ProfileItem href="/membership" icon={<Crown className="text-yellow-400"/>} label="购买会员" action={<ChevronRight className="h-4 w-4 text-muted-foreground"/>} />
                        <ProfileItem href="/payment-details" icon={<ReceiptText className="text-primary"/>} label="付费明细" action={<ChevronRight className="h-4 w-4 text-muted-foreground"/>} />
                        <ProfileItem href="/my-api" icon={<KeyRound className="text-primary"/>} label="我的API" action={<ChevronRight className="h-4 w-4 text-muted-foreground"/>} />
                        <ProfileItem href="/invite" icon={<Users className="text-primary"/>} label="邀请好友" action={<ChevronRight className="h-4 w-4 text-muted-foreground"/>} />
                    </div>
                </CardContent>
            </Card>

            {/* Support */}
            <Card className="bg-card/50 border-border/30">
                <CardContent className="p-0">
                    <div className="divide-y divide-border/30">
                        <Dialog>
                            <DialogTrigger asChild>
                                <div>
                                    <ProfileItem icon={<Headset className="text-primary"/>} label="联系客服" action={<ChevronRight className="h-4 w-4 text-muted-foreground"/>} onClick={() => {}}/>
                                </div>
                            </DialogTrigger>
                            <DialogContent className="max-w-[90vw] sm:max-w-xs rounded-lg">
                                <DialogHeader>
                                    <DialogTitle>联系客服</DialogTitle>
                                    <DialogDescription>
                                        通过Telegram联系我们的客服团队。
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                    <div className="flex flex-col items-center justify-center gap-4">
                                        <Image
                                            src="/support-qr.png"
                                            alt="Telegram QR Code"
                                            width={200}
                                            height={200}
                                            priority
                                            unoptimized
                                            data-ai-hint="qr code"
                                            className="rounded-md"
                                        />
                                        <div className="text-center">
                                            <p className="text-sm text-muted-foreground">扫描二维码或搜索下方账号</p>
                                            <p 
                                                className="font-mono text-lg text-primary mt-2 cursor-pointer hover:bg-muted/50 px-2 py-1 rounded transition-colors"
                                                onClick={async () => {
                                                    try {
                                                        await navigator.clipboard.writeText('@Michael_Qin');
                                                        // 可以添加一个简单的提示
                                                        // toast 提示已复制
                                                    } catch (err) {
                                                        console.log('复制失败:', err);
                                                    }
                                                }}
                                                title="点击复制"
                                            >
                                                @Michael_Qin
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </DialogContent>
                        </Dialog>
                        <ProfileItem href="/profile/feedback" icon={<FileQuestion className="text-primary"/>} label="问题反馈" action={<ChevronRight className="h-4 w-4 text-muted-foreground"/>} />
                    </div>
                </CardContent>
            </Card>

            {/* Logout */}
            <Card className="bg-transparent border-0 shadow-none">
                <CardContent className="p-0">
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="secondary" className="w-full justify-center gap-2 text-muted-foreground">
                                <LogOut className="w-4 h-4" />
                                退出登录
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>确定要退出登录吗?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    您随时可以重新登录。
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel variant="secondary">取消</AlertDialogCancel>
                                <AlertDialogAction onClick={handleLogout} className="bg-primary hover:bg-primary/90">确认退出</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </CardContent>
            </Card>
        </div>
      </main>

            {/* 头像编辑器 */}
            {authUser && (
                <AvatarEditor
                    open={avatarEditorOpen}
                    onOpenChange={setAvatarEditorOpen}
                    userId={authUser.id}
                    currentUrl={profile.avatar}
                    onUploaded={handleAvatarUploaded}
                />
            )}

            {/* 用户名编辑器 */}
            {authUser && (
                <UsernameEditDialog
                    isOpen={usernameEditOpen}
                    onClose={() => setUsernameEditOpen(false)}
                    currentUsername={profile.name}
                    userId={authUser.id}
                    onUpdate={handleUsernameUpdate}
                />
            )}

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border/50 h-16 z-20 flex-shrink-0">
        <div className="grid grid-cols-3 items-center h-full text-center">
            <Link 
                href="/" 
                passHref
                className="flex flex-col items-center justify-center space-y-1 transition-colors w-full h-full text-muted-foreground"
            >
                <BarChart className="h-6 w-6" />
                <span className="text-xs font-medium">将军榜</span>
            </Link>
            <div className="relative flex flex-col items-center justify-center h-full">
                 <Link href="/my-account" passHref className="absolute -top-5 flex items-center justify-center w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-lg border-4 border-background transition-transform active:scale-95">
                    <ArrowRightLeft className="w-6 h-6" />
                </Link>
                <span className="text-xs font-medium pt-8 text-muted-foreground">交易</span>
            </div>
            <Link 
                href="/profile" 
                passHref
                className="flex flex-col items-center justify-center space-y-1 transition-colors w-full h-full text-primary"
            >
                <User className="h-6 w-6" />
                <span className="text-xs font-medium">我的</span>
            </Link>
        </div>
      </nav>
    </div>
    </ProtectedRoute>
    </>
  );
}

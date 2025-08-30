
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
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { 
    ArrowRightLeft,
    BarChart, 
    ChevronRight, 
    Copy, 
    Crown, 
    Edit, 
    FileQuestion, 
    Headset, 
    ImagePlus, 
    KeyRound, 
    Mail, 
    ReceiptText, 
    Settings, 
    User, 
    Wallet,
    X
} from 'lucide-react';
import { SimpleToast } from '../components/SimpleToast';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';


function ProfileItem({ icon, label, value, action, onClick, href }: { icon: React.ReactNode, label: string, value?: string, action?: React.ReactNode, onClick?: () => void, href?: string }) {
    const isClickable = !!onClick || !!href;
    const Component = href ? Link : (isClickable ? 'button' : 'div');
    
    const props = href ? { href } : { onClick };

    return (
        <Component {...props} className={`flex items-center p-4 w-full text-left ${isClickable ? 'hover:bg-accent/50 transition-colors' : ''}`}>
            {icon}
            <span className="ml-4 text-sm font-medium">{label}</span>
            <div className="ml-auto flex items-center gap-2">
                {value && <span className="text-sm text-muted-foreground">{value}</span>}
                {action}
            </div>
        </Component>
    )
}

const feedbackTypes = [
    { id: 'feature-suggestion', label: '功能建议' },
    { id: 'ui-issue', label: '界面问题' },
    { id: 'account-issue', label: '账号问题' },
    { id: 'other', label: '其他问题' },
];

function FeedbackDialog() {
    const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
    const [description, setDescription] = useState('');
    const [images, setImages] = useState<string[]>([]);
    const [showSuccessToast, setShowSuccessToast] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            const newImages = files.map(file => URL.createObjectURL(file));
            setImages(prev => [...prev, ...newImages].slice(0, 3));
        }
    };

    const removeImage = (index: number) => {
        setImages(prev => prev.filter((_, i) => i !== index));
    };

    const handleTypeChange = (typeId: string) => {
        setSelectedTypes(prev =>
            prev.includes(typeId)
                ? prev.filter(id => id !== typeId)
                : [...prev, typeId]
        );
    };
    
    const handleSubmit = () => {
        console.log({
            types: selectedTypes,
            description,
            images,
        });
        
        setSelectedTypes([]);
        setDescription('');
        setImages([]);

        setShowSuccessToast(true);
    };

    return (
        <Dialog onOpenChange={(open) => !open && setShowSuccessToast(false)}>
             {showSuccessToast && <SimpleToast message="提交成功" onDismiss={() => setShowSuccessToast(false)} />}
            <DialogTrigger asChild>
                <div className="divide-y divide-border/30">
                    <ProfileItem icon={<FileQuestion className="text-primary"/>} label="问题反馈" action={<ChevronRight className="h-4 w-4 text-muted-foreground"/>} onClick={() => {}}/>
                </div>
            </DialogTrigger>
            <DialogContent className="max-w-[90vw] sm:max-w-md rounded-lg">
                <DialogHeader>
                    <DialogTitle>问题反馈</DialogTitle>
                    <DialogDescription>我们重视您的每一个建议</DialogDescription>
                </DialogHeader>
                <div className="grid gap-6 py-4">
                    <div className="grid gap-3">
                        <Label>问题类型</Label>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                           {feedbackTypes.map((type) => (
                                <div key={type.id} className="flex items-center gap-2">
                                    <Checkbox
                                        id={type.id}
                                        checked={selectedTypes.includes(type.id)}
                                        onCheckedChange={() => handleTypeChange(type.id)}
                                    />
                                    <Label htmlFor={type.id} className="font-normal text-sm">{type.label}</Label>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="description">问题描述</Label>
                        <Textarea
                            id="description"
                            placeholder="请详细描述您的问题或建议..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            maxLength={500}
                            className="h-28"
                        />
                        <p className="text-xs text-muted-foreground text-right">{description.length} / 500</p>
                    </div>
                    <div className="grid gap-2">
                         <Label>上传图片 (可选, 最多3张)</Label>
                         <div className="flex items-center gap-2">
                            {images.map((img, index) => (
                                <div key={index} className="relative w-20 h-20">
                                    <Image src={img} alt={`upload-preview-${index}`} layout="fill" objectFit="cover" className="rounded-md" />
                                    <button onClick={() => removeImage(index)} className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-0.5">
                                        <X className="w-3 h-3" />
                                    </button>
                                </div>
                            ))}
                            {images.length < 3 && (
                                <Label htmlFor="file-upload" className="w-20 h-20 bg-muted rounded-md flex items-center justify-center cursor-pointer hover:bg-muted/80">
                                    <ImagePlus className="w-8 h-8 text-muted-foreground" />
                                </Label>
                            )}
                         </div>
                         <Input id="file-upload" type="file" className="hidden" accept="image/png, image/jpeg, image/jpg" multiple onChange={handleFileChange} />
                    </div>
                </div>
                <DialogFooter className="flex-row justify-end gap-2">
                    <DialogClose asChild>
                        <Button type="button" variant="secondary">取消</Button>
                    </DialogClose>
                     <DialogClose asChild>
                        <Button type="submit" onClick={handleSubmit}>提交</Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default function ProfilePage() {
    const [activeTab, setActiveTab] = useState('profile');
    const [showToast, setShowToast] = useState(false);

    // Mock data
    const user = {
        name: 'CryptoKing',
        id: '88888888',
        email: 'crypto.king@example.com',
        avatar: 'https://i.pravatar.cc/150?u=cryptoking',
        membership: '年度会员'
    }

    const handleCopyId = () => {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(user.id);
            setShowToast(true);
        }
    }

  return (
    <div className="bg-background min-h-screen text-foreground flex flex-col h-screen">
      {showToast && <SimpleToast message="复制成功" onDismiss={() => setShowToast(false)} />}
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
                        
                        <button className="absolute -bottom-1 -right-1 bg-accent text-accent-foreground rounded-full p-1 hover:bg-accent/80 transition-colors border-2 border-card">
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">编辑头像</span>
                        </button>
                    </div>
                    <div className="space-y-1">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            {user.name}
                            {user.membership && (
                                <span className="bg-yellow-400 text-yellow-900 text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                                    <Crown className="w-3 h-3" />
                                    {user.membership}
                                </span>
                            )}
                        </h2>
                        <div className="flex items-center text-xs text-muted-foreground">
                            <span>ID: {user.id}</span>
                            <Button variant="ghost" size="icon" className="h-6 w-6 ml-1" onClick={handleCopyId}>
                                <Copy className="h-3 w-3" />
                            </Button>
                        </div>
                         <div className="flex items-center text-xs text-muted-foreground gap-1">
                            <Mail className="w-3 h-3" />
                            <span>{user.email || '--'}</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Common Functions */}
            <Card className="bg-card/50 border-border/30">
                 <CardContent className="p-0">
                    <div className="divide-y divide-border/30">
                        <ProfileItem href="/membership" icon={<Crown className="text-yellow-400"/>} label="购买会员" action={<ChevronRight className="h-4 w-4 text-muted-foreground"/>} />
                        <ProfileItem icon={<ReceiptText className="text-primary"/>} label="付费明细" action={<ChevronRight className="h-4 w-4 text-muted-foreground"/>} />
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
                                            src="https://picsum.photos/200/200"
                                            alt="Telegram QR Code"
                                            width={160}
                                            height={160}
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
                        <FeedbackDialog />
                    </div>
                </CardContent>
            </Card>
        </div>
      </main>


      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border/50 h-16 z-20 flex-shrink-0">
        <div className="grid grid-cols-3 items-center h-full text-center">
            <Link href="/" passHref className="flex flex-col items-center justify-center space-y-1 h-full">
                <button
                    onClick={() => setActiveTab('leaderboard')}
                    className={`flex flex-col items-center justify-center space-y-1 transition-colors w-full h-full ${
                    activeTab === 'leaderboard' ? 'text-primary' : 'text-muted-foreground'
                    }`}
                >
                    <BarChart className="h-6 w-6" />
                    <span className="text-xs font-medium">将军榜</span>
                </button>
            </Link>
            <Link href="/trade" passHref className="relative flex flex-col items-center justify-center h-full">
                 <div className="absolute -top-5 flex items-center justify-center w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-lg border border-border/50 transition-transform active:scale-95">
                    <ArrowRightLeft className="w-7 h-7" />
                </div>
                <span className="text-xs font-medium text-muted-foreground pt-8">交易</span>
            </Link>
            <Link href="/profile" passHref className="flex flex-col items-center justify-center space-y-1 h-full">
              <button
                  onClick={() => setActiveTab('profile')}
                  className={`flex flex-col items-center justify-center space-y-1 transition-colors w-full h-full ${
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


'use client'

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useInView } from 'react-intersection-observer';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronLeft, ChevronDown, Bot, Loader2, AlertTriangle, X, Copy } from 'lucide-react';
import { SimpleToast } from '@/app/components/SimpleToast';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';


const HandClickIcon = () => (
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width="24" 
        height="24" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        className="w-5 h-5 text-blue-400"
      >
        <path d="M8 10V7a4 4 0 0 1 8 0v3" />
        <path d="M12 10v4" />
        <path d="M10 14h4" />
        <path d="M18 10h1.5a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-1.5" />
        <path d="M6 10H4.5a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2H6" />
      </svg>
    );

interface PaymentRecord {
    id: string;
    user_id: string;
    plan_id?: string;
    payment_method: 'TRC20' | 'ERC20';
    payment_address: string;
    sender_address?: string;
    amount_usdt: number;
    transaction_hash?: string;
    status: 'pending' | 'completed' | 'failed' | 'reviewing';
    payment_type: string;
    completed_at?: string;
    expires_at?: string;
    created_at: string;
    plan_title?: string;
    plan_price?: number;
}

const getPaymentIcon = (paymentType: string) => {
    if (paymentType.includes('自动跟单')) {
        return <Bot className="w-5 h-5 text-green-400" />;
    }
    return <HandClickIcon />;
};

const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
        'pending': '审核中',
        'completed': '支付成功',
        'failed': '支付失败',
        'reviewing': '审核中'
    };
    return statusMap[status] || status;
};

const PAGE_SIZE = 10;

function InfoPill({ label, value, action, isAddress = false }: { label: string; value: string; action?: React.ReactNode; isAddress?: boolean }) {
    const [showToast, setShowToast] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(value);
        setShowToast(true);
    };

    return (
        <>
            {showToast && <SimpleToast message="复制成功" onDismiss={() => setShowToast(false)} />}
            <div className="flex items-center justify-between text-sm py-2">
                <span className="text-muted-foreground">{label}</span>
                <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground">{isAddress ? `${value.slice(0, 4)}...${value.slice(-4)}` : value}</span>
                    {isAddress && (
                         <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleCopy}>
                            <Copy className="h-3 w-3 text-muted-foreground" />
                        </Button>
                    )}
                    {action}
                </div>
            </div>
        </>
    )
}

function PaymentCard({ payment }: { payment: PaymentRecord }) {
    const statusText = getStatusText(payment.status);
    const icon = getPaymentIcon(payment.payment_type);
    
    const statusVariant: { [key: string]: 'default' | 'destructive' | 'secondary' } = {
        '支付成功': 'default',
        '支付失败': 'destructive',
        '审核中': 'secondary'
    };

    const statusColor: { [key: string]: string } = {
        '支付成功': 'bg-green-500/20 text-green-400 border-green-500/30',
        '支付失败': 'bg-red-500/20 text-red-400 border-red-500/30',
        '审核中': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
    };
  
  return (
    <Card className="bg-card/50 border-border/30 overflow-hidden relative">
      <CardContent className="p-4 space-y-2">
        <div className="flex justify-between items-center pb-2">
            <div className="flex items-center gap-3">
                {icon}
                <h3 className="font-bold text-base">{payment.payment_type}</h3>
            </div>
             <Badge variant="outline" className={statusColor[statusText]}>
                {statusText}
            </Badge>
        </div>
        <div className="border-t border-border/30 pt-1">
            <InfoPill label="支付方式" value={payment.payment_method} />
            <InfoPill label="收款地址" value={payment.payment_address} isAddress />
            {payment.sender_address && (
                <InfoPill label="付款地址" value={payment.sender_address} isAddress />
            )}
            <InfoPill label="金额" value={`${payment.amount_usdt}U`} />
            {payment.transaction_hash && (
                <InfoPill label="交易哈希" value={payment.transaction_hash} isAddress />
            )}
            <InfoPill 
                label="创建时间" 
                value={new Date(payment.created_at).toLocaleString('zh-CN', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                })} 
            />
            {payment.completed_at && (
                <InfoPill 
                    label="完成时间" 
                    value={new Date(payment.completed_at).toLocaleString('zh-CN', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                    })} 
                />
            )}
        </div>
      </CardContent>
    </Card>
  )
}

function FilterDropdown({ label, options, onSelect, value }: { label: string; options: string[]; onSelect: (option: string) => void; value: string; }) {
    const displayLabel = value === `全部${label}` ? label : value;
    
    return (
        <DropdownMenu>
        <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground text-sm p-0 h-auto">
            {displayLabel}
            <ChevronDown className="w-4 h-4 ml-1" />
            </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
            {options.map((option) => (
            <DropdownMenuItem key={option} onSelect={() => onSelect(option)}>
                {option}
            </DropdownMenuItem>
            ))}
        </DropdownMenuContent>
        </DropdownMenu>
    );
}

function NotificationBanner() {
    const [isVisible, setIsVisible] = useState(true);
    const [currentIndex, setCurrentIndex] = useState(0);

    const notifications = [
        "支付可能存在延迟，请耐心等待",
        "若长时间审核中请联系客服处理"
    ];

     useEffect(() => {
        if (!isVisible) return;
        const interval = setInterval(() => {
            setCurrentIndex((prevIndex) => (prevIndex + 1) % notifications.length);
        }, 5000);
        return () => clearInterval(interval);
    }, [isVisible, notifications.length]);

    if (!isVisible) {
        return null;
    }

    return (
        <div className="h-8 bg-yellow-500/10 text-yellow-200 px-4 relative flex items-center overflow-hidden">
            <div className="flex items-center gap-3 w-full">
                <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0" />
                 <AnimatePresence mode="wait">
                    <motion.p
                        key={currentIndex}
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -20, opacity: 0 }}
                        transition={{ duration: 0.5, ease: "easeInOut" }}
                        className="text-sm truncate flex-grow"
                    >
                        {notifications[currentIndex]}
                    </motion.p>
                </AnimatePresence>
            </div>
            <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-yellow-200/70 hover:text-yellow-200 hover:bg-white/10"
                onClick={() => setIsVisible(false)}
            >
                <X className="w-4 h-4" />
            </Button>
        </div>
    )
}


export default function PaymentDetailsPage() {
    const [payments, setPayments] = useState<PaymentRecord[]>([]);
    const [page, setPage] = useState(0);
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [hasMore, setHasMore] = useState(true);
    const { ref: loadMoreRef, inView } = useInView({ threshold: 0.1 });
    const { user } = useAuth();
    const { toast } = useToast();
    
    const [timeFilterLabel, setTimeFilterLabel] = useState('近三个月');
    const [methodFilter, setMethodFilter] = useState('全部方式');
    const [typeFilter, setTypeFilter] = useState('全部类型');
    const [statusFilter, setStatusFilter] = useState('全部状态');

    useEffect(() => {
        if (user) {
            loadPayments(true);
        }
    }, [user, methodFilter, typeFilter, statusFilter]);

    const getFilterValue = (filter: string, prefix: string) => {
        if (filter === `全部${prefix}`) return null;
        if (filter === '支付成功') return 'completed';
        if (filter === '支付失败') return 'failed';
        if (filter === '审核中') return 'pending';
        return filter;
    };

    const loadPayments = async (reset = false) => {
        if (!user || loading) return;
        
        try {
            setLoading(true);
            const currentPage = reset ? 0 : page;
            
            const { data, error } = await supabase.rpc('get_payment_records', {
                page_size: PAGE_SIZE,
                page_offset: currentPage * PAGE_SIZE,
                filter_status: getFilterValue(statusFilter, '状态'),
                filter_method: getFilterValue(methodFilter, '方式'),
                filter_type: getFilterValue(typeFilter, '类型')
            });

            if (error) throw error;

            const newPayments = data || [];
            
            if (reset) {
                setPayments(newPayments);
                setPage(1);
            } else {
                setPayments(prev => [...prev, ...newPayments]);
                setPage(prev => prev + 1);
            }
            
            setHasMore(newPayments.length === PAGE_SIZE);
        } catch (error: any) {
            console.error('获取付费记录失败:', error);
            toast({ description: '获取付费记录失败，请刷新重试' });
        } finally {
            setLoading(false);
            if (initialLoading) {
                setInitialLoading(false);
            }
        }
    };

    const loadMorePayments = useCallback(() => {
        if (!hasMore || loading) return;
        loadPayments(false);
    }, [hasMore, loading, page, user]);

    useEffect(() => {
        if (inView && !loading && !initialLoading) {
            loadMorePayments();
        }
    }, [inView, loadMorePayments, loading, initialLoading]);


    return (
        <div className="bg-background min-h-screen text-foreground flex flex-col">
            <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-border/50 bg-background/80 px-4 backdrop-blur-sm">
                <Link href="/profile" passHref>
                    <Button variant="ghost" size="icon">
                        <ChevronLeft className="h-6 w-6" />
                    </Button>
                </Link>
                <h1 className="text-lg font-bold">付费明细</h1>
                <Link href="/membership">
                    <Button variant="link" className="text-primary px-0 hover:no-underline">购买会员</Button>
                </Link>
            </header>

            <NotificationBanner />
            
            <main className="flex-grow overflow-auto p-4 space-y-4">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                         <FilterDropdown
                            label="方式"
                            value={methodFilter}
                            options={['全部方式', 'TRC20', 'ERC20']}
                            onSelect={setMethodFilter}
                        />
                        <FilterDropdown
                            label="类型"
                            value={typeFilter}
                            options={['全部类型', '自动跟单', '手动跟单']}
                            onSelect={setTypeFilter}
                        />
                        <FilterDropdown
                            label="状态"
                            value={statusFilter}
                            options={['全部状态', '支付成功', '支付失败', '审核中']}
                            onSelect={setStatusFilter}
                        />
                    </div>
                    <FilterDropdown
                        label="时间"
                        value={timeFilterLabel}
                        options={['近三个月', '近半年', '近一年']}
                        onSelect={setTimeFilterLabel}
                    />
                </div>
                {payments.length === 0 && !initialLoading ? (
                    <div className="text-center text-muted-foreground pt-20">
                        <p>暂无付费记录</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {payments.map(payment => (
                            <PaymentCard key={payment.id} payment={payment} />
                        ))}
                    </div>
                )}
                <div ref={loadMoreRef} className="flex justify-center items-center min-h-[200px] text-muted-foreground">
                    {(loading || initialLoading) && (
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                            <p className="text-muted-foreground">加载中...</p>
                        </div>
                    )}
                    {!loading && !initialLoading && !hasMore && payments.length > 0 && (
                        <span>已经到底了</span>
                    )}
                </div>
            </main>
        </div>
    );
}

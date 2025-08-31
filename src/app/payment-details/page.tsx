
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

const allMockPayments = Array.from({ length: 30 }, (_, i) => {
    const type = i % 4;
    let paymentType, icon, typeKey;
    const statusOptions = ['支付成功', '支付失败', '审核中'];
    const status = statusOptions[i % 3];


    switch (type) {
        case 0:
            paymentType = '自动跟单 · 1年';
            icon = <Bot className="w-5 h-5 text-green-400" />;
            typeKey = 'auto-year';
            break;
        case 1:
            paymentType = '手动跟单 · 3个月';
            icon = <HandClickIcon />;
            typeKey = 'manual-quarter';
            break;
        case 2:
            paymentType = '自动跟单 · 1个月';
            icon = <Bot className="w-5 h-5 text-green-400" />;
            typeKey = 'auto-month';
            break;
        default:
            paymentType = '手动跟单 · 1年';
            icon = <HandClickIcon />;
            typeKey = 'manual-year';
            break;
    }
    const paymentMethod = i % 3 === 0 ? 'ERC20' : 'TRC20';
    const date = new Date(2024, 4 - Math.floor(i / 10), 28 - (i % 28), 10, 30, 15);

    return { 
        id: `${i + 1}`, 
        paymentMethod,
        paymentAddress: 'TXYZ...abcd',
        senderAddress: `T${[...Array(3)].map(() => Math.random().toString(36)[2]).join('')}...${[...Array(4)].map(() => Math.random().toString(36)[2]).join('')}`,
        paymentType,
        completionTime: date.toISOString().replace('T', ' ').substring(0, 19),
        icon,
        type: typeKey,
        status,
    };
});

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

function PaymentCard({ payment }: { payment: typeof allMockPayments[0] }) {
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
                {payment.icon}
                <h3 className="font-bold text-base">{payment.paymentType}</h3>
            </div>
             <Badge variant="outline" className={statusColor[payment.status]}>
                {payment.status}
            </Badge>
        </div>
        <div className="border-t border-border/30 pt-1">
            <InfoPill label="支付方式" value={payment.paymentMethod} />
            <InfoPill label="收款地址" value={payment.paymentAddress} isAddress />
            <InfoPill label="付款地址" value={payment.senderAddress} isAddress />
            <InfoPill label="支付完成时间" value={payment.completionTime} />
        </div>
      </CardContent>
    </Card>
  )
}

function FilterDropdown({ label, options, onSelect, setLabel }: { label: string; options: string[]; onSelect: (option: string) => void; setLabel?: (label: string) => void; }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground text-sm p-0 h-auto">
          {label}
          <ChevronDown className="w-4 h-4 ml-1" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {options.map((option) => (
          <DropdownMenuItem key={option} onSelect={() => {
            onSelect(option);
            if (setLabel) setLabel(option);
          }}>
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
    const [payments, setPayments] = useState<(typeof allMockPayments[0])[]>([]);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [hasMore, setHasMore] = useState(true);
    const { ref: loadMoreRef, inView } = useInView({ threshold: 0.1 });
    
    const [timeFilterLabel, setTimeFilterLabel] = useState('近三个月');
    const [methodFilter, setMethodFilter] = useState('全部方式');
    const [typeFilter, setTypeFilter] = useState('全部类型');

    const loadMorePayments = useCallback(() => {
        if (loading || !hasMore) return;
        setLoading(true);
        
        setTimeout(() => {
            const newPayments = allMockPayments.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
            setPayments(prev => [...prev, ...newPayments]);
            setPage(prev => prev + 1);
            setHasMore(page * PAGE_SIZE < allMockPayments.length);
            setLoading(false);
        }, 1000);
    }, [loading, hasMore, page]);
    
    useEffect(() => {
        // Initial load
        setLoading(true);
        setPayments(allMockPayments.slice(0, PAGE_SIZE));
        setPage(2);
        setHasMore(PAGE_SIZE < allMockPayments.length);
        setLoading(false);
    }, []);

    useEffect(() => {
        if (inView && !loading) {
            loadMorePayments();
        }
    }, [inView, loading, loadMorePayments]);


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
                            label={methodFilter}
                            options={['全部方式', 'TRC20', 'ERC20']}
                            onSelect={setMethodFilter}
                            setLabel={setMethodFilter}
                        />
                        <FilterDropdown
                            label={typeFilter}
                            options={['全部类型', '自动跟单', '手动跟单']}
                            onSelect={setTypeFilter}
                            setLabel={setTypeFilter}
                        />
                    </div>
                    <FilterDropdown
                        label={timeFilterLabel}
                        options={['近三个月', '近半年', '近一年']}
                        onSelect={setTimeFilterLabel}
                        setLabel={setTimeFilterLabel}
                    />
                </div>
                {payments.length === 0 && !loading ? (
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
                <div ref={loadMoreRef} className="flex justify-center items-center h-16 text-muted-foreground">
                    {loading && (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            <span>加载中...</span>
                        </>
                    )}
                    {!loading && !hasMore && payments.length > 0 && (
                        <span>已经到底了</span>
                    )}
                </div>
            </main>
        </div>
    );
}

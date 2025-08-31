
'use client'

import { useState } from 'react';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronLeft, ChevronDown, Copy, Bot, ShieldCheck } from 'lucide-react';
import { SimpleToast } from '@/app/components/SimpleToast';

const mockPayments = [
    { 
        id: '1', 
        paymentMethod: 'TRC20',
        paymentAddress: 'TXYZ...abcd',
        senderAddress: 'TABC...wxyz',
        paymentType: '自动跟单 · 1年',
        completionTime: '2024-05-20 10:30:15',
        icon: <Bot className="w-5 h-5 text-green-400" />,
        type: 'auto'
    },
    { 
        id: '2', 
        paymentMethod: 'TRC20',
        paymentAddress: 'TXYZ...abcd',
        senderAddress: 'TDEF...uvwx',
        paymentType: '手动跟单 · 3个月',
        completionTime: '2024-02-15 09:00:41',
        icon: <ShieldCheck className="w-5 h-5 text-blue-400" />,
        type: 'manual'
    }
];

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

function PaymentCard({ payment }: { payment: typeof mockPayments[0] }) {
  return (
    <Card className="bg-card/50 border-border/30">
      <CardContent className="p-4 space-y-2">
        <div className="flex justify-between items-center pb-2">
            <div className="flex items-center gap-3">
                {payment.icon}
                <h3 className="font-bold text-base">{payment.paymentType}</h3>
            </div>
        </div>
        <div className="border-t border-border/30 pt-1">
            <InfoPill label="支付方式" value={payment.paymentMethod} />
            <InfoPill label="支付地址" value={payment.paymentAddress} isAddress />
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


export default function PaymentDetailsPage() {
    const [payments, setPayments] = useState(mockPayments);
    const [timeFilterLabel, setTimeFilterLabel] = useState('近三个月');

    return (
        <div className="bg-background min-h-screen text-foreground flex flex-col">
            <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-border/50 bg-background/80 px-4 backdrop-blur-sm">
                <Link href="/profile" passHref>
                    <Button variant="ghost" size="icon">
                        <ChevronLeft className="h-6 w-6" />
                    </Button>
                </Link>
                <h1 className="text-lg font-bold">付费明细</h1>
                <div className="w-9"></div> {/* Placeholder for spacing */}
            </header>
            
            <main className="flex-grow overflow-auto p-4 space-y-4">
                <div className="flex justify-end">
                    <FilterDropdown
                        label={timeFilterLabel}
                        options={['近三个月', '近半年', '近一年']}
                        onSelect={setTimeFilterLabel}
                        setLabel={setTimeFilterLabel}
                    />
                </div>
                {payments.length === 0 ? (
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
            </main>
        </div>
    );
}

    
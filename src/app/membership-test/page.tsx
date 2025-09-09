'use client'

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function MembershipTestPage() {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        testSupabaseConnection();
    }, []);

    const testSupabaseConnection = async () => {
        try {
            console.log('测试页面：开始测试Supabase连接...');
            
            // 简单的测试查询
            const { data, error } = await supabase
                .from('membership_plans')
                .select('*')
                .limit(1);

            console.log('测试页面：Supabase响应:', { data, error });

            if (error) {
                throw error;
            }

            setData(data);
            console.log('测试页面：数据设置成功');
        } catch (err: any) {
            console.error('测试页面：错误:', err);
            setError(err.message || '连接失败');
        } finally {
            setLoading(false);
            console.log('测试页面：加载完成');
        }
    };

    return (
        <div className="bg-background min-h-screen text-foreground flex flex-col">
            <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-border/50 bg-background/80 px-4 backdrop-blur-sm">
                <Link href="/profile" passHref>
                    <Button variant="ghost" size="icon">
                        <ChevronLeft className="h-6 w-6" />
                    </Button>
                </Link>
                <h1 className="text-lg font-bold">会员中心测试</h1>
                <div className="w-10"></div>
            </header>

            <main className="flex-grow overflow-auto p-4">
                <div className="max-w-md mx-auto">
                    <h2 className="text-xl font-bold mb-4">Supabase连接测试</h2>
                    
                    {loading && (
                        <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                            <p>测试连接中...</p>
                        </div>
                    )}

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-4">
                            <h3 className="font-bold text-red-400 mb-2">连接失败</h3>
                            <p className="text-red-300">{error}</p>
                            <Button 
                                onClick={() => {
                                    setError(null);
                                    setLoading(true);
                                    testSupabaseConnection();
                                }}
                                className="mt-4"
                            >
                                重试
                            </Button>
                        </div>
                    )}

                    {!loading && !error && (
                        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                            <h3 className="font-bold text-green-400 mb-2">连接成功！</h3>
                            <p className="text-green-300 mb-2">数据库连接正常</p>
                            <div className="bg-black/20 rounded p-2 mt-2">
                                <pre className="text-xs text-gray-300 overflow-auto">
                                    {JSON.stringify(data, null, 2)}
                                </pre>
                            </div>
                            <div className="mt-4 space-y-2">
                                <Button 
                                    onClick={() => window.location.href = '/membership'}
                                    className="w-full"
                                >
                                    前往正式会员中心
                                </Button>
                                <Button 
                                    variant="outline"
                                    onClick={() => {
                                        setLoading(true);
                                        testSupabaseConnection();
                                    }}
                                    className="w-full"
                                >
                                    重新测试
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MembershipBadge, type MembershipLevel } from '@/components/ui/membership-badge';
import { Badge } from '@/components/ui/badge';

const membershipLevels: { level: MembershipLevel; title: string; description: string }[] = [
  {
    level: 'free',
    title: '免费用户',
    description: '基础功能访问权限'
  },
  {
    level: 'basic',
    title: '基础会员',
    description: '收益率 ≥ 50%，胜率 ≥ 70%，信号数 ≥ 100'
  },
  {
    level: 'pro',
    title: '专业会员',
    description: '收益率 ≥ 100%，胜率 ≥ 85% 或 收益率 ≥ 150%，胜率 ≥ 75%'
  },
  {
    level: 'vip',
    title: '至尊会员',
    description: '收益率 ≥ 200%，胜率 ≥ 90%，信号数 ≥ 500'
  }
];

const sizes = ['sm', 'md', 'lg'] as const;

export default function MembershipTestPage() {
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-center mb-8">会员徽章系统测试</h1>
        
        <Card>
          <CardHeader>
            <CardTitle>会员等级系统</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {membershipLevels.map((item) => (
              <div key={item.level} className="flex items-center gap-4 p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <MembershipBadge 
                    level={item.level}
                    size="lg"
                    showText={true}
                  />
                  <div>
                    <h3 className="font-semibold">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>不同尺寸对比</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {sizes.map((size) => (
                <div key={size} className="space-y-4">
                  <h3 className="font-semibold capitalize">{size} 尺寸</h3>
                  <div className="space-y-3">
                    {membershipLevels.filter(item => item.level !== 'free').map((item) => (
                      <div key={item.level} className="flex items-center gap-2">
                        <MembershipBadge 
                          level={item.level}
                          size={size}
                          showText={true}
                        />
                        <span className="text-sm">{item.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>仅图标模式</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              {membershipLevels.filter(item => item.level !== 'free').map((item) => (
                <div key={item.level} className="text-center">
                  <MembershipBadge 
                    level={item.level}
                    size="md"
                    showText={false}
                  />
                  <p className="text-xs mt-1">{item.title}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>头像搭配效果</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-6">
              {membershipLevels.filter(item => item.level !== 'free').map((item) => (
                <div key={item.level} className="text-center">
                  <div className="relative inline-block">
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                      <span className="text-xl font-bold">
                        {item.title.charAt(0)}
                      </span>
                    </div>
                    <div className="absolute -bottom-1 -right-1">
                      <MembershipBadge 
                        level={item.level}
                        size="sm"
                        showText={false}
                      />
                    </div>
                  </div>
                  <p className="text-xs mt-2">{item.title}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>响应式测试提示</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                请在不同屏幕尺寸下测试徽章的显示效果：
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">桌面端 (&gt;1024px)</Badge>
                <Badge variant="outline">平板端 (768px-1024px)</Badge>
                <Badge variant="outline">移动端 (&lt;768px)</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
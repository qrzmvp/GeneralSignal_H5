"use client"

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { METALLIC_RANK_ICONS } from '@/components/ui/rank-icons';

export default function RankIconsTestPage() {
  const mockTraders = [
    { 
      id: '1', 
      name: '量化大师', 
      rank: 1, 
      avatar: 'https://i.pravatar.cc/150?u=quant',
      description: '王者交易员'
    },
    { 
      id: '2', 
      name: '趋势猎人', 
      rank: 2, 
      avatar: 'https://i.pravatar.cc/150?u=hunter',
      description: '亚军交易员'
    },
    { 
      id: '3', 
      name: '波段之王', 
      rank: 3, 
      avatar: 'https://i.pravatar.cc/150?u=swing',
      description: '季军交易员'
    }
  ];

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-center mb-8">立体金属感排名图标测试</h1>
        
        {/* 单独图标展示 */}
        <Card>
          <CardHeader>
            <CardTitle>排名图标展示</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-8 justify-center items-center">
              {Object.entries(METALLIC_RANK_ICONS).map(([rank, config]) => (
                <div key={rank} className="text-center space-y-2">
                  <config.Icon className="w-16 h-16" />
                  <p className="text-sm font-medium">{config.label}</p>
                  <config.Badge />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 头像搭配效果 */}
        <Card>
          <CardHeader>
            <CardTitle>头像搭配效果</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-6">
              {mockTraders.map((trader) => {
                const rankConfig = METALLIC_RANK_ICONS[trader.rank as keyof typeof METALLIC_RANK_ICONS];
                return (
                  <div key={trader.id} className="text-center space-y-3">
                    <div className="relative inline-block">
                      <Avatar className="w-20 h-20 border-2 border-primary">
                        <AvatarImage src={trader.avatar} alt={trader.name} />
                        <AvatarFallback>{trader.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      
                      {/* 左上角大图标 */}
                      <div className="absolute -top-2 -left-2 transform -rotate-12">
                        <rankConfig.Icon className="w-9 h-9" />
                      </div>
                      
                      {/* 右下角小徽章 */}
                      <div className="absolute -bottom-1 -right-1">
                        <rankConfig.Badge />
                      </div>
                    </div>
                    
                    <div>
                      <p className="font-bold">{trader.name}</p>
                      <p className="text-sm text-muted-foreground">{trader.description}</p>
                      <p className="text-xs text-primary">排名: 第{trader.rank}名</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* 不同尺寸测试 */}
        <Card>
          <CardHeader>
            <CardTitle>不同尺寸效果</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {Object.entries(METALLIC_RANK_ICONS).map(([rank, config]) => (
                <div key={rank} className="flex items-center gap-4">
                  <span className="text-sm font-medium w-12">{config.label}:</span>
                  <config.Icon className="w-6 h-6" />
                  <config.Icon className="w-8 h-8" />
                  <config.Icon className="w-10 h-10" />
                  <config.Icon className="w-12 h-12" />
                  <config.Icon className="w-16 h-16" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
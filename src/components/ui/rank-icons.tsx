import React from 'react';
import { cn } from '@/lib/utils';

// 王者皇冠图标 - 立体金色
export function CrownIcon({ className }: { className?: string }) {
  return (
    <div className={cn("relative rank-icon-container rank-icon-gold", className)}>
      <svg 
        width="32" 
        height="32" 
        viewBox="0 0 32 32" 
        className="drop-shadow-xl"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* 金色渐变 */}
          <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFD700" />
            <stop offset="30%" stopColor="#FFA500" />
            <stop offset="70%" stopColor="#FFD700" />
            <stop offset="100%" stopColor="#B8860B" />
          </linearGradient>
          
          {/* 金色光泽 */}
          <linearGradient id="goldShine" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.8)" />
            <stop offset="50%" stopColor="rgba(255,255,255,0.4)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0.1)" />
          </linearGradient>

          {/* 阴影滤镜 */}
          <filter id="crownShadow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="2"/>
            <feOffset dx="2" dy="2" result="offset"/>
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.5"/>
            </feComponentTransfer>
            <feMerge> 
              <feMergeNode/>
              <feMergeNode in="SourceGraphic"/> 
            </feMerge>
          </filter>
        </defs>

        {/* 皇冠主体 */}
        <path 
          d="M4 22 L8 12 L12 18 L16 8 L20 18 L24 12 L28 22 L26 26 L6 26 Z" 
          fill="url(#goldGradient)" 
          stroke="#B8860B" 
          strokeWidth="0.5"
          filter="url(#crownShadow)"
        />
        
        {/* 宝石装饰 */}
        <circle cx="16" cy="14" r="2" fill="#FF4444" className="animate-pulse" />
        <circle cx="10" cy="16" r="1.5" fill="#4444FF" />
        <circle cx="22" cy="16" r="1.5" fill="#44FF44" />
        
        {/* 光泽效果 */}
        <path 
          d="M6 22 L10 14 L14 18 L16 12 L18 18 L22 14 L26 22 L24 24 L8 24 Z" 
          fill="url(#goldShine)" 
          opacity="0.6"
        />
        
        {/* 皇冠顶部装饰 */}
        <path d="M14 8 L16 4 L18 8" fill="url(#goldGradient)" stroke="#B8860B" strokeWidth="0.3"/>
      </svg>
    </div>
  );
}

// 亚军奖牌图标 - 立体银色（优化版）
export function MedalIcon({ className }: { className?: string }) {
  return (
    <div className={cn("relative rank-icon-container rank-icon-silver", className)}>
      <svg 
        width="32" 
        height="32" 
        viewBox="0 0 32 32" 
        className="drop-shadow-xl"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* 银色主渐变 - 更加真实的金属感 */}
          <radialGradient id="silverGradientMain" cx="30%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="20%" stopColor="#E5E5E5" />
            <stop offset="40%" stopColor="#C0C0C0" />
            <stop offset="70%" stopColor="#A8A8A8" />
            <stop offset="100%" stopColor="#808080" />
          </radialGradient>
          
          {/* 银色深度渐变 */}
          <linearGradient id="silverDepth" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F8F8FF" />
            <stop offset="30%" stopColor="#DCDCDC" />
            <stop offset="60%" stopColor="#C0C0C0" />
            <stop offset="100%" stopColor="#969696" />
          </linearGradient>
          
          {/* 银色高光 */}
          <radialGradient id="silverHighlight" cx="25%" cy="25%" r="50%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.9)" />
            <stop offset="40%" stopColor="rgba(255,255,255,0.6)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0.1)" />
          </radialGradient>

          {/* 丝带渐变 - 更丰富的颜色层次 */}
          <linearGradient id="ribbonGradientNew" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#DC143C" />
            <stop offset="25%" stopColor="#FF6B6B" />
            <stop offset="75%" stopColor="#FF5252" />
            <stop offset="100%" stopColor="#B71C1C" />
          </linearGradient>
          
          {/* 丝带阴影 */}
          <linearGradient id="ribbonShadow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(183, 28, 28, 0.8)" />
            <stop offset="100%" stopColor="rgba(139, 0, 0, 0.9)" />
          </linearGradient>

          {/* 内圈装饰渐变 */}
          <radialGradient id="innerRing" cx="50%" cy="50%" r="80%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.3)" />
            <stop offset="70%" stopColor="rgba(192,192,192,0.8)" />
            <stop offset="100%" stopColor="rgba(128,128,128,1)" />
          </radialGradient>

          {/* 阴影滤镜 */}
          <filter id="medalShadow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="3"/>
            <feOffset dx="2" dy="3" result="offset"/>
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.6"/>
            </feComponentTransfer>
            <feMerge> 
              <feMergeNode/>
              <feMergeNode in="SourceGraphic"/> 
            </feMerge>
          </filter>
        </defs>

        {/* 丝带背景阴影 */}
        <path d="M10 2 L22 2 L20 16 L12 16 Z" fill="url(#ribbonShadow)" opacity="0.3" transform="translate(1,1)" />
        <path d="M8 2 L10 2 L12 14 L6 18 Z" fill="url(#ribbonShadow)" opacity="0.3" transform="translate(1,1)" />
        <path d="M22 2 L24 2 L26 18 L20 14 Z" fill="url(#ribbonShadow)" opacity="0.3" transform="translate(1,1)" />

        {/* 丝带主体 - 更立体的效果 */}
        <path d="M10 2 L22 2 L20 16 L12 16 Z" fill="url(#ribbonGradientNew)" filter="url(#medalShadow)" />
        <path d="M8 2 L10 2 L12 14 L6 18 Z" fill="url(#ribbonGradientNew)" opacity="0.9" />
        <path d="M22 2 L24 2 L26 18 L20 14 Z" fill="url(#ribbonGradientNew)" opacity="0.9" />
        
        {/* 丝带折叠效果 */}
        <path d="M10 2 L22 2 L21 4 L11 4 Z" fill="rgba(255,255,255,0.4)" />
        <path d="M8 2 L10 2 L9.5 4 L8.5 4 Z" fill="rgba(255,255,255,0.4)" />
        <path d="M22 2 L24 2 L23.5 4 L22.5 4 Z" fill="rgba(255,255,255,0.4)" />
        
        {/* 奖牌主体外圈 */}
        <circle 
          cx="16" 
          cy="20" 
          r="9" 
          fill="url(#silverDepth)" 
          stroke="#808080" 
          strokeWidth="0.5"
          filter="url(#medalShadow)"
        />
        
        {/* 奖牌主体 */}
        <circle 
          cx="16" 
          cy="20" 
          r="8" 
          fill="url(#silverGradientMain)" 
          stroke="#A0A0A0" 
          strokeWidth="1"
        />
        
        {/* 内圈装饰环 */}
        <circle cx="16" cy="20" r="6.5" fill="none" stroke="url(#innerRing)" strokeWidth="0.8" />
        <circle cx="16" cy="20" r="5" fill="none" stroke="#B8B8B8" strokeWidth="0.3" />
        
        {/* 中心装饰区域 */}
        <circle cx="16" cy="20" r="4" fill="url(#silverDepth)" opacity="0.7" />
        
        {/* 数字2 - 更精美的设计 */}
        <text 
          x="16" 
          y="24.5" 
          textAnchor="middle" 
          fontSize="7" 
          fontWeight="bold" 
          fill="#2C2C2C"
          stroke="rgba(255,255,255,0.8)"
          strokeWidth="0.3"
        >
          2
        </text>
        
        {/* 星星装饰 */}
        <path d="M16 16 L16.5 17.5 L18 17.5 L16.8 18.3 L17.3 19.8 L16 19 L14.7 19.8 L15.2 18.3 L14 17.5 L15.5 17.5 Z" 
              fill="rgba(255,255,255,0.6)" />
        
        {/* 主高光效果 */}
        <ellipse cx="13" cy="17" rx="3.5" ry="2.5" fill="url(#silverHighlight)" opacity="0.8" />
        
        {/* 边缘高光 */}
        <circle cx="16" cy="20" r="8" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.5" 
                strokeDasharray="2,1" opacity="0.6" />
      </svg>
    </div>
  );
}

// 季军奖杯图标 - 立体铜色
export function TrophyIcon({ className }: { className?: string }) {
  return (
    <div className={cn("relative rank-icon-container rank-icon-bronze", className)}>
      <svg 
        width="32" 
        height="32" 
        viewBox="0 0 32 32" 
        className="drop-shadow-xl"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* 铜色渐变 */}
          <linearGradient id="bronzeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#CD7F32" />
            <stop offset="30%" stopColor="#D2691E" />
            <stop offset="70%" stopColor="#CD7F32" />
            <stop offset="100%" stopColor="#8B4513" />
          </linearGradient>
          
          {/* 铜色光泽 */}
          <linearGradient id="bronzeShine" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(255,215,0,0.8)" />
            <stop offset="50%" stopColor="rgba(255,215,0,0.3)" />
            <stop offset="100%" stopColor="rgba(255,215,0,0.1)" />
          </linearGradient>

          {/* 底座渐变 */}
          <linearGradient id="baseGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#8B4513" />
            <stop offset="100%" stopColor="#654321" />
          </linearGradient>
        </defs>

        {/* 奖杯底座 */}
        <rect x="10" y="24" width="12" height="4" rx="1" fill="url(#baseGradient)" />
        <rect x="12" y="22" width="8" height="2" fill="url(#bronzeGradient)" />
        
        {/* 奖杯主体 */}
        <path 
          d="M11 22 L11 12 Q11 10 13 10 L19 10 Q21 10 21 12 L21 22 Z" 
          fill="url(#bronzeGradient)" 
          stroke="#8B4513" 
          strokeWidth="0.5"
        />
        
        {/* 奖杯把手 */}
        <path d="M21 14 Q25 14 25 18 Q25 20 23 20 L21 20" 
              fill="none" stroke="url(#bronzeGradient)" strokeWidth="2" />
        <path d="M11 14 Q7 14 7 18 Q7 20 9 20 L11 20" 
              fill="none" stroke="url(#bronzeGradient)" strokeWidth="2" />
        
        {/* 装饰线条 */}
        <line x1="13" y1="12" x2="19" y2="12" stroke="#8B4513" strokeWidth="0.5" />
        <line x1="13" y1="15" x2="19" y2="15" stroke="#8B4513" strokeWidth="0.3" />
        
        {/* 数字3 */}
        <text 
          x="16" 
          y="19" 
          textAnchor="middle" 
          fontSize="6" 
          fontWeight="bold" 
          fill="#654321"
        >
          3
        </text>
        
        {/* 光泽效果 */}
        <ellipse cx="14" cy="14" rx="2" ry="3" fill="url(#bronzeShine)" opacity="0.6" />
      </svg>
    </div>
  );
}

// 右下角小型排名徽章
export function RankBadge({ rank, className }: { rank: number; className?: string }) {
  const badges = {
    1: { 
      cssClass: 'rank-badge-gold rank-badge-glow',
      text: '王者',
    },
    2: { 
      cssClass: 'rank-badge-silver rank-badge-glow',
      text: '亚军',
    },
    3: { 
      cssClass: 'rank-badge-bronze rank-badge-glow',
      text: '季军',
    }
  };

  const badge = badges[rank as keyof typeof badges];
  if (!badge) return null;

  return (
    <div 
      className={cn(
        "inline-flex items-center justify-center rounded-full text-xs font-bold",
        "backdrop-blur-sm shadow-lg transition-all duration-200 hover:scale-110",
        "w-6 h-6 text-[10px]",
        badge.cssClass,
        className
      )}
    >
      {rank}
    </div>
  );
}

// 导出所有图标的配置
export const METALLIC_RANK_ICONS = {
  1: { 
    Icon: CrownIcon, 
    color: "text-yellow-400",
    label: "王者",
    Badge: () => <RankBadge rank={1} />
  },
  2: { 
    Icon: MedalIcon, 
    color: "text-slate-400",
    label: "亚军",
    Badge: () => <RankBadge rank={2} />
  },
  3: { 
    Icon: TrophyIcon, 
    color: "text-amber-600",
    label: "季军",
    Badge: () => <RankBadge rank={3} />
  }
};
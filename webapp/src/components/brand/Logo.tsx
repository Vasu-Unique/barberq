import React from 'react';
import { cn } from '@/utils/cn';

interface LogoProps {
  className?: string;
  iconClassName?: string;
  textClassName?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'white' | 'dark';
}

export function Logo({
  className,
  iconClassName,
  textClassName,
  showText = true,
  size = 'md',
  variant = 'default',
}: LogoProps) {
  const sizeMap = {
    sm: { box: 'h-8 w-8', icon: 20, text: 'text-base', subText: 'text-[9px]' },
    md: { box: 'h-10 w-10', icon: 24, text: 'text-xl', subText: 'text-[10px]' },
    lg: { box: 'h-12 w-12', icon: 30, text: 'text-2xl', subText: 'text-xs' },
    xl: { box: 'h-16 w-16', icon: 40, text: 'text-3xl', subText: 'text-sm' },
  }[size];

  const isWhite = variant === 'white';

  return (
    <div className={cn('flex items-center gap-3 select-none group', className)}>
      {/* Brand Icon Mark */}
      <div
        className={cn(
          'relative flex items-center justify-center rounded-xl transition-all duration-300 shadow-sm group-hover:scale-105 group-hover:shadow-md',
          sizeMap.box,
          isWhite
            ? 'bg-white/15 text-white backdrop-blur-md border border-white/25 shadow-none'
            : 'bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 text-white shadow-primary-900/20',
          iconClassName,
        )}
      >
        <svg
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="h-[70%] w-[70%] drop-shadow-sm"
        >
          <defs>
            <linearGradient id="barberqGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1CA39E" />
              <stop offset="60%" stopColor="#007C84" />
              <stop offset="100%" stopColor="#00565C" />
            </linearGradient>
            <linearGradient id="coralAccent" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#E9785F" />
              <stop offset="100%" stopColor="#E55B3C" />
            </linearGradient>
            <linearGradient id="goldGlow" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#F9EED3" />
              <stop offset="100%" stopColor="#DDA027" />
            </linearGradient>
          </defs>

          {/* Q Outer Circle / Queue Ring */}
          <circle
            cx="22"
            cy="22"
            r="16"
            stroke="currentColor"
            strokeWidth="3.8"
            strokeLinecap="round"
            className="opacity-95"
          />

          {/* Diagonal Barber Pole Flow Stripes inside Q */}
          <path
            d="M13 14C15.5 11 20 9.5 24 10"
            stroke="url(#coralAccent)"
            strokeWidth="3.2"
            strokeLinecap="round"
          />
          <path
            d="M11 22C12 18 16 15 20 15"
            stroke="#D9F2F4"
            strokeWidth="2.5"
            strokeLinecap="round"
            opacity="0.8"
          />

          {/* Minimalist Barber Scissor Blades forming dynamic geometry */}
          <path
            d="M14 30L29 15"
            stroke="currentColor"
            strokeWidth="2.8"
            strokeLinecap="round"
          />
          <path
            d="M14 15L29 30"
            stroke="currentColor"
            strokeWidth="2.8"
            strokeLinecap="round"
          />
          
          {/* Scissor Pivot Accent */}
          <circle cx="21.5" cy="22.5" r="2.2" fill="url(#goldGlow)" />

          {/* The Q's dynamic Queue tail - stylized token pointer */}
          <path
            d="M31 31L40 40"
            stroke="url(#coralAccent)"
            strokeWidth="4.5"
            strokeLinecap="round"
          />
          {/* Signal / Active queue pulse dot */}
          <circle cx="40" cy="40" r="2.5" fill="#E55B3C" />
        </svg>
      </div>

      {/* Brand Typography */}
      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center leading-none">
            <span
              className={cn(
                'font-extrabold tracking-tight font-sans',
                sizeMap.text,
                isWhite ? 'text-white' : 'text-ink',
                textClassName,
              )}
            >
              Barber
            </span>
            <span
              className={cn(
                'font-black tracking-tight font-sans text-primary-600 ml-0.5',
                isWhite && 'text-mint',
                sizeMap.text,
              )}
            >
              Q
            </span>
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-coral-500 ml-1 mb-2 animate-pulse" />
          </div>
          <span
            className={cn(
              'font-semibold uppercase tracking-widest leading-none mt-1',
              sizeMap.subText,
              isWhite ? 'text-primary-100/80' : 'text-ink-soft',
            )}
          >
            Smart Queues
          </span>
        </div>
      )}
    </div>
  );
}

export function LogoIcon({ className, size = 28 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <circle cx="22" cy="22" r="16" stroke="#007C84" strokeWidth="4" strokeLinecap="round" />
      <path d="M14 30L29 15" stroke="#1CA39E" strokeWidth="3" strokeLinecap="round" />
      <path d="M14 15L29 30" stroke="#1CA39E" strokeWidth="3" strokeLinecap="round" />
      <circle cx="21.5" cy="22.5" r="2.5" fill="#DDA027" />
      <path d="M31 31L40 40" stroke="#E55B3C" strokeWidth="4.5" strokeLinecap="round" />
      <circle cx="40" cy="40" r="2.5" fill="#E55B3C" />
    </svg>
  );
}

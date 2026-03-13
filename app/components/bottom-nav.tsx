"use client"

import { Home, CalendarDays, Users, Trophy, User } from "lucide-react"
import { cn } from "@/lib/utils"

export type MainTab = 'home' | 'schedule' | 'team' | 'formation' | 'ranking' | 'profile'

interface BottomNavProps {
    activeTab: MainTab
    onTabChange: (tab: MainTab) => void
    isManagerMode?: boolean
}

const navItems: { value: MainTab; label: string; icon: typeof Home }[] = [
    { value: "schedule", label: "일정", icon: CalendarDays },
    { value: "team", label: "팀", icon: Users },
    { value: "formation", label: "포메이션", icon: Trophy }, 
    { value: "ranking", label: "랭킹", icon: Trophy },
    { value: "profile", label: "내정보", icon: User },
]

export function BottomNav({ activeTab, onTabChange, isManagerMode }: BottomNavProps) {
    const visibleNavItems = navItems.filter(item => {
        if (item.value === 'formation' && !isManagerMode) return false;
        return true;
    });

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-lg border-t border-slate-200 shadow-[0_-2px_10px_rgba(0,0,0,0.06)]">
            <div className="max-w-7xl mx-auto flex items-center justify-around h-16 px-1">
                {visibleNavItems.map((item) => {
                    const Icon = item.icon
                    const isActive = activeTab === item.value
                    return (
                        <button
                            key={item.value}
                            onClick={() => onTabChange(item.value)}
                            className={cn(
                                "flex flex-col items-center justify-center gap-0.5 w-full h-full relative transition-all duration-200",
                                "active:scale-95",
                                isActive ? "text-blue-600" : "text-slate-400 hover:text-slate-600"
                            )}
                        >
                            <Icon
                                className={cn(
                                    "h-5 w-5 transition-all duration-200",
                                    isActive && "scale-110"
                                )}
                                strokeWidth={isActive ? 2.5 : 2}
                            />
                            <span className={cn(
                                "text-[10px] font-medium transition-all duration-200",
                                isActive ? "font-semibold" : ""
                            )}>
                                {item.label}
                            </span>
                        </button>
                    )
                })}
            </div>
            {/* Safe area for iPhone etc. */}
            <div className="h-[env(safe-area-inset-bottom,0px)] bg-white/95" />
        </nav>
    )
}

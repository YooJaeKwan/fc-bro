"use client"

import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Sparkles, X } from 'lucide-react'

interface BadgeNotificationProps {
    userId: string
}

interface Badge {
    id: string
    code: string
    name: string
    description: string
    icon: string
    tier: string
    color: string
}

interface NewBadge {
    id: string
    earnedAt: string
    badge: Badge
}

export function BadgeNotification({ userId }: BadgeNotificationProps) {
    const [newBadges, setNewBadges] = useState<NewBadge[]>([])
    const [isOpen, setIsOpen] = useState(false)
    const [currentIndex, setCurrentIndex] = useState(0)

    useEffect(() => {
        if (!userId) return

        // 새 뱃지 확인
        const checkNewBadges = async () => {
            try {
                const response = await fetch(`/api/user/badges?userId=${userId}&onlyNew=true`)
                const data = await response.json()

                if (data.success && data.badges.length > 0) {
                    setNewBadges(data.badges)
                    setIsOpen(true)
                }
            } catch (error) {
                console.error('새 뱃지 확인 오류:', error)
            }
        }

        checkNewBadges()
    }, [userId])

    const handleNext = () => {
        if (currentIndex < newBadges.length - 1) {
            setCurrentIndex(currentIndex + 1)
        } else {
            handleClose()
        }
    }

    const handleClose = async () => {
        try {
            const badgeIds = newBadges.map(b => b.id)
            await fetch('/api/user/badges', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, badgeIds })
            })

            setIsOpen(false)
            setNewBadges([])
            setCurrentIndex(0)
        } catch (error) {
            console.error('뱃지 확인 처리 오류:', error)
        }
    }

    if (newBadges.length === 0) return null

    const currentBadge = newBadges[currentIndex].badge

    const getTierGradient = (tier: string) => {
        switch (tier) {
            case 'legendary':
                return 'from-yellow-500 via-amber-500 to-orange-500'
            case 'epic':
                return 'from-purple-500 via-violet-500 to-fuchsia-500'
            case 'rare':
                return 'from-blue-500 via-cyan-500 to-sky-500'
            default:
                return 'from-gray-500 via-slate-500 to-zinc-500'
        }
    }

    const getTierBg = (tier: string) => {
        switch (tier) {
            case 'legendary':
                return 'from-yellow-50 via-amber-50 to-orange-50'
            case 'epic':
                return 'from-purple-50 via-violet-50 to-fuchsia-50'
            case 'rare':
                return 'from-blue-50 via-cyan-50 to-sky-50'
            default:
                return 'from-gray-50 via-slate-50 to-zinc-50'
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="w-[85vw] max-w-sm sm:max-w-md border-0 bg-transparent shadow-none p-0 rounded-2xl mx-auto">
                <DialogTitle className="sr-only">새로운 뱃지 획득</DialogTitle>
                <div className="relative">
                    {/* Close button */}
                    <button
                        onClick={handleClose}
                        className="absolute -top-2 -right-2 z-10 p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-colors"
                    >
                        <X className="h-4 w-4 text-gray-600" />
                    </button>

                    {/* Badge card */}
                    <div className={`
            relative overflow-hidden
            bg-gradient-to-br ${getTierBg(currentBadge.tier)}
            rounded-2xl shadow-2xl
            border-2 border-white/50
          `}>
                        {/* Sparkle effect */}
                        <div className="absolute top-0 left-0 w-full h-full">
                            <div className="absolute top-4 right-4 animate-pulse">
                                <Sparkles className={`h-6 w-6 text-${currentBadge.tier === 'legendary' ? 'yellow' : 'purple'}-400`} />
                            </div>
                            <div className="absolute bottom-8 left-6 animate-pulse delay-150">
                                <Sparkles className={`h-4 w-4 text-${currentBadge.tier === 'legendary' ? 'yellow' : 'purple'}-300`} />
                            </div>
                        </div>

                        <div className="relative p-5 sm:p-8 text-center">
                            {/* Header */}
                            <div className={`
                inline-block px-4 py-1.5 rounded-full mb-4
                bg-gradient-to-r ${getTierGradient(currentBadge.tier)}
                text-white text-xs sm:text-sm font-semibold
                shadow-lg
              `}>
                                업적 달성!
                            </div>

                            {/* Badge icon */}
                            <div className="my-6">
                                <div className="text-5xl sm:text-7xl mb-4 animate-bounce">
                                    {currentBadge.icon}
                                </div>
                            </div>

                            {/* Badge name */}
                            <h2 className="text-xl sm:text-2xl font-bold mb-2" style={{ color: currentBadge.color }}>
                                {currentBadge.name}
                            </h2>

                            {/* Badge description */}
                            <p className="text-gray-600 text-xs sm:text-sm mb-6">
                                {currentBadge.description}
                            </p>

                            {/* Progress indicator */}
                            {newBadges.length > 1 && (
                                <div className="flex items-center justify-center gap-1.5 mb-6">
                                    {newBadges.map((_, idx) => (
                                        <div
                                            key={idx}
                                            className={`h-1.5 rounded-full transition-all ${idx === currentIndex
                                                ? `w-8 bg-gradient-to-r ${getTierGradient(currentBadge.tier)}`
                                                : 'w-1.5 bg-gray-300'
                                                }`}
                                        />
                                    ))}
                                </div>
                            )}

                            {/* Action button */}
                            <Button
                                onClick={handleNext}
                                className={`
                  w-full bg-gradient-to-r ${getTierGradient(currentBadge.tier)}
                  hover:opacity-90 text-white font-semibold
                  shadow-lg hover:shadow-xl transition-all
                `}
                            >
                                {currentIndex < newBadges.length - 1
                                    ? `다음 (${currentIndex + 1}/${newBadges.length})`
                                    : '확인'}
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

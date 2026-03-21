'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Award } from "lucide-react"

interface Badge {
    code: string
    name: string
    description: string
    icon: string
    color: string
}

interface BadgeNotifierProps {
    userId: string
}

export default function BadgeNotifier({ userId }: BadgeNotifierProps) {
    const [newBadges, setNewBadges] = useState<Badge[]>([])
    const [showNewBadgeDialog, setShowNewBadgeDialog] = useState(false)

    useEffect(() => {
        if (!userId) return

        const checkNewBadges = async () => {
            try {
                const response = await fetch(`/api/dashboard/stats?userId=${userId}`)
                const result = await response.json()

                if (result.success && result.data.newBadges && result.data.newBadges.length > 0) {
                    setNewBadges(result.data.newBadges)
                    setShowNewBadgeDialog(true)
                }
            } catch (error) {
                console.error("신규 뱃지 확인 중 오류:", error)
            }
        }

        checkNewBadges()
    }, [userId])

    const handleAcknowledge = async () => {
        if (!userId || newBadges.length === 0) return
        
        try {
            await fetch('/api/user/badge/acknowledge', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId })
            })
            setNewBadges([])
            setShowNewBadgeDialog(false)
        } catch (err) {
            console.error('뱃지 확인 요청 실패:', err)
            setShowNewBadgeDialog(false)
        }
    }

    if (!showNewBadgeDialog || newBadges.length === 0) return null

    return (
        <Dialog open={showNewBadgeDialog} onOpenChange={(open) => {
            if (!open) {
                handleAcknowledge()
            }
        }}>
            <DialogContent className="w-[85vw] max-w-sm sm:max-w-[400px] p-0 rounded-2xl mx-auto border-none shadow-2xl overflow-hidden bg-white z-[100]">
                <DialogHeader className="hidden">
                    <DialogTitle>새로운 업적 달성 축하</DialogTitle>
                </DialogHeader>
                
                <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 text-center text-white relative">
                    <div className="absolute top-0 left-0 w-20 h-20 bg-white/10 rounded-full -translate-x-10 -translate-y-10 blur-xl"></div>
                    <div className="absolute bottom-0 right-0 w-20 h-20 bg-white/10 rounded-full translate-x-10 translate-y-10 blur-xl"></div>
                    
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-md rounded-full mb-4 ring-4 ring-white/10 animate-bounce">
                       <Award className="h-10 w-10 text-white" />
                    </div>
                    <h2 className="text-2xl font-black mb-1">축하합니다! 🥳</h2>
                    <p className="text-blue-100 text-sm font-medium">새로운 업적을 달성했습니다!</p>
                </div>
                
                <div className="p-6">
                    <div className="space-y-4 max-h-[40vh] overflow-y-auto px-1 py-1">
                        {newBadges.map((badge, idx) => (
                            <div key={idx} className="flex items-center gap-4 p-4 rounded-xl border border-slate-100 bg-slate-50 hover:bg-white transition-all shadow-sm">
                                <div className="text-3xl shrink-0 scale-110 drop-shadow-sm">{badge.icon}</div>
                                <div className="min-w-0">
                                    <div className="font-black text-slate-800 text-sm mb-0.5" style={{ color: badge.color }}>{badge.name}</div>
                                    <div className="text-[11px] text-slate-500 font-medium leading-tight">{badge.description}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                    
                    <div className="mt-6">
                        <Button 
                            className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-white font-black rounded-xl border-none shadow-lg shadow-slate-200"
                            onClick={handleAcknowledge}
                        >
                            대단하네요!
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

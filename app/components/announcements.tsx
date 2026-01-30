'use client'

import { useState, useEffect } from 'react'
import { Bell, Plus, Edit, Trash2, X, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'

interface Announcement {
    id: string
    content: string
    createdAt: string
}

interface AnnouncementsProps {
    isManagerMode?: boolean
    currentUser?: any
}


export function Announcements({ isManagerMode = false, currentUser }: AnnouncementsProps) {
    const [announcements, setAnnouncements] = useState<any[]>([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [isOpen, setIsOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(true)

    // 관리자 모드 상태
    const [isManageDialogOpen, setIsManageDialogOpen] = useState(false)
    const [editingAnnouncement, setEditingAnnouncement] = useState<any | null>(null)
    const [content, setContent] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    // 공지사항 목록 조회
    const fetchAnnouncements = async () => {
        try {
            const userId = currentUser?.id
            const url = userId ? `/api/announcements?userId=${userId}` : '/api/announcements'
            const response = await fetch(url)
            const data = await response.json()
            if (data.success) {
                setAnnouncements(data.announcements)
                setUnreadCount(data.unreadCount || 0)
            }
        } catch (error) {
            console.error('공지사항 조회 오류:', error)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchAnnouncements()
    }, [currentUser?.id])

    // 공지 읽음 처리
    const markAsRead = async (announcementId: string) => {
        if (!currentUser?.id) return
        try {
            await fetch('/api/announcements/read', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: currentUser.id,
                    announcementId
                })
            })
        } catch (error) {
            console.error('읽음 처리 오류:', error)
        }
    }

    // 팝오버 열릴 때 모든 공지를 읽음 처리
    const handleOpenChange = async (open: boolean) => {
        setIsOpen(open)

        if (open && unreadCount > 0 && currentUser?.id) {
            // 현재 표시된 공지 중 읽지 않은 것들만 필터링
            const unreadAnnouncements = announcements.filter(a => !a.isRead)

            // 순차적으로 혹은 병렬로 읽음 처리
            await Promise.all(unreadAnnouncements.map(a => markAsRead(a.id)))

            // UI 즉시 업데이트
            setAnnouncements(prev => prev.map(a => ({ ...a, isRead: true })))
            setUnreadCount(0)
        }
    }

    // 공지사항 생성/수정
    const handleSubmit = async () => {
        if (!content.trim()) {
            alert('내용을 입력해주세요.')
            return
        }

        setIsSubmitting(true)
        try {
            const method = editingAnnouncement ? 'PUT' : 'POST'
            const body = {
                ...(editingAnnouncement && { id: editingAnnouncement.id }),
                content,
                userId: currentUser?.id,
                userRole: currentUser?.role,
            }

            const response = await fetch('/api/announcements', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            })

            const data = await response.json()
            if (data.success) {
                await fetchAnnouncements()
                setContent('')
                setEditingAnnouncement(null)
                setIsManageDialogOpen(false) // 등록/수정 성공 시 다이얼로그 닫기
            } else {
                alert(data.error || '저장에 실패했습니다.')
            }
        } catch (error) {
            console.error('공지사항 저장 오류:', error)
            alert('저장 중 오류가 발생했습니다.')
        } finally {
            setIsSubmitting(false)
        }
    }

    // 공지사항 삭제
    const handleDelete = async (id: string) => {
        if (!confirm('정말 삭제하시겠습니까?')) return

        try {
            const response = await fetch(`/api/announcements?id=${id}&userRole=${currentUser?.role}`, {
                method: 'DELETE',
            })

            const data = await response.json()
            if (data.success) {
                await fetchAnnouncements()
            } else {
                alert(data.error || '삭제에 실패했습니다.')
            }
        } catch (error) {
            console.error('공지사항 삭제 오류:', error)
            alert('삭제 중 오류가 발생했습니다.')
        }
    }

    // 수정 모드 시작
    const handleEdit = (announcement: Announcement) => {
        setEditingAnnouncement(announcement)
        setContent(announcement.content)
    }

    // 수정 취소
    const handleCancelEdit = () => {
        setEditingAnnouncement(null)
        setContent('')
    }

    return (
        <>
            <Popover open={isOpen} onOpenChange={handleOpenChange}>
                <PopoverTrigger asChild>
                    <Button variant="ghost" size="sm" className="relative">
                        <Bell className="h-5 w-5" />
                        {unreadCount > 0 && (
                            <Badge
                                className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-red-500 text-white text-xs"
                            >
                                {unreadCount}
                            </Badge>
                        )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0" align="end">
                    <div className="border-b px-4 py-3 bg-gray-50 flex justify-between items-center">
                        <h3 className="font-semibold text-sm">📢 공지사항</h3>
                        {isManagerMode && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2 text-xs"
                                onClick={() => {
                                    setIsOpen(false)
                                    setIsManageDialogOpen(true)
                                }}
                            >
                                <Plus className="h-3 w-3 mr-1" />
                                관리
                            </Button>
                        )}
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                        {isLoading ? (
                            <div className="p-4 text-center text-sm text-muted-foreground">
                                로딩 중...
                            </div>
                        ) : announcements.length === 0 ? (
                            <div className="p-4 text-center text-sm text-muted-foreground">
                                공지사항이 없습니다.
                            </div>
                        ) : (
                            announcements.map((announcement) => (
                                <div
                                    key={announcement.id}
                                    className={`p-4 border-b last:border-b-0 ${!announcement.isRead ? 'bg-blue-50' : ''
                                        }`}
                                >
                                    <div className="flex items-start justify-between gap-2 mb-1">
                                        <p className="text-sm text-gray-700 flex-1">{announcement.content}</p>
                                        {!announcement.isRead && (
                                            <Badge variant="secondary" className="text-[10px] bg-red-100 text-red-600 shrink-0">
                                                NEW
                                            </Badge>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-400">
                                        {new Date(announcement.createdAt).toLocaleDateString('ko-KR')}
                                    </p>
                                </div>
                            ))
                        )}
                    </div>
                </PopoverContent>
            </Popover>

            {/* 관리자 공지사항 관리 다이얼로그 */}
            <Dialog open={isManageDialogOpen} onOpenChange={setIsManageDialogOpen}>
                <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>공지사항 관리</DialogTitle>
                        <DialogDescription>
                            공지사항을 추가, 수정, 삭제할 수 있습니다.
                        </DialogDescription>
                    </DialogHeader>

                    {/* 공지사항 입력 폼 */}
                    <div className="space-y-4 py-4 border-b">
                        <Textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="공지사항 내용을 입력하세요"
                            rows={3}
                        />
                        <div className="flex gap-2">
                            {editingAnnouncement && (
                                <Button variant="outline" onClick={handleCancelEdit} className="flex-1">
                                    <X className="h-4 w-4 mr-1" />
                                    취소
                                </Button>
                            )}
                            <Button
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                                className="flex-1"
                            >
                                <Save className="h-4 w-4 mr-1" />
                                {isSubmitting ? '저장 중...' : editingAnnouncement ? '수정' : '등록'}
                            </Button>
                        </div>
                    </div>

                    {/* 공지사항 목록 */}
                    <div className="space-y-2 pt-2">
                        <h4 className="font-medium text-sm text-gray-700">등록된 공지사항</h4>
                        {announcements.length === 0 ? (
                            <p className="text-sm text-muted-foreground">등록된 공지사항이 없습니다.</p>
                        ) : (
                            <div className="space-y-2 max-h-60 overflow-y-auto">
                                {announcements.map((a) => (
                                    <div key={a.id} className="p-3 bg-gray-50 rounded-lg">
                                        <div className="flex justify-between items-start gap-2">
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm text-gray-700 line-clamp-2">{a.content}</p>
                                                <p className="text-xs text-gray-400 mt-1">
                                                    {new Date(a.createdAt).toLocaleDateString('ko-KR')}
                                                </p>
                                            </div>
                                            <div className="flex gap-1 shrink-0">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-7 w-7 p-0"
                                                    onClick={() => handleEdit(a)}
                                                >
                                                    <Edit className="h-3 w-3" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                    onClick={() => handleDelete(a.id)}
                                                >
                                                    <Trash2 className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}

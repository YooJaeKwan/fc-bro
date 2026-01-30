'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { MessageCircle, Send, Trash2, Loader2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'

interface Comment {
    id: string
    content: string
    createdAt: string
    author: {
        id: string
        nickname: string | null
        realName: string | null
        image: string | null
    }
}

interface ScheduleCommentsProps {
    scheduleId: string
    currentUserId: string
    isManagerMode?: boolean
}

export function ScheduleComments({
    scheduleId,
    currentUserId,
    isManagerMode = false
}: ScheduleCommentsProps) {
    const [comments, setComments] = useState<Comment[]>([])
    const [newComment, setNewComment] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isExpanded, setIsExpanded] = useState(false)
    const [deletingId, setDeletingId] = useState<string | null>(null)
    const scrollRef = useRef<HTMLDivElement>(null)

    // 댓글 목록 조회
    const fetchComments = async () => {
        try {
            setIsLoading(true)
            const res = await fetch(`/api/schedule/comments?scheduleId=${scheduleId}`)
            if (res.ok) {
                const data = await res.json()
                setComments(data.comments || [])
            }
        } catch (error) {
            console.error('Failed to fetch comments:', error)
        } finally {
            setIsLoading(false)
        }
    }

    // 컴포넌트 마운트 시 댓글 개수 로드 (초기 표시용)
    useEffect(() => {
        fetchComments()
    }, [scheduleId])

    // 확장 시 댓글 로드 (아직 로드되지 않은 경우에만)
    useEffect(() => {
        if (isExpanded && comments.length === 0 && !isLoading) {
            fetchComments()
        }
    }, [isExpanded])

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [isExpanded, comments])

    // 댓글 작성
    const handleSubmit = async () => {
        if (!newComment.trim() || isSubmitting) return

        try {
            setIsSubmitting(true)
            const res = await fetch('/api/schedule/comments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ scheduleId, content: newComment, userId: currentUserId }),
            })

            if (res.ok) {
                const data = await res.json()
                setComments(prev => [...prev, data.comment])
                setNewComment('')
            }
        } catch (error) {
            console.error('Failed to submit comment:', error)
        } finally {
            setIsSubmitting(false)
        }
    }

    // 댓글 삭제
    const handleDelete = async (commentId: string) => {
        if (deletingId) return

        try {
            setDeletingId(commentId)
            const res = await fetch(`/api/schedule/comments/${commentId}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: currentUserId }),
            })

            if (res.ok) {
                setComments(prev => prev.filter(c => c.id !== commentId))
            }
        } catch (error) {
            console.error('Failed to delete comment:', error)
        } finally {
            setDeletingId(null)
        }
    }

    // 작성자명 표시
    const getAuthorName = (author: Comment['author']) => {
        return author.nickname || author.realName || '익명'
    }

    return (
        <div className="mt-3">
            {/* 댓글 토글 버튼 */}
            <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
            >
                <MessageCircle className="h-4 w-4" />
                <span>댓글 {comments.length > 0 ? `(${comments.length})` : ''}</span>
            </Button>

            {/* 확장된 댓글 섹션 */}
            {isExpanded && (
                <div className="mt-3 space-y-3 border-t pt-3">
                    {/* 댓글 목록 */}
                    {isLoading ? (
                        <div className="flex justify-center py-4">
                            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                        </div>
                    ) : comments.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-2">
                            아직 댓글이 없습니다. 첫 번째 댓글을 남겨보세요!
                        </p>
                    ) : (
                        <div ref={scrollRef} className="space-y-3 max-h-64 overflow-y-auto">
                            {comments.map((comment) => (
                                <div key={comment.id} className="flex gap-2 group">
                                    <Avatar className="h-7 w-7 flex-shrink-0">
                                        <AvatarImage src={comment.author.image || undefined} />
                                        <AvatarFallback className="text-xs">
                                            {getAuthorName(comment.author).charAt(0)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium">
                                                {getAuthorName(comment.author)}
                                            </span>
                                            <span className="text-xs text-muted-foreground">
                                                {formatDistanceToNow(new Date(comment.createdAt), {
                                                    addSuffix: true,
                                                    locale: ko,
                                                })}
                                            </span>
                                            {/* 삭제 버튼 (본인 또는 총무) */}
                                            {(comment.author.id === currentUserId || isManagerMode) && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    onClick={() => handleDelete(comment.id)}
                                                    disabled={deletingId === comment.id}
                                                >
                                                    {deletingId === comment.id ? (
                                                        <Loader2 className="h-3 w-3 animate-spin" />
                                                    ) : (
                                                        <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                                                    )}
                                                </Button>
                                            )}
                                        </div>
                                        <p className="text-sm whitespace-pre-wrap break-words">
                                            {comment.content}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* 댓글 입력 */}
                    <div className="flex gap-2 items-end">
                        <Textarea
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="예: 9시반까지 참석 가능합니다"
                            className="min-h-[60px] text-sm resize-none"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault()
                                    handleSubmit()
                                }
                            }}
                        />
                        <Button
                            size="icon"
                            onClick={handleSubmit}
                            disabled={!newComment.trim() || isSubmitting}
                            className="flex-shrink-0"
                        >
                            {isSubmitting ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Send className="h-4 w-4" />
                            )}
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )
}

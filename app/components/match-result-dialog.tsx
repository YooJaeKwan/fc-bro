import { useState, useEffect, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Minus, Plus, Upload, X, Image as ImageIcon } from "lucide-react"
import { supabase } from "@/lib/supabase"
import Image from "next/image"

interface MatchResultDialogProps {
    isOpen: boolean
    onClose: () => void
    schedule: any
    onSuccess: () => void
}

export function MatchResultDialog({ isOpen, onClose, schedule, onSuccess }: MatchResultDialogProps) {
    const [ourScore, setOurScore] = useState(0)
    const [opponentScore, setOpponentScore] = useState(0)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [selectedImage, setSelectedImage] = useState<File | null>(null)
    const [imagePreview, setImagePreview] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    // 일정이 변경되거나 다이얼로그가 열릴 때 초기값 설정
    useEffect(() => {
        if (isOpen && schedule) {
            // 결과가 이미 입력된 경우 기존 값 표시, 없으면 0
            setOurScore(schedule.ourScore !== null && schedule.ourScore !== undefined ? Number(schedule.ourScore) : 0)
            setOpponentScore(schedule.opponentScore !== null && schedule.opponentScore !== undefined ? Number(schedule.opponentScore) : 0)

            // 기존 이미지가 있다면 미리보기 설정 (여기서는 새로 업로드하는 것만 다룸, 기존 이미지 삭제/수정은 추후 고려)
            if (schedule.matchPhotoUrl) {
                setImagePreview(schedule.matchPhotoUrl)
            }
        } else if (!isOpen) {
            // 다이얼로그가 닫힐 때 초기화
            resetForm()
        }
    }, [isOpen, schedule?.id]) // isOpen과 schedule.id가 변경될 때마다 실행

    // 폼 초기화 함수
    const resetForm = () => {
        setOurScore(0)
        setOpponentScore(0)
        setSelectedImage(null)
        setImagePreview(null)
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }

    // 다이얼로그 닫기 핸들러
    const handleClose = () => {
        resetForm()
        onClose()
    }

    // 점수 증가/감소 핸들러
    const incrementOurScore = () => setOurScore(prev => Math.min(prev + 1, 99))
    const decrementOurScore = () => setOurScore(prev => Math.max(prev - 1, 0))
    const incrementOpponentScore = () => setOpponentScore(prev => Math.min(prev + 1, 99))
    const decrementOpponentScore = () => setOpponentScore(prev => Math.max(prev - 1, 0))

    // 이미지 선택 핸들러
    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            if (file.size > 5 * 1024 * 1024) { // 5MB 제한
                alert("이미지 크기는 5MB 이하여야 합니다.")
                return
            }
            setSelectedImage(file)
            const reader = new FileReader()
            reader.onloadend = () => {
                setImagePreview(reader.result as string)
            }
            reader.readAsDataURL(file)
        }
    }

    const handleSubmit = async () => {
        try {
            setIsSubmitting(true)

            let matchPhotoUrl = schedule.matchPhotoUrl // 기본값은 기존 URL

            // 이미지가 선택되었다면 업로드 수행
            if (selectedImage) {
                const fileExt = selectedImage.name.split('.').pop()
                const fileName = `${schedule.id}_${Date.now()}.${fileExt}`
                const filePath = `${fileName}`

                const { error: uploadError } = await supabase.storage
                    .from('match-photos')
                    .upload(filePath, selectedImage)

                if (uploadError) {
                    throw new Error(`이미지 업로드 실패: ${uploadError.message}`)
                }

                const { data: { publicUrl } } = supabase.storage
                    .from('match-photos')
                    .getPublicUrl(filePath)

                matchPhotoUrl = publicUrl
            }

            const response = await fetch("/api/schedule/result", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    scheduleId: schedule.id,
                    ourScore: ourScore,
                    opponentScore: opponentScore,
                    matchPhotoUrl: matchPhotoUrl
                }),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || "결과 저장에 실패했습니다.")
            }

            console.log('경기 결과 저장 성공:', data)
            resetForm()
            onSuccess()
            onClose()
        } catch (error: any) {
            console.error("결과 저장 오류:", error)
            alert(error.message || "결과 저장 중 오류가 발생했습니다.")
        } finally {
            setIsSubmitting(false)
        }
    }

    if (!schedule) return null

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>경기 결과 입력</DialogTitle>
                    <DialogDescription>
                        {schedule.title} ({schedule.date} {schedule.time})
                        <br />
                        경기 결과를 입력해주세요.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-6">
                    {schedule.type === 'training' ? (
                        <div className="text-center py-4 text-muted-foreground">
                            연습 경기는 별도의 점수를 기록하지 않습니다.<br />
                            특이사항이 있다면 아래 코멘트에 남겨주세요.
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* 스코어보드 스타일 */}
                            <div className="bg-slate-900 rounded-xl p-6 text-white shadow-lg">
                                <div className="flex items-center justify-between gap-6">
                                    {/* 우리팀/노랑팀 */}
                                    <div className="flex-1 space-y-3">
                                        <div className="text-center">
                                            <div className={`text-xs font-bold mb-2 px-3 py-1 rounded-full inline-block ${schedule.type === 'internal'
                                                ? 'bg-yellow-400/20 text-yellow-200'
                                                : 'bg-sky-400/20 text-sky-200'
                                                }`}>
                                                {schedule.type === 'internal' ? 'YELLOW' : 'HOME'}
                                            </div>
                                            <div className={`text-6xl font-bold font-mono tracking-wider ${schedule.type === 'internal' ? 'text-yellow-400' : 'text-sky-400'
                                                }`}>
                                                {ourScore}
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                type="button"
                                                onClick={decrementOurScore}
                                                variant="secondary"
                                                size="sm"
                                                className="flex-1 h-10 bg-slate-700 hover:bg-slate-600 text-white"
                                                disabled={ourScore === 0}
                                            >
                                                <Minus className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                type="button"
                                                onClick={incrementOurScore}
                                                variant="secondary"
                                                size="sm"
                                                className="flex-1 h-10 bg-slate-700 hover:bg-slate-600 text-white"
                                                disabled={ourScore === 99}
                                            >
                                                <Plus className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>

                                    {/* VS */}
                                    <div className="flex flex-col items-center">
                                        <span className="text-slate-500 text-sm font-bold">VS</span>
                                        <div className="h-12 w-px bg-slate-700/50 my-2"></div>
                                    </div>

                                    {/* 상대팀/파랑팀 */}
                                    <div className="flex-1 space-y-3">
                                        <div className="text-center">
                                            <div className={`text-xs font-bold mb-2 px-3 py-1 rounded-full inline-block ${schedule.type === 'internal'
                                                ? 'bg-blue-400/20 text-blue-200'
                                                : 'bg-rose-400/20 text-rose-200'
                                                }`}>
                                                {schedule.type === 'internal' ? 'BLUE' : 'AWAY'}
                                            </div>
                                            <div className={`text-6xl font-bold font-mono tracking-wider ${schedule.type === 'internal' ? 'text-blue-400' : 'text-rose-400'
                                                }`}>
                                                {opponentScore}
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                type="button"
                                                onClick={decrementOpponentScore}
                                                variant="secondary"
                                                size="sm"
                                                className="flex-1 h-10 bg-slate-700 hover:bg-slate-600 text-white"
                                                disabled={opponentScore === 0}
                                            >
                                                <Minus className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                type="button"
                                                onClick={incrementOpponentScore}
                                                variant="secondary"
                                                size="sm"
                                                className="flex-1 h-10 bg-slate-700 hover:bg-slate-600 text-white"
                                                disabled={opponentScore === 99}
                                            >
                                                <Plus className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <p className="text-xs text-center text-muted-foreground">
                                +/- 버튼을 눌러 점수를 조정하세요
                            </p>
                        </div>
                    )}

                    {/* 이미지 업로드 섹션 */}
                    <div className="mt-6 space-y-3">
                        <div className="text-sm font-medium flex items-center gap-2">
                            <ImageIcon className="h-4 w-4" />
                            경기 사진 (선택)
                        </div>

                        <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg p-4 flex flex-col items-center justify-center gap-3">
                            {imagePreview ? (
                                <div className="relative w-full aspect-video rounded-md overflow-hidden bg-gray-100">
                                    <Image
                                        src={imagePreview}
                                        alt="경기 사진 미리보기"
                                        fill
                                        className="object-cover"
                                    />
                                    <Button
                                        type="button"
                                        variant="destructive"
                                        size="icon"
                                        className="absolute top-2 right-2 h-6 w-6"
                                        onClick={() => {
                                            setSelectedImage(null)
                                            setImagePreview(null)
                                            if (fileInputRef.current) fileInputRef.current.value = ''
                                        }}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            ) : (
                                <div className="text-center">
                                    <div className="mt-2 text-xs text-gray-500">
                                        기념 사진을 업로드하세요
                                    </div>
                                </div>
                            )}

                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleImageSelect}
                            />

                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <Upload className="h-4 w-4 mr-2" />
                                {imagePreview ? "사진 변경" : "사진 선택"}
                            </Button>
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
                        취소
                    </Button>
                    <Button onClick={handleSubmit} disabled={isSubmitting}>
                        {isSubmitting ? "저장 중..." : "저장"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

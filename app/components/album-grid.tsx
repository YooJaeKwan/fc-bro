"use client"

import Image from "next/image"
import { CalendarIcon, MapPin, Trophy } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface AlbumGridProps {
    schedules: any[]
}

export function AlbumGrid({ schedules }: AlbumGridProps) {
    if (schedules.length === 0) {
        return (
            <div className="text-center py-20 text-gray-500">
                <div className="text-4xl mb-4">📷</div>
                <h3 className="text-lg font-semibold mb-2">아직 앨범이 비어있어요</h3>
                <p>경기 결과를 입력할 때 사진을 등록해보세요!</p>
            </div>
        )
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {schedules.map((schedule) => (
                <div key={schedule.id} className="group relative bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow cursor-pointer">
                    {/* 이미지 영역 */}
                    <div className="relative aspect-[4/3]">
                        <Image
                            src={schedule.matchPhotoUrl}
                            alt={`${schedule.date} 경기 사진`}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        {/* 오버레이 정보 (호버 시 표시) */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4 text-white">
                            <div className="font-bold text-lg mb-1">{schedule.location}</div>
                            {schedule.matchSummary && (
                                <p className="text-sm line-clamp-2 text-gray-200">
                                    "{schedule.matchSummary}"
                                </p>
                            )}
                        </div>

                        {/* 날짜 배지 */}
                        <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-black px-2 py-1 rounded-md text-xs font-bold shadow-sm flex items-center gap-1">
                            <CalendarIcon className="h-3 w-3" />
                            {schedule.date}
                        </div>

                        {/* 결과 배지 */}
                        {schedule.ourScore !== null && schedule.opponentScore !== null && (
                            <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-bold shadow-sm border border-white/20">
                                {schedule.ourScore} : {schedule.opponentScore}
                            </div>
                        )}
                    </div>

                    {/* 하단 정보 (항상 표시하지만 호버 시 숨김 처리할 수도 있음, 여기선 항상 표시) */}
                    <div className="p-4">
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                    {schedule.type === 'internal' ? '자체경기' : schedule.type === 'match' ? `A매치${schedule.opponentTeam ? ` vs ${schedule.opponentTeam}` : ''}` : '훈련'}
                                    <Badge variant="outline" className="text-[10px] h-5 font-normal">
                                        {schedule.startTime}
                                    </Badge>
                                </h3>
                                <div className="flex items-center text-xs text-gray-500 mt-1">
                                    <MapPin className="h-3 w-3 mr-1" />
                                    {schedule.location}
                                </div>
                            </div>

                            {schedule.mvpUser && (
                                <div className="flex flex-col items-end">
                                    <div className="flex items-center gap-1 text-xs font-semibold text-yellow-600 bg-yellow-50 px-2 py-1 rounded-full border border-yellow-100">
                                        <Trophy className="h-3 w-3" />
                                        MOM: {schedule.mvpUser.realName || schedule.mvpUser.nickname}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    )
}

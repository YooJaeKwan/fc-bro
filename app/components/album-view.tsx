"use client"

import { useState, useEffect } from "react"
import { AlbumGrid } from "./album-grid"

export function AlbumView() {
    const [schedules, setSchedules] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState("")

    useEffect(() => {
        fetchAlbum()
    }, [])

    const fetchAlbum = async () => {
        try {
            setIsLoading(true)
            const response = await fetch('/api/album/list')
            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || '앨범을 불러오는데 실패했습니다.')
            }

            setSchedules(data.schedules)
        } catch (err: any) {
            setError(err.message)
        } finally {
            setIsLoading(false)
        }
    }

    if (isLoading) {
        return (
            <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="text-center py-10 text-red-500">
                {error}
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <AlbumGrid schedules={schedules} />
        </div>
    )
}

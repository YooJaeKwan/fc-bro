"use client"

import { Suspense } from "react"
import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"

function KakaoCallbackContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
    const [errorMessage, setErrorMessage] = useState('')

    useEffect(() => {
        const code = searchParams.get('code')
        const error = searchParams.get('error')

        if (error) {
            console.error('카카오 로그인 오류:', error)
            setStatus('error')
            setErrorMessage('카카오 로그인이 취소되었거나 오류가 발생했습니다.')
            setTimeout(() => router.push('/'), 2000)
            return
        }

        if (!code) {
            setStatus('error')
            setErrorMessage('인가 코드가 없습니다.')
            setTimeout(() => router.push('/'), 2000)
            return
        }

        // 인가 코드로 토큰 교환
        const exchangeToken = async () => {
            try {
                const response = await fetch('/api/auth/kakao/token', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ code }),
                })

                const data = await response.json()

                if (!response.ok || data.error) {
                    throw new Error(data.error || '토큰 교환 실패')
                }

                console.log('카카오 로그인 성공:', data.userInfo)

                // 사용자 정보를 sessionStorage에 저장하고 메인 페이지로 리다이렉트
                sessionStorage.setItem('kakao_user_info', JSON.stringify(data.userInfo))
                sessionStorage.setItem('kakao_login_pending', 'true')

                setStatus('success')
                router.push('/')
            } catch (error) {
                console.error('토큰 교환 오류:', error)
                setStatus('error')
                setErrorMessage(error instanceof Error ? error.message : '로그인 처리 중 오류가 발생했습니다.')
                setTimeout(() => router.push('/'), 2000)
            }
        }

        exchangeToken()
    }, [searchParams, router])

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="bg-white p-8 rounded-lg shadow-md text-center">
                {status === 'loading' && (
                    <>
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto mb-4"></div>
                        <p className="text-gray-600">카카오 로그인 처리 중...</p>
                    </>
                )}
                {status === 'success' && (
                    <>
                        <div className="text-green-500 text-4xl mb-4">✓</div>
                        <p className="text-gray-600">로그인 성공! 잠시 후 이동합니다...</p>
                    </>
                )}
                {status === 'error' && (
                    <>
                        <div className="text-red-500 text-4xl mb-4">✕</div>
                        <p className="text-red-600">{errorMessage}</p>
                        <p className="text-gray-500 text-sm mt-2">잠시 후 메인 페이지로 이동합니다...</p>
                    </>
                )}
            </div>
        </div>
    )
}

function LoadingFallback() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="bg-white p-8 rounded-lg shadow-md text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto mb-4"></div>
                <p className="text-gray-600">로딩 중...</p>
            </div>
        </div>
    )
}

export default function KakaoCallbackPage() {
    return (
        <Suspense fallback={<LoadingFallback />}>
            <KakaoCallbackContent />
        </Suspense>
    )
}

"use client"

import { useEffect, useState, useCallback } from "react"

// Redirect URI - 환경변수에서 가져오거나 기본값 사용
const getRedirectUri = () => {
  if (typeof window !== 'undefined') {
    return process.env.NEXT_PUBLIC_KAKAO_REDIRECT_URI || `${window.location.origin}/auth/kakao/callback`
  }
  return process.env.NEXT_PUBLIC_KAKAO_REDIRECT_URI || 'http://localhost:3000/auth/kakao/callback'
}

// 카카오 SDK v2 타입 정의
declare global {
  interface Window {
    Kakao: {
      init: (appKey: string) => void
      isInitialized: () => boolean
      Auth: {
        authorize: (options: {
          redirectUri: string
          scope?: string
          prompt?: string
          loginHint?: string
          nonce?: string
          state?: string
        }) => void
        setAccessToken: (token: string) => void
        getAccessToken: () => string | null
        logout: (callback?: () => void) => void
      }
      API: {
        request: (options: {
          url: string
          success: (response: any) => void
          fail: (error: any) => void
        }) => void
      }
    }
  }
}

interface KakaoLoginHookProps {
  onSuccess: (userInfo: any) => void
  onError: (error: string) => void
}

export function useKakaoLogin({ onSuccess, onError }: KakaoLoginHookProps) {
  const [isKakaoReady, setIsKakaoReady] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // 이미 초기화되어 있는지 확인
    if (window.Kakao && window.Kakao.isInitialized()) {
      setIsKakaoReady(true)
      setIsLoading(false)
      return
    }

    // 카카오 SDK v2 스크립트 로드
    const script = document.createElement('script')
    script.src = 'https://t1.kakaocdn.net/kakao_js_sdk/2.7.4/kakao.min.js'
    script.async = true

    script.onload = () => {
      console.log('카카오 SDK v2 스크립트 로드 완료')

      setTimeout(() => {
        if (window.Kakao) {
          const javascriptKey = process.env.NEXT_PUBLIC_KAKAO_JS_KEY
          console.log('JavaScript 키:', javascriptKey ? '설정됨' : '없음')

          if (javascriptKey) {
            try {
              if (!window.Kakao.isInitialized()) {
                window.Kakao.init(javascriptKey)
                console.log('카카오 SDK v2 초기화 완료')
              }

              setIsKakaoReady(true)
              setIsLoading(false)
              console.log('카카오 SDK v2 준비 완료')
            } catch (error) {
              console.error('카카오 SDK 초기화 오류:', error)
              onError('카카오 SDK 초기화에 실패했습니다.')
              setIsLoading(false)
            }
          } else {
            onError('카카오 JavaScript 키가 설정되지 않았습니다.')
            setIsLoading(false)
          }
        } else {
          console.error('window.Kakao 객체가 없음')
          onError('카카오 SDK 객체를 찾을 수 없습니다.')
          setIsLoading(false)
        }
      }, 100)
    }

    script.onerror = () => {
      console.error('카카오 SDK 로드 실패')
      onError('카카오 SDK 로드에 실패했습니다.')
      setIsLoading(false)
    }

    document.head.appendChild(script)

    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script)
      }
    }
  }, [onError])

  const loginWithKakao = useCallback(() => {
    console.log('loginWithKakao 호출됨, isKakaoReady:', isKakaoReady)

    if (!isKakaoReady) {
      onError('카카오 SDK가 아직 준비되지 않았습니다. 잠시 후 다시 시도해주세요.')
      return
    }

    if (!window.Kakao || !window.Kakao.Auth) {
      onError('카카오 인증 서비스를 사용할 수 없습니다.')
      return
    }

    console.log('카카오 로그인 시작 (SDK v2)...')

    try {
      const redirectUri = getRedirectUri()
      console.log('Redirect URI:', redirectUri)

      // SDK v2에서는 authorize로 리다이렉트 방식 사용
      window.Kakao.Auth.authorize({
        redirectUri: redirectUri,
      })
    } catch (error) {
      console.error('카카오 로그인 중 예외 발생:', error)
      onError('카카오 로그인 중 오류가 발생했습니다.')
    }
  }, [isKakaoReady, onError])

  const logoutFromKakao = useCallback(() => {
    if (window.Kakao && window.Kakao.Auth && typeof window.Kakao.Auth.logout === 'function') {
      window.Kakao.Auth.logout(() => {
        console.log('카카오 로그아웃 완료')
      })
    }
  }, [])

  return {
    loginWithKakao,
    logoutFromKakao,
    isKakaoReady,
    isLoading
  }
}

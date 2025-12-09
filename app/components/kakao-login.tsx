"use client"

import { useEffect, useState } from "react"

// 카카오 SDK 타입 정의
declare global {
  interface Window {
    Kakao: {
      init: (appKey: string) => void
      isInitialized: () => boolean
      Auth: {
        login: (options: {
          success: (authObj: any) => void
          fail: (error: any) => void
          scope?: string
          throughTalk?: boolean
        }) => void
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
    // 이미 로드되어 있는지 확인
    if (window.Kakao && window.Kakao.isInitialized()) {
      setIsKakaoReady(true)
      setIsLoading(false)
      return
    }

    // 카카오 SDK 스크립트 로드 (최신 CDN 사용)
    const script = document.createElement('script')
    script.src = 'https://developers.kakao.com/sdk/js/kakao.js'
    script.async = true
    
    script.onload = () => {
      console.log('카카오 SDK 스크립트 로드 완료')
      
      // 약간의 지연을 두어 SDK가 완전히 준비될 때까지 기다림
      setTimeout(() => {
        if (window.Kakao) {
          const javascriptKey = process.env.NEXT_PUBLIC_KAKAO_JS_KEY
          console.log('JavaScript 키:', javascriptKey ? '설정됨' : '없음')
          
          if (javascriptKey) {
            try {
              if (!window.Kakao.isInitialized()) {
                window.Kakao.init(javascriptKey)
                console.log('카카오 SDK 초기화 완료')
              }
              
              // SDK의 Auth 객체가 있는지 확인
              if (window.Kakao.Auth && typeof window.Kakao.Auth.login === 'function') {
                setIsKakaoReady(true)
                setIsLoading(false)
                console.log('카카오 Auth API 준비 완료')
              } else {
                console.error('카카오 Auth API가 준비되지 않음')
                onError('카카오 인증 API가 준비되지 않았습니다.')
                setIsLoading(false)
              }
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
      }, 100) // 100ms 지연
    }

    script.onerror = () => {
      console.error('카카오 SDK 로드 실패')
      onError('카카오 SDK 로드에 실패했습니다.')
      setIsLoading(false)
    }

    document.head.appendChild(script)

    return () => {
      // 컴포넌트 언마운트 시 스크립트 제거
      if (document.head.contains(script)) {
        document.head.removeChild(script)
      }
    }
  }, [onError])

  const loginWithKakao = () => {
    console.log('loginWithKakao 호출됨, isKakaoReady:', isKakaoReady)
    
    if (!isKakaoReady) {
      onError('카카오 SDK가 아직 준비되지 않았습니다. 잠시 후 다시 시도해주세요.')
      return
    }

    if (!window.Kakao || !window.Kakao.Auth) {
      onError('카카오 인증 서비스를 사용할 수 없습니다.')
      return
    }

    if (typeof window.Kakao.Auth.login !== 'function') {
      onError('카카오 로그인 함수를 찾을 수 없습니다.')
      return
    }

    console.log('카카오 로그인 시작...')
    
    try {
      window.Kakao.Auth.login({
        success: (authObj: any) => {
          console.log('카카오 로그인 성공:', authObj)
          
          // authObj에 error가 있는지 확인 (카카오가 200으로 에러를 반환하는 경우 대응)
          if (authObj && authObj.error) {
            console.error('인증 코드 획득 실패:', authObj)
            let errorMessage = '로그인에 실패했습니다.'
            
            if (authObj.error === 'not_found_auth_code') {
              errorMessage = '인증 코드를 받지 못했습니다. 로그인이 취소되었거나 권한이 거부되었습니다.'
            } else if (authObj.error_description) {
              errorMessage = `로그인 오류: ${authObj.error_description}`
            }
            
            onError(errorMessage)
            return
          }
          
          // 사용자 정보 요청
          window.Kakao.API.request({
            url: '/v2/user/me',
            success: (userInfo: any) => {
              console.log('사용자 정보 획득 성공:', userInfo)
              onSuccess(userInfo)
            },
            fail: (error: any) => {
              console.error('사용자 정보 요청 실패:', error)
              
              // 사용자 정보 요청 실패 시에도 로그인은 성공으로 처리
              console.log('기본 사용자 정보로 로그인 진행')
              onSuccess({
                id: Date.now(), // 임시 ID
                properties: {
                  nickname: '카카오 사용자',
                  profile_image: null
                }
              })
            }
          })
        },
        fail: (error: any) => {
          console.error('카카오 로그인 실패:', error)
          
          // 구체적인 오류 메시지 제공
          let errorMessage = '카카오 로그인에 실패했습니다.'
          
          if (error.error === 'invalid_scope') {
            errorMessage = '카카오 로그인 권한 설정에 문제가 있습니다.'
          } else if (error.error === 'access_denied') {
            errorMessage = '로그인이 취소되었습니다.'
          } else if (error.error === 'not_found_auth_code') {
            errorMessage = '인증 코드를 받지 못했습니다. 로그인이 취소되었거나 권한이 거부되었습니다.'
          } else if (error.error_description) {
            errorMessage = `로그인 오류: ${error.error_description}`
          }
          
          onError(errorMessage)
        },
        // 카카오톡 앱 사용 안 함 - 웹 브라우저만 사용 (Windows 환경 대응)
        throughTalk: false,
        // scope를 제거하여 기본 권한만 요청 (닉네임, 프로필사진 등)
        // 필요시 카카오 개발자 콘솔에서 동의항목 설정 후 추가
        // scope: 'profile_nickname,profile_image'
      })
    } catch (error) {
      console.error('카카오 로그인 중 예외 발생:', error)
      onError('카카오 로그인 중 오류가 발생했습니다.')
    }
  }

  const logoutFromKakao = () => {
    if (window.Kakao && window.Kakao.Auth && typeof window.Kakao.Auth.logout === 'function') {
      window.Kakao.Auth.logout(() => {
        console.log('카카오 로그아웃 완료')
      })
    }
  }

  return {
    loginWithKakao,
    logoutFromKakao,
    isKakaoReady,
    isLoading
  }
}

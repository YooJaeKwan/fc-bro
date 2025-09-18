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
          persistAccessToken?: boolean
          persistRefreshToken?: boolean
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
    script.src = 'https://t1.kakaocdn.net/kakao_js_sdk/2.7.2/kakao.min.js'
    script.integrity = 'sha384-TiCUE00h649CAMonG018J2ujOgDKW/kVWlChEuu4jK2vxfAAD0eZxzCKakxg55G4'
    script.crossOrigin = 'anonymous'
    script.async = true
    
    script.onload = () => {
      console.log('카카오 SDK 스크립트 로드 완료')
      
      // SDK가 완전히 로드될 때까지 충분한 시간 대기
      setTimeout(() => {
        if (window.Kakao) {
          const javascriptKey = process.env.NEXT_PUBLIC_KAKAO_JS_KEY || process.env.NEXT_PUBLIC_KAKAO_APP_KEY
          console.log('JavaScript 키:', javascriptKey ? '설정됨' : '없음')
          console.log('환경 변수 확인:', {
            NEXT_PUBLIC_KAKAO_JS_KEY: process.env.NEXT_PUBLIC_KAKAO_JS_KEY ? '설정됨' : '없음',
            NEXT_PUBLIC_KAKAO_APP_KEY: process.env.NEXT_PUBLIC_KAKAO_APP_KEY ? '설정됨' : '없음'
          })
          
          if (javascriptKey) {
            try {
              if (!window.Kakao.isInitialized()) {
                window.Kakao.init(javascriptKey)
                console.log('카카오 SDK 초기화 완료')
              }
              
              // Auth API가 준비될 때까지 재시도 로직 추가
              const checkAuthAPI = (retryCount = 0) => {
                console.log(`Auth API 확인 시도 ${retryCount + 1}/5`)
                
                if (window.Kakao.Auth && typeof window.Kakao.Auth.login === 'function') {
                  setIsKakaoReady(true)
                  setIsLoading(false)
                  console.log('카카오 Auth API 준비 완료')
                } else if (retryCount < 4) {
                  // 최대 5번까지 200ms 간격으로 재시도
                  setTimeout(() => checkAuthAPI(retryCount + 1), 200)
                } else {
                  console.error('카카오 Auth API가 준비되지 않음 (최대 재시도 횟수 초과)')
                  console.log('현재 Kakao 객체 상태:', {
                    Kakao: !!window.Kakao,
                    Auth: !!window.Kakao.Auth,
                    login: window.Kakao.Auth ? typeof window.Kakao.Auth.login : 'undefined'
                  })
                  onError('카카오 인증 API가 준비되지 않았습니다. 페이지를 새로고침해주세요.')
                  setIsLoading(false)
                }
              }
              
              // Auth API 확인 시작
              checkAuthAPI()
              
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
      }, 300) // 300ms로 증가
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

  // 모바일 기기 감지 함수
  const isMobile = () => {
    if (typeof window === 'undefined') return false
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  }

  // 모바일 브라우저별 감지 함수
  const getMobileBrowser = () => {
    if (typeof window === 'undefined') return 'unknown'
    const userAgent = navigator.userAgent
    
    if (userAgent.includes('Instagram')) return 'instagram'
    if (userAgent.includes('KAKAOTALK')) return 'kakaotalk'
    if (userAgent.includes('Chrome')) return 'chrome'
    if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) return 'safari'
    if (userAgent.includes('Firefox')) return 'firefox'
    
    return 'unknown'
  }

  const loginWithKakao = () => {
    console.log('loginWithKakao 호출됨, isKakaoReady:', isKakaoReady)
    
    if (!isKakaoReady) {
      onError('카카오 SDK가 아직 준비되지 않았습니다. 잠시 후 다시 시도해주세요.')
      return
    }

    // 더 상세한 디버깅 정보 출력
    console.log('현재 Kakao 객체 상태:', {
      Kakao: !!window.Kakao,
      isInitialized: window.Kakao ? window.Kakao.isInitialized() : false,
      Auth: window.Kakao ? !!window.Kakao.Auth : false,
      login: window.Kakao && window.Kakao.Auth ? typeof window.Kakao.Auth.login : 'undefined'
    })

    if (!window.Kakao) {
      onError('카카오 SDK가 로드되지 않았습니다. 페이지를 새로고침해주세요.')
      return
    }

    if (!window.Kakao.isInitialized()) {
      onError('카카오 SDK가 초기화되지 않았습니다. 페이지를 새로고침해주세요.')
      return
    }

    if (!window.Kakao.Auth) {
      onError('카카오 인증 서비스를 사용할 수 없습니다. 페이지를 새로고침해주세요.')
      return
    }

    if (typeof window.Kakao.Auth.login !== 'function') {
      onError('카카오 로그인 함수를 찾을 수 없습니다. 페이지를 새로고침해주세요.')
      return
    }

    console.log('카카오 로그인 시작...')
    
    const mobile = isMobile()
    const browser = getMobileBrowser()
    
    console.log('디바이스 정보:', { mobile, browser })
    
    try {
      // 모바일 최적화된 로그인 옵션
      const loginOptions: any = {
        success: (authObj: any) => {
          console.log('카카오 로그인 성공:', authObj)
          
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
          } else if (error.error_description) {
            errorMessage = `로그인 오류: ${error.error_description}`
          }
          
          onError(errorMessage)
        }
      }

      // 모바일 환경에 따른 로그인 옵션 최적화
      if (mobile) {
        // 모바일에서는 throughTalk 옵션으로 카카오톡 앱 연동 우선 시도
        if (browser === 'kakaotalk') {
          // 카카오톡 인앱 브라우저에서는 기본 옵션 사용
          console.log('카카오톡 인앱 브라우저에서 로그인')
        } else {
          // 일반 모바일 브라우저에서는 throughTalk 비활성화
          loginOptions.throughTalk = false
          console.log('모바일 브라우저에서 카카오톡 앱 연동 비활성화')
        }
        
        // 모바일에서 팝업 대신 현재 창에서 로그인 진행
        loginOptions.persistAccessToken = true
        loginOptions.persistRefreshToken = true
      } else {
        // 데스크톱에서는 기본 팝업 방식 사용
        console.log('데스크톱 브라우저에서 팝업 로그인')
      }

      console.log('로그인 옵션:', loginOptions)
      window.Kakao.Auth.login(loginOptions)
      
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

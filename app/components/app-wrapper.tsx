"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Dashboard from "../page-dashboard"
import { useKakaoLogin } from "./kakao-login"
import { UserSignup } from "./user-signup"

// 앱의 상태를 정의
type AppState = 'login' | 'signup' | 'dashboard'

export function AppWrapper() {
  const [appState, setAppState] = useState<AppState>('login')
  const [isLoading, setIsLoading] = useState(false)
  const [kakaoUserInfo, setKakaoUserInfo] = useState(null)
  const [userInfo, setUserInfo] = useState(null)
  const [error, setError] = useState("")

  const { loginWithKakao, isKakaoReady, isLoading: kakaoLoading } = useKakaoLogin({
    onSuccess: async (kakaoUserInfo) => {
      console.log('카카오 로그인 성공:', kakaoUserInfo)
      setKakaoUserInfo(kakaoUserInfo)
      
      try {
        // 기존 사용자인지 확인
        await checkExistingUser(kakaoUserInfo)
      } catch (error) {
        console.error('사용자 확인 중 오류:', error)
        setError('사용자 정보 확인 중 오류가 발생했습니다.')
        setIsLoading(false)
      }
    },
    onError: (errorMessage) => {
      console.error('로그인 오류:', errorMessage)
      setError(errorMessage)
      setIsLoading(false)
    }
  })

  const handleKakaoLogin = () => {
    if (!isKakaoReady) {
      setError("카카오 SDK가 아직 준비되지 않았습니다. 잠시만 기다려주세요.")
      return
    }
    
    setIsLoading(true)
    setError("")
    loginWithKakao()
  }

  const checkExistingUser = async (kakaoUserInfo: any) => {
    try {
      console.log('사용자 존재 여부 확인 중...')
      
      const response = await fetch('/api/user/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          kakaoId: kakaoUserInfo.id
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || '사용자 확인 중 오류가 발생했습니다.')
      }

      if (result.exists) {
        // 기존 사용자 - 바로 대시보드로 이동
        console.log('기존 사용자 로그인:', result.user)
        setUserInfo(result.user)
        setAppState('dashboard')
        setIsLoading(false)
      } else {
        // 신규 사용자 - 회원가입 화면으로 이동
        console.log('신규 사용자 - 회원가입 진행')
        setAppState('signup')
        setIsLoading(false)
      }

    } catch (error) {
      console.error('사용자 확인 오류:', error)
      setError('사용자 정보 확인 중 오류가 발생했습니다.')
      setIsLoading(false)
    }
  }

  const handleSignupComplete = (userData: any) => {
    console.log('회원가입 완료:', userData)
    setUserInfo(userData)
    setAppState('dashboard')
  }

  const handleBackToLogin = () => {
    setAppState('login')
    setKakaoUserInfo(null)
    setError("")
  }

  // 로딩 중 화면
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">
            {kakaoUserInfo ? '사용자 정보 확인 중...' : '카카오 로그인 중...'}
          </p>
        </div>
      </div>
    )
  }

  // 카카오 SDK 로딩 중 화면
  if (kakaoLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">카카오 SDK 로딩 중...</p>
        </div>
      </div>
    )
  }

  // 회원가입 화면
  if (appState === 'signup' && kakaoUserInfo) {
    return (
      <UserSignup 
        kakaoUserInfo={kakaoUserInfo}
        onSignupComplete={handleSignupComplete}
        onBack={handleBackToLogin}
      />
    )
  }

  // 사용자 정보 업데이트 핸들러
  const handleUserUpdate = (updatedUser: any) => {
    console.log('App-wrapper에서 사용자 정보 업데이트:', updatedUser)
    setUserInfo(updatedUser)
  }

  // 대시보드 화면
  if (appState === 'dashboard' && userInfo) {
    return <Dashboard userInfo={userInfo} onUserUpdate={handleUserUpdate} />
  }

  // 로그인 화면
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 rounded-full overflow-hidden bg-white border-2 border-blue-200 flex items-center justify-center">
            <img 
              src="/fc-bro-emblem.jpg" 
              alt="FC BRO Logo" 
              className="w-full h-full object-cover"
            />
          </div>
          <CardTitle className="text-2xl">FC BRO</CardTitle>
          {/* <CardDescription>Football Club BRO</CardDescription> */}
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <Button
            onClick={handleKakaoLogin}
            className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-medium"
            size="lg"
            disabled={isLoading || !isKakaoReady}
          >
            {isLoading ? '로그인 중...' : !isKakaoReady ? 'SDK 로딩 중...' : '카카오로 시작하기'}
          </Button>
          <p className="text-xs text-center text-muted-foreground">
            카카오 계정으로 로그인하면
            <br />자동으로 팀 가입 화면으로 이동합니다
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

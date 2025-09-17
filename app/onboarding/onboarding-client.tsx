'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { User, Phone, MapPin, Trophy, ArrowRight, Check } from "lucide-react"

export default function OnboardingClient() {
  const sessionData = useSession()
  const session = sessionData?.data
  const status = sessionData?.status
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [checkingUser, setCheckingUser] = useState(true)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    position: '',
    preferredFoot: ''
  })

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/')
    } else if (status === 'authenticated' && session?.user) {
      // 기존 회원인지 확인
      checkExistingUser()
    }
  }, [status, session, router])

  const checkExistingUser = async () => {
    try {
      const response = await fetch('/api/user/profile')
      if (response.ok) {
        const userData = await response.json()
        // 이미 추가 정보가 있는 사용자는 대시보드로
        if (userData.phone || userData.position) {
          router.push('/dashboard')
        } else {
          // 카카오에서 가져온 이름 설정
          setFormData(prev => ({
            ...prev,
            name: userData.name || session?.user?.name || ''
          }))
          setCheckingUser(false)
        }
      } else {
        setCheckingUser(false)
      }
    } catch (error) {
      console.error('Error checking user:', error)
      setCheckingUser(false)
    }
  }

  const handleNext = () => {
    if (step === 1 && (!formData.name || !formData.phone)) {
      setError('이름과 전화번호를 입력해주세요.')
      return
    }
    if (step === 2 && (!formData.position || !formData.preferredFoot)) {
      setError('포지션과 주발을 선택해주세요.')
      return
    }
    setError('')
    setStep(step + 1)
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        router.push('/dashboard')
      } else {
        setError('프로필 저장에 실패했습니다.')
      }
    } catch (error) {
      console.error('Failed to save profile:', error)
      setError('프로필 저장 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  // 세션이 로드되지 않았거나 체크 중인 경우 로딩 표시
  if (!sessionData || status === 'loading' || checkingUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">로딩 중...</p>
        </div>
      </div>
    )
  }

  const progressValue = (step / 3) * 100

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center px-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <div className="mb-4">
            <Progress value={progressValue} className="h-2" />
          </div>
          <CardTitle className="text-2xl">
            {step === 1 && '기본 정보 입력'}
            {step === 2 && '축구 정보 입력'}
            {step === 3 && '가입 완료!'}
          </CardTitle>
          <CardDescription>
            {step === 1 && '팀 활동에 필요한 기본 정보를 입력해주세요'}
            {step === 2 && '포지션과 주발 정보를 선택해주세요'}
            {step === 3 && 'FC BRO에 오신 것을 환영합니다!'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === 1 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">
                  <User className="h-4 w-4 inline mr-2" />
                  이름
                </Label>
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="실명을 입력해주세요"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">
                  <Phone className="h-4 w-4 inline mr-2" />
                  전화번호
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="010-1234-5678"
                  required
                />
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button
                className="w-full"
                onClick={handleNext}
              >
                다음
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="position">
                  <MapPin className="h-4 w-4 inline mr-2" />
                  주 포지션
                </Label>
                <Select
                  value={formData.position}
                  onValueChange={(value) => setFormData({ ...formData, position: value })}
                >
                  <SelectTrigger id="position">
                    <SelectValue placeholder="포지션을 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FW">공격수 (FW)</SelectItem>
                    <SelectItem value="MF">미드필더 (MF)</SelectItem>
                    <SelectItem value="DF">수비수 (DF)</SelectItem>
                    <SelectItem value="GK">골키퍼 (GK)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="preferredFoot">
                  <Trophy className="h-4 w-4 inline mr-2" />
                  주발
                </Label>
                <Select
                  value={formData.preferredFoot}
                  onValueChange={(value) => setFormData({ ...formData, preferredFoot: value })}
                >
                  <SelectTrigger id="preferredFoot">
                    <SelectValue placeholder="주발을 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LEFT">왼발</SelectItem>
                    <SelectItem value="RIGHT">오른발</SelectItem>
                    <SelectItem value="BOTH">양발</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="flex gap-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setStep(1)}
                >
                  이전
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleNext}
                >
                  다음
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div className="text-center space-y-4">
                <div className="h-20 w-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <Check className="h-10 w-10 text-green-600" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">모든 정보가 입력되었습니다!</h3>
                  <p className="text-sm text-muted-foreground">
                    이제 팀 활동을 시작할 준비가 완료되었습니다.
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">이름</span>
                  <span className="font-medium">{formData.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">전화번호</span>
                  <span className="font-medium">{formData.phone}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">포지션</span>
                  <span className="font-medium">
                    {formData.position === 'FW' && '공격수'}
                    {formData.position === 'MF' && '미드필더'}
                    {formData.position === 'DF' && '수비수'}
                    {formData.position === 'GK' && '골키퍼'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">주발</span>
                  <span className="font-medium">
                    {formData.preferredFoot === 'LEFT' && '왼발'}
                    {formData.preferredFoot === 'RIGHT' && '오른발'}
                    {formData.preferredFoot === 'BOTH' && '양발'}
                  </span>
                </div>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="flex gap-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setStep(2)}
                  disabled={loading}
                >
                  이전
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleSubmit}
                  disabled={loading}
                >
                  {loading ? '저장 중...' : '시작하기'}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

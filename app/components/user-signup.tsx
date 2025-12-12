"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
// import { Checkbox } from "@/components/ui/checkbox" // 더 이상 사용하지 않음
import { Users, AlertCircle, CheckCircle } from "lucide-react"
import { regionData, provinceOptions, footOptions } from "@/lib/region-data"

interface UserSignupProps {
  kakaoUserInfo: any
  onSignupComplete: (userData: any) => void
  onBack?: () => void
}

export function UserSignup({ kakaoUserInfo, onSignupComplete, onBack }: UserSignupProps) {
  const [formData, setFormData] = useState({
    realName: "",
    phoneNumber: "",
    birthYear: "",
    preferredPosition: "",
    subPosition1: "",
    subPosition2: "",
    region: "",
    city: "",
    preferredFoot: "",
    jerseyNumber: ""
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 포지션 옵션 - 카테고리별 분류
  const positionCategories = {
    attacker: {
      name: "공격수",
      positions: [
        { value: "ST", label: "ST (스트라이커)" },
        { value: "CF", label: "CF (센터 포워드)" },
        { value: "SS", label: "SS (세컨드 스트라이커)" },
        { value: "LWF", label: "LWF (좌측 윙 포워드)" },
        { value: "RWF", label: "RWF (우측 윙 포워드)" }
      ]
    },
    midfielder: {
      name: "미드필더",
      positions: [
        { value: "CAM", label: "CAM (공격형 미드필더)" },
        { value: "CM", label: "CM (중앙 미드필더)" },
        { value: "CDM", label: "CDM (수비형 미드필더)" }
      ]
    },
    defender: {
      name: "수비수",
      positions: [
        { value: "CB", label: "CB (센터백)" },
        { value: "RB", label: "RB (우측 풀백)" },
        { value: "LB", label: "LB (좌측 풀백)" },
        { value: "DRL", label: "DRL (양쪽 풀백 가능)" },
        { value: "DRLC", label: "DRLC (멀티 수비수)" }
      ]
    },
    goalkeeper: {
      name: "골키퍼",
      positions: [
        { value: "GK", label: "GK (골키퍼)" }
      ]
    }
  }

  // 모든 포지션을 플랫하게 만든 배열 (검증 및 선택용)
  const allPositions = Object.values(positionCategories).flatMap(category => category.positions)

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    // 실명 검증
    if (!formData.realName.trim()) {
      newErrors.realName = "실명을 입력해주세요."
    } else if (formData.realName.trim().length < 2) {
      newErrors.realName = "실명은 2글자 이상 입력해주세요."
    }

    // 전화번호 검증
    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = "전화번호를 입력해주세요."
    } else {
      const phoneRegex = /^010\d{8}$/
      if (!phoneRegex.test(formData.phoneNumber)) {
        newErrors.phoneNumber = "올바른 전화번호 형식이 아닙니다. (예: 01012345678)"
      }
    }

    // 출생연도 검증
    if (!formData.birthYear) {
      newErrors.birthYear = "출생연도를 선택해주세요."
    }

    // 희망포지션 검증
    if (!formData.preferredPosition) {
      newErrors.preferredPosition = "희망포지션을 선택해주세요."
    } else if (!allPositions.find(pos => pos.value === formData.preferredPosition)) {
      newErrors.preferredPosition = "유효하지 않은 포지션입니다."
    }

    // 부포지션 검증 (선택사항)
    const selectedSubPositions = [formData.subPosition1, formData.subPosition2].filter(pos => pos !== "")
    
    // 유효한 포지션인지 확인
    if (selectedSubPositions.some(pos => !allPositions.find(p => p.value === pos))) {
      newErrors.subPositions = "유효하지 않은 부포지션이 포함되어 있습니다."
    }
    
    // 희망포지션과 중복 확인
    if (selectedSubPositions.includes(formData.preferredPosition)) {
      newErrors.subPositions = "부포지션에는 희망포지션과 다른 포지션을 선택해주세요."
    }
    
    // 부포지션 간 중복 확인
    if (formData.subPosition1 && formData.subPosition2 && formData.subPosition1 === formData.subPosition2) {
      newErrors.subPositions = "부포지션은 서로 다른 포지션을 선택해주세요."
    }

    // 거주 지역 검증
    if (!formData.region) {
      newErrors.region = "시도를 선택해주세요."
    } else if (!formData.city) {
      newErrors.city = "구/시를 선택해주세요."
    }

    // 등번호 검증 (선택사항)
    if (formData.jerseyNumber && (!/^\d+$/.test(formData.jerseyNumber) || Number(formData.jerseyNumber) < 1 || Number(formData.jerseyNumber) > 99)) {
      newErrors.jerseyNumber = "등번호는 1-99 사이의 숫자여야 합니다."
    }

    // 주발 검증 (선택사항)
    // 주발은 필수가 아니므로 별도 검증 없음

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    
    // 입력 시 해당 필드 에러 제거
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const handlePhoneChange = (value: string) => {
    // 숫자만 허용하고 11자리 제한
    const numbersOnly = value.replace(/\D/g, '').slice(0, 11)
    handleInputChange('phoneNumber', numbersOnly)
  }

  const handleJerseyNumberChange = (value: string) => {
    // 숫자만 허용하고 2자리 제한 (1-99)
    const numbersOnly = value.replace(/\D/g, '').slice(0, 2)
    handleInputChange('jerseyNumber', numbersOnly)
  }


  // 부포지션 선택에서 이미 선택된 포지션들 제외
  const getAvailableSubPositions = (excludePositions: string[] = []) => {
    return allPositions.filter(pos => !excludePositions.includes(pos.value))
  }

  const handleSubmit = async () => {
    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      // 회원가입 데이터 구성
      const signupData = {
        // 카카오 정보
        kakaoId: kakaoUserInfo.id,
        nickname: kakaoUserInfo.properties?.nickname || '카카오 사용자',
        profileImage: kakaoUserInfo.properties?.profile_image
          ? kakaoUserInfo.properties.profile_image.replace("http://", "https://")
          : null,
        
        // 입력 정보
        realName: formData.realName.trim(),
        phoneNumber: formData.phoneNumber,
        birthYear: formData.birthYear,
        preferredPosition: formData.preferredPosition,
        subPositions: [formData.subPosition1, formData.subPosition2].filter(pos => pos !== ""),
        region: formData.region,
        city: formData.city,
        preferredFoot: formData.preferredFoot || null,
        jerseyNumber: formData.jerseyNumber ? Number(formData.jerseyNumber) : null
      }

      console.log('회원가입 요청 데이터:', signupData)

      // 실제 API 호출로 사용자 정보 저장
      const response = await fetch('/api/user/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(signupData)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || '회원가입 처리 중 오류가 발생했습니다.')
      }

      console.log('회원가입 성공:', result)
      onSignupComplete(result.user)
      
    } catch (error) {
      console.error('회원가입 처리 중 오류:', error)
      
      let errorMessage = '회원가입 처리 중 오류가 발생했습니다.'
      
      if (error instanceof Error) {
        errorMessage = error.message
      }
      
      setErrors({ submit: errorMessage })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <Users className="h-8 w-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl">회원가입</CardTitle>
          <CardDescription>
            안녕하세요, {kakaoUserInfo.properties?.nickname || '카카오 사용자'}님!
            <br />추가 정보를 입력해주세요.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {errors.submit && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{errors.submit}</AlertDescription>
            </Alert>
          )}

          {/* 실명 입력 */}
          <div className="space-y-2">
            <Label htmlFor="realName">실명 *</Label>
            <Input
              id="realName"
              type="text"
              placeholder="실명을 입력해주세요"
              value={formData.realName}
              onChange={(e) => handleInputChange('realName', e.target.value)}
              className={errors.realName ? "border-red-500" : ""}
            />
            {errors.realName && (
              <p className="text-sm text-red-500">{errors.realName}</p>
            )}
          </div>

          {/* 전화번호 입력 */}
          <div className="space-y-2">
            <Label htmlFor="phoneNumber">전화번호 *</Label>
            <Input
              id="phoneNumber"
              type="tel"
              placeholder="01012345678 (하이픈 없이)"
              value={formData.phoneNumber}
              onChange={(e) => handlePhoneChange(e.target.value)}
              className={errors.phoneNumber ? "border-red-500" : ""}
              maxLength={11}
            />
            {errors.phoneNumber && (
              <p className="text-sm text-red-500">{errors.phoneNumber}</p>
            )}
          </div>

          {/* 출생연도 선택 */}
          <div className="space-y-2">
            <Label>출생연도 *</Label>
            <Select
              value={formData.birthYear}
              onValueChange={(value) => handleInputChange('birthYear', value)}
            >
              <SelectTrigger className={errors.birthYear ? "border-red-500" : ""}>
                <SelectValue placeholder="출생연도를 선택해주세요" />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {Array.from({ length: new Date().getFullYear() - 1900 + 1 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}년
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.birthYear && (
              <p className="text-sm text-red-500">{errors.birthYear}</p>
            )}
            <div className="text-xs text-muted-foreground">
              팀 편성 시 연령대별 밸런스를 맞추는 데 활용됩니다.
            </div>
          </div>

          {/* 희망포지션 선택 */}
          <div className="space-y-2">
            <Label>주포지션 (희망포지션) *</Label>
            <Select
              value={formData.preferredPosition}
              onValueChange={(value) => handleInputChange('preferredPosition', value)}
            >
              <SelectTrigger className={errors.preferredPosition ? "border-red-500" : ""}>
                <SelectValue placeholder="희망포지션을 선택해주세요" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(positionCategories).map(([categoryKey, category]) => (
                  <div key={categoryKey}>
                    <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">
                      {category.name}
                    </div>
                    {category.positions.map((position) => (
                      <SelectItem key={position.value} value={position.value}>
                        {position.label}
                      </SelectItem>
                    ))}
                  </div>
                ))}
              </SelectContent>
            </Select>
            {errors.preferredPosition && (
              <p className="text-sm text-red-500">{errors.preferredPosition}</p>
            )}
          </div>

          {/* 부포지션 선택 */}
          <div className="space-y-3">
            {/* <Label>부포지션 (선택사항, 최대 2개)</Label> */}
            {/* <div className="text-xs text-muted-foreground">
              주포지션 외에 소화 가능한 포지션을 선택해주세요.
            </div> */}
            
            {/* 첫 번째 부포지션 */}
            <div className="space-y-2">
              <Label>부포지션 1 (선택사항)</Label>
              <Select
                value={formData.subPosition1 || "none"}
                onValueChange={(value) => handleInputChange('subPosition1', value === "none" ? "" : value)}
              >
                <SelectTrigger className={errors.subPositions ? "border-red-500" : ""}>
                  <SelectValue placeholder="첫 번째 부포지션 선택" />
                </SelectTrigger>
                <SelectContent>
                  {/* 선택없음 옵션 */}
                  <SelectItem value="none">
                    <span className="text-muted-foreground">선택없음</span>
                  </SelectItem>
                  
                  {Object.entries(positionCategories).map(([categoryKey, category]) => (
                    <div key={categoryKey}>
                      <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">
                        {category.name}
                      </div>
                      {category.positions
                        .filter(pos => pos.value !== formData.preferredPosition && pos.value !== formData.subPosition2)
                        .map((position) => (
                          <SelectItem key={position.value} value={position.value}>
                            {position.label}
                          </SelectItem>
                        ))}
                    </div>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 두 번째 부포지션 */}
            <div className="space-y-2">
              <Label>부포지션 2 (선택사항)</Label>
              <Select
                value={formData.subPosition2 || "none"}
                onValueChange={(value) => handleInputChange('subPosition2', value === "none" ? "" : value)}
              >
                <SelectTrigger className={errors.subPositions ? "border-red-500" : ""}>
                  <SelectValue placeholder="두 번째 부포지션 선택" />
                </SelectTrigger>
                <SelectContent>
                  {/* 선택없음 옵션 */}
                  <SelectItem value="none">
                    <span className="text-muted-foreground">선택없음</span>
                  </SelectItem>
                  
                  {Object.entries(positionCategories).map(([categoryKey, category]) => (
                    <div key={categoryKey}>
                      <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">
                        {category.name}
                      </div>
                      {category.positions
                        .filter(pos => pos.value !== formData.preferredPosition && pos.value !== formData.subPosition1)
                        .map((position) => (
                          <SelectItem key={position.value} value={position.value}>
                            {position.label}
                          </SelectItem>
                        ))}
                    </div>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 선택된 부포지션 표시 */}
            {/* {(formData.subPosition1 || formData.subPosition2) && (
              <div className="text-sm text-blue-600">
                선택된 부포지션: {[formData.subPosition1, formData.subPosition2].filter(pos => pos !== "").join(', ')}
                <button 
                  type="button"
                  onClick={() => {
                    setFormData(prev => ({
                      ...prev,
                      subPosition1: "",
                      subPosition2: ""
                    }))
                  }}
                  className="ml-2 text-xs text-red-500 hover:text-red-700 underline"
                >
                  초기화
                </button>
              </div>
            )} */}

            {errors.subPositions && (
              <p className="text-sm text-red-500">{errors.subPositions}</p>
            )}
          </div>

          {/* 거주 지역 선택 (2단계) */}
          <div className="space-y-3">
            {/* <Label>거주 지역 *</Label> */}
            
            {/* 시도 선택 */}
            <div className="space-y-2">
              <Label>지역</Label>
              <Select
                value={formData.region}
                onValueChange={(value) => {
                  handleInputChange('region', value)
                  handleInputChange('city', "") // 시도 변경 시 구/시 초기화
                }}
              >
                <SelectTrigger className={errors.region ? "border-red-500" : ""}>
                  <SelectValue placeholder="시도를 선택해주세요" />
                </SelectTrigger>
                <SelectContent>
                  {provinceOptions.map((province) => (
                    <SelectItem key={province.value} value={province.value}>
                      {province.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.region && (
                <p className="text-sm text-red-500">{errors.region}</p>
              )}
            </div>

            {/* 구/시 선택 */}
            {formData.region && (
              <div className="space-y-2">
                <Label>시군구</Label>
                <Select
                  value={formData.city}
                  onValueChange={(value) => handleInputChange('city', value)}
                >
                  <SelectTrigger className={errors.city ? "border-red-500" : ""}>
                    <SelectValue placeholder="구/시를 선택해주세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {regionData[formData.region as keyof typeof regionData]?.map((city) => (
                      <SelectItem key={city} value={city}>
                        {city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.city && (
                  <p className="text-sm text-red-500">{errors.city}</p>
                )}
              </div>
            )}

            {/* 선택된 지역 표시 */}
            {/* {formData.region && formData.city && (
              <div className="text-sm text-blue-600">
                선택된 지역: {provinceOptions.find(p => p.value === formData.region)?.label} {formData.city}
              </div>
            )} */}
          </div>

          {/* 주발 선택 */}
          <div className="space-y-2">
            <Label>주발</Label>
            <Select
              value={formData.preferredFoot}
              onValueChange={(value) => handleInputChange('preferredFoot', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="주로 사용하는 발을 선택해주세요" />
              </SelectTrigger>
              <SelectContent>
                {footOptions.map((foot) => (
                  <SelectItem key={foot.value} value={foot.value}>
                    {foot.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {/* <div className="text-xs text-muted-foreground">
              팀 편성 시 참고 정보로 활용됩니다.
            </div> */}
          </div>

          {/* 등번호 선택 */}
          <div className="space-y-2">
            <Label>등번호 (선택사항)</Label>
            <Input
              type="text"
              placeholder="등번호를 입력하세요"
              value={formData.jerseyNumber}
              onChange={(e) => handleJerseyNumberChange(e.target.value)}
              className={errors.jerseyNumber ? "border-red-500" : ""}
              maxLength={2}
            />
            {errors.jerseyNumber && (
              <p className="text-sm text-red-500">{errors.jerseyNumber}</p>
            )}
          </div>

          {/* 버튼 영역 */}
          <div className="flex flex-col space-y-2 pt-4">
            <Button
              onClick={handleSubmit}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-medium"
              size="lg"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  <span>회원가입 중...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4" />
                  <span>회원가입 완료</span>
                </div>
              )}
            </Button>
            
            {onBack && (
              <Button
                onClick={onBack}
                variant="outline"
                className="w-full"
                disabled={isSubmitting}
              >
                이전으로
              </Button>
            )}
          </div>

          <p className="text-xs text-center text-muted-foreground">
            입력하신 정보는 팀 매칭 및 관리 목적으로만 사용됩니다.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

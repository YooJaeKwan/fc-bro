"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Users, AlertCircle, CheckCircle, Edit, Save, X, Target, MapPin } from "lucide-react"
import { regionData, provinceOptions, footOptions } from "@/lib/region-data"

interface UserProfileProps {
  userInfo: any
  onUserUpdate: (updatedUser: any) => void
}

export function UserProfile({ userInfo, onUserUpdate }: UserProfileProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    realName: userInfo?.realName || "",
    phoneNumber: userInfo?.phoneNumber || "",
    preferredPosition: userInfo?.preferredPosition || "",
    subPosition1: userInfo?.subPositions?.[0] || "",
    subPosition2: userInfo?.subPositions?.[1] || "",
    region: userInfo?.region || "",
    city: userInfo?.city || "",
    preferredFoot: userInfo?.preferredFoot || ""
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 포지션 옵션 - 카테고리별 분류 (회원가입과 동일)
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
        { value: "AMC", label: "AMC (공격형 중앙 미드필더)" },
        { value: "MC", label: "MC (중앙 미드필더)" },
        { value: "DM", label: "DM (수비형 미드필더)" }
      ]
    },
    defender: {
      name: "수비수",
      positions: [
        { value: "DC", label: "DC (센터백)" },
        { value: "DR", label: "DR (오른쪽 풀백)" },
        { value: "DL", label: "DL (왼쪽 풀백)" },
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

  // 모든 포지션을 플랫하게 만든 배열
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

    // 희망포지션 검증
    if (!formData.preferredPosition) {
      newErrors.preferredPosition = "희망포지션을 선택해주세요."
    }

    // 부포지션 검증 (선택사항)
    const selectedSubPositions = [formData.subPosition1, formData.subPosition2].filter(pos => pos !== "")
    
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

  const handleSave = async () => {
    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      const updateData = {
        userId: userInfo?.id,
        realName: formData.realName.trim(),
        phoneNumber: formData.phoneNumber,
        preferredPosition: formData.preferredPosition,
        subPositions: [formData.subPosition1, formData.subPosition2].filter(pos => pos !== ""),
        region: formData.region,
        city: formData.city,
        preferredFoot: formData.preferredFoot || null
      }

      console.log('정보 수정 요청:', updateData)

      const response = await fetch('/api/user/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || '정보 수정 중 오류가 발생했습니다.')
      }

      console.log('정보 수정 성공:', result)
      
      // 업데이트된 사용자 정보로 상위 컴포넌트 업데이트
      onUserUpdate(result.user)
      
      setIsEditing(false)
      setErrors({})

    } catch (error) {
      console.error('정보 수정 중 오류:', error)
      
      let errorMessage = '정보 수정 중 오류가 발생했습니다.'
      
      if (error instanceof Error) {
        errorMessage = error.message
      }
      
      setErrors({ submit: errorMessage })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    // 원래 값으로 되돌리기
    setFormData({
      realName: userInfo?.realName || "",
      phoneNumber: userInfo?.phoneNumber || "",
      preferredPosition: userInfo?.preferredPosition || "",
      subPosition1: userInfo?.subPositions?.[0] || "",
      subPosition2: userInfo?.subPositions?.[1] || "",
      region: userInfo?.region || "",
      city: userInfo?.city || "",
      preferredFoot: userInfo?.preferredFoot || ""
    })
    setErrors({})
    setIsEditing(false)
  }

  const handleEdit = () => {
    setIsEditing(true)
  }

  return (
    <div className="space-y-6">
      {/* 프로필 헤더 */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={userInfo?.profileImage || "/placeholder.svg"} />
                <AvatarFallback className="text-lg">
                  {(userInfo?.realName || userInfo?.nickname)?.[0] || 'U'}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-xl">{userInfo?.realName || userInfo?.nickname}</CardTitle>
                <CardDescription>
                  {userInfo?.preferredPosition}
                  {userInfo?.subPositions && userInfo.subPositions.length > 0 && 
                    ` (+ ${userInfo.subPositions.join(', ')})`
                  } • {userInfo?.region} {userInfo?.city}
                  {userInfo?.preferredFoot && ` • ${footOptions.find(f => f.value === userInfo.preferredFoot)?.label}`}
                </CardDescription>
                <p className="text-sm text-muted-foreground mt-1">
                  가입일: {userInfo?.registeredAt ? new Date(userInfo.registeredAt).toLocaleDateString('ko-KR') : '정보 없음'}
                </p>
              </div>
            </div>
            <Button
              onClick={isEditing ? handleCancel : handleEdit}
              variant={isEditing ? "outline" : "default"}
              className="self-start"
            >
              {isEditing ? (
                <>
                  <X className="h-4 w-4 mr-2" />
                  취소
                </>
              ) : (
                <>
                  <Edit className="h-4 w-4 mr-2" />
                  정보 수정
                </>
              )}
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* 정보 수정 폼 */}
      {isEditing ? (
        <Card>
          <CardHeader>
            <CardTitle>내 정보 수정</CardTitle>
            <CardDescription>변경할 정보를 입력해주세요.</CardDescription>
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

            {/* 희망포지션 선택 */}
            <div className="space-y-2">
              <Label>희망포지션 (주포지션) *</Label>
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
              <Label>부포지션 (선택사항, 최대 2개)</Label>
              <div className="text-xs text-muted-foreground">
                주포지션 외에 소화 가능한 포지션을 선택해주세요.
              </div>
              
              {/* 첫 번째 부포지션 */}
              <div className="space-y-2">
                <Label>부포지션 1</Label>
                <Select
                  value={formData.subPosition1 || undefined}
                  onValueChange={(value) => handleInputChange('subPosition1', value || "")}
                >
                  <SelectTrigger className={errors.subPositions ? "border-red-500" : ""}>
                    <SelectValue placeholder="첫 번째 부포지션 선택 (선택사항)" />
                  </SelectTrigger>
                  <SelectContent>
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
                <Label>부포지션 2</Label>
                <Select
                  value={formData.subPosition2 || undefined}
                  onValueChange={(value) => handleInputChange('subPosition2', value || "")}
                >
                  <SelectTrigger className={errors.subPositions ? "border-red-500" : ""}>
                    <SelectValue placeholder="두 번째 부포지션 선택 (선택사항)" />
                  </SelectTrigger>
                  <SelectContent>
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
              {(formData.subPosition1 || formData.subPosition2) && (
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
              )}

              {errors.subPositions && (
                <p className="text-sm text-red-500">{errors.subPositions}</p>
              )}
            </div>

            {/* 거주 지역 선택 (2단계) */}
            <div className="space-y-3">
              <Label>거주 지역 *</Label>
              
              {/* 시도 선택 */}
              <div className="space-y-2">
                <Label>시도</Label>
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
                  <Label>구/시</Label>
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
              {formData.region && formData.city && (
                <div className="text-sm text-blue-600">
                  선택된 지역: {provinceOptions.find(p => p.value === formData.region)?.label} {formData.city}
                </div>
              )}
            </div>

            {/* 주발 선택 */}
            <div className="space-y-2">
              <Label>주발 (선택사항)</Label>
              <Select
                value={formData.preferredFoot || undefined}
                onValueChange={(value) => handleInputChange('preferredFoot', value || "")}
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
              <div className="text-xs text-muted-foreground">
                팀 편성 시 참고 정보로 활용됩니다.
              </div>
            </div>

            {/* 저장 버튼 */}
            <div className="flex justify-end space-x-2 pt-4">
              <Button
                onClick={handleCancel}
                variant="outline"
                disabled={isSubmitting}
              >
                취소
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSubmitting}
                className="bg-green-600 hover:bg-green-700"
              >
                {isSubmitting ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    <span>저장 중...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Save className="h-4 w-4" />
                    <span>저장</span>
                  </div>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* 정보 표시 모드 */
        <div className="grid gap-6 md:grid-cols-2">
          {/* 기본 정보 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>기본 정보</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">실명</Label>
                <p className="text-base">{userInfo?.realName || '정보 없음'}</p>
              </div>
              <Separator />
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">연락처</Label>
                <p className="text-base">{userInfo?.phoneNumber || '정보 없음'}</p>
              </div>
              <Separator />
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">거주지역</Label>
                <p className="text-base">
                  {userInfo?.region && userInfo?.city 
                    ? `${provinceOptions.find(p => p.value === userInfo.region)?.label} ${userInfo.city}`
                    : '정보 없음'
                  }
                </p>
              </div>
              <Separator />
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">주발</Label>
                <p className="text-base">
                  {userInfo?.preferredFoot 
                    ? footOptions.find(f => f.value === userInfo.preferredFoot)?.label
                    : '정보 없음'
                  }
                </p>
              </div>
            </CardContent>
          </Card>

          {/* 포지션 정보 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Target className="h-5 w-5" />
                <span>포지션 정보</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">희망포지션 (주포지션)</Label>
                <div className="flex items-center space-x-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    {userInfo?.preferredPosition || '정보 없음'}
                  </span>
                </div>
              </div>
              <Separator />
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">부포지션</Label>
                <div className="flex flex-wrap gap-2">
                  {userInfo?.subPositions && userInfo.subPositions.length > 0 ? (
                    userInfo.subPositions.map((position: string, index: number) => (
                      <span 
                        key={index}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                      >
                        {position}
                      </span>
                    ))
                  ) : (
                    <p className="text-base text-muted-foreground">설정된 부포지션이 없습니다</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

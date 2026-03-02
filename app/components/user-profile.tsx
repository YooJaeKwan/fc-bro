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
import { Users, AlertCircle, CheckCircle, Edit, Save, X, Target, MapPin, Activity, History, Plus } from "lucide-react"
import { useEffect } from "react"
import { regionData, provinceOptions, footOptions } from "@/lib/region-data"

// 커스텀 SoccerBall 아이콘 컴포넌트
const SoccerBall = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
    <path d="M12 2c-2.21 0-4.21.9-5.66 2.34L12 12l5.66-7.66C16.21 2.9 14.21 2 12 2z" />
    <path d="M12 22c2.21 0 4.21-.9 5.66-2.34L12 12l-5.66 7.66C7.79 21.1 9.79 22 12 22z" />
    <path d="M2 12h20" />
    <path d="M12 2v20" />
    <circle cx="12" cy="12" r="2" />
  </svg>
)

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
    preferredFoot: userInfo?.preferredFoot || "",
    jerseyNumber: userInfo?.jerseyNumber ? userInfo.jerseyNumber.toString() : "",
    // injuryStatus: userInfo?.injuryStatus || "", // Removed
    // injuryDetail: userInfo?.injuryDetail || "", // Removed
    // expectedReturnDate: userInfo?.expectedReturnDate ? new Date(userInfo.expectedReturnDate).toISOString().split('T')[0] : "" // Removed
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [injuryHistory, setInjuryHistory] = useState<any[]>([])
  const [showInjuryForm, setShowInjuryForm] = useState(false)
  const [injuryFormData, setInjuryFormData] = useState({
    injuryStatus: userInfo?.injuryStatus || "HEALTHY",
    injuryName: userInfo?.injuryName || "",
    injuryStartDate: userInfo?.injuryStartDate ? new Date(userInfo.injuryStartDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    expectedReturnDate: userInfo?.expectedReturnDate ? new Date(userInfo.expectedReturnDate).toISOString().split('T')[0] : "",
    injuryDetail: userInfo?.injuryDetail || ""
  })

  // 부상 이력 가져오기
  useEffect(() => {
    if (userInfo?.id) {
      fetchInjuryHistory()
    }
  }, [userInfo?.id])

  const fetchInjuryHistory = async () => {
    try {
      const response = await fetch(`/api/user/injury/history?userId=${userInfo.id}&requesterId=${userInfo.id}`)
      const data = await response.json()
      if (data.success) {
        setInjuryHistory(data.injuries || [])
      }
    } catch (error) {
      console.error('부상 이력 조회 실패:', error)
    }
  }

  const handleInjurySave = async () => {
    setIsSubmitting(true)
    try {
      const response = await fetch('/api/user/injury', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userInfo.id,
          requesterId: userInfo.id,
          ...injuryFormData
        })
      })

      const data = await response.json()
      if (data.success) {
        onUserUpdate(data.user)
        setShowInjuryForm(false)
        fetchInjuryHistory()
      } else {
        alert(data.error || '저장 실패')
      }
    } catch (error) {
      console.error('부상 정보 저장 실패:', error)
      alert('저장 중 오류가 발생했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

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
        { value: "CAM", label: "CAM (공격형 중앙 미드필더)" },
        { value: "CM", label: "CM (중앙 미드필더)" },
        { value: "CDM", label: "CDM (수비형 미드필더)" }
      ]
    },
    defender: {
      name: "수비수",
      positions: [
        { value: "CB", label: "CB (센터백)" },
        { value: "RB", label: "RB (오른쪽 풀백)" },
        { value: "LB", label: "LB (왼쪽 풀백)" },
        { value: "LRB", label: "LRB (양쪽 풀백 가능)" },
        { value: "LRCB", label: "LRCB (멀티 수비수)" }
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

    // 등번호 검증 (선택사항)
    if (formData.jerseyNumber && (!/^\d+$/.test(formData.jerseyNumber) || Number(formData.jerseyNumber) < 1 || Number(formData.jerseyNumber) > 99)) {
      newErrors.jerseyNumber = "등번호는 1-99 사이의 숫자여야 합니다."
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

  const handleJerseyNumberChange = (value: string) => {
    // 숫자만 허용하고 2자리 제한 (1-99)
    const numbersOnly = value.replace(/\D/g, '').slice(0, 2)
    handleInputChange('jerseyNumber', numbersOnly)
  }

  const handleSave = async () => {
    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      // 부상 정보 업데이트를 위한 별도 처리 (여기서 한 번에 처리하거나 별도 API 호출)
      // 기존 update API가 모든 필드를 처리하도록 수정되어 있지 않다면 별도 호출 필요할 수 있음
      // 일단은 update API가 처리한다고 가정하고 data에 포함
      const updateData = {
        userId: userInfo?.id,
        realName: formData.realName.trim(),
        phoneNumber: formData.phoneNumber,
        preferredPosition: formData.preferredPosition,
        subPositions: [formData.subPosition1, formData.subPosition2].filter(pos => pos !== ""),
        region: formData.region,
        city: formData.city,
        preferredFoot: formData.preferredFoot || null,
        jerseyNumber: formData.jerseyNumber ? Number(formData.jerseyNumber) : null
      }

      // 1. 기본 정보 업데이트
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
      preferredFoot: userInfo?.preferredFoot || "",
      jerseyNumber: userInfo?.jerseyNumber ? userInfo.jerseyNumber.toString() : ""
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
          {/* 프로필 이미지와 기본 정보 */}
          <div className="flex items-center space-x-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={userInfo?.profileImage || "/placeholder.svg"} />
              <AvatarFallback className="text-lg">
                {(userInfo?.realName || userInfo?.nickname)?.[0] || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-semibold flex items-center gap-2">
                    {userInfo?.realName || userInfo?.nickname}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    가입일: {userInfo?.registeredAt ? new Date(userInfo.registeredAt).toLocaleDateString('ko-KR') : '정보 없음'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>

        {/* 정보 수정 버튼을 Card 하단에 배치 */}
        {!isEditing && (
          <CardContent className="pt-0">
            <div className="flex justify-center">
              <Button
                onClick={handleEdit}
                variant="default"
                size="sm"
                className="w-full max-w-xs"
              >
                <Edit className="h-4 w-4 mr-2" />
                정보 수정
              </Button>
            </div>
          </CardContent>
        )}
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
              <Label>주포지션 *</Label>
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
              {/* <Label>부포지션 (선택사항, 최대 2개)</Label>
              <div className="text-xs text-muted-foreground">
                주포지션 외에 소화 가능한 포지션을 선택해주세요.
              </div> */}

              {/* 첫 번째 부포지션 */}
              <div className="space-y-2">
                <Label>부포지션 1 (희망포지션)</Label>
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
                <Label>부포지션 2 (희망포지션)</Label>
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
              {/* <div className="text-xs text-muted-foreground">
              팀 편성 시 참고 정보로 활용됩니다.
            </div> */}
            </div>

            {/* 등번호 입력 */}
            <div className="space-y-2">
              <Label>등번호 (선택사항)</Label>
              <Input
                type="text"
                placeholder=""
                value={formData.jerseyNumber}
                onChange={(e) => handleJerseyNumberChange(e.target.value)}
                className={errors.jerseyNumber ? "border-red-500" : ""}
                maxLength={2}
              />
              {errors.jerseyNumber && (
                <p className="text-sm text-red-500">{errors.jerseyNumber}</p>
              )}
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
                <span>기본 정보</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">이름</Label>
                <p className="text-base">{userInfo?.realName || '정보 없음'}</p>
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">연락처</Label>
                  <p className="text-base">{userInfo?.phoneNumber || '정보 없음'}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">거주지역</Label>
                  <p className="text-base">
                    {userInfo?.region && userInfo?.city
                      ? `${provinceOptions.find(p => p.value === userInfo.region)?.label} ${userInfo.city}`
                      : '정보 없음'
                    }
                  </p>
                </div>
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">주발</Label>
                  <p className="text-base">
                    {userInfo?.preferredFoot
                      ? footOptions.find(f => f.value === userInfo.preferredFoot)?.label
                      : '정보 없음'
                    }
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">등번호</Label>
                  <p className="text-base">
                    {userInfo?.jerseyNumber ? `${userInfo.jerseyNumber}번` : '설정 안함'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>


          {/* 포지션 정보 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <span>포지션 정보</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">주포지션</Label>
                <div className="flex items-center space-x-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    {(() => {
                      const position = userInfo?.preferredPosition
                      if (!position) return '정보 없음'
                      const positionInfo = allPositions.find(p => p.value === position)
                      return positionInfo ? positionInfo.label : position
                    })()}
                  </span>
                </div>
              </div>
              <Separator />
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">부포지션 (희망포지션)</Label>
                <div className="flex flex-wrap gap-2">
                  {userInfo?.subPositions && userInfo.subPositions.length > 0 ? (
                    userInfo.subPositions.map((position: string, index: number) => {
                      const positionInfo = allPositions.find(p => p.value === position)
                      return (
                        <span
                          key={index}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          {positionInfo ? positionInfo.label : position}
                        </span>
                      )
                    })
                  ) : (
                    <p className="text-base text-muted-foreground">설정된 부포지션이 없습니다</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 부상 관리 섹션 추가 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="space-y-1">
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <Activity className="h-5 w-5 text-red-500" />
              부상 관리
            </CardTitle>
          </div>
          {!isEditing && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setInjuryFormData({
                  injuryStatus: userInfo?.injuryStatus || "HEALTHY",
                  injuryName: userInfo?.injuryName || "",
                  injuryStartDate: userInfo?.injuryStartDate ? new Date(userInfo.injuryStartDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                  expectedReturnDate: userInfo?.expectedReturnDate ? new Date(userInfo.expectedReturnDate).toISOString().split('T')[0] : "",
                  injuryDetail: userInfo?.injuryDetail || ""
                })
                setShowInjuryForm(!showInjuryForm)
              }}
            >
              {showInjuryForm ? <X className="h-4 w-4" /> : (userInfo?.injuryStatus === "HEALTHY" || !userInfo?.injuryStatus ? "부상 신고" : "상태 업데이트")}
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {showInjuryForm ? (
            <div className="space-y-4 pt-2">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>현재 상태</Label>
                  <Select
                    value={injuryFormData.injuryStatus}
                    onValueChange={(value) => setInjuryFormData(prev => ({ ...prev, injuryStatus: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="HEALTHY">정상 (활동 가능)</SelectItem>
                      <SelectItem value="INJURED">부상 중 (활동 중단)</SelectItem>
                      <SelectItem value="RECOVERING">회복 중 (재활 단계)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {injuryFormData.injuryStatus !== "HEALTHY" && (
                  <div className="space-y-2">
                    <Label>부상명</Label>
                    <Input
                      value={injuryFormData.injuryName}
                      onChange={(e) => setInjuryFormData(prev => ({ ...prev, injuryName: e.target.value }))}
                      placeholder="예: 발목 염좌, 근육 파열"
                    />
                  </div>
                )}
              </div>

              {injuryFormData.injuryStatus !== "HEALTHY" && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>부상 발생일</Label>
                    <Input
                      type="date"
                      value={injuryFormData.injuryStartDate}
                      onChange={(e) => setInjuryFormData(prev => ({ ...prev, injuryStartDate: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>복귀 예상일</Label>
                    <Input
                      type="date"
                      value={injuryFormData.expectedReturnDate}
                      onChange={(e) => setInjuryFormData(prev => ({ ...prev, expectedReturnDate: e.target.value }))}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label>상세 정보</Label>
                <Input
                  value={injuryFormData.injuryDetail}
                  onChange={(e) => setInjuryFormData(prev => ({ ...prev, injuryDetail: e.target.value }))}
                  placeholder="부상 경위나 현재 증상 등"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="ghost" size="sm" onClick={() => setShowInjuryForm(false)}>취소</Button>
                <Button
                  onClick={handleInjurySave}
                  disabled={isSubmitting}
                  size="sm"
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  {isSubmitting ? "저장 중..." : "저장하기"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* 현재 상태 요약 */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${userInfo?.injuryStatus === "INJURED" ? "bg-red-100 text-red-600" :
                    userInfo?.injuryStatus === "RECOVERING" ? "bg-amber-100 text-amber-600" :
                      "bg-green-100 text-green-600"
                    }`}>
                    <Activity className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold">
                      {userInfo?.injuryStatus === "INJURED" ? "부상 중" :
                        userInfo?.injuryStatus === "RECOVERING" ? "회복 중" : "정상"}
                    </p>
                    {userInfo?.injuryStatus && userInfo?.injuryStatus !== "HEALTHY" && userInfo?.injuryName && (
                      <p className="text-sm text-muted-foreground">{userInfo.injuryName}</p>
                    )}
                  </div>
                </div>
                {userInfo?.injuryStatus && userInfo?.injuryStatus !== "HEALTHY" && userInfo?.expectedReturnDate && (
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">복귀 예정일</p>
                    <p className="text-sm font-medium">{new Date(userInfo.expectedReturnDate).toLocaleDateString('ko-KR')}</p>
                  </div>
                )}
              </div>

              {/* 부상 이력 */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <History className="h-4 w-4 text-muted-foreground" />
                  부상 이력
                </h4>
                {injuryHistory.length > 0 ? (
                  <div className="space-y-2">
                    {injuryHistory.map((injury, index) => (
                      <div key={injury.id || index} className="p-3 bg-white border rounded-md text-sm">
                        <div className="flex justify-between items-start">
                          <p className="font-medium text-gray-900">{injury.injuryName}</p>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${injury.endDate ? 'bg-gray-100 text-gray-600' : 'bg-red-100 text-red-600'}`}>
                            {injury.endDate ? '완치' : '진행중'}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(injury.startDate).toLocaleDateString()} ~ {injury.endDate ? new Date(injury.endDate).toLocaleDateString() : '진행 중'}
                        </p>
                        {injury.description && (
                          <p className="text-xs text-gray-600 mt-2 italic">"{injury.description}"</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground py-8 text-center border border-dashed rounded-lg">기록된 부상 이력이 없습니다.</p>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

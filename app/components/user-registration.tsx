"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Users } from "lucide-react"

// 포지션 정의
const positions = {
  공격수: [
    { code: "ST", name: "스트라이커 (ST)" },
    { code: "CF", name: "센터 포워드 (CF)" },
    { code: "SS", name: "세컨드 스트라이커 (SS)" },
    { code: "LWF", name: "좌측 윙 포워드 (LWF)" },
    { code: "RWF", name: "우측 윙 포워드 (RWF)" },
  ],
  미드필더: [
    { code: "CAM", name: "공격형 중앙 미드필더 (CAM)" },
    { code: "CM", name: "중앙 미드필더 (CM)" },
    { code: "CDM", name: "수비형 미드필더 (CDM)" },
  ],
  수비수: [
    { code: "CB", name: "센터백 (CB)" },
    { code: "RB", name: "라이트백 (RB)" },
    { code: "LB", name: "레프트백 (LB)" },
    { code: "LRB", name: "양쪽 풀백 (LRB)" },
    { code: "LRCB", name: "멀티 수비수 (LRCB)" },
  ],
  골키퍼: [{ code: "GK", name: "골키퍼 (GK)" }],
}

const regions = [
  "서울특별시",
  "부산광역시",
  "대구광역시",
  "인천광역시",
  "광주광역시",
  "대전광역시",
  "울산광역시",
  "세종특별자치시",
  "경기도",
  "강원도",
  "충청북도",
  "충청남도",
  "전라북도",
  "전라남도",
  "경상북도",
  "경상남도",
  "제주특별자치도",
]

const cities = {
  서울특별시: [
    "강남구",
    "강동구",
    "강북구",
    "강서구",
    "관악구",
    "광진구",
    "구로구",
    "금천구",
    "노원구",
    "도봉구",
    "동대문구",
    "동작구",
    "마포구",
    "서대문구",
    "서초구",
    "성동구",
    "성북구",
    "송파구",
    "양천구",
    "영등포구",
    "용산구",
    "은평구",
    "종로구",
    "중구",
    "중랑구",
  ],
  부산광역시: [
    "강서구",
    "금정구",
    "기장군",
    "남구",
    "동구",
    "동래구",
    "부산진구",
    "북구",
    "사상구",
    "사하구",
    "서구",
    "수영구",
    "연제구",
    "영도구",
    "중구",
    "해운대구",
  ],
  대구광역시: ["남구", "달서구", "달성군", "동구", "북구", "서구", "수성구", "중구"],
  인천광역시: ["강화군", "계양구", "미추홀구", "남동구", "동구", "부평구", "서구", "연수구", "옹진군", "중구"],
  광주광역시: ["광산구", "남구", "동구", "북구", "서구"],
  대전광역시: ["대덕구", "동구", "서구", "유성구", "중구"],
  울산광역시: ["남구", "동구", "북구", "울주군", "중구"],
  세종특별자치시: ["세종시"],
  경기도: [
    "수원시",
    "성남시",
    "안양시",
    "안산시",
    "용인시",
    "광명시",
    "평택시",
    "과천시",
    "오산시",
    "시흥시",
    "군포시",
    "의왕시",
    "하남시",
    "이천시",
    "안성시",
    "김포시",
    "화성시",
    "광주시",
    "양주시",
    "포천시",
    "여주시",
    "연천군",
    "가평군",
    "양평군",
    "고양시",
    "남양주시",
    "의정부시",
    "구리시",
    "파주시",
    "동두천시",
  ],
  강원도: [
    "춘천시",
    "원주시",
    "강릉시",
    "동해시",
    "태백시",
    "속초시",
    "삼척시",
    "홍천군",
    "횡성군",
    "영월군",
    "평창군",
    "정선군",
    "철원군",
    "화천군",
    "양구군",
    "인제군",
    "고성군",
    "양양군",
  ],
  충청북도: [
    "청주시",
    "충주시",
    "제천시",
    "보은군",
    "옥천군",
    "영동군",
    "증평군",
    "진천군",
    "괴산군",
    "음성군",
    "단양군",
  ],
  충청남도: [
    "천안시",
    "공주시",
    "보령시",
    "아산시",
    "서산시",
    "논산시",
    "계룡시",
    "당진시",
    "금산군",
    "부여군",
    "서천군",
    "청양군",
    "홍성군",
    "예산군",
    "태안군",
  ],
  전라북도: [
    "전주시",
    "군산시",
    "익산시",
    "정읍시",
    "남원시",
    "김제시",
    "완주군",
    "진안군",
    "무주군",
    "장수군",
    "임실군",
    "순창군",
    "고창군",
    "부안군",
  ],
  전라남도: [
    "목포시",
    "여수시",
    "순천시",
    "나주시",
    "광양시",
    "담양군",
    "곡성군",
    "구례군",
    "고흥군",
    "보성군",
    "화순군",
    "장흥군",
    "강진군",
    "해남군",
    "영암군",
    "무안군",
    "함평군",
    "영광군",
    "장성군",
    "완도군",
    "진도군",
    "신안군",
  ],
  경상북도: [
    "포항시",
    "경주시",
    "김천시",
    "안동시",
    "구미시",
    "영주시",
    "영천시",
    "상주시",
    "문경시",
    "경산시",
    "군위군",
    "의성군",
    "청송군",
    "영양군",
    "영덕군",
    "청도군",
    "고령군",
    "성주군",
    "칠곡군",
    "예천군",
    "봉화군",
    "울진군",
    "울릉군",
  ],
  경상남도: [
    "창원시",
    "진주시",
    "통영시",
    "사천시",
    "김해시",
    "밀양시",
    "거제시",
    "양산시",
    "의령군",
    "함안군",
    "창녕군",
    "고성군",
    "남해군",
    "하동군",
    "산청군",
    "함양군",
    "거창군",
    "합천군",
  ],
  제주특별자치도: ["제주시", "서귀포시"],
}

interface UserRegistrationProps {
  kakaoUserInfo: any
  onRegistrationComplete: (userData: any) => void
}

export function UserRegistration({ kakaoUserInfo, onRegistrationComplete }: UserRegistrationProps) {
  const [formData, setFormData] = useState({
    realName: "",
    phoneNumber: "",
    region: "",
    city: "",
    birthYear: "",
    preferredFoot: "",
    mainPosition: "",
    mainPositionCode: "",
    subPositions: [] as string[],
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const currentYear = new Date().getFullYear()
  const birthYears = Array.from({ length: 50 }, (_, i) => currentYear - 15 - i)

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.realName.trim()) {
      newErrors.realName = "실명을 입력해주세요"
    }

    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = "전화번호를 입력해주세요"
    } else if (!/^\d{10,11}$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = "올바른 전화번호 형식이 아닙니다 (하이픈 없이 숫자만)"
    }

    if (!formData.region) {
      newErrors.region = "지역을 선택해주세요"
    }

    if (!formData.city) {
      newErrors.city = "시/군/구를 선택해주세요"
    }

    if (!formData.birthYear) {
      newErrors.birthYear = "출생연도를 선택해주세요"
    }

    if (!formData.preferredFoot) {
      newErrors.preferredFoot = "주발을 선택해주세요"
    }

    if (!formData.mainPositionCode) {
      newErrors.mainPosition = "주포지션을 선택해주세요"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    try {
      // DB에 회원 정보 저장
      const res = await fetch('/api/user/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          kakaoId: kakaoUserInfo.id.toString(),
          realName: formData.realName,
          phoneNumber: formData.phoneNumber,
          region: formData.region,
          city: formData.city,
          birthYear: formData.birthYear,
          preferredFoot: formData.preferredFoot,
          mainPosition: formData.mainPositionCode,
          subPositions: formData.subPositions,
        })
      })

      const data = await res.json()

      if (res.ok) {
        // 회원가입 성공 시 사용자 정보 전달
        const userData = {
          ...formData,
          kakaoId: kakaoUserInfo.id,
          email: kakaoUserInfo.kakao_account?.email || '',
          nickname: kakaoUserInfo.properties?.nickname || '사용자',
          profileImage: kakaoUserInfo.properties?.profile_image || '',
          registeredAt: new Date().toISOString(),
        }

        onRegistrationComplete(userData)
      } else {
        alert('회원가입 중 오류가 발생했습니다.')
      }
    } catch (error) {
      console.error('Signup error:', error)
      alert('서버 연결 중 오류가 발생했습니다.')
    }
  }

  // 전체 포지션 목록을 평면화
  const allPositions = Object.values(positions).flat()

  // 각 Select에서 사용할 포지션 리스트를 필터링하는 함수들 추가
  const getAvailablePositionsForSub1 = () => {
    return Object.entries(positions).reduce(
      (acc, [group, positionList]) => {
        const filteredPositions = positionList.filter((position) => position.code !== formData.mainPositionCode)
        if (filteredPositions.length > 0) {
          acc[group] = filteredPositions
        }
        return acc
      },
      {} as typeof positions,
    )
  }

  const getAvailablePositionsForSub2 = () => {
    return Object.entries(positions).reduce(
      (acc, [group, positionList]) => {
        const filteredPositions = positionList.filter(
          (position) => position.code !== formData.mainPositionCode && position.code !== formData.subPositions[0],
        )
        if (filteredPositions.length > 0) {
          acc[group] = filteredPositions
        }
        return acc
      },
      {} as typeof positions,
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <Users className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl">회원가입</CardTitle>
            <CardDescription>팀 가입을 위한 기본 정보를 입력해주세요</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 카카오 계정 정보 */}
            <div className="p-4 bg-yellow-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={kakaoUserInfo?.properties?.profile_image || "/placeholder.svg"} />
                  <AvatarFallback>{kakaoUserInfo?.properties?.nickname?.[0] || "K"}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{kakaoUserInfo?.properties?.nickname || "카카오 사용자"}</p>
                  <p className="text-sm text-muted-foreground">{kakaoUserInfo?.kakao_account?.email || "이메일 없음"}</p>
                </div>
              </div>
            </div>

            {/* 기본 정보 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="realName">실명 *</Label>
                <Input
                  id="realName"
                  value={formData.realName}
                  onChange={(e) => setFormData({ ...formData, realName: e.target.value })}
                  placeholder="홍길동"
                />
                {errors.realName && <p className="text-sm text-red-500">{errors.realName}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phoneNumber">전화번호 * (하이픈 없이)</Label>
                <Input
                  id="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value.replace(/\D/g, "") })}
                  placeholder="01012345678"
                  maxLength={11}
                />
                {errors.phoneNumber && <p className="text-sm text-red-500">{errors.phoneNumber}</p>}
              </div>
            </div>

            {/* 지역 정보 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>지역 *</Label>
                <Select
                  value={formData.region}
                  onValueChange={(value) => setFormData({ ...formData, region: value, city: "" })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="지역을 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {regions.map((region) => (
                      <SelectItem key={region} value={region}>
                        {region}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.region && <p className="text-sm text-red-500">{errors.region}</p>}
              </div>

              <div className="space-y-2">
                <Label>시/군/구 *</Label>
                <Select
                  value={formData.city}
                  onValueChange={(value) => setFormData({ ...formData, city: value })}
                  disabled={!formData.region}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="시/군/구를 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {formData.region &&
                      cities[formData.region as keyof typeof cities]?.map((city) => (
                        <SelectItem key={city} value={city}>
                          {city}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                {errors.city && <p className="text-sm text-red-500">{errors.city}</p>}
              </div>
            </div>

            {/* 출생연도 및 주발 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>출생연도 *</Label>
                <Select
                  value={formData.birthYear}
                  onValueChange={(value) => setFormData({ ...formData, birthYear: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="출생연도를 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {birthYears.map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}년
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.birthYear && <p className="text-sm text-red-500">{errors.birthYear}</p>}
              </div>

              <div className="space-y-2">
                <Label>주발 *</Label>
                <Select
                  value={formData.preferredFoot}
                  onValueChange={(value) => setFormData({ ...formData, preferredFoot: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="주발을 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="왼발">왼발</SelectItem>
                    <SelectItem value="오른발">오른발</SelectItem>
                    <SelectItem value="양발">양발</SelectItem>
                  </SelectContent>
                </Select>
                {errors.preferredFoot && <p className="text-sm text-red-500">{errors.preferredFoot}</p>}
              </div>
            </div>

            {/* 주포지션 선택 */}
            <div className="space-y-2">
              <Label>주포지션 *</Label>
              <Select
                value={formData.mainPositionCode}
                onValueChange={(value) => {
                  const selectedPosition = allPositions.find((p) => p.code === value)
                  if (selectedPosition) {
                    // 포지션 그룹 찾기
                    const group =
                      Object.entries(positions).find(([_, positions]) =>
                        positions.some((p) => p.code === value),
                      )?.[0] || ""

                    setFormData({
                      ...formData,
                      mainPosition: group,
                      mainPositionCode: value,
                    })
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="주포지션을 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(positions).map(([group, positionList]) => (
                    <div key={group}>
                      <div className="px-2 py-1 text-sm font-medium text-muted-foreground bg-muted">{group}</div>
                      {positionList.map((position) => (
                        <SelectItem key={position.code} value={position.code}>
                          {position.name}
                        </SelectItem>
                      ))}
                    </div>
                  ))}
                </SelectContent>
              </Select>
              {errors.mainPosition && <p className="text-sm text-red-500">{errors.mainPosition}</p>}
            </div>

            {/* 부포지션 선택 */}
            <div className="space-y-2">
              <Label>부포지션 1 (희망포지션)</Label>
              <Select
                value={formData.subPositions[0] || "선택 안함"}
                onValueChange={(value) => {
                  const newSubPositions = [...formData.subPositions]
                  if (value === "선택 안함") {
                    newSubPositions.splice(0, 1)
                  } else {
                    newSubPositions[0] = value
                  }
                  setFormData({
                    ...formData,
                    subPositions: newSubPositions.filter(Boolean),
                  })
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="부포지션 1을 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="선택 안함">선택 안함</SelectItem>
                  {Object.entries(getAvailablePositionsForSub1()).map(([group, positionList]) => (
                    <div key={group}>
                      <div className="px-2 py-1 text-sm font-medium text-muted-foreground bg-muted">{group}</div>
                      {positionList.map((position) => (
                        <SelectItem key={position.code} value={position.code}>
                          {position.name}
                        </SelectItem>
                      ))}
                    </div>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>부포지션 2 (희망포지션)</Label>
              <Select
                value={formData.subPositions[1] || "선택 안함"}
                onValueChange={(value) => {
                  const newSubPositions = [...formData.subPositions]
                  if (value === "선택 안함") {
                    newSubPositions.splice(1, 1)
                  } else {
                    newSubPositions[1] = value
                  }
                  setFormData({
                    ...formData,
                    subPositions: newSubPositions.filter(Boolean),
                  })
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="부포지션 2를 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="선택 안함">선택 안함</SelectItem>
                  {Object.entries(getAvailablePositionsForSub2()).map(([group, positionList]) => (
                    <div key={group}>
                      <div className="px-2 py-1 text-sm font-medium text-muted-foreground bg-muted">{group}</div>
                      {positionList.map((position) => (
                        <SelectItem key={position.code} value={position.code}>
                          {position.name}
                        </SelectItem>
                      ))}
                    </div>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 가입 완료 버튼 */}
            <Button onClick={handleSubmit} className="w-full" size="lg">
              가입 완료
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Plus, X, Settings, Users, Target, BarChart3, Edit } from 'lucide-react'

// 기본 추천 능력치
const defaultSkills = ["속도", "패스", "수비", "슈팅", "드리블"]

// 포지션 대분류와 기본 중분류
const defaultPositions = {
  "골키퍼": ["GK"],
  "수비수": ["CB", "LB", "RB", "SW"],
  "미드필더": ["CDM", "CM", "CAM", "LM", "RM"],
  "공격수": ["CF", "LW", "RW", "ST"]
}

export function TeamSettings() {
  const [teamName, setTeamName] = useState("FC BRO")
  const [teamDescription, setTeamDescription] = useState("열정적인 아마추어 축구팀")
  const [skillCategories, setSkillCategories] = useState([
    "속도", "패스", "수비", "슈팅", "드리블", "체력", "멘탈"
  ])
  const [newSkill, setNewSkill] = useState("")
  const [positions, setPositions] = useState(defaultPositions)
  const [editingPosition, setEditingPosition] = useState(null)
  const [newSubPosition, setNewSubPosition] = useState("")
  const [autoFormation, setAutoFormation] = useState(true)
  const [balanceByPosition, setBalanceByPosition] = useState(true)
  const [balanceByRating, setBalanceByRating] = useState(true)

  const addSkillCategory = () => {
    if (newSkill.trim() && !skillCategories.includes(newSkill.trim())) {
      setSkillCategories([...skillCategories, newSkill.trim()])
      setNewSkill("")
    }
  }

  const removeSkillCategory = (skill: string) => {
    if (defaultSkills.includes(skill)) return // 기본 능력치는 삭제 불가
    setSkillCategories(skillCategories.filter(s => s !== skill))
  }

  const resetToDefault = () => {
    setSkillCategories([...defaultSkills])
  }

  const addSubPosition = (mainPosition: string) => {
    if (newSubPosition.trim() && !positions[mainPosition].includes(newSubPosition.trim())) {
      setPositions({
        ...positions,
        [mainPosition]: [...positions[mainPosition], newSubPosition.trim()]
      })
      setNewSubPosition("")
    }
  }

  const removeSubPosition = (mainPosition: string, subPosition: string) => {
    // 기본 포지션은 최소 1개 유지
    if (positions[mainPosition].length <= 1) return
    
    setPositions({
      ...positions,
      [mainPosition]: positions[mainPosition].filter(pos => pos !== subPosition)
    })
  }

  const resetPositionsToDefault = () => {
    setPositions(defaultPositions)
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div>
        <h2 className="text-2xl font-bold">팀 설정</h2>
        <p className="text-muted-foreground">팀 정보와 관리 설정을 구성하세요</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 기본 팀 정보 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              기본 팀 정보
            </CardTitle>
            <CardDescription>팀의 기본 정보를 설정합니다</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="teamName">팀 이름</Label>
              <Input 
                id="teamName" 
                value={teamName} 
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="팀 이름을 입력하세요"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="teamDescription">팀 소개</Label>
              <Textarea 
                id="teamDescription" 
                value={teamDescription} 
                onChange={(e) => setTeamDescription(e.target.value)}
                placeholder="팀에 대한 간단한 소개를 입력하세요"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>팀 엠블럼</Label>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Users className="h-8 w-8 text-gray-400" />
                </div>
                <Button variant="outline" size="sm">
                  이미지 업로드
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 팀 편성 설정 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              팀 편성 설정
            </CardTitle>
            <CardDescription>자동 팀 편성 규칙을 설정합니다</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>자동 팀 편성 활성화</Label>
                <p className="text-sm text-muted-foreground">
                  참석자를 기반으로 자동으로 팀을 구성합니다
                </p>
              </div>
              <Switch 
                checked={autoFormation} 
                onCheckedChange={setAutoFormation}
              />
            </div>
            
            <Separator />
            
            <div className="space-y-4">
              <Label className="text-sm font-medium">편성 우선순위</Label>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">1</div>
                  <span>동일한 인원수로 분배</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold">2</div>
                  <span>포지션 균형 맞추기</span>
                  <Switch 
                    checked={balanceByPosition} 
                    onCheckedChange={setBalanceByPosition}
                    disabled={!autoFormation}
                    size="sm"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-xs font-bold">3</div>
                  <span>실력 균형 맞추기</span>
                  <Switch 
                    checked={balanceByRating} 
                    onCheckedChange={setBalanceByRating}
                    disabled={!autoFormation}
                    size="sm"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 포지션 관리 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            포지션 관리
          </CardTitle>
          <CardDescription>
            대분류 포지션과 세부 포지션을 설정합니다. 팀 편성 시 대분류를 우선으로 하고 세부 포지션을 고려합니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <Label>현재 포지션 구성</Label>
            <Button variant="outline" size="sm" onClick={resetPositionsToDefault}>
              기본값으로 초기화
            </Button>
          </div>
          
          <div className="space-y-4">
            {Object.entries(positions).map(([mainPos, subPositions]) => (
              <div key={mainPos} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-lg">{mainPos}</h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingPosition(editingPosition === mainPos ? null : mainPos)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {subPositions.map((subPos) => (
                    <Badge 
                      key={subPos} 
                      variant="secondary"
                      className="flex items-center gap-1"
                    >
                      {subPos}
                      {editingPosition === mainPos && subPositions.length > 1 && (
                        <button
                          onClick={() => removeSubPosition(mainPos, subPos)}
                          className="ml-1 hover:bg-red-100 rounded-full p-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </Badge>
                  ))}
                </div>
                
                {editingPosition === mainPos && (
                  <div className="flex gap-2 mt-3">
                    <Input
                      value={newSubPosition}
                      onChange={(e) => setNewSubPosition(e.target.value)}
                      placeholder="새 세부 포지션 (예: LWB, RWB)"
                      onKeyPress={(e) => e.key === 'Enter' && addSubPosition(mainPos)}
                      className="flex-1"
                    />
                    <Button 
                      onClick={() => addSubPosition(mainPos)} 
                      disabled={!newSubPosition.trim()}
                      size="sm"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
          
          <div className="text-sm text-muted-foreground bg-blue-50 p-3 rounded-lg">
            💡 <strong>팀 편성 시 고려사항:</strong><br/>
            1. 먼저 대분류(골키퍼, 수비수, 미드필더, 공격수)를 균등하게 배분합니다.<br/>
            2. 그 다음 세부 포지션(CB, LB, RB 등)을 고려하여 더 세밀하게 조정합니다.
          </div>
        </CardContent>
      </Card>

      {/* 능력치 관리 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            선수 능력치 관리
          </CardTitle>
          <CardDescription>
            선수 평가에 사용할 능력치 항목을 설정합니다. 모든 항목의 평균이 종합 점수가 됩니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 현재 능력치 목록 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>현재 능력치 항목</Label>
              <Button variant="outline" size="sm" onClick={resetToDefault}>
                기본값으로 초기화
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {skillCategories.map((skill, index) => (
                <Badge 
                  key={index} 
                  variant={defaultSkills.includes(skill) ? "default" : "secondary"}
                  className="flex items-center gap-1 px-3 py-1"
                >
                  {skill}
                  {!defaultSkills.includes(skill) && (
                    <button
                      onClick={() => removeSkillCategory(skill)}
                      className="ml-1 hover:bg-red-100 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </Badge>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              💡 기본 능력치(파란색)는 삭제할 수 없습니다. 추가 능력치만 삭제 가능합니다.
            </p>
          </div>

          <Separator />

          {/* 새 능력치 추가 */}
          <div className="space-y-3">
            <Label>새 능력치 추가</Label>
            <div className="flex gap-2">
              <Input
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                placeholder="예: 리더십, 골키핑, 크로스 등"
                onKeyPress={(e) => e.key === 'Enter' && addSkillCategory()}
              />
              <Button onClick={addSkillCategory} disabled={!newSkill.trim()}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              팀의 특성에 맞는 추가 능력치를 자유롭게 설정하세요. (예: 체력, 멘탈, 리더십 등)
            </p>
          </div>

          {/* 추천 능력치 */}
          <div className="space-y-3">
            <Label>추천 능력치</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {["체력", "멘탈", "리더십", "골키핑", "크로스", "헤딩", "태클", "볼 컨트롤"].map((skill) => (
                <Button
                  key={skill}
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (!skillCategories.includes(skill)) {
                      setSkillCategories([...skillCategories, skill])
                    }
                  }}
                  disabled={skillCategories.includes(skill)}
                  className="justify-start"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  {skill}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 설정 저장 */}
      <div className="flex justify-end gap-4">
        <Button variant="outline">
          취소
        </Button>
        <Button>
          <Settings className="h-4 w-4 mr-2" />
          설정 저장
        </Button>
      </div>
    </div>
  )
}

"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Vote,
  Clock,
  AlertTriangle,
  ShieldAlert,
  Trash2,
  Megaphone,
  HeartPulse,
  TrendingUp,
  ScrollText,
} from "lucide-react"

interface RuleSection {
  id: string
  title: string
  subtitle: string
  icon: React.ReactNode
  theme: { border: string; iconBg: string; iconText: string; badge: string }
  principle: string
  items: { label: string; content: string; tag?: string }[]
}

const ruleSections: RuleSection[] = [
  {
    id: "article-1",
    title: "제1조",
    subtitle: "참석 투표 및 마감",
    icon: <Vote className="h-5 w-5" />,
    theme: {
      border: "border-l-blue-500",
      iconBg: "bg-blue-50",
      iconText: "text-blue-600",
      badge: "bg-blue-100 text-blue-700",
    },
    principle:
      "원활한 경기 준비와 팀 배분을 위해 모든 회원은 정해진 기한 내에 참석 여부를 확정해야 한다.",
    items: [
      {
        label: "투표 마감",
        content:
          "시합전 화요일 밤 12시까지 어플을 통해 투표를 완료한다.",
      },
      {
        label: "미확정 시 투표 방법",
        content:
          "일정이 확실치 않은 경우에는 [불참]으로 우선 투표한다. 이후 일정이 확정되어 참여가 가능해질 경우 즉시 [참석]으로 상태를 변경한다.",
      },
      {
        label: "변경 요청",
        content:
          "팀편성 이후 참석 여부를 변경할 경우, 운영진이 인원수와 팀 밸런스를 재조정할 수 있도록 즉시 알린다.",
      },
      {
        label: "미투표 페널티",
        content:
          "마감 시한까지 상습적으로 투표를 누락하는 인원에 대해서는 페널티를 부여할 수 있다. (확정시 재공지)",
        tag: "검토 중",
      },
      {
        label: "인원 제한 및 게스트 초대",
        content:
          "참석 투표한 팀원은 모두 시합 참여가 가능하며, 투표 마감 결과 참석 인원이 28명 미만일 경우 최대 28명까지 게스트를 초대 허용한다.",
      },
    ],
  },
  {
    id: "article-2",
    title: "제2조",
    subtitle: "지각 및 노쇼",
    icon: <Clock className="h-5 w-5" />,
    theme: {
      border: "border-l-amber-500",
      iconBg: "bg-amber-50",
      iconText: "text-amber-600",
      badge: "bg-amber-100 text-amber-700",
    },
    principle:
      "정해진 경기 시간을 존중하고 팀원들의 대기 시간을 최소화한다.",
    items: [
      {
        label: "집합 시간",
        content:
          "경기 시작 20분 전까지 구장에 도착하여 개인 웜업 및 팀 배정을 확인한다.",
      },
      {
        label: "지각",
        content:
          "집합 시간까지 도착하지 못한 경우, 쿼터 명단에서 제외될 수 있다. (선착순 11명이 선발) 지각을 반복할 경우 페널티를 부여할 수 있다. (확정시 재공지)",
        tag: "검토 중",
      },
      {
        label: "노쇼(No-Show)",
        content:
          "[참석] 투표 후 사전 연락 없이 불참하거나 경기 직전 취소하는 행위는 팀 운영에 큰 차질을 주므로 운영진의 별도 관리를 받는다.",
      },
    ],
  },
  {
    id: "article-3",
    title: "제3조",
    subtitle: "구장 매너 및 뒷정리",
    icon: <Trash2 className="h-5 w-5" />,
    theme: {
      border: "border-l-purple-500",
      iconBg: "bg-purple-50",
      iconText: "text-purple-600",
      badge: "bg-purple-100 text-purple-700",
    },
    principle: "",
    items: [
      {
        label: "정시 퇴장",
        content:
          "다음 타임 대관 팀을 위해 경기 종료 5분 전(08:55)까지 모든 정리를 마치고 퇴장하는 것을 원칙으로 한다.",
      },
      {
        label: "장비 사전 정리",
        content:
          "마지막 쿼터 시작 전 공 가방 및 공용 장비를 사전 정리하여 퇴장 시간을 단축한다.",
      },
      {
        label: "쓰레기 수거",
        content:
          "본인이 발생시킨 쓰레기는 전량 직접 수거한다.",
      },
      {
        label: "절대 금연",
        content:
          "운동장 내 절대 금연한다.",
      },
      {
        label: "소음 자제",
        content:
          "아파트 인근이니 과도한 샤우팅, 환호성 및 소음을 자제한다. (퇴출 사례 많음)",
      },
    ],
  },
  {
    id: "article-4",
    title: "제4조",
    subtitle: "심판 및 경기 진행",
    icon: <Megaphone className="h-5 w-5" />,
    theme: {
      border: "border-l-green-500",
      iconBg: "bg-green-50",
      iconText: "text-green-600",
      badge: "bg-green-100 text-green-700",
    },
    principle:
      "자체 경기 시 모두가 즐거운 경기를 위해 아래 규칙을 준수한다.",
    items: [
      {
        label: "심판 수행",
        content:
          "쿼터별로 쉬는 인원이나 부상자, 혹은 사전에 정해진 순번에 따라 교대로 심판을 맡는다.",
      },
      {
        label: "판정 존중",
        content:
          "심판의 판정은 절대적이며, 경기 중 과도한 항의나 독설로 분위기를 저해하는 행위는 엄금한다.",
      },
      {
        label: "셀프 콜 금지",
        content:
          "심판의 휘슬이 울리기 전까지는 경기를 멈추지 않는 것을 원칙으로 한다.",
      },
      {
        label: "심판의 권한 및 통제",
        content:
          "심판은 경기가 과열되어 부상이 발생하지 않도록 과격한 상황에 대해서 휘슬을 불거나 경기를 중단하며 엄격하게 통제한다.",
      },
      {
        label: "게스트 휴식 원칙",
        content:
          "게스트는 최소 1쿼터 이상 휴식을 원칙으로 한다.",
      },
      {
        label: "쿼터별 휴식인원 결정",
        content:
          "쿼터별 휴식인원은 팀별로 정하며 자발적인 휴식 인원이 충분하지 않을 경우, 휴식하지 않았던 인원들끼리 가위바위보로 정한다.",
      },
      {
        label: "지각자의 휴식 산정",
        content:
          "경기 시작시간보다 늦어서 참여하지 못한 쿼터는 휴식한 쿼터에 포함하지 않는다.",
      },
      {
        label: "골키퍼 포지션 배정",
        content:
          "골키퍼 포지션이 없을 경우 팀에서 자체적으로 정하며 자원하는 인원이 없을 경우 가위바위보로 정한다.",
      },
    ],
  },
  {
    id: "article-5",
    title: "제5조",
    subtitle: "부상 및 안전 관리",
    icon: <HeartPulse className="h-5 w-5" />,
    theme: {
      border: "border-l-red-500",
      iconBg: "bg-red-50",
      iconText: "text-red-600",
      badge: "bg-red-100 text-red-700",
    },
    principle: "",
    items: [
      {
        label: "안전 제일",
        content:
          "자체 경기인만큼 무리한 태클이나 거친 몸싸움은 지양하며, 동료의 안전을 최우선으로 한다.",
      },
      {
        label: "상태 기록",
        content:
          "부상 발생 시 즉시 운영진에게 알리고, 어플 내 '부상 상황' 칸에 부위와 정도를 기록하여 복귀 시점을 관리받는다.",
      },
    ],
  },
  {
    id: "article-6",
    title: "제6조",
    subtitle: "선수 레벨 관리",
    icon: <TrendingUp className="h-5 w-5" />,
    theme: {
      border: "border-l-indigo-500",
      iconBg: "bg-indigo-50",
      iconText: "text-indigo-600",
      badge: "bg-indigo-100 text-indigo-700",
    },
    principle: "",
    items: [
      {
        label: "레벨 체계",
        content:
          "루키, 아마1~5, 세미프로1~3, 프로의 총 10단계의 레벨로 관리된다.",
      },
      {
        label: "자동 팀편성",
        content:
          "레벨당 점수를 부여하여 밸런스 있게 자동팀편성을 한다.",
      },
      {
        label: "수동 팀편성 조정",
        content:
          "자동팀편성 후 부득이한 상황에 따라 수동으로 팀편성을 조정한다.",
      },
      {
        label: "신규 회원 평가",
        content:
          "신규 회원의 경우 몇차례 경기를 보고 난 이후에 평가단이 레벨을 투표한다.",
      },
      {
        label: "분기별 레벨 상향",
        content:
          "레벨은 분기별로 평가단에 의해 저평가된 팀원의 레벨을 상향한다. (하향 없음)",
      },
      {
        label: "특별 상향",
        content:
          "필요에 따라 평가단 내부 발의를 통해 특정 인원의 레벨을 상향한다.",
      },
      {
        label: "연단위 레벨 초기화",
        content:
          "연단위로 레벨이 초기화되며 새롭게 평가단을 지원받고 재평가한다.",
      },
    ],
  },
]

export function TeamRules() {
  return (
    <div className="space-y-5 pb-6">
      {/* 상단 헤더 */}
      <div className="flex items-center gap-3 px-1">
        <div className="p-2.5 rounded-2xl bg-slate-900 shadow-md">
          <ScrollText className="h-5 w-5 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-black text-slate-900 tracking-tight">
            FC 브로 운영 회칙
          </h2>
        </div>
      </div>

      {/* 규칙 섹션들 */}
      {ruleSections.map((section) => (
        <Card
          key={section.id}
          className={`overflow-hidden border-l-4 ${section.theme.border} shadow-sm`}
        >
          <CardHeader className="pb-2 pt-4 px-4">
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-xl ${section.theme.iconBg} ${section.theme.iconText}`}
              >
                {section.icon}
              </div>
              <div className="flex-1 min-w-0">
                <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                  {section.title}
                  <Badge
                    variant="secondary"
                    className={`text-[11px] font-bold px-2 py-0.5 ${section.theme.badge} border-0`}
                  >
                    {section.subtitle}
                  </Badge>
                </CardTitle>
              </div>
            </div>
            {section.principle && (
              <p className="text-[13px] text-slate-600 leading-relaxed mt-2 pl-[52px]">
                {section.principle}
              </p>
            )}
          </CardHeader>

          <CardContent className="px-4 pb-4 pt-1">
            <div className="space-y-3">
              {section.items.map((item, idx) => (
                <div key={idx}>
                  {idx > 0 && <Separator className="mb-3 bg-slate-100" />}
                  <div className="flex gap-3">
                    {/* 번호 */}
                    <div className="flex-shrink-0 mt-0.5">
                      <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-slate-100 text-[11px] font-bold text-slate-500">
                        {idx + 1}
                      </span>
                    </div>
                    {/* 내용 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[13px] font-bold text-slate-800">
                          {item.label}
                        </span>
                        {item.tag && (
                          <Badge
                            variant="outline"
                            className="text-[10px] px-1.5 py-0 border-amber-300 text-amber-600 bg-amber-50"
                          >
                            {item.tag}
                          </Badge>
                        )}
                      </div>
                      <p className="text-[12.5px] text-slate-600 leading-relaxed">
                        {item.content}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

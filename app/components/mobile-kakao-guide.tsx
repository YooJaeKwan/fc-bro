"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger 
} from "@/components/ui/dialog"
import { 
  Smartphone, 
  ExternalLink, 
  AlertCircle, 
  CheckCircle, 
  HelpCircle,
  RefreshCw
} from "lucide-react"

interface MobileKakaoGuideProps {
  onRetry: () => void
  isVisible: boolean
}

export function MobileKakaoGuide({ onRetry, isVisible }: MobileKakaoGuideProps) {
  const [showDetailGuide, setShowDetailGuide] = useState(false)

  if (!isVisible) return null

  const isMobile = () => {
    if (typeof window === 'undefined') return false
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  }

  const getBrowserInfo = () => {
    if (typeof window === 'undefined') return 'unknown'
    const userAgent = navigator.userAgent
    
    if (userAgent.includes('Instagram')) return { name: '인스타그램', needsGuide: true }
    if (userAgent.includes('KAKAOTALK')) return { name: '카카오톡', needsGuide: false }
    if (userAgent.includes('Chrome')) return { name: '크롬', needsGuide: false }
    if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) return { name: '사파리', needsGuide: true }
    if (userAgent.includes('Firefox')) return { name: '파이어폭스', needsGuide: false }
    
    return { name: '알 수 없음', needsGuide: true }
  }

  const mobile = isMobile()
  const browser = getBrowserInfo()

  return (
    <div className="space-y-4">
      {/* 모바일 로그인 안내 */}
      {mobile && browser.needsGuide && (
        <Alert className="bg-yellow-50 border-yellow-200">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            <div className="space-y-2">
              <p className="font-medium">모바일에서 로그인이 어려우신가요?</p>
              <p className="text-sm">
                {browser.name} 브라우저에서는 팝업이 차단될 수 있습니다.
              </p>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* 액션 버튼들 */}
      <div className="flex flex-col space-y-3">
        <Button 
          onClick={onRetry} 
          className="w-full"
          variant="outline"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          다시 시도하기
        </Button>

        {mobile && (
          <Dialog open={showDetailGuide} onOpenChange={setShowDetailGuide}>
            <DialogTrigger asChild>
              <Button variant="ghost" className="w-full">
                <HelpCircle className="mr-2 h-4 w-4" />
                모바일 로그인 도움말
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-sm">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Smartphone className="h-5 w-5" />
                  모바일 로그인 가이드
                </DialogTitle>
                <DialogDescription>
                  원활한 로그인을 위한 팁을 확인하세요.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base text-green-700">
                      <CheckCircle className="inline mr-2 h-4 w-4" />
                      추천 방법
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2">
                      <Badge variant="outline" className="bg-green-50">1단계</Badge>
                      <p className="text-sm">
                        <strong>크롬 브라우저</strong>에서 접속하세요.
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Badge variant="outline" className="bg-blue-50">2단계</Badge>
                      <p className="text-sm">
                        팝업 차단이 해제되어 있는지 확인하세요.
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Badge variant="outline" className="bg-purple-50">3단계</Badge>
                      <p className="text-sm">
                        카카오톡 앱이 설치되어 있다면 자동으로 연동됩니다.
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {browser.name === '인스타그램' && (
                  <Alert className="bg-orange-50 border-orange-200">
                    <AlertCircle className="h-4 w-4 text-orange-600" />
                    <AlertDescription className="text-orange-800">
                      <p className="font-medium mb-1">인스타그램 앱에서 접속하셨나요?</p>
                      <p className="text-sm">
                        인스타그램 내장 브라우저는 팝업을 지원하지 않습니다. 
                        하단의 <ExternalLink className="inline h-3 w-3" /> 버튼을 눌러 
                        외부 브라우저로 열어주세요.
                      </p>
                    </AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <h4 className="font-medium text-sm">문제가 계속 발생한다면:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• 브라우저 캐시 삭제</li>
                    <li>• 시크릿/인코그니토 모드 사용</li>
                    <li>• 다른 브라우저로 시도</li>
                  </ul>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* 브라우저별 특별 안내 */}
      {mobile && browser.name === '사파리' && (
        <Alert className="bg-blue-50 border-blue-200">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <p className="font-medium mb-1">Safari 브라우저 사용 중</p>
            <p className="text-sm">
              설정 → Safari → 팝업 차단 해제를 확인해주세요.
            </p>
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}

"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, CheckCircle, Database, Loader2 } from "lucide-react"

interface DBTestResult {
  connected: boolean
  error?: string
  userCount?: number
  teamCount?: number
  scheduleCount?: number
  sampleUsers?: any[]
}

export default function DatabaseTestPage() {
  const [testing, setTesting] = useState(false)
  const [result, setResult] = useState<DBTestResult | null>(null)

  const testDatabase = async () => {
    setTesting(true)
    setResult(null)

    try {
      const response = await fetch('/api/test-db', {
        method: 'GET',
      })

      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({
        connected: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류'
      })
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">NeonDB 연결 테스트</h1>
        <p className="text-muted-foreground">
          데이터베이스 연결 상태와 테이블 정보를 확인합니다.
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            데이터베이스 연결 테스트
          </CardTitle>
          <CardDescription>
            NeonDB PostgreSQL 데이터베이스와의 연결을 테스트합니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={testDatabase} 
            disabled={testing}
            className="w-full"
          >
            {testing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                테스트 중...
              </>
            ) : (
              <>
                <Database className="mr-2 h-4 w-4" />
                데이터베이스 연결 테스트 시작
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {result.connected ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  연결 성공
                </>
              ) : (
                <>
                  <AlertCircle className="h-5 w-5 text-red-500" />
                  연결 실패
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {result.connected ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">사용자</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{result.userCount}</div>
                      <p className="text-sm text-muted-foreground">명의 사용자</p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">팀</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{result.teamCount}</div>
                      <p className="text-sm text-muted-foreground">개의 팀</p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">일정</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{result.scheduleCount}</div>
                      <p className="text-sm text-muted-foreground">개의 일정</p>
                    </CardContent>
                  </Card>
                </div>

                {result.sampleUsers && result.sampleUsers.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3">샘플 사용자 데이터</h3>
                    <div className="space-y-2">
                      {result.sampleUsers.map((user, index) => (
                        <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <div className="font-medium">
                              {user.name || user.nickname || '이름없음'}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              ID: {user.id}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={user.role === 'ADMIN' ? 'default' : 'secondary'}>
                              {user.role}
                            </Badge>
                            <div className="text-sm text-muted-foreground">
                              {new Date(user.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="space-y-4">
                <div className="p-4 border border-red-200 rounded-lg bg-red-50">
                  <h3 className="font-semibold text-red-800 mb-2">오류 정보</h3>
                  <p className="text-red-700">{result.error}</p>
                </div>
                
                <div className="p-4 border border-yellow-200 rounded-lg bg-yellow-50">
                  <h3 className="font-semibold text-yellow-800 mb-2">확인 사항</h3>
                  <ul className="text-yellow-700 space-y-1">
                    <li>• .env.local 파일에 DATABASE_URL이 설정되어 있는가?</li>
                    <li>• NeonDB 프로젝트가 활성화되어 있는가?</li>
                    <li>• 데이터베이스 URL이 올바른 형식인가?</li>
                    <li>• 마이그레이션이 실행되었는가?</li>
                  </ul>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}


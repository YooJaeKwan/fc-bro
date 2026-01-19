import { NextRequest, NextResponse } from 'next/server'

// Redirect URI - 환경변수에서 가져옴 (클라이언트와 동일한 값 사용)
const getRedirectUri = () => {
    return process.env.NEXT_PUBLIC_KAKAO_REDIRECT_URI || 'http://localhost:3000/auth/kakao/callback'
}

export async function POST(request: NextRequest) {
    try {
        const { code } = await request.json()

        if (!code) {
            return NextResponse.json(
                { error: '인가 코드가 없습니다.' },
                { status: 400 }
            )
        }

        const clientId = process.env.KAKAO_CLIENT_ID
        const clientSecret = process.env.KAKAO_CLIENT_SECRET
        const redirectUri = getRedirectUri()

        console.log('토큰 교환 - Redirect URI:', redirectUri)

        if (!clientId) {
            return NextResponse.json(
                { error: '카카오 클라이언트 ID가 설정되지 않았습니다.' },
                { status: 500 }
            )
        }

        // 인가 코드로 액세스 토큰 요청
        const tokenParams = new URLSearchParams({
            grant_type: 'authorization_code',
            client_id: clientId,
            redirect_uri: redirectUri,
            code: code,
        })

        if (clientSecret) {
            tokenParams.append('client_secret', clientSecret)
        }

        console.log('토큰 요청 파라미터:', {
            grant_type: 'authorization_code',
            client_id: clientId,
            redirect_uri: redirectUri,
            code: code.substring(0, 10) + '...',
        })

        const tokenResponse = await fetch('https://kauth.kakao.com/oauth/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: tokenParams.toString(),
        })

        const tokenData = await tokenResponse.json()

        if (tokenData.error) {
            console.error('토큰 요청 오류:', tokenData)
            return NextResponse.json(
                { error: `토큰 요청 실패: ${tokenData.error_description || tokenData.error}` },
                { status: 400 }
            )
        }

        console.log('토큰 획득 성공')

        // 액세스 토큰으로 사용자 정보 요청
        const userResponse = await fetch('https://kapi.kakao.com/v2/user/me', {
            headers: {
                Authorization: `Bearer ${tokenData.access_token}`,
                'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
            },
        })

        const userInfo = await userResponse.json()

        if (userInfo.error) {
            console.error('사용자 정보 요청 오류:', userInfo)
            return NextResponse.json(
                { error: `사용자 정보 요청 실패: ${userInfo.error}` },
                { status: 400 }
            )
        }

        console.log('사용자 정보 획득 성공:', userInfo.id)

        return NextResponse.json({
            userInfo: userInfo,
            accessToken: tokenData.access_token,
        })
    } catch (error) {
        console.error('카카오 토큰 교환 중 오류:', error)
        return NextResponse.json(
            { error: '서버 오류가 발생했습니다.' },
            { status: 500 }
        )
    }
}

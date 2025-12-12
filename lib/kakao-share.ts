// 카카오톡 공유 유틸리티

// 카카오 SDK 타입 확장
declare global {
  interface Window {
    Kakao: {
      init: (appKey: string) => void
      isInitialized: () => boolean
      Share: {
        sendDefault: (options: {
          objectType: string
          content: {
            title: string
            description: string
            imageUrl?: string
            link: {
              mobileWebUrl?: string
              webUrl?: string
            }
          }
          buttons?: Array<{
            title: string
            link: {
              mobileWebUrl?: string
              webUrl?: string
            }
          }>
        }) => void
      }
    }
  }
}

// 카카오 SDK 초기화 확인
export function isKakaoSDKReady(): boolean {
  return typeof window !== 'undefined' && 
         window.Kakao && 
         window.Kakao.isInitialized()
}

// 카카오톡 링크 공유
export function shareToKakaoTalk(shareData: {
  title: string
  description: string
  imageUrl?: string
  webUrl?: string
}) {
  if (!isKakaoSDKReady()) {
    // SDK가 없으면 텍스트를 클립보드에 복사
    const text = `${shareData.title}\n\n${shareData.description}`
    copyToClipboard(text)
    alert('텍스트가 클립보드에 복사되었습니다. 카카오톡에서 붙여넣기 하세요.')
    return
  }

  try {
    window.Kakao.Share.sendDefault({
      objectType: 'text',
      content: {
        title: shareData.title,
        description: shareData.description,
        imageUrl: shareData.imageUrl,
        link: {
          mobileWebUrl: shareData.webUrl || window.location.href,
          webUrl: shareData.webUrl || window.location.href,
        },
      },
    })
  } catch (error) {
    console.error('카카오톡 공유 오류:', error)
    // 실패 시 클립보드에 복사
    const text = `${shareData.title}\n\n${shareData.description}`
    copyToClipboard(text)
    alert('카카오톡 공유에 실패했습니다. 텍스트가 클립보드에 복사되었습니다.')
  }
}

// 클립보드에 텍스트 복사
export function copyToClipboard(text: string): Promise<boolean> {
  return new Promise((resolve) => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text)
        .then(() => {
          resolve(true)
        })
        .catch(() => {
          // 클립보드 API 실패 시 fallback
          fallbackCopyToClipboard(text)
          resolve(false)
        })
    } else {
      fallbackCopyToClipboard(text)
      resolve(false)
    }
  })
}

// 클립보드 복사 fallback (구형 브라우저 지원)
function fallbackCopyToClipboard(text: string) {
  const textArea = document.createElement('textarea')
  textArea.value = text
  textArea.style.position = 'fixed'
  textArea.style.left = '-999999px'
  textArea.style.top = '-999999px'
  document.body.appendChild(textArea)
  textArea.focus()
  textArea.select()
  
  try {
    document.execCommand('copy')
  } catch (err) {
    console.error('클립보드 복사 실패:', err)
  }
  
  document.body.removeChild(textArea)
}


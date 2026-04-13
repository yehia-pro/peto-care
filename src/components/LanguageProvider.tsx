import { useEffect } from 'react'
import { useLanguageStore } from '@/stores/languageStore'
import { API_BASE_URL } from '@/services/api';

export default function LanguageProvider({ children }: { children: React.ReactNode }) {
  const { setLanguage, currentLanguage } = useLanguageStore()

  useEffect(() => {
    const storedLang = localStorage.getItem('i18nextLng') || 'ar'
    if (storedLang === 'ar' || storedLang === 'en') {
      setLanguage(storedLang as 'ar' | 'en')
    } else {
      setLanguage('ar')
    }

    if (typeof window !== 'undefined') {
      (window as any).translateWithGemini = async (text: string, target = 'en') => {
        const hasKey = Boolean((import.meta as any).env?.VITE_GEMINI_API_KEY)
        if (!hasKey) return text
        try {
          const res = await fetch(API_BASE_URL + '/gemini/translate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text, target })
          })
          if (!res.ok) return text
          const json = await res.json()
          return json.translated || text
        } catch (e) {
          console.warn('Gemini translate failed', e)
          return text
        }
      }
    }
  }, [setLanguage])

  useEffect(() => {
    const enforceDirection = () => {
      if (typeof document !== 'undefined') {
        const dir = currentLanguage === 'ar' ? 'rtl' : 'ltr'
        document.documentElement.setAttribute('dir', dir)
        document.documentElement.setAttribute('lang', currentLanguage)
        document.documentElement.classList.remove('ltr', 'rtl')
        document.documentElement.classList.add(dir)
      }
    }
    
    enforceDirection()
    
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && (mutation.attributeName === 'dir' || mutation.attributeName === 'lang')) {
          const target = mutation.target as HTMLElement;
          if (target === document.documentElement) {
            const dir = currentLanguage === 'ar' ? 'rtl' : 'ltr'
            const currentDir = target.getAttribute('dir');
            const currentLang = target.getAttribute('lang');
            if (currentDir !== dir || currentLang !== currentLanguage) {
              enforceDirection();
            }
          }
        }
      });
    });
    
    if (typeof document !== 'undefined') {
      observer.observe(document.documentElement, { attributes: true });
    }
    
    return () => observer.disconnect();
  }, [currentLanguage])

  return <>{children}</>
}

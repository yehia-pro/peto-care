import { create } from 'zustand'
import i18n from '../i18n'

export type LanguageCode = 'ar' | 'en'

interface LanguageState {
  currentLanguage: LanguageCode
  setLanguage: (language: LanguageCode) => Promise<void>
  t: (key: string, options?: any) => string
}

export const useLanguageStore = create<LanguageState>((set) => ({
  currentLanguage: (localStorage.getItem('i18nextLng') as LanguageCode) || 'ar',

  setLanguage: async (language: LanguageCode) => {
    await i18n.changeLanguage(language)
    set({ currentLanguage: language })

    const dir = language === 'ar' ? 'rtl' : 'ltr'
    document.documentElement.dir = dir
    document.documentElement.lang = language
    document.documentElement.classList.remove('ltr', 'rtl')
    document.documentElement.classList.add(dir)
  },

  t: (key: string, options?: any) => {
    return String(i18n.t(key, options))
  }
}))

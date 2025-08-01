'use client'

import { useTranslations } from 'next-intl'
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Globe } from "lucide-react"
import { useLanguage, type Locale } from "@/hooks/useLanguage"

export function LanguageToggle() {
  const { changeLanguage, getCurrentLanguage, isPending } = useLanguage()
  const t = useTranslations()
  const currentLanguage = getCurrentLanguage()

  const languages: { code: Locale; name: string }[] = [
    { code: 'zh', name: t('languages.zh') },
    { code: 'en', name: t('languages.en') },
    { code: 'ja', name: t('languages.ja') },
  ]

  const handleLanguageChange = (locale: Locale) => {
    changeLanguage(locale)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          disabled={isPending}
        >
          <Globe className="h-4 w-4" />
          <span className="sr-only">{t('settings.language')}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {languages.map((language) => (
          <DropdownMenuItem
            key={language.code}
            onClick={() => handleLanguageChange(language.code)}
            className={currentLanguage === language.code ? "bg-accent" : ""}
          >
            {language.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

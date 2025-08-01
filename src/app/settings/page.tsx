'use client'

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { useTranslations } from 'next-intl'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast, ToastContainer } from "@/components/Toast"
import { ArrowLeft, User, Palette, Bell, Shield, Database } from "lucide-react"
import { AuthGuard } from "@/components/AuthGuard"
import { PageAccessControl } from "@/components/PageAccessControl"
import { PersonalPreferences } from "@/components/settings/PersonalPreferences"
import { NoteSettings } from "@/components/settings/NoteSettings"
import { NotificationSettings } from "@/components/settings/NotificationSettings"
import { PrivacySettings } from "@/components/settings/PrivacySettings"
import { DataSettings } from "@/components/settings/DataSettings"

export default function SettingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toasts, toast, removeToast } = useToast()
  const [activeTab, setActiveTab] = useState("preferences")
  const t = useTranslations()

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
    }
  }, [status, router])

  if (status === "loading") {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 min-h-screen">
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">{t('common.loading')}</div>
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <AuthGuard>
      <PageAccessControl allowedForBanned={false} showBannedAlert={false}>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 min-h-screen">
        <div className="max-w-6xl mx-auto">
          {/* 页面标题和返回按钮 */}
          <div className="mb-6 sm:mb-8">
            <div className="flex items-center gap-4 mb-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/')}
                className="h-8 w-8 p-0"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground">
                  {t('settings.title')}
                </h1>
                <p className="text-muted-foreground mt-1">
                  自定义您的便签系统体验
                </p>
              </div>
            </div>
          </div>

          {/* 设置标签页 */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 h-auto p-1">
              <TabsTrigger value="preferences" className="flex items-center gap-2 py-2">
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">{t('settings.personalPreferences')}</span>
              </TabsTrigger>
              <TabsTrigger value="notes" className="flex items-center gap-2 py-2">
                <Palette className="h-4 w-4" />
                <span className="hidden sm:inline">{t('settings.noteSettings')}</span>
              </TabsTrigger>
              <TabsTrigger value="notifications" className="flex items-center gap-2 py-2">
                <Bell className="h-4 w-4" />
                <span className="hidden sm:inline">{t('settings.notificationSettings')}</span>
              </TabsTrigger>
              <TabsTrigger value="privacy" className="flex items-center gap-2 py-2">
                <Shield className="h-4 w-4" />
                <span className="hidden sm:inline">{t('settings.privacySettings')}</span>
              </TabsTrigger>
              <TabsTrigger value="data" className="flex items-center gap-2 py-2">
                <Database className="h-4 w-4" />
                <span className="hidden sm:inline">{t('settings.dataSettings')}</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="preferences">
              <PersonalPreferences toast={toast} />
            </TabsContent>

            <TabsContent value="notes">
              <NoteSettings toast={toast} />
            </TabsContent>

            <TabsContent value="notifications">
              <NotificationSettings toast={toast} />
            </TabsContent>

            <TabsContent value="privacy">
              <PrivacySettings toast={toast} />
            </TabsContent>

            <TabsContent value="data">
              <DataSettings toast={toast} />
            </TabsContent>
          </Tabs>
        </div>

        <ToastContainer toasts={toasts} onRemove={removeToast} />
        </div>
      </PageAccessControl>
    </AuthGuard>
  )
}

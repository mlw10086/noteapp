'use client'

import { ScheduledNotesManager } from "@/components/ScheduledNotesManager"
import { AuthGuard } from "@/components/AuthGuard"
import { PageAccessControl } from "@/components/PageAccessControl"
import { useToast, ToastContainer } from "@/components/Toast"

export default function ScheduledPage() {
  const { toasts, toast, removeToast } = useToast()

  return (
    <AuthGuard>
      <PageAccessControl allowedForBanned={false} showBannedAlert={false}>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 min-h-screen custom-scrollbar">
        <div className="max-w-7xl mx-auto">
        {/* 页面标题 */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-2">
            定时便签管理
          </h1>
          <p className="text-muted-foreground">
            管理所有定时发布的便签，支持编辑发布时间、立即发布或删除操作
          </p>
        </div>

        {/* 定时便签管理器 */}
        <ScheduledNotesManager toast={toast} />

        {/* Toast 容器 */}
        <ToastContainer toasts={toasts} onRemove={removeToast} />
        </div>
        </div>
      </PageAccessControl>
    </AuthGuard>
  )
}

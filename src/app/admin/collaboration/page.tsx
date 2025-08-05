'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Settings, Activity, Clock } from "lucide-react"
import { CollaborationMonitor } from "@/components/CollaborationMonitor"
import { CollaborationControlPanel } from "@/components/CollaborationControlPanel"
import { useToast, ToastContainer } from "@/components/Toast"
import { AdminLayout } from "@/components/admin/AdminLayout"

export default function CollaborationManagePage() {
  const { toasts, toast, removeToast } = useToast()

  return (
    <AdminLayout
      title="协作管理"
      description="管理实时协作功能，监控协作房间状态，控制协作开关和定时设置"
      requiredRole="admin"
    >

      <div className="space-y-6">
        {/* 功能概览卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">实时监控</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">实时</div>
              <p className="text-xs text-muted-foreground">
                监控活跃协作房间和用户状态
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">协作控制</CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">全局</div>
              <p className="text-xs text-muted-foreground">
                控制协作功能的开启和关闭
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">定时管理</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">智能</div>
              <p className="text-xs text-muted-foreground">
                设置协作功能的定时开关
              </p>
            </CardContent>
          </Card>
        </div>

        {/* 主要功能区域 */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* 协作控制面板 */}
          <div className="space-y-6">
            <CollaborationControlPanel toast={toast} />
          </div>

          {/* 实时监控面板 */}
          <div className="space-y-6">
            <CollaborationMonitor toast={toast} />
          </div>
        </div>

        {/* Toast 容器 */}
        <ToastContainer toasts={toasts} onRemove={removeToast} />
      </div>
    </AdminLayout>
  )
}

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Wrench, Clock, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { prisma } from "@/lib/prisma"

async function getMaintenanceMessage() {
  try {
    const setting = await prisma.siteSettings.findUnique({
      where: { key: 'site_maintenance_message' }
    })
    return setting?.value || '系统正在维护中，请稍后再试。'
  } catch (error) {
    return '系统正在维护中，请稍后再试。'
  }
}

export default async function MaintenancePage() {
  const message = await getMaintenanceMessage()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900">
            <Wrench className="h-8 w-8 text-orange-600 dark:text-orange-400" />
          </div>
          <CardTitle className="text-2xl font-bold">系统维护中</CardTitle>
          <CardDescription>
            我们正在对系统进行维护升级
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground whitespace-pre-line">
              {message}
            </p>
          </div>
          
          <div className="flex items-center justify-center text-sm text-muted-foreground">
            <Clock className="h-4 w-4 mr-2" />
            预计维护时间：30分钟 - 2小时
          </div>
          
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">
              如有紧急问题，请联系管理员
            </p>
            
            <Button variant="outline" className="w-full" asChild>
              <Link href="/">
                <ArrowLeft className="h-4 w-4 mr-2" />
                返回首页
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

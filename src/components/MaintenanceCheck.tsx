import { redirect } from 'next/navigation'
import { isMaintenanceMode } from '@/lib/maintenance-check'

interface MaintenanceCheckProps {
  children: React.ReactNode
  skipPaths?: string[]
}

export async function MaintenanceCheck({ 
  children, 
  skipPaths = ['/admin', '/maintenance', '/api'] 
}: MaintenanceCheckProps) {
  // 检查当前路径是否需要跳过维护模式检查
  const currentPath = typeof window !== 'undefined' ? window.location.pathname : ''
  const shouldSkip = skipPaths.some(path => currentPath.startsWith(path))
  
  if (shouldSkip) {
    return <>{children}</>
  }

  // 检查维护模式
  const maintenanceMode = await isMaintenanceMode()
  
  if (maintenanceMode) {
    redirect('/maintenance')
  }

  return <>{children}</>
}

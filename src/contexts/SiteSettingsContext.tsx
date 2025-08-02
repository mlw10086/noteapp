'use client'

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'

interface SiteSettings {
  site_name?: string
  site_description?: string
  site_logo?: string
  site_favicon?: string
  contact_email?: string
  maintenance_mode?: boolean
  maintenance_message?: string
  [key: string]: any
}

interface SiteSettingsContextType {
  settings: SiteSettings
  loading: boolean
  error: string | null
  refreshSettings: () => Promise<void>
  isMaintenanceMode: boolean
}

const SiteSettingsContext = createContext<SiteSettingsContextType | undefined>(undefined)

const CACHE_KEY = 'site_settings_cache'
const VERSION_KEY = 'site_settings_version'

interface CachedSettings {
  settings: SiteSettings
  version: number
  timestamp: number
}

export function SiteSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SiteSettings>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 从 localStorage 获取缓存
  const getCachedSettings = (): CachedSettings | null => {
    if (typeof window === 'undefined') return null
    
    try {
      const cached = localStorage.getItem(CACHE_KEY)
      if (cached) {
        const data = JSON.parse(cached) as CachedSettings
        // 检查缓存是否过期（24小时）
        const isExpired = Date.now() - data.timestamp > 24 * 60 * 60 * 1000
        if (!isExpired) {
          return data
        }
      }
    } catch (error) {
      console.error('读取缓存设置失败:', error)
    }
    return null
  }

  // 保存设置到 localStorage
  const setCachedSettings = (settings: SiteSettings, version: number) => {
    if (typeof window === 'undefined') return
    
    try {
      const cacheData: CachedSettings = {
        settings,
        version,
        timestamp: Date.now()
      }
      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData))
      localStorage.setItem(VERSION_KEY, version.toString())
    } catch (error) {
      console.error('保存缓存设置失败:', error)
    }
  }

  // 获取当前缓存版本
  const getCachedVersion = (): number => {
    if (typeof window === 'undefined') return 0
    
    try {
      const version = localStorage.getItem(VERSION_KEY)
      return version ? parseInt(version, 10) : 0
    } catch {
      return 0
    }
  }

  // 从服务器获取设置
  const fetchSettings = async (force = false) => {
    try {
      setError(null)
      
      // 如果不是强制刷新，先检查缓存
      if (!force) {
        const cached = getCachedSettings()
        if (cached) {
          setSettings(cached.settings)
          setLoading(false)
          
          // 后台检查是否有更新
          checkForUpdates(cached.version)
          return
        }
      }

      setLoading(true)
      const response = await fetch('/api/settings/public')
      
      if (!response.ok) {
        throw new Error('获取设置失败')
      }

      const data = await response.json()
      
      if (data.error) {
        throw new Error(data.error)
      }

      const newSettings = data.settings || {}
      const newVersion = data.version || Date.now()

      setSettings(newSettings)
      setCachedSettings(newSettings, newVersion)
      
    } catch (err) {
      console.error('获取站点设置失败:', err)
      setError(err instanceof Error ? err.message : '获取设置失败')
      
      // 如果网络请求失败，尝试使用缓存
      const cached = getCachedSettings()
      if (cached) {
        setSettings(cached.settings)
      }
    } finally {
      setLoading(false)
    }
  }

  // 后台检查更新
  const checkForUpdates = async (currentVersion: number) => {
    try {
      const response = await fetch('/api/settings/public')
      if (response.ok) {
        const data = await response.json()
        const serverVersion = data.version || 0
        
        // 如果服务器版本更新，刷新设置
        if (serverVersion > currentVersion) {
          console.log('检测到设置更新，正在刷新...')
          const newSettings = data.settings || {}
          setSettings(newSettings)
          setCachedSettings(newSettings, serverVersion)
        }
      }
    } catch (error) {
      // 静默失败，不影响用户体验
      console.debug('后台检查更新失败:', error)
    }
  }

  // 手动刷新设置
  const refreshSettings = async () => {
    await fetchSettings(true)
  }

  // 初始化加载
  useEffect(() => {
    fetchSettings()
  }, [])

  // 监听存储变化（多标签页同步）
  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === CACHE_KEY && e.newValue) {
        try {
          const data = JSON.parse(e.newValue) as CachedSettings
          setSettings(data.settings)
        } catch (error) {
          console.error('同步设置失败:', error)
        }
      } else if (e.key === 'site_settings_updated') {
        // 管理端更新了设置，强制刷新
        console.log('检测到设置更新，正在刷新...')
        fetchSettings(true)
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  const value: SiteSettingsContextType = {
    settings,
    loading,
    error,
    refreshSettings,
    isMaintenanceMode: settings.maintenance_mode === true
  }

  return (
    <SiteSettingsContext.Provider value={value}>
      {children}
    </SiteSettingsContext.Provider>
  )
}

export function useSiteSettings() {
  const context = useContext(SiteSettingsContext)
  if (context === undefined) {
    throw new Error('useSiteSettings must be used within a SiteSettingsProvider')
  }
  return context
}

// 便捷 hooks
export function useSiteName() {
  const { settings } = useSiteSettings()
  return settings.site_name || '便签系统'
}

export function useSiteDescription() {
  const { settings } = useSiteSettings()
  return settings.site_description || '现代化的便签管理系统'
}

export function useMaintenanceMode() {
  const { isMaintenanceMode, settings } = useSiteSettings()
  return {
    isMaintenanceMode,
    message: settings.maintenance_message || '系统正在维护中，请稍后再试。'
  }
}

'use client'

import { useState, useEffect, useCallback } from 'react'

interface AutoSaveSettings {
  autoSave: boolean
  autoSaveInterval: number // 自动保存间隔（秒）
}

export function useAutoSave() {
  const [settings, setSettings] = useState<AutoSaveSettings>({
    autoSave: true,
    autoSaveInterval: 10 // 默认10秒
  })
  const [loading, setLoading] = useState(true)

  const loadSettings = useCallback(async () => {
    try {
      const response = await fetch('/api/user/privacy-settings')
      if (response.ok) {
        const data = await response.json()
        setSettings({
          autoSave: data.autoSave ?? true,
          autoSaveInterval: data.autoSaveInterval ?? 10
        })
      }
    } catch (error) {
      console.error('加载自动保存设置失败:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadSettings()
  }, [loadSettings])

  return {
    ...settings,
    loading,
    refreshSettings: loadSettings
  }
}

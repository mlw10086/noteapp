'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast, ToastContainer } from '@/components/Toast'

export default function TestCollaborationPage() {
  const [noteId, setNoteId] = useState('1')
  const [userId, setUserId] = useState('1')
  const [receiverId, setReceiverId] = useState('2')
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const { toasts, toast, removeToast } = useToast()

  const testAddCollaborator = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/test/collaboration', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'add_collaborator',
          noteId,
          receiverId,
          permission: 'edit'
        }),
      })

      const data = await response.json()
      setResult(data)
      
      if (data.success) {
        toast('协作者添加成功', 'success')
      } else {
        toast(data.message || '操作失败', 'error')
      }
    } catch (error) {
      console.error('测试失败:', error)
      toast('网络错误', 'error')
    } finally {
      setLoading(false)
    }
  }

  const testCreateInvitation = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/test/collaboration', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'create_invitation',
          noteId,
          userId,
          receiverId,
          permission: 'edit'
        }),
      })

      const data = await response.json()
      setResult(data)
      
      if (data.success) {
        toast('邀请创建成功', 'success')
      } else {
        toast(data.message || '操作失败', 'error')
      }
    } catch (error) {
      console.error('测试失败:', error)
      toast('网络错误', 'error')
    } finally {
      setLoading(false)
    }
  }

  const testCheckAccess = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/test/collaboration', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'check_access',
          noteId,
          userId: receiverId // 检查被邀请者的权限
        }),
      })

      const data = await response.json()
      setResult(data)
      
      if (data.success) {
        toast(`访问权限: ${data.access}`, 'success')
      } else {
        toast(data.message || '无权访问', 'error')
      }
    } catch (error) {
      console.error('测试失败:', error)
      toast('网络错误', 'error')
    } finally {
      setLoading(false)
    }
  }

  const testNoteAccess = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/notes/${noteId}`)
      
      if (response.ok) {
        const data = await response.json()
        setResult({ success: true, note: data, message: 'API访问成功' })
        toast('便签API访问成功', 'success')
      } else {
        const error = await response.json()
        setResult({ success: false, error, message: 'API访问失败' })
        toast(`API访问失败: ${error.error}`, 'error')
      }
    } catch (error) {
      console.error('测试失败:', error)
      toast('网络错误', 'error')
    } finally {
      setLoading(false)
    }
  }

  const getCollaborationInfo = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/test/collaboration?noteId=${noteId}`)
      const data = await response.json()
      setResult(data)
      
      if (data.success) {
        toast('获取协作信息成功', 'success')
      } else {
        toast(data.message || '获取失败', 'error')
      }
    } catch (error) {
      console.error('测试失败:', error)
      toast('网络错误', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">协作功能测试</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>测试参数</CardTitle>
            <CardDescription>设置测试用的ID参数</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">便签ID</label>
              <Input
                value={noteId}
                onChange={(e) => setNoteId(e.target.value)}
                placeholder="便签ID"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">邀请者ID</label>
              <Input
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="邀请者ID"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">被邀请者ID</label>
              <Input
                value={receiverId}
                onChange={(e) => setReceiverId(e.target.value)}
                placeholder="被邀请者ID"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>测试操作</CardTitle>
            <CardDescription>执行各种协作功能测试</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              onClick={testAddCollaborator} 
              disabled={loading}
              className="w-full"
            >
              添加协作者
            </Button>
            <Button 
              onClick={testCreateInvitation} 
              disabled={loading}
              className="w-full"
              variant="outline"
            >
              创建邀请
            </Button>
            <Button 
              onClick={testCheckAccess} 
              disabled={loading}
              className="w-full"
              variant="outline"
            >
              检查访问权限
            </Button>
            <Button 
              onClick={testNoteAccess} 
              disabled={loading}
              className="w-full"
              variant="secondary"
            >
              测试便签API访问
            </Button>
            <Button 
              onClick={getCollaborationInfo} 
              disabled={loading}
              className="w-full"
              variant="secondary"
            >
              获取协作信息
            </Button>
          </CardContent>
        </Card>
      </div>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle>测试结果</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-100 p-4 rounded-lg overflow-auto text-sm">
              {JSON.stringify(result, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  )
}

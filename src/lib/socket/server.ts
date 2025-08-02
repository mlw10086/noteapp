// 用户连接信息接口
export interface ConnectedUser {
  id: string
  name: string
  email: string
  avatar?: string
  socketId: string
  noteId?: number
  cursor?: {
    position: number
    selection?: {
      start: number
      end: number
    }
  }
}

// Socket 事件类型定义
export interface ServerToClientEvents {
  // 用户状态事件
  'user:joined': (user: ConnectedUser) => void
  'user:left': (userId: string) => void
  'user:cursor': (data: { userId: string; cursor: ConnectedUser['cursor'] }) => void
  
  // 文档协作事件
  'document:operation': (operation: any) => void
  'document:sync': (content: string, version: number) => void
  'document:saved': (timestamp: string) => void
  
  // 房间事件
  'room:users': (users: ConnectedUser[]) => void
  'room:error': (error: string) => void
}

export interface ClientToServerEvents {
  // 房间管理
  'room:join': (noteId: number) => void
  'room:leave': (noteId: number) => void
  
  // 文档操作
  'document:operation': (operation: any) => void
  'document:cursor': (cursor: ConnectedUser['cursor']) => void
  'document:save': (content: string) => void
  
  // 用户状态
  'user:typing': (isTyping: boolean) => void
}

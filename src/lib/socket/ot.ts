// 操作类型枚举
export enum OperationType {
  INSERT = 'insert',
  DELETE = 'delete',
  RETAIN = 'retain'
}

// 基础操作接口
export interface Operation {
  type: OperationType
  position: number
  content?: string
  length?: number
  userId: string
  timestamp: number
  version?: number
}

// 操作转换算法类（简化版）
export class OperationalTransform {
  /**
   * 创建插入操作
   */
  static createInsertOperation(
    position: number, 
    content: string, 
    userId: string
  ): Operation {
    return {
      type: OperationType.INSERT,
      position,
      content,
      userId,
      timestamp: Date.now(),
      version: 0 // 将在应用时设置
    }
  }

  /**
   * 创建删除操作
   */
  static createDeleteOperation(
    position: number, 
    length: number, 
    userId: string
  ): Operation {
    return {
      type: OperationType.DELETE,
      position,
      length,
      userId,
      timestamp: Date.now(),
      version: 0 // 将在应用时设置
    }
  }
}

// ============================================================
// TextNow iOS 全参协议号矩阵运营系统 — 类型定义
// 严格对齐计划书字段规范
// ============================================================

/** 15 个原生全参字段（100% 兼容甲方格式，不可修改名称） */
export const NATIVE_FIELDS = [
  "Cookie",
  "IDFA",
  "User-Agent",
  "X-PX-AUTHORIZATION",
  "X-PX-DEVICE-FP",
  "X-PX-DEVICE-MODEL",
  "X-PX-MOBILE-SDK-VERSION",
  "X-PX-OS",
  "X-PX-OS-VERSION",
  "X-PX-UUID",
  "X-PX-VID",
  "clientId",
  "email",
  "phone",
  "username",
] as const;

export type NativeField = (typeof NATIVE_FIELDS)[number];

/** 账号状态体系 */
export type AccountStatus =
  | "normal"      // 正常
  | "pending_renew" // 待续期
  | "banned"      // 已封禁
  | "expired"     // 已过期
  | "disabled";   // 已停用

/** 账号分组标签 */
export type AccountGroup =
  | "marketing"   // 营销组
  | "service"     // 客服组
  | "backup"      // 备用组
  | "test";       // 测试组

/** 全参号账号（原生字段 + 扩展管理字段） */
export interface Account {
  // === 15 原生字段（不可改名） ===
  "Cookie": string;
  "IDFA": string;
  "User-Agent": string;
  "X-PX-AUTHORIZATION": string;
  "X-PX-DEVICE-FP": string;
  "X-PX-DEVICE-MODEL": string;
  "X-PX-MOBILE-SDK-VERSION": string;
  "X-PX-OS": string;
  "X-PX-OS-VERSION": string;
  "X-PX-UUID": string;
  "X-PX-VID": string;
  "clientId": string;
  "email": string;
  "phone": string;
  "username": string;

  // === 扩展管理字段 ===
  id: string;
  emailPassword: string;      // 邮箱密码
  accountPassword: string;    // 账号密码
  proxyIp: string;            // 绑定代理IP
  tokenExpiry: string;        // 令牌过期时间 ISO
  createdAt: string;          // 创建时间
  lastActiveAt: string;       // 最后活跃时间
  group: AccountGroup;        // 分组标签
  status: AccountStatus;      // 状态
  enabled: boolean;           // 启停
  totalSent: number;          // 累计发送量
  totalReceived: number;      // 累计接收量
  lastHealthCheck?: string;   // 最后健康检测时间
  notes?: string;             // 备注
}

/** 任务状态 */
export type TaskStatus =
  | "draft"       // 草稿
  | "pending"     // 待启动
  | "running"     // 运行中
  | "paused"      // 已暂停
  | "completed"   // 已完成
  | "terminated"; // 已终止

/** 任务优先级 */
export type TaskPriority = "low" | "normal" | "high" | "urgent";

/** 群发任务 */
export interface SendTask {
  id: string;
  name: string;
  accountGroup: AccountGroup;
  targetNumbers: string[];     // 目标号码列表
  templateId: string;          // 内容模板ID
  scheduleStart: string;       // 发送时段开始
  scheduleEnd: string;         // 发送时段结束
  priority: TaskPriority;
  status: TaskStatus;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  total: number;               // 发送总数
  success: number;             // 成功数
  failed: number;              // 失败数
  failReasons: Record<string, number>; // 失败原因分布
  progress: number;            // 进度百分比
  imageUrl?: string;           // 附件图片URL（从模板继承）
  linkUrl?: string;            // 落地链接URL（从模板继承）
  linkText?: string;           // 链接显示文案
}

/** 内容模板 */
export interface MessageTemplate {
  id: string;
  name: string;
  category: string;            // 分类
  content: string;             // 文案内容（含变量占位符）
  imageUrl?: string;           // 附件图片URL（MMS图片消息）
  linkUrl?: string;            // 落地链接URL（短链/落地页）
  linkText?: string;           // 链接显示文案
  enabled: boolean;
  createdAt: string;
  usageCount: number;          // 使用次数
}

/** 消息方向 */
export type MessageDirection = "inbound" | "outbound";

/** 消息状态 */
export type MessageStatus = "sent" | "delivered" | "failed" | "received" | "pending";

/** 单条消息记录 */
export interface Message {
  id: string;
  accountId: string;           // 发送/接收账号ID
  accountPhone: string;        // 账号号码
  targetNumber: string;        // 对方号码
  direction: MessageDirection;
  content: string;
  status: MessageStatus;
  timestamp: string;
  failReason?: string;
  isAutoReply: boolean;        // 是否自动回复
  taskId?: string;             // 关联任务ID
}

/** 会话 */
export interface Conversation {
  id: string;
  accountId: string;
  accountPhone: string;
  peerNumber: string;          // 对方号码
  lastMessage: string;
  lastTimestamp: string;
  unread: number;
  messages: Message[];
  takenOver: boolean;          // 是否人工接管
}

/** 关键词回复规则匹配类型 */
export type RuleMatchType = "exact" | "fuzzy" | "regex";

/** 关键词自动回复规则 */
export interface AutoReplyRule {
  id: string;
  name: string;
  matchType: RuleMatchType;
  keywords: string;            // 关键词/正则
  replyContent: string;        // 回复话术
  enabled: boolean;
  priority: number;            // 优先级（数字越小越高）
  hitCount: number;            // 命中次数
  isMultiTurn: boolean;        // 是否多轮对话
  multiTurnContext?: string;   // 多轮上下文关联
}

/** 风控配置 */
export interface RiskControlConfig {
  globalConcurrency: number;          // 全局并发数
  dailyLimitPerAccount: number;       // 单账号日发送上限
  hourlyLimitPerAccount: number;      // 单账号小时发送上限
  minInterval: number;                // 最小发送间隔(秒)
  maxInterval: number;                // 最大发送间隔(秒)
  usDaytimeOnly: boolean;             // 仅美国本土白天时段
  retryCount: number;                 // 失败重试次数
  retryInterval: number;              // 重试间隔(秒)
  circuitBreakerThreshold: number;    // 连续失败熔断阈值
  taskSuccessRateThreshold: number;   // 任务成功率熔断阈值(%)
  tokenExpiryWarningHours: number;    // 令牌过期预警(小时)
  contentDedup: boolean;              // 内容去重校验
  ipConsistencyCheck: boolean;        // IP一致性校验
  keepAliveDays: number;              // 保号周期(天)
  tokenRenewalCheckHours: number;     // 续期检测周期(小时)
  healthCheckHours: number;           // 健康检测周期(小时)
}

/** 操作日志 */
export interface OperationLog {
  id: string;
  timestamp: string;
  operator: string;
  action: string;
  target: string;
  detail: string;
  level: "info" | "warning" | "error";
}

/** 用户角色 */
export type UserRole = "admin" | "operator";

/** 系统用户 */
export interface SystemUser {
  id: string;
  username: string;
  role: UserRole;
  enabled: boolean;
  lastLoginAt?: string;
  createdAt: string;
}

/** 发送记录（单条） */
export interface SendRecord {
  id: string;
  taskId: string;
  accountId: string;
  accountPhone: string;
  targetNumber: string;
  content: string;
  status: MessageStatus;
  timestamp: string;
  failReason?: string;
  retryCount: number;
}

// ============================================================
// 坐席管理（商业化运营 — 人工客服坐席）
// ============================================================

/** 坐席状态 */
export type SeatStatus =
  | "online"     // 在线
  | "busy"       // 忙碌（满负荷）
  | "away"       // 离开
  | "offline";   // 离线

/** 坐席分组 */
export type SeatGroup =
  | "sales"      // 销售组
  | "support"    // 客服组
  | "vip"        // VIP 专属
  | "backup";    // 备用组

/** 坐席技能标签 */
export type SeatSkill =
  | "textnow"    // TextNow 平台
  | "marketing"  // 营销转化
  | "complaint"  // 投诉处理
  | "technical"  // 技术支持
  | "multilingual"; // 多语言

/** 坐席（人工客服） */
export interface Seat {
  id: string;
  name: string;                // 坐席名称
  seatNo: string;              // 坐席工号
  group: SeatGroup;            // 所属分组
  skills: SeatSkill[];         // 技能标签
  status: SeatStatus;          // 当前状态
  enabled: boolean;            // 启停
  maxConcurrent: number;       // 最大并发会话数
  boundAccountIds: string[];   // 绑定的协议账号ID
  // 绩效统计
  totalConversations: number;  // 累计接待会话
  totalReplies: number;        // 累计回复消息
  avgResponseSec: number;      // 平均响应时长(秒)
  satisfaction: number;        // 满意度评分(0-100)
  onlineHours: number;         // 累计在线时长(小时)
  // 排班
  workSchedule: string;        // 排班描述
  // 时间
  createdAt: string;
  lastActiveAt?: string;
  notes?: string;
}

/** 会话分配策略 */
export type AssignmentStrategy =
  | "round_robin"    // 轮询分配
  | "least_load"     // 最少负荷
  | "skill_match"    // 技能匹配
  | "manual";        // 人工指定

/** 会话分配记录 */
export interface ConversationAssignment {
  conversationId: string;
  seatId: string;
  assignedAt: string;
  assignedBy: "auto" | "manual";
  strategy: AssignmentStrategy;
  status: "active" | "transferred" | "closed";
}

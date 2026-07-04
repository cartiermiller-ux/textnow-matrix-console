import type { AccountStatus, AccountGroup, TaskStatus, TaskPriority, RiskControlConfig } from "./types";

/** 原生字段中文说明 */
export const FIELD_LABELS: Record<string, string> = {
  "Cookie": "会话 Cookie",
  "IDFA": "iOS 广告标识符",
  "User-Agent": "客户端 UA",
  "X-PX-AUTHORIZATION": "PX 核心鉴权令牌",
  "X-PX-DEVICE-FP": "PX 设备指纹 ID",
  "X-PX-DEVICE-MODEL": "设备机型名称",
  "X-PX-MOBILE-SDK-VERSION": "PX 移动端 SDK 版本",
  "X-PX-OS": "操作系统类型",
  "X-PX-OS-VERSION": "系统版本号",
  "X-PX-UUID": "PX 设备级唯一 ID",
  "X-PX-VID": "PX 会话级唯一 ID",
  "clientId": "客户端实例唯一 ID",
  "email": "注册邮箱",
  "phone": "美国手机号",
  "username": "TextNow 用户名",
};

/** 账号状态映射 */
export const STATUS_MAP: Record<AccountStatus, { label: string; color: string }> = {
  normal: { label: "正常", color: "text-green-600 bg-green-50 border-green-200" },
  pending_renew: { label: "待续期", color: "text-amber-600 bg-amber-50 border-amber-200" },
  banned: { label: "已封禁", color: "text-red-600 bg-red-50 border-red-200" },
  expired: { label: "已过期", color: "text-gray-600 bg-gray-50 border-gray-200" },
  disabled: { label: "已停用", color: "text-gray-500 bg-gray-50 border-gray-200" },
};

/** 分组映射 */
export const GROUP_MAP: Record<AccountGroup, { label: string; color: string }> = {
  marketing: { label: "营销组", color: "text-blue-600 bg-blue-50 border-blue-200" },
  service: { label: "客服组", color: "text-purple-600 bg-purple-50 border-purple-200" },
  backup: { label: "备用组", color: "text-cyan-600 bg-cyan-50 border-cyan-200" },
  test: { label: "测试组", color: "text-orange-600 bg-orange-50 border-orange-200" },
};

/** 任务状态映射 */
export const TASK_STATUS_MAP: Record<TaskStatus, { label: string; color: string }> = {
  draft: { label: "草稿", color: "text-gray-600 bg-gray-50 border-gray-200" },
  pending: { label: "待启动", color: "text-blue-600 bg-blue-50 border-blue-200" },
  running: { label: "运行中", color: "text-green-600 bg-green-50 border-green-200" },
  paused: { label: "已暂停", color: "text-amber-600 bg-amber-50 border-amber-200" },
  completed: { label: "已完成", color: "text-cyan-600 bg-cyan-50 border-cyan-200" },
  terminated: { label: "已终止", color: "text-red-600 bg-red-50 border-red-200" },
};

/** 任务优先级映射 */
export const PRIORITY_MAP: Record<TaskPriority, { label: string; color: string }> = {
  low: { label: "低", color: "text-gray-500" },
  normal: { label: "普通", color: "text-blue-500" },
  high: { label: "高", color: "text-amber-500" },
  urgent: { label: "紧急", color: "text-red-500" },
};

/** 内置变量说明 */
export const BUILTIN_VARIABLES = [
  { token: "{随机数字}", desc: "插入随机数字串（4-8位）" },
  { token: "{随机字母}", desc: "插入随机字母串（4-8位）" },
  { token: "{收件人号后四位}", desc: "目标号码后四位数字" },
  { token: "{时间戳}", desc: "当前 Unix 时间戳" },
];

/** 默认风控配置 */
export const DEFAULT_RISK_CONFIG: RiskControlConfig = {
  globalConcurrency: 50,
  dailyLimitPerAccount: 100,
  hourlyLimitPerAccount: 20,
  minInterval: 60,
  maxInterval: 120,
  usDaytimeOnly: true,
  retryCount: 3,
  retryInterval: 30,
  circuitBreakerThreshold: 5,
  taskSuccessRateThreshold: 80,
  tokenExpiryWarningHours: 24,
  contentDedup: true,
  ipConsistencyCheck: true,
  keepAliveDays: 7,
  tokenRenewalCheckHours: 6,
  healthCheckHours: 12,
};

/** 基础敏感词列表 */
export const SENSITIVE_WORDS = [
  "赌", "博彩", "色情", "枪支", "毒品", "诈骗", "钓鱼",
  "free money", "click here", "limited time", "act now",
];

/** 侧边栏导航 — 分组结构（商业化产品布局） */
export interface NavItem {
  path: string;
  label: string;
  icon: string;
  badge?: "pendingRenew" | "unread" | "runningTasks" | "seatOnline";
}

export interface NavGroup {
  group: string;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    group: "总览",
    items: [
      { path: "/", label: "运营总览", icon: "LayoutDashboard" },
    ],
  },
  {
    group: "账号资源",
    items: [
      { path: "/accounts", label: "号池管理", icon: "Users", badge: "pendingRenew" },
      { path: "/seats", label: "坐席管理", icon: "Headset", badge: "seatOnline" },
    ],
  },
  {
    group: "消息运营",
    items: [
      { path: "/tasks", label: "群发任务", icon: "Send", badge: "runningTasks" },
      { path: "/templates", label: "内容模板", icon: "FileText" },
      { path: "/chat", label: "双向聊天", icon: "MessageSquare", badge: "unread" },
    ],
  },
  {
    group: "安全与数据",
    items: [
      { path: "/risk-control", label: "风控引擎", icon: "Shield" },
      { path: "/statistics", label: "数据统计", icon: "BarChart3" },
    ],
  },
  {
    group: "系统设置",
    items: [
      { path: "/system", label: "系统管理", icon: "Settings" },
    ],
  },
];

/** 扁平化导航（兼容旧引用） */
export const NAV_ITEMS: NavItem[] = NAV_GROUPS.flatMap((g) => g.items);

/** 开放 API 接口列表 */
export const API_ENDPOINTS = [
  {
    method: "GET",
    path: "/api/v1/accounts",
    desc: "号池查询 — 获取账号列表，支持按分组/状态筛选",
    params: "group, status, page, pageSize",
  },
  {
    method: "POST",
    path: "/api/v1/send/single",
    desc: "单条发送 — 使用指定账号向目标号码发送一条短信",
    params: "accountId, targetNumber, content",
  },
  {
    method: "POST",
    path: "/api/v1/send/batch",
    desc: "批量发送 — 创建群发任务，支持模板变量",
    params: "accountGroup, targetNumbers[], templateId, schedule",
  },
  {
    method: "GET",
    path: "/api/v1/messages",
    desc: "查询消息 — 按账号/号码/时间段检索历史消息",
    params: "accountId, peerNumber, startTime, endTime, page",
  },
  {
    method: "POST",
    path: "/api/v1/accounts/callback",
    desc: "账号状态回调 — 账号状态变更通知（封禁/过期等）",
    params: "accountId, status, reason, timestamp",
  },
  {
    method: "GET",
    path: "/api/v1/statistics/overview",
    desc: "运营总览 — 获取号池总量、发送量、成功率等汇总数据",
    params: "dateRange",
  },
];

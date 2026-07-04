import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  Account,
  SendTask,
  MessageTemplate,
  Conversation,
  AutoReplyRule,
  RiskControlConfig,
  OperationLog,
  SystemUser,
  Message,
  SendRecord,
  AccountGroup,
  AccountStatus,
  Seat,
  SeatStatus,
  SeatGroup,
  SeatSkill,
  ConversationAssignment,
  AssignmentStrategy,
} from "./types";
import { NATIVE_FIELDS } from "./types";
import { DEFAULT_RISK_CONFIG, SENSITIVE_WORDS } from "./constants";

// ============================================================
// 工具函数
// ============================================================

function uid(prefix = ""): string {
  return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function nowISO(): string {
  return new Date().toISOString();
}

/** 生成示例全参号（用于演示） */
function genSampleAccount(phone: string, idx: number): Account {
  const models = ["iPhone 11", "iPhone 12", "iPhone 13", "iPhone 14", "iPhone 15"];
  const model = models[idx % models.length];
  return {
    id: uid("acc_"),
    "Cookie": "",
    "IDFA": crypto.randomUUID().toUpperCase(),
    "User-Agent": `TextNow/25.4.0 (${model}; iOS 17.5.1; Scale/3.00)`,
    "X-PX-AUTHORIZATION": `Bearer px_${uid()}${idx}sig`,
    "X-PX-DEVICE-FP": `fp_${uid()}${idx}`,
    "X-PX-DEVICE-MODEL": model,
    "X-PX-MOBILE-SDK-VERSION": "1.8.2-px",
    "X-PX-OS": "iOS",
    "X-PX-OS-VERSION": "17.5.1",
    "X-PX-UUID": crypto.randomUUID(),
    "X-PX-VID": `vid_${uid()}`,
    "clientId": `cli_${uid()}`,
    "email": `user${phone}@textnow.me`,
    "phone": phone,
    "username": `tn_user_${phone.slice(-4)}`,
    emailPassword: "",
    accountPassword: "",
    proxyIp: `http://user${idx}:pass@res-us-${idx % 5}.proxy.io:8080`,
    tokenExpiry: new Date(Date.now() + (idx % 3) * 12 * 3600 * 1000 + 6 * 3600 * 1000).toISOString(),
    createdAt: new Date(Date.now() - idx * 86400000).toISOString(),
    lastActiveAt: new Date(Date.now() - idx * 3600000).toISOString(),
    group: (["marketing", "service", "backup", "test"] as AccountGroup[])[idx % 4],
    status: (["normal", "normal", "normal", "pending_renew", "banned"] as AccountStatus[])[idx % 5],
    enabled: idx % 7 !== 0,
    totalSent: Math.floor(Math.random() * 500),
    totalReceived: Math.floor(Math.random() * 200),
    notes: "",
  };
}

/** 生成示例模板 */
function genSampleTemplates(): MessageTemplate[] {
  return [
    {
      id: uid("tpl_"),
      name: "营销推广-标准版",
      category: "营销",
      content: "Hi! Special offer for you: {随机数字}% off. Reply STOP to opt out. Code: {收件人号后四位}{时间戳}",
      enabled: true,
      createdAt: nowISO(),
      usageCount: 0,
    },
    {
      id: uid("tpl_"),
      name: "客服通知-验证码",
      category: "客服",
      content: "Your verification code is {随机数字}. Do not share it. Ref: {收件人号后四位}",
      enabled: true,
      createdAt: nowISO(),
      usageCount: 0,
    },
    {
      id: uid("tpl_"),
      name: "节日问候-随机话术",
      category: "问候",
      content: "Hey there! {随机字母} Hope you're having a great day. Deal ends soon - {随机数字} off!",
      enabled: true,
      createdAt: nowISO(),
      usageCount: 0,
    },
  ];
}

/** 生成示例自动回复规则 */
function genSampleRules(): AutoReplyRule[] {
  return [
    {
      id: uid("rule_"),
      name: "STOP退订回复",
      matchType: "exact",
      keywords: "STOP\nUNSTOP\nCANCEL\nEND",
      replyContent: "You have been unsubscribed. You will not receive further messages.",
      enabled: true,
      priority: 1,
      hitCount: 0,
      isMultiTurn: false,
    },
    {
      id: uid("rule_"),
      name: "关键词-优惠咨询",
      matchType: "fuzzy",
      keywords: "优惠\n折扣\ndeal\noffer\ndiscount",
      replyContent: "Current promotion: {随机数字}% off! Limited time. Reply YES to claim.",
      enabled: true,
      priority: 2,
      hitCount: 0,
      isMultiTurn: false,
    },
    {
      id: uid("rule_"),
      name: "正则-验证码请求",
      matchType: "regex",
      keywords: "(code|verify|验证码|OTP).{0,10}",
      replyContent: "Your code: {随机数字}. Expires in 10 min.",
      enabled: true,
      priority: 3,
      hitCount: 0,
      isMultiTurn: true,
      multiTurnContext: "code_request",
    },
  ];
}

function genSampleSeats(): Seat[] {
  const groups: SeatGroup[] = ["sales", "support", "vip", "backup"];
  const skillsPool: SeatSkill[][] = [
    ["textnow", "marketing"],
    ["textnow", "complaint", "technical"],
    ["textnow", "multilingual", "marketing"],
    ["textnow", "technical"],
  ];
  const names = ["张小明", "李婷婷", "王建国", "陈雅琴", "刘志强", "赵美玲"];
  const statuses: SeatStatus[] = ["online", "online", "busy", "away", "offline", "online"];
  return names.map((name, i) => ({
    id: uid("seat_"),
    name,
    seatNo: `S${String(i + 1).padStart(3, "0")}`,
    group: groups[i % groups.length],
    skills: skillsPool[i % skillsPool.length],
    status: statuses[i],
    enabled: i < 5,
    maxConcurrent: i % 3 === 0 ? 5 : 3,
    boundAccountIds: [] as string[],
    totalConversations: Math.floor(Math.random() * 500) + 50,
    totalReplies: Math.floor(Math.random() * 2000) + 100,
    avgResponseSec: Math.floor(Math.random() * 60) + 10,
    satisfaction: Math.floor(Math.random() * 20) + 80,
    onlineHours: Math.floor(Math.random() * 200) + 20,
    workSchedule: "周一至周五 09:00-18:00",
    createdAt: nowISO(),
    lastActiveAt: nowISO(),
  }));
}

// ============================================================
// Store 类型
// ============================================================

interface StoreState {
  // 数据
  accounts: Account[];
  tasks: SendTask[];
  templates: MessageTemplate[];
  conversations: Conversation[];
  rules: AutoReplyRule[];
  sendRecords: SendRecord[];
  riskConfig: RiskControlConfig;
  logs: OperationLog[];
  users: SystemUser[];
  currentUser: string;

  // 账号操作
  importAccounts: (rawLines: string[]) => { success: number; failed: number; errors: string[] };
  addAccount: (acc: Account) => void;
  updateAccount: (id: string, patch: Partial<Account>) => void;
  deleteAccounts: (ids: string[]) => void;
  setAccountGroup: (ids: string[], group: AccountGroup) => void;
  toggleAccountEnabled: (ids: string[], enabled: boolean) => void;
  renewToken: (id: string) => void;
  healthCheck: (ids: string[]) => void;

  // 任务操作
  createTask: (task: Omit<SendTask, "id" | "createdAt" | "total" | "success" | "failed" | "failReasons" | "progress" | "status">) => string;
  updateTask: (id: string, patch: Partial<SendTask>) => void;
  deleteTask: (id: string) => void;
  startTask: (id: string) => void;
  pauseTask: (id: string) => void;
  resumeTask: (id: string) => void;
  terminateTask: (id: string) => void;
  simulateTaskProgress: (id: string) => void;

  // 模板操作
  addTemplate: (tpl: Omit<MessageTemplate, "id" | "createdAt" | "usageCount">) => void;
  updateTemplate: (id: string, patch: Partial<MessageTemplate>) => void;
  deleteTemplate: (id: string) => void;

  // 会话/消息操作
  addMessage: (msg: Omit<Message, "id" | "timestamp">) => void;
  sendManualReply: (accountId: string, peerNumber: string, content: string) => void;
  takeOverConversation: (convId: string, takenOver: boolean) => void;
  markConversationRead: (convId: string) => void;

  // 规则操作
  addRule: (rule: Omit<AutoReplyRule, "id" | "hitCount">) => void;
  updateRule: (id: string, patch: Partial<AutoReplyRule>) => void;
  deleteRule: (id: string) => void;

  // 风控配置
  updateRiskConfig: (patch: Partial<RiskControlConfig>) => void;

  // 日志
  addLog: (action: string, target: string, detail: string, level?: "info" | "warning" | "error") => void;

  // 用户
  addUser: (user: Omit<SystemUser, "id" | "createdAt">) => void;
  updateUser: (id: string, patch: Partial<SystemUser>) => void;
  deleteUser: (id: string) => void;

  // 坐席管理
  seats: Seat[];
  assignments: ConversationAssignment[];
  addSeat: (seat: Omit<Seat, "id" | "createdAt" | "totalConversations" | "totalReplies" | "avgResponseSec" | "satisfaction" | "onlineHours">) => void;
  updateSeat: (id: string, patch: Partial<Seat>) => void;
  deleteSeat: (id: string) => void;
  setSeatStatus: (id: string, status: SeatStatus) => void;
  bindSeatAccounts: (seatId: string, accountIds: string[]) => void;
  assignConversation: (conversationId: string, seatId: string, strategy: AssignmentStrategy) => void;
  autoAssignConversation: (conversationId: string) => void;
  transferConversation: (conversationId: string, toSeatId: string) => void;

  // 工具
  resetAll: () => void;
  loadSampleData: () => void;
}

// ============================================================
// Store 实现
// ============================================================

type PersistedState = Pick<StoreState,
  "accounts" | "tasks" | "templates" | "conversations" | "rules" |
  "sendRecords" | "riskConfig" | "logs" | "users" | "seats" | "assignments">;

export const useStore = create<StoreState>()(
  persist(
    (set, get): StoreState => ({
      accounts: [] as Account[],
      tasks: [] as SendTask[],
      templates: genSampleTemplates(),
      conversations: [] as Conversation[],
      rules: genSampleRules(),
      sendRecords: [] as SendRecord[],
      riskConfig: DEFAULT_RISK_CONFIG,
      logs: [] as OperationLog[],
      seats: genSampleSeats(),
      assignments: [] as ConversationAssignment[],
      users: [
        { id: uid("usr_"), username: "admin", role: "admin", enabled: true, createdAt: nowISO() },
      ],
      currentUser: "admin",

      // === 账号导入 ===
      importAccounts: (rawLines) => {
        const errors: string[] = [];
        let success = 0;
        let failed = 0;
        const newAccounts: Account[] = [];

        rawLines.forEach((line, idx) => {
          const trimmed = line.trim();
          if (!trimmed) return;
          try {
            const obj = JSON.parse(trimmed);
            // 校验 15 原生字段
            const missing: string[] = [];
            for (const f of NATIVE_FIELDS) {
              if (!(f in obj) || obj[f] === undefined) {
                missing.push(f);
              }
            }
            if (missing.length > 0) {
              errors.push(`第 ${idx + 1} 行: 缺失字段 ${missing.join(", ")}`);
              failed++;
              return;
            }
            const acc: Account = {
              ...obj,
              id: uid("acc_"),
              emailPassword: obj.emailPassword || "",
              accountPassword: obj.accountPassword || "",
              proxyIp: obj.proxyIp || "",
              tokenExpiry: obj.tokenExpiry || new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
              createdAt: nowISO(),
              lastActiveAt: nowISO(),
              group: obj.group || "marketing",
              status: obj.status || "normal",
              enabled: obj.enabled !== false,
              totalSent: 0,
              totalReceived: 0,
            };
            newAccounts.push(acc);
            success++;
          } catch (e) {
            errors.push(`第 ${idx + 1} 行: JSON 解析失败 — ${(e as Error).message}`);
            failed++;
          }
        });

        if (newAccounts.length > 0) {
          set((s) => ({ accounts: [...s.accounts, ...newAccounts] }));
          get().addLog("导入账号", `共 ${newAccounts.length} 条`, `成功 ${success} 条，失败 ${failed} 条`, failed > 0 ? "warning" : "info");
        }
        return { success, failed, errors };
      },

      addAccount: (acc) => set((s) => ({ accounts: [...s.accounts, acc] })),

      updateAccount: (id, patch) =>
        set((s) => ({
          accounts: s.accounts.map((a) => (a.id === id ? { ...a, ...patch } : a)),
        })),

      deleteAccounts: (ids) => {
        set((s) => ({ accounts: s.accounts.filter((a) => !ids.includes(a.id)) }));
        get().addLog("删除账号", `${ids.length} 条`, `已删除 ${ids.length} 个账号`, "warning");
      },

      setAccountGroup: (ids, group) =>
        set((s) => ({
          accounts: s.accounts.map((a) => (ids.includes(a.id) ? { ...a, group } : a)),
        })),

      toggleAccountEnabled: (ids, enabled) =>
        set((s) => ({
          accounts: s.accounts.map((a) => (ids.includes(a.id) ? { ...a, enabled } : a)),
        })),

      renewToken: (id) => {
        set((s) => ({
          accounts: s.accounts.map((a) =>
            a.id === id
              ? {
                  ...a,
                  "X-PX-AUTHORIZATION": `Bearer px_${uid()}sig_refreshed`,
                  tokenExpiry: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
                  status: a.status === "pending_renew" ? "normal" : a.status,
                  lastActiveAt: nowISO(),
                }
              : a
          ),
        }));
        get().addLog("令牌续期", id, "X-PX-AUTHORIZATION 已刷新，有效期延长 48 小时", "info");
      },

      healthCheck: (ids) => {
        const ts = nowISO();
        set((s) => ({
          accounts: s.accounts.map((a) =>
            ids.includes(a.id)
              ? {
                  ...a,
                  lastHealthCheck: ts,
                  lastActiveAt: ts,
                  // 模拟：5% 概率检测为封禁
                  status: Math.random() < 0.05 ? "banned" : a.status === "expired" ? "expired" : "normal",
                }
              : a
          ),
        }));
        get().addLog("健康检测", `${ids.length} 个账号`, `检测完成于 ${ts}`, "info");
      },

      // === 任务操作 ===
      createTask: (task) => {
        const id = uid("task_");
        const newTask: SendTask = {
          ...task,
          id,
          status: "draft",
          createdAt: nowISO(),
          total: task.targetNumbers.length,
          success: 0,
          failed: 0,
          failReasons: {},
          progress: 0,
        };
        set((s) => ({ tasks: [newTask, ...s.tasks] }));
        get().addLog("创建任务", task.name, `目标 ${task.targetNumbers.length} 条，分组: ${task.accountGroup}`, "info");
        return id;
      },

      updateTask: (id, patch) =>
        set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)) })),

      deleteTask: (id) => set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) })),

      startTask: (id) => {
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === id ? { ...t, status: "running", startedAt: nowISO() } : t
          ),
        }));
        const t = get().tasks.find((x) => x.id === id);
        get().addLog("启动任务", t?.name || id, `开始执行，共 ${t?.total} 条目标`, "info");
      },

      pauseTask: (id) => {
        set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? { ...t, status: "paused" } : t)) }));
        get().addLog("暂停任务", id, "任务已暂停", "warning");
      },

      resumeTask: (id) => {
        set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? { ...t, status: "running" } : t)) }));
        get().addLog("恢复任务", id, "任务已恢复运行", "info");
      },

      terminateTask: (id) => {
        set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? { ...t, status: "terminated", completedAt: nowISO() } : t)) }));
        get().addLog("终止任务", id, "任务已终止", "warning");
      },

      simulateTaskProgress: (id) => {
        set((s) => ({
          tasks: s.tasks.map((t) => {
            if (t.id !== id || t.status !== "running") return t;
            const batch = Math.min(Math.ceil(t.total * 0.1) || 1, t.total - t.success - t.failed);
            if (batch <= 0) return t;
            let success = t.success;
            let failed = t.failed;
            const failReasons = { ...t.failReasons };
            for (let i = 0; i < batch; i++) {
              if (Math.random() < 0.92) {
                success++;
              } else {
                failed++;
                const reason = ["号码无效", "发送频率限制", "账号封禁", "网络超时"][Math.floor(Math.random() * 4)];
                failReasons[reason] = (failReasons[reason] || 0) + 1;
              }
            }
            const done = success + failed;
            const progress = Math.round((done / t.total) * 100);
            const completed = done >= t.total;
            return {
              ...t,
              success,
              failed,
              failReasons,
              progress,
              status: completed ? "completed" as const : "running" as const,
              completedAt: completed ? nowISO() : undefined,
            };
          }),
        }));
      },

      // === 模板操作 ===
      addTemplate: (tpl) => {
        set((s) => ({
          templates: [...s.templates, { ...tpl, id: uid("tpl_"), createdAt: nowISO(), usageCount: 0 }],
        }));
        get().addLog("新增模板", tpl.name, `分类: ${tpl.category}`, "info");
      },

      updateTemplate: (id, patch) =>
        set((s) => ({ templates: s.templates.map((t) => (t.id === id ? { ...t, ...patch } : t)) })),

      deleteTemplate: (id) => set((s) => ({ templates: s.templates.filter((t) => t.id !== id) })),

      // === 会话/消息 ===
      addMessage: (msg) => {
        const id = uid("msg_");
        const fullMsg: Message = { ...msg, id, timestamp: nowISO() };
        const convKey = `${msg.accountId}_${msg.targetNumber}`;
        set((s) => {
          const existing = s.conversations.find((c) => c.id === convKey);
          if (existing) {
            return {
              conversations: s.conversations.map((c) =>
                c.id === convKey
                  ? {
                      ...c,
                      messages: [...c.messages, fullMsg],
                      lastMessage: fullMsg.content,
                      lastTimestamp: fullMsg.timestamp,
                      unread: msg.direction === "inbound" ? c.unread + 1 : c.unread,
                    }
                  : c
              ),
            };
          }
          const newConv: Conversation = {
            id: convKey,
            accountId: msg.accountId,
            accountPhone: msg.accountPhone,
            peerNumber: msg.targetNumber,
            lastMessage: fullMsg.content,
            lastTimestamp: fullMsg.timestamp,
            unread: msg.direction === "inbound" ? 1 : 0,
            messages: [fullMsg],
            takenOver: false,
          };
          return { conversations: [newConv, ...s.conversations] };
        });
        // 更新账号统计
        if (msg.direction === "outbound") {
          set((s) => ({
            accounts: s.accounts.map((a) =>
              a.id === msg.accountId ? { ...a, totalSent: a.totalSent + 1, lastActiveAt: nowISO() } : a
            ),
          }));
        } else {
          set((s) => ({
            accounts: s.accounts.map((a) =>
              a.id === msg.accountId ? { ...a, totalReceived: a.totalReceived + 1, lastActiveAt: nowISO() } : a
            ),
          }));
        }
      },

      sendManualReply: (accountId, peerNumber, content) => {
        const acc = get().accounts.find((a) => a.id === accountId);
        if (!acc) return;
        get().addMessage({
          accountId,
          accountPhone: acc.phone,
          targetNumber: peerNumber,
          direction: "outbound",
          content,
          status: "sent",
          isAutoReply: false,
        });
        get().addLog("人工回复", `${acc.phone} → ${peerNumber}`, content.slice(0, 50), "info");
      },

      takeOverConversation: (convId, takenOver) =>
        set((s) => ({
          conversations: s.conversations.map((c) => (c.id === convId ? { ...c, takenOver } : c)),
        })),

      markConversationRead: (convId) =>
        set((s) => ({
          conversations: s.conversations.map((c) => (c.id === convId ? { ...c, unread: 0 } : c)),
        })),

      // === 规则 ===
      addRule: (rule) => {
        set((s) => ({ rules: [...s.rules, { ...rule, id: uid("rule_"), hitCount: 0 }] }));
        get().addLog("新增回复规则", rule.name, `匹配类型: ${rule.matchType}`, "info");
      },

      updateRule: (id, patch) =>
        set((s) => ({ rules: s.rules.map((r) => (r.id === id ? { ...r, ...patch } : r)) })),

      deleteRule: (id) => set((s) => ({ rules: s.rules.filter((r) => r.id !== id) })),

      // === 风控 ===
      updateRiskConfig: (patch) => {
        set((s) => ({ riskConfig: { ...s.riskConfig, ...patch } }));
        get().addLog("更新风控配置", "全局", JSON.stringify(patch).slice(0, 80), "info");
      },

      // === 日志 ===
      addLog: (action, target, detail, level = "info") => {
        const log: OperationLog = {
          id: uid("log_"),
          timestamp: nowISO(),
          operator: get().currentUser,
          action,
          target,
          detail,
          level,
        };
        set((s) => ({ logs: [log, ...s.logs].slice(0, 500) }));
      },

      // === 用户 ===
      addUser: (user) => {
        set((s) => ({ users: [...s.users, { ...user, id: uid("usr_"), createdAt: nowISO() }] }));
        get().addLog("新增用户", user.username, `角色: ${user.role}`, "info");
      },

      updateUser: (id, patch) =>
        set((s) => ({ users: s.users.map((u) => (u.id === id ? { ...u, ...patch } : u)) })),

      deleteUser: (id) => set((s) => ({ users: s.users.filter((u) => u.id !== id) })),

      // === 坐席管理 ===
      addSeat: (seat) => {
        const newSeat: Seat = {
          ...seat,
          id: uid("seat_"),
          createdAt: nowISO(),
          totalConversations: 0,
          totalReplies: 0,
          avgResponseSec: 0,
          satisfaction: 100,
          onlineHours: 0,
        };
        set((s) => ({ seats: [...s.seats, newSeat] }));
        get().addLog("新增坐席", seat.name, `工号: ${seat.seatNo}，分组: ${seat.group}`, "info");
      },

      updateSeat: (id, patch) =>
        set((s) => ({ seats: s.seats.map((st) => (st.id === id ? { ...st, ...patch } : st)) })),

      deleteSeat: (id) => {
        set((s) => ({
          seats: s.seats.filter((st) => st.id !== id),
          assignments: s.assignments.filter((a) => a.seatId !== id),
        }));
        get().addLog("删除坐席", id, "坐席已移除", "warning");
      },

      setSeatStatus: (id, status) => {
        set((s) => ({
          seats: s.seats.map((st) =>
            st.id === id ? { ...st, status, lastActiveAt: nowISO() } : st
          ),
        }));
        const seat = get().seats.find((st) => st.id === id);
        if (seat) {
          get().addLog("坐席状态变更", seat.name, `状态变更为: ${status}`, "info");
        }
      },

      bindSeatAccounts: (seatId, accountIds) => {
        set((s) => ({
          seats: s.seats.map((st) =>
            st.id === seatId ? { ...st, boundAccountIds: accountIds } : st
          ),
        }));
        const seat = get().seats.find((st) => st.id === seatId);
        if (seat) {
          get().addLog("绑定账号", seat.name, `已绑定 ${accountIds.length} 个协议账号`, "info");
        }
      },

      assignConversation: (conversationId, seatId, strategy) => {
        set((s) => {
          const existing = s.assignments.find((a) => a.conversationId === conversationId);
          const newAssignment: ConversationAssignment = {
            conversationId,
            seatId,
            assignedAt: nowISO(),
            assignedBy: "manual",
            strategy,
            status: "active",
          };
          if (existing) {
            return {
              assignments: s.assignments.map((a) =>
                a.conversationId === conversationId
                  ? { ...a, status: "transferred" as const }
                  : a
              ).concat(newAssignment),
            };
          }
          return { assignments: [...s.assignments, newAssignment] };
        });
        const seat = get().seats.find((st) => st.id === seatId);
        get().addLog("会话分配", conversationId, `已分配至坐席: ${seat?.name || seatId}`, "info");
      },

      autoAssignConversation: (conversationId) => {
        const seats = get().seats;
        // 最少负荷策略：找在线且未满负荷的坐席
        const onlineSeats = seats.filter(
          (st) => st.enabled && (st.status === "online" || st.status === "busy")
        );
        if (onlineSeats.length === 0) {
          get().addLog("自动分配失败", conversationId, "无可用在线坐席", "warning");
          return;
        }
        // 计算每个坐席当前活跃会话数
        const assignments = get().assignments;
        const seatLoads = onlineSeats.map((st) => {
          const activeCount = assignments.filter(
            (a) => a.seatId === st.id && a.status === "active"
          ).length;
          return { seat: st, load: activeCount };
        });
        // 选负荷最低且未超限的
        const candidates = seatLoads
          .filter((sl) => sl.load < sl.seat.maxConcurrent)
          .sort((a, b) => a.load - b.load);
        if (candidates.length === 0) {
          get().addLog("自动分配失败", conversationId, "所有在线坐席已满负荷", "warning");
          return;
        }
        const target = candidates[0].seat;
        set((s) => {
          const newAssignment: ConversationAssignment = {
            conversationId,
            seatId: target.id,
            assignedAt: nowISO(),
            assignedBy: "auto",
            strategy: "least_load",
            status: "active",
          };
          return { assignments: [...s.assignments, newAssignment] };
        });
        get().addLog("自动分配", conversationId, `已自动分配至: ${target.name}（最少负荷）`, "info");
      },

      transferConversation: (conversationId, toSeatId) => {
        set((s) => ({
          assignments: s.assignments.map((a) =>
            a.conversationId === conversationId && a.status === "active"
              ? { ...a, status: "transferred" as const }
              : a
          ).concat({
            conversationId,
            seatId: toSeatId,
            assignedAt: nowISO(),
            assignedBy: "manual" as const,
            strategy: "manual" as const,
            status: "active" as const,
          }),
        }));
        const seat = get().seats.find((st) => st.id === toSeatId);
        get().addLog("会话转接", conversationId, `已转接至: ${seat?.name || toSeatId}`, "info");
      },

      // === 工具 ===
      resetAll: () => {
        set({
          accounts: [],
          tasks: [],
          conversations: [],
          sendRecords: [],
          logs: [],
          templates: genSampleTemplates(),
          rules: genSampleRules(),
          riskConfig: DEFAULT_RISK_CONFIG,
          seats: genSampleSeats(),
          assignments: [],
        });
      },

      loadSampleData: () => {
        const phones = [
          "2025550143", "2025550188", "2135550167", "3055550123", "4045550199",
          "4155550177", "5035550156", "6175550134", "6505550188", "7185550145",
          "2025550192", "2135550144", "3055550178", "4045550166", "4155550193",
        ];
        const samples = phones.map((p, i) => genSampleAccount(p, i));
        set((s) => ({ accounts: [...s.accounts, ...samples] }));
        get().addLog("加载示例数据", `15 条账号`, "已加载 15 条示例全参号", "info");
      },
    }),
    {
      name: "textnow-matrix-store",
      partialize: (s): PersistedState => ({
        accounts: s.accounts,
        tasks: s.tasks,
        templates: s.templates,
        conversations: s.conversations,
        rules: s.rules,
        sendRecords: s.sendRecords,
        riskConfig: s.riskConfig,
        logs: s.logs,
        users: s.users,
        seats: s.seats,
        assignments: s.assignments,
      }),
    }
  )
);

// ============================================================
// 辅助导出
// ============================================================

/** 变量替换函数 */
export function replaceVariables(content: string, targetNumber: string): string {
  const last4 = targetNumber.slice(-4);
  const ts = Date.now().toString();
  return content
    .replace(/\{随机数字\}/g, () => Math.floor(Math.random() * 90000000 + 10000000).toString())
    .replace(/\{随机字母\}/g, () => {
      const chars = "abcdefghijklmnopqrstuvwxyz";
      const len = 4 + Math.floor(Math.random() * 5);
      return Array.from({ length: len }, () => chars[Math.floor(Math.random() * 26)]).join("");
    })
    .replace(/\{收件人号后四位\}/g, last4)
    .replace(/\{时间戳\}/g, ts);
}

/** 敏感词检测 */
export function checkSensitive(content: string): string[] {
  const lower = content.toLowerCase();
  return SENSITIVE_WORDS.filter((w) => lower.includes(w.toLowerCase()));
}

export { genSampleAccount, uid, nowISO };

import { useStore } from "@/lib/store";
import { STATUS_MAP } from "@/lib/constants";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Users, Send, Inbox, TrendingUp, AlertTriangle, Activity, Shield, Clock,
  ArrowUpRight, Zap, Plus, MessageSquare, Server, Cpu, Database,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useMemo } from "react";
import {
  AreaChart, Area, ResponsiveContainer, Tooltip, XAxis, CartesianGrid,
} from "recharts";

export default function Dashboard() {
  const navigate = useNavigate();
  const accounts = useStore((s) => s.accounts);
  const tasks = useStore((s) => s.tasks);
  const conversations = useStore((s) => s.conversations);
  const logs = useStore((s) => s.logs);

  const stats = useMemo(() => {
    const total = accounts.length;
    const available = accounts.filter((a) => a.status === "normal" && a.enabled).length;
    const banned = accounts.filter((a) => a.status === "banned").length;
    const pendingRenew = accounts.filter((a) => a.status === "pending_renew").length;
    const todaySent = accounts.reduce((s, a) => s + a.totalSent, 0);
    const todayReceived = accounts.reduce((s, a) => s + a.totalReceived, 0);
    const totalSent = tasks.reduce((s, t) => s + t.success, 0);
    const totalAttempted = tasks.reduce((s, t) => s + t.success + t.failed, 0);
    const successRate = totalAttempted > 0 ? Math.round((totalSent / totalAttempted) * 100) : 0;
    const banRate = total > 0 ? Math.round((banned / total) * 100) : 0;
    return { total, available, banned, pendingRenew, todaySent, todayReceived, successRate, banRate };
  }, [accounts, tasks]);

  const runningTasks = tasks.filter((t) => t.status === "running");
  const recentLogs = logs.slice(0, 8);

  // 生成 7 天趋势数据（基于当前数据模拟）
  const trendData = useMemo(() => {
    const days = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"];
    const base = Math.max(stats.todaySent, 100);
    return days.map((day, i) => ({
      day,
      发送: Math.round(base * (0.6 + Math.sin(i * 0.8) * 0.3 + Math.random() * 0.15)),
      接收: Math.round(base * 0.4 * (0.7 + Math.cos(i * 0.6) * 0.2 + Math.random() * 0.1)),
    }));
  }, [stats.todaySent]);

  const statCards = [
    { label: "号池总量", value: stats.total, icon: Users, color: "text-blue-600 bg-blue-50 dark:bg-blue-950/40", sub: `可用 ${stats.available}`, trend: stats.available > 0 ? "up" : "flat", accent: "from-blue-500/60 to-blue-400/10" },
    { label: "今日发送量", value: stats.todaySent, icon: Send, color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40", sub: `成功率 ${stats.successRate}%`, trend: stats.todaySent > 0 ? "up" : "flat", accent: "from-emerald-500/60 to-emerald-400/10" },
    { label: "今日接收量", value: stats.todayReceived, icon: Inbox, color: "text-violet-600 bg-violet-50 dark:bg-violet-950/40", sub: `${conversations.length} 个会话`, trend: stats.todayReceived > 0 ? "up" : "flat", accent: "from-violet-500/60 to-violet-400/10" },
    { label: "封禁率", value: `${stats.banRate}%`, icon: AlertTriangle, color: "text-red-600 bg-red-50 dark:bg-red-950/40", sub: `封禁 ${stats.banned}`, trend: stats.banned > 0 ? "down" : "flat", accent: "from-red-500/60 to-red-400/10" },
  ];

  if (accounts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <div className="relative mb-6">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5">
            <Users className="h-10 w-10 text-primary" />
          </div>
          <div className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg">
            <Plus className="h-4 w-4" />
          </div>
        </div>
        <h2 className="text-xl font-semibold mb-2">号池为空，开始导入账号</h2>
        <p className="text-sm text-muted-foreground mb-8 text-center max-w-md leading-relaxed">
          支持 .jsonl 格式批量导入，字段名与甲方提供的 15 个原生字段 100% 兼容，导入后即可使用
        </p>
        <Button onClick={() => navigate("/accounts")} className="gap-1.5 shadow-md">
          <Plus className="h-4 w-4" /> 前往导入
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* 快捷操作栏 */}
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" onClick={() => navigate("/accounts")} className="gap-1.5 shadow-sm">
          <Plus className="h-3.5 w-3.5" /> 导入账号
        </Button>
        <Button size="sm" variant="outline" onClick={() => navigate("/tasks")} className="gap-1.5">
          <Zap className="h-3.5 w-3.5" /> 新建群发
        </Button>
        <Button size="sm" variant="outline" onClick={() => navigate("/chat")} className="gap-1.5">
          <MessageSquare className="h-3.5 w-3.5" /> 查看会话
          {conversations.reduce((s, c) => s + c.unread, 0) > 0 && (
            <Badge variant="destructive" className="ml-1 h-4 px-1 text-[10px]">
              {conversations.reduce((s, c) => s + c.unread, 0)}
            </Badge>
          )}
        </Button>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.label} className="tn-kpi-card p-4">
              <div className="flex items-start justify-between">
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground font-medium">{card.label}</p>
                  <p className="text-3xl font-bold mt-1.5 font-mono tabular-nums tn-count-up">{card.value}</p>
                  <p className="text-[11px] text-muted-foreground mt-1">{card.sub}</p>
                </div>
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${card.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
              {card.trend !== "flat" && (
                <div className="mt-2.5 flex items-center gap-1 text-[10px]">
                  {card.trend === "up" ? (
                    <span className="inline-flex items-center gap-0.5 text-emerald-600 font-medium">
                      <ArrowUpRight className="h-3 w-3" /> 活跃
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-0.5 text-red-600 font-medium">
                      <AlertTriangle className="h-3 w-3" /> 需关注
                    </span>
                  )}
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* 趋势图 + 运行中任务 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* 发送/接收趋势 */}
        <Card className="tn-card-hover p-4 lg:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold">近 7 日收发趋势</h3>
            <div className="ml-auto flex items-center gap-3 text-[11px]">
              <span className="inline-flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-chart-1" /> 发送
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-chart-2" /> 接收
              </span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={trendData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorSend" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorRecv" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--chart-2)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--chart-2)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                  fontSize: "12px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                }}
              />
              <Area type="monotone" dataKey="发送" stroke="var(--chart-1)" strokeWidth={2} fill="url(#colorSend)" />
              <Area type="monotone" dataKey="接收" stroke="var(--chart-2)" strokeWidth={2} fill="url(#colorRecv)" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        {/* 运行中任务 */}
        <Card className="tn-card-hover p-4">
          <div className="flex items-center gap-2 mb-3">
            <Activity className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold">运行中任务</h3>
            <Badge variant="secondary" className="ml-auto">{runningTasks.length}</Badge>
          </div>
          {runningTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted mb-2">
                <Zap className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-xs text-muted-foreground">暂无运行中任务</p>
            </div>
          ) : (
            <div className="space-y-3">
              {runningTasks.slice(0, 4).map((t) => (
                <div key={t.id} className="cursor-pointer group" onClick={() => navigate("/tasks")}>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-medium truncate group-hover:text-primary transition-colors">{t.name}</span>
                    <span className="font-mono tabular-nums text-muted-foreground">{t.progress}%</span>
                  </div>
                  <Progress value={t.progress} className="h-1.5" />
                  <div className="flex items-center gap-3 mt-1.5 text-[10px] text-muted-foreground">
                    <span className="text-emerald-600">成功 {t.success}</span>
                    <span className="text-red-600">失败 {t.failed}</span>
                    <span>总计 {t.total}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* 账号状态分布 + 风控概览 + 系统资源 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* 账号状态分布 */}
        <Card className="tn-card-hover p-4">
          <div className="flex items-center gap-2 mb-3">
            <Activity className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold">账号状态分布</h3>
          </div>
          <div className="space-y-2.5">
            {Object.entries(STATUS_MAP).map(([key, val]) => {
              const count = accounts.filter((a) => a.status === key).length;
              const pct = stats.total > 0 ? (count / stats.total) * 100 : 0;
              return (
                <div key={key} className="flex items-center gap-2">
                  <span className="text-xs w-16 text-muted-foreground">{val.label}</span>
                  <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-xs font-mono tabular-nums w-8 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </Card>

        {/* 风控概览 */}
        <Card className="tn-card-hover p-4">
          <div className="flex items-center gap-2 mb-3">
            <Shield className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold">风控概览</h3>
          </div>
          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between items-center py-1">
              <span className="text-muted-foreground">整体成功率</span>
              <span className={`font-mono tabular-nums font-semibold ${stats.successRate >= 80 ? "text-emerald-600" : "text-amber-600"}`}>{stats.successRate}%</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-muted-foreground">待续期账号</span>
              <span className={`font-mono tabular-nums font-semibold ${stats.pendingRenew > 0 ? "text-amber-600" : "text-emerald-600"}`}>{stats.pendingRenew}</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-muted-foreground">封禁账号</span>
              <span className={`font-mono tabular-nums font-semibold ${stats.banned > 0 ? "text-red-600" : "text-emerald-600"}`}>{stats.banned}</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-muted-foreground">活跃会话</span>
              <span className="font-mono tabular-nums font-semibold">{conversations.filter(c => c.unread > 0).length}</span>
            </div>
          </div>
        </Card>

        {/* 系统资源 */}
        <Card className="tn-card-hover p-4">
          <div className="flex items-center gap-2 mb-3">
            <Server className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold">系统资源</h3>
            <Badge variant="outline" className="ml-auto text-[10px] gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 tn-pulse-dot" /> 正常
            </Badge>
          </div>
          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between items-center py-1">
              <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                <Cpu className="h-3 w-3" /> CPU 使用率
              </span>
              <span className="font-mono tabular-nums font-semibold text-emerald-600">23%</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                <Database className="h-3 w-3" /> 内存占用
              </span>
              <span className="font-mono tabular-nums font-semibold text-emerald-600">1.2G</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                <Server className="h-3 w-3" /> 协议服务
              </span>
              <span className="font-mono tabular-nums font-semibold text-emerald-600">在线</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                <Activity className="h-3 w-3" /> 队列任务
              </span>
              <span className="font-mono tabular-nums font-semibold">{runningTasks.length}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* 最近操作日志 */}
      <Card className="tn-card-hover p-4">
        <div className="flex items-center gap-2 mb-3">
          <Clock className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">最近操作日志</h3>
          <Button variant="ghost" size="sm" className="ml-auto text-xs" onClick={() => navigate("/system")}>
            查看全部
          </Button>
        </div>
        {recentLogs.length === 0 ? (
          <p className="text-xs text-muted-foreground py-4 text-center">暂无操作记录</p>
        ) : (
          <div className="space-y-1.5">
            {recentLogs.map((log) => (
              <div key={log.id} className="flex items-center gap-3 text-xs py-1.5 border-b border-border/50 last:border-0 last:pb-0">
                <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                  log.level === "error" ? "bg-red-500" : log.level === "warning" ? "bg-amber-500" : "bg-emerald-500"
                }`} />
                <span className="text-muted-foreground font-mono tabular-nums w-32 shrink-0">
                  {new Date(log.timestamp).toLocaleString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}
                </span>
                <span className="font-medium w-20 shrink-0">{log.action}</span>
                <span className="text-muted-foreground truncate">{log.detail}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

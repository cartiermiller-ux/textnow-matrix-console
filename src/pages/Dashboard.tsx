import { useStore } from "@/lib/store";
import { STATUS_MAP } from "@/lib/constants";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Users, Send, Inbox, TrendingUp, AlertTriangle, Activity, Shield, Clock,
  ArrowUpRight, Zap, Plus, MessageSquare,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useMemo } from "react";

export default function Dashboard() {
  const navigate = useNavigate();
  const accounts = useStore((s) => s.accounts);
  const tasks = useStore((s) => s.tasks);
  const conversations = useStore((s) => s.conversations);
  const logs = useStore((s) => s.logs);
  const loadSampleData = useStore((s) => s.loadSampleData);

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

  const statCards = [
    { label: "号池总量", value: stats.total, icon: Users, color: "text-blue-600 bg-blue-50 dark:bg-blue-950/40", sub: `可用 ${stats.available}`, trend: stats.available > 0 ? "up" : "flat" },
    { label: "今日发送量", value: stats.todaySent, icon: Send, color: "text-green-600 bg-green-50 dark:bg-green-950/40", sub: `成功率 ${stats.successRate}%`, trend: stats.todaySent > 0 ? "up" : "flat" },
    { label: "今日接收量", value: stats.todayReceived, icon: Inbox, color: "text-purple-600 bg-purple-50 dark:bg-purple-950/40", sub: `${conversations.length} 个会话`, trend: stats.todayReceived > 0 ? "up" : "flat" },
    { label: "封禁率", value: `${stats.banRate}%`, icon: AlertTriangle, color: "text-red-600 bg-red-50 dark:bg-red-950/40", sub: `封禁 ${stats.banned}`, trend: stats.banned > 0 ? "down" : "flat" },
  ];

  if (accounts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
          <Users className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-lg font-semibold mb-2">号池为空，开始导入账号</h2>
        <p className="text-sm text-muted-foreground mb-6 text-center max-w-md">
          支持 .jsonl 格式批量导入，字段名与甲方提供的 15 个原生字段 100% 兼容，导入后即可使用
        </p>
        <div className="flex gap-3">
          <Button onClick={() => navigate("/accounts")} variant="default">
            前往导入
          </Button>
          <Button onClick={loadSampleData} variant="outline">
            加载示例数据
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* 快捷操作栏 */}
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" onClick={() => navigate("/accounts")} className="gap-1.5">
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
            <Card key={card.label} className="tn-card-hover p-4">
              <div className="flex items-start justify-between">
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">{card.label}</p>
                  <p className="text-2xl font-bold mt-1 font-mono tabular-nums">{card.value}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{card.sub}</p>
                </div>
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${card.color}`}>
                  <Icon className="h-4.5 w-4.5" />
                </div>
              </div>
              {card.trend !== "flat" && (
                <div className="mt-2 flex items-center gap-1 text-[10px]">
                  {card.trend === "up" ? (
                    <span className="inline-flex items-center gap-0.5 text-green-600">
                      <ArrowUpRight className="h-3 w-3" /> 活跃
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-0.5 text-red-600">
                      <AlertTriangle className="h-3 w-3" /> 需关注
                    </span>
                  )}
                </div>
              )}
            </Card>
          );
        })}
      </div>

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

        {/* 运行中任务 */}
        <Card className="tn-card-hover p-4">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold">运行中任务</h3>
            <Badge variant="secondary" className="ml-auto">{runningTasks.length}</Badge>
          </div>
          {runningTasks.length === 0 ? (
            <p className="text-xs text-muted-foreground py-6 text-center">暂无运行中任务</p>
          ) : (
            <div className="space-y-3">
              {runningTasks.slice(0, 4).map((t) => (
                <div key={t.id} className="cursor-pointer" onClick={() => navigate("/tasks")}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-medium truncate">{t.name}</span>
                    <span className="font-mono tabular-nums text-muted-foreground">{t.progress}%</span>
                  </div>
                  <Progress value={t.progress} className="h-1.5" />
                  <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground">
                    <span>成功 {t.success}</span>
                    <span>失败 {t.failed}</span>
                    <span>总计 {t.total}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* 风控概览 */}
        <Card className="tn-card-hover p-4">
          <div className="flex items-center gap-2 mb-3">
            <Shield className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold">风控概览</h3>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">整体成功率</span>
              <span className={`font-mono tabular-nums ${stats.successRate >= 80 ? "text-green-600" : "text-amber-600"}`}>{stats.successRate}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">待续期账号</span>
              <span className={`font-mono tabular-nums ${stats.pendingRenew > 0 ? "text-amber-600" : "text-green-600"}`}>{stats.pendingRenew}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">封禁账号</span>
              <span className={`font-mono tabular-nums ${stats.banned > 0 ? "text-red-600" : "text-green-600"}`}>{stats.banned}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">活跃会话</span>
              <span className="font-mono tabular-nums">{conversations.filter(c => c.unread > 0).length}</span>
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
              <div key={log.id} className="flex items-center gap-3 text-xs py-1.5 border-b border-border/50 last:border-0">
                <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                  log.level === "error" ? "bg-red-500" : log.level === "warning" ? "bg-amber-500" : "bg-green-500"
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

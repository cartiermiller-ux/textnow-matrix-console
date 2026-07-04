import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { STATUS_MAP, GROUP_MAP, TASK_STATUS_MAP } from "@/lib/constants";
import type { AccountStatus, AccountGroup } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip,
} from "recharts";
import {
  Users, Send, Inbox, TrendingUp, AlertTriangle, Download, Calendar,
  Activity, BarChart3, Clock, CheckCircle2, XCircle,
} from "lucide-react";
import { toast } from "sonner";

// 饼图配色
const PIE_COLORS: Record<AccountStatus, string> = {
  normal: "#22c55e",
  pending_renew: "#f59e0b",
  banned: "#ef4444",
  expired: "#9ca3af",
  disabled: "#6b7280",
};

// 柱状图配色
const BAR_COLORS: Record<AccountGroup, string> = {
  marketing: "#3b82f6",
  service: "#a855f7",
  backup: "#06b6d4",
  test: "#f97316",
};

type TimeRange = "day" | "week" | "month";

export default function Statistics() {
  const accounts = useStore((s) => s.accounts);
  const tasks = useStore((s) => s.tasks);
  const conversations = useStore((s) => s.conversations);

  const [timeRange, setTimeRange] = useState<TimeRange>("day");

  // === 运营总览大盘 ===
  const overview = useMemo(() => {
    const total = accounts.length;
    const available = accounts.filter((a) => a.status === "normal" && a.enabled).length;
    const banned = accounts.filter((a) => a.status === "banned").length;
    const todaySent = accounts.reduce((s, a) => s + a.totalSent, 0);
    const todayReceived = accounts.reduce((s, a) => s + a.totalReceived, 0);
    const totalSuccess = tasks.reduce((s, t) => s + t.success, 0);
    const totalAttempted = tasks.reduce((s, t) => s + t.success + t.failed, 0);
    const successRate = totalAttempted > 0 ? Math.round((totalSuccess / totalAttempted) * 100) : 0;
    const banRate = total > 0 ? Math.round((banned / total) * 100) : 0;
    return { total, available, banned, todaySent, todayReceived, successRate, banRate };
  }, [accounts, tasks]);

  // === 账号维度统计（按发送量降序）===
  const accountStats = useMemo(() => {
    const now = Date.now();
    return accounts
      .map((a) => {
        const createdMs = new Date(a.createdAt).getTime();
        const aliveMs = now - createdMs;
        const aliveDays = Math.floor(aliveMs / 86400000);
        const aliveHours = Math.floor((aliveMs % 86400000) / 3600000);
        return {
          ...a,
          aliveDuration: aliveDays > 0 ? `${aliveDays}天${aliveHours}小时` : `${aliveHours}小时`,
        };
      })
      .sort((a, b) => b.totalSent - a.totalSent);
  }, [accounts]);

  // === 任务维度统计 ===
  const taskStats = useMemo(() => {
    return tasks.map((t) => {
      const successRate = t.total > 0 ? Math.round((t.success / t.total) * 100) : 0;
      let duration = "—";
      if (t.startedAt) {
        const start = new Date(t.startedAt).getTime();
        const end = t.completedAt ? new Date(t.completedAt).getTime() : Date.now();
        const diffMs = end - start;
        const mins = Math.floor(diffMs / 60000);
        const secs = Math.floor((diffMs % 60000) / 1000);
        duration = mins > 0 ? `${mins}分${secs}秒` : `${secs}秒`;
      }
      const failReasonList = Object.entries(t.failReasons)
        .map(([reason, count]) => `${reason}(${count})`)
        .join("、");
      return { ...t, successRate, duration, failReasonList };
    });
  }, [tasks]);

  // === 饼图数据：账号状态分布 ===
  const statusPieData = useMemo(() => {
    return (Object.keys(STATUS_MAP) as AccountStatus[]).map((key) => ({
      name: STATUS_MAP[key].label,
      key,
      value: accounts.filter((a) => a.status === key).length,
    }));
  }, [accounts]);

  // === 柱状图数据：分组分布 ===
  const groupBarData = useMemo(() => {
    return (Object.keys(GROUP_MAP) as AccountGroup[]).map((key) => ({
      name: GROUP_MAP[key].label,
      key,
      数量: accounts.filter((a) => a.group === key).length,
    }));
  }, [accounts]);

  // === 导出 CSV ===
  const handleExportCSV = () => {
    const escape = (val: string | number | undefined | null) => {
      const s = String(val ?? "");
      if (s.includes(",") || s.includes('"') || s.includes("\n")) {
        return `"${s.replace(/"/g, '""')}"`;
      }
      return s;
    };

    const lines: string[] = [];

    lines.push("=== 账号维度统计 ===");
    lines.push("手机号,分组,状态,累计发送量,累计接收量,存活时长,最后活跃时间");
    accountStats.forEach((a) => {
      lines.push([
        escape(a.phone),
        escape(GROUP_MAP[a.group].label),
        escape(STATUS_MAP[a.status].label),
        a.totalSent,
        a.totalReceived,
        escape(a.aliveDuration),
        escape(new Date(a.lastActiveAt).toLocaleString("zh-CN")),
      ].join(","));
    });

    lines.push("");
    lines.push("=== 任务维度统计 ===");
    lines.push("任务名称,状态,发送总数,成功数,失败数,成功率,耗时,失败原因分布");
    taskStats.forEach((t) => {
      lines.push([
        escape(t.name),
        escape(TASK_STATUS_MAP[t.status].label),
        t.total,
        t.success,
        t.failed,
        `${t.successRate}%`,
        escape(t.duration),
        escape(t.failReasonList || "无"),
      ].join(","));
    });

    const csv = "\uFEFF" + lines.join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `运营报表_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("运营报表已导出为 CSV");
  };

  const statCards = [
    { label: "号池总量", value: overview.total, icon: Users, color: "text-blue-600 bg-blue-50", sub: `可用 ${overview.available}` },
    { label: "今日发送量", value: overview.todaySent, icon: Send, color: "text-green-600 bg-green-50", sub: `成功率 ${overview.successRate}%` },
    { label: "今日接收量", value: overview.todayReceived, icon: Inbox, color: "text-purple-600 bg-purple-50", sub: `${conversations.length} 个会话` },
    { label: "整体成功率", value: `${overview.successRate}%`, icon: TrendingUp, color: "text-cyan-600 bg-cyan-50", sub: overview.successRate >= 80 ? "良好" : "需关注" },
    { label: "封禁率", value: `${overview.banRate}%`, icon: AlertTriangle, color: "text-red-600 bg-red-50", sub: `封禁 ${overview.banned}` },
    { label: "可用账号", value: overview.available, icon: CheckCircle2, color: "text-emerald-600 bg-emerald-50", sub: `占比 ${overview.total > 0 ? Math.round((overview.available / overview.total) * 100) : 0}%` },
  ];

  const timeRangeBtns: { key: TimeRange; label: string }[] = [
    { key: "day", label: "日" },
    { key: "week", label: "周" },
    { key: "month", label: "月" },
  ];

  return (
    <div className="space-y-5">
      {/* 工具栏 */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1 rounded-lg border bg-muted/30 p-0.5">
          <Calendar className="h-3.5 w-3.5 text-muted-foreground ml-2" />
          {timeRangeBtns.map((b) => (
            <Button
              key={b.key}
              size="sm"
              variant={timeRange === b.key ? "default" : "ghost"}
              className="h-7 px-3 text-xs"
              onClick={() => setTimeRange(b.key)}
            >
              {b.label}
            </Button>
          ))}
        </div>
        <span className="text-xs text-muted-foreground">时间维度选择仅用于 UI 展示，不影响数据范围</span>
        <Button size="sm" className="ml-auto" onClick={handleExportCSV}>
          <Download className="h-4 w-4 mr-1" /> 导出运营报表 CSV
        </Button>
      </div>

      {/* 运营总览大盘 */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.label} className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">{card.label}</p>
                  <p className="text-2xl font-bold mt-1 font-mono">{card.value}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{card.sub}</p>
                </div>
                <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${card.color}`}>
                  <Icon className="h-4.5 w-4.5" />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* 图表区 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 账号状态分布饼图 */}
        <Card className="tn-card-hover p-4">
          <div className="flex items-center gap-2 mb-3">
            <Activity className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold">账号状态分布</h3>
          </div>
          {accounts.length === 0 ? (
            <p className="text-xs text-muted-foreground py-12 text-center">暂无账号数据</p>
          ) : (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="60%" height={220}>
                <PieChart>
                  <Pie
                    data={statusPieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={(entry) => `${entry.name} ${entry.value}`}
                  >
                    {statusPieData.map((entry) => (
                      <Cell key={entry.key} fill={PIE_COLORS[entry.key as AccountStatus]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-1.5">
                {statusPieData.map((entry) => (
                  <div key={entry.key} className="flex items-center gap-2 text-xs">
                    <span
                      className="h-2.5 w-2.5 rounded-sm"
                      style={{ backgroundColor: PIE_COLORS[entry.key as AccountStatus] }}
                    />
                    <span className="text-muted-foreground">{entry.name}</span>
                    <span className="font-mono ml-auto">{entry.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>

        {/* 分组分布柱状图 */}
        <Card className="tn-card-hover p-4">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold">分组分布</h3>
          </div>
          {accounts.length === 0 ? (
            <p className="text-xs text-muted-foreground py-12 text-center">暂无账号数据</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={groupBarData}>
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="数量" radius={[4, 4, 0, 0]}>
                  {groupBarData.map((entry) => (
                    <Cell key={entry.key} fill={BAR_COLORS[entry.key as AccountGroup]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      {/* 账号维度统计表格 */}
      <Card className="overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b">
          <Users className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">账号维度统计</h3>
          <Badge variant="secondary" className="ml-auto">按发送量降序</Badge>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-32">手机号</TableHead>
                <TableHead className="w-24">分组</TableHead>
                <TableHead className="w-24">状态</TableHead>
                <TableHead className="w-24">累计发送量</TableHead>
                <TableHead className="w-24">累计接收量</TableHead>
                <TableHead className="w-32">存活时长</TableHead>
                <TableHead>最后活跃时间</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accountStats.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                    暂无账号数据
                  </TableCell>
                </TableRow>
              ) : (
                accountStats.map((a) => (
                  <TableRow key={a.id} className="hover:bg-muted/30">
                    <TableCell className="font-mono text-xs">{a.phone}</TableCell>
                    <TableCell>
                      <span className={`inline-flex rounded border px-1.5 py-0.5 text-[10px] font-medium ${GROUP_MAP[a.group].color}`}>
                        {GROUP_MAP[a.group].label}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex rounded border px-1.5 py-0.5 text-[10px] font-medium ${STATUS_MAP[a.status].color}`}>
                        {STATUS_MAP[a.status].label}
                      </span>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{a.totalSent}</TableCell>
                    <TableCell className="font-mono text-xs">{a.totalReceived}</TableCell>
                    <TableCell className="font-mono text-xs">{a.aliveDuration}</TableCell>
                    <TableCell className="text-xs text-muted-foreground font-mono">
                      {new Date(a.lastActiveAt).toLocaleString("zh-CN")}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        {accountStats.length > 0 && (
          <div className="px-4 py-2 border-t text-xs text-muted-foreground">
            共 {accountStats.length} 个账号
          </div>
        )}
      </Card>

      {/* 任务维度统计表格 */}
      <Card className="overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b">
          <Clock className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">任务维度统计</h3>
          <Badge variant="secondary" className="ml-auto">{taskStats.length} 个任务</Badge>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-40">任务名称</TableHead>
                <TableHead className="w-24">状态</TableHead>
                <TableHead className="w-20">发送总数</TableHead>
                <TableHead className="w-20">成功数</TableHead>
                <TableHead className="w-20">失败数</TableHead>
                <TableHead className="w-24">成功率</TableHead>
                <TableHead className="w-28">耗时</TableHead>
                <TableHead>失败原因分布</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {taskStats.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                    暂无任务数据
                  </TableCell>
                </TableRow>
              ) : (
                taskStats.map((t) => (
                  <TableRow key={t.id} className="hover:bg-muted/30">
                    <TableCell className="text-xs font-medium truncate max-w-40">{t.name}</TableCell>
                    <TableCell>
                      <span className={`inline-flex rounded border px-1.5 py-0.5 text-[10px] font-medium ${TASK_STATUS_MAP[t.status].color}`}>
                        {TASK_STATUS_MAP[t.status].label}
                      </span>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{t.total}</TableCell>
                    <TableCell className="font-mono text-xs text-green-600">{t.success}</TableCell>
                    <TableCell className="font-mono text-xs text-red-600">{t.failed}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <span className={`font-mono text-xs ${t.successRate >= 80 ? "text-green-600" : t.successRate >= 50 ? "text-amber-600" : "text-red-600"}`}>
                          {t.successRate}%
                        </span>
                        {t.successRate >= 80 ? (
                          <CheckCircle2 className="h-3 w-3 text-green-500" />
                        ) : (
                          <XCircle className="h-3 w-3 text-amber-500" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{t.duration}</TableCell>
                    <TableCell className="text-xs text-muted-foreground truncate max-w-48">
                      {t.failReasonList || "—"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}

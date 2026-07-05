import { useState, useMemo } from "react";
import { useStore } from "@/lib/store";
import { TASK_STATUS_MAP, PRIORITY_MAP, GROUP_MAP } from "@/lib/constants";
import type { AccountGroup, TaskPriority } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import {
  Plus, Send, Play, Pause, Square, Trash2, Zap, MoreHorizontal,
  Inbox, CheckCircle2, XCircle, TrendingUp, AlertTriangle, FileText,
  Image as ImageIcon, Link as LinkIcon,
} from "lucide-react";

const PHONE_RE = /^\d{10}$/;

export default function Tasks() {
  const tasks = useStore((s) => s.tasks);
  const templates = useStore((s) => s.templates);
  const accounts = useStore((s) => s.accounts);
  const createTask = useStore((s) => s.createTask);
  const startTask = useStore((s) => s.startTask);
  const pauseTask = useStore((s) => s.pauseTask);
  const resumeTask = useStore((s) => s.resumeTask);
  const terminateTask = useStore((s) => s.terminateTask);
  const deleteTask = useStore((s) => s.deleteTask);
  const simulateTaskProgress = useStore((s) => s.simulateTaskProgress);

  const [createOpen, setCreateOpen] = useState(false);

  // 任务维度统计
  const stats = useMemo(() => {
    const totalSent = tasks.reduce((s, t) => s + t.success + t.failed, 0);
    const success = tasks.reduce((s, t) => s + t.success, 0);
    const failed = tasks.reduce((s, t) => s + t.failed, 0);
    const rate = totalSent > 0 ? Math.round((success / totalSent) * 100) : 0;
    const failReasons: Record<string, number> = {};
    tasks.forEach((t) => {
      Object.entries(t.failReasons).forEach(([k, v]) => {
        failReasons[k] = (failReasons[k] || 0) + v;
      });
    });
    const failTotal = Object.values(failReasons).reduce((s, n) => s + n, 0);
    return { totalSent, success, failed, rate, failReasons, failTotal };
  }, [tasks]);

  const tplName = (id: string) => templates.find((t) => t.id === id)?.name || "—";

  const statCards = [
    { label: "发送总数", value: stats.totalSent, icon: Send, color: "text-blue-600 bg-blue-50" },
    { label: "成功数", value: stats.success, icon: CheckCircle2, color: "text-green-600 bg-green-50" },
    { label: "失败数", value: stats.failed, icon: XCircle, color: "text-red-600 bg-red-50" },
    { label: "成功率", value: `${stats.rate}%`, icon: TrendingUp, color: stats.rate >= 80 ? "text-green-600 bg-green-50" : "text-amber-600 bg-amber-50" },
  ];

  return (
    <div className="space-y-4">
      {/* 统计卡片 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.label} className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">{card.label}</p>
                  <p className="text-2xl font-bold mt-1 font-mono">{card.value}</p>
                </div>
                <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${card.color}`}>
                  <Icon className="h-4.5 w-4.5" />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* 任务列表 */}
        <Card className="lg:col-span-2 overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b">
            <Send className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold">群发任务</h3>
            <Badge variant="secondary" className="ml-1">{tasks.length}</Badge>
            <Button size="sm" className="ml-auto" onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-1" /> 新建任务
            </Button>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-36">任务名</TableHead>
                  <TableHead className="w-20">分组</TableHead>
                  <TableHead className="w-16">目标</TableHead>
                  <TableHead className="w-28">模板</TableHead>
                  <TableHead className="w-16">优先级</TableHead>
                  <TableHead className="w-20">状态</TableHead>
                  <TableHead className="w-32">进度</TableHead>
                  <TableHead className="w-24">成功/失败</TableHead>
                  <TableHead className="w-28">创建时间</TableHead>
                  <TableHead className="w-16">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tasks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-12 text-muted-foreground">
                      <div className="flex flex-col items-center gap-2">
                        <Inbox className="h-8 w-8 text-muted-foreground/50" />
                        <span>暂无任务，点击新建</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  tasks.map((t) => {
                    const st = TASK_STATUS_MAP[t.status];
                    const pr = PRIORITY_MAP[t.priority];
                    const gp = GROUP_MAP[t.accountGroup];
                    return (
                      <TableRow key={t.id} className="hover:bg-muted/30">
                        <TableCell className="text-xs font-medium truncate max-w-36">{t.name}</TableCell>
                        <TableCell>
                          <span className={`inline-flex rounded border px-1.5 py-0.5 text-[10px] font-medium ${gp.color}`}>
                            {gp.label}
                          </span>
                        </TableCell>
                        <TableCell className="font-mono text-xs">{t.total}</TableCell>
                        <TableCell className="text-xs text-muted-foreground truncate max-w-28">
                          <div className="flex items-center gap-1">
                            <span className="truncate">{tplName(t.templateId)}</span>
                            {t.imageUrl && (
                              <span title="含图片" className="shrink-0 text-purple-600"><ImageIcon className="h-3 w-3" /></span>
                            )}
                            {t.linkUrl && (
                              <span title="含链接" className="shrink-0 text-blue-600"><LinkIcon className="h-3 w-3" /></span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={`text-xs font-medium ${pr.color}`}>{pr.label}</span>
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex rounded border px-1.5 py-0.5 text-[10px] font-medium ${st.color}`}>
                            {st.label}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <Progress value={t.progress} className="h-1.5" />
                            <span className="text-[10px] font-mono text-muted-foreground">{t.progress}%</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs">
                          <span className="font-mono text-green-600">{t.success}</span>
                          <span className="text-muted-foreground mx-0.5">/</span>
                          <span className="font-mono text-red-600">{t.failed}</span>
                        </TableCell>
                        <TableCell className="text-[10px] text-muted-foreground font-mono">
                          {new Date(t.createdAt).toLocaleString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {(t.status === "draft" || t.status === "pending") && (
                                <DropdownMenuItem onClick={() => { startTask(t.id); toast.success("任务已启动"); }}>
                                  <Play className="h-3.5 w-3.5 mr-2" /> 启动
                                </DropdownMenuItem>
                              )}
                              {t.status === "running" && (
                                <DropdownMenuItem onClick={() => { pauseTask(t.id); toast.success("任务已暂停"); }}>
                                  <Pause className="h-3.5 w-3.5 mr-2" /> 暂停
                                </DropdownMenuItem>
                              )}
                              {t.status === "paused" && (
                                <DropdownMenuItem onClick={() => { resumeTask(t.id); toast.success("任务已恢复"); }}>
                                  <Play className="h-3.5 w-3.5 mr-2" /> 恢复
                                </DropdownMenuItem>
                              )}
                              {(t.status === "running" || t.status === "paused") && (
                                <DropdownMenuItem onClick={() => { terminateTask(t.id); toast.success("任务已终止"); }}>
                                  <Square className="h-3.5 w-3.5 mr-2" /> 终止
                                </DropdownMenuItem>
                              )}
                              {t.status === "running" && (
                                <DropdownMenuItem onClick={() => { simulateTaskProgress(t.id); }}>
                                  <Zap className="h-3.5 w-3.5 mr-2" /> 刷新进度
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem className="text-red-600" onClick={() => { deleteTask(t.id); toast.success("任务已删除"); }}>
                                <Trash2 className="h-3.5 w-3.5 mr-2" /> 删除
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </Card>

        {/* 失败原因分布 */}
        <Card className="tn-card-hover p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold">失败原因分布</h3>
          </div>
          {stats.failTotal === 0 ? (
            <p className="text-xs text-muted-foreground py-8 text-center">暂无失败记录</p>
          ) : (
            <div className="space-y-2.5">
              {Object.entries(stats.failReasons)
                .sort((a, b) => b[1] - a[1])
                .map(([reason, count]) => {
                  const pct = stats.failTotal > 0 ? (count / stats.failTotal) * 100 : 0;
                  return (
                    <div key={reason} className="flex items-center gap-2">
                      <span className="text-xs w-24 text-muted-foreground truncate">{reason}</span>
                      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full bg-red-500" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs font-mono w-8 text-right">{count}</span>
                    </div>
                  );
                })}
            </div>
          )}
        </Card>
      </div>

      {/* 新建任务弹窗 */}
      <CreateTaskDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        accountCount={accounts.length}
        onCreate={(payload) => {
          createTask(payload);
          toast.success(`任务「${payload.name}」已创建，目标 ${payload.targetNumbers.length} 条`);
          setCreateOpen(false);
        }}
      />
    </div>
  );
}

// === 新建任务弹窗 ===
interface CreateTaskPayload {
  name: string;
  accountGroup: AccountGroup;
  targetNumbers: string[];
  templateId: string;
  scheduleStart: string;
  scheduleEnd: string;
  priority: TaskPriority;
  imageUrl?: string;
  linkUrl?: string;
  linkText?: string;
}

function CreateTaskDialog({
  open,
  onOpenChange,
  accountCount,
  onCreate,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  accountCount: number;
  onCreate: (payload: CreateTaskPayload) => void;
}) {
  const templates = useStore((s) => s.templates);

  const [name, setName] = useState("");
  const [accountGroup, setAccountGroup] = useState<AccountGroup>("marketing");
  const [rawNumbers, setRawNumbers] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [scheduleStart, setScheduleStart] = useState("");
  const [scheduleEnd, setScheduleEnd] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("normal");

  // 解析目标号码：去重 + 格式校验
  const parsed = useMemo(() => {
    const lines = rawNumbers.split("\n").map((l) => l.trim()).filter(Boolean);
    const seen = new Set<string>();
    const valid: string[] = [];
    const invalid: string[] = [];
    const duplicates: string[] = [];
    lines.forEach((l) => {
      if (!PHONE_RE.test(l)) {
        invalid.push(l);
        return;
      }
      if (seen.has(l)) {
        duplicates.push(l);
        return;
      }
      seen.add(l);
      valid.push(l);
    });
    return { valid, invalid, duplicates, total: lines.length };
  }, [rawNumbers]);

  const reset = () => {
    setName("");
    setAccountGroup("marketing");
    setRawNumbers("");
    setTemplateId("");
    setScheduleStart("");
    setScheduleEnd("");
    setPriority("normal");
  };

  const handleCreate = () => {
    if (!name.trim()) {
      toast.error("请输入任务名");
      return;
    }
    if (parsed.valid.length === 0) {
      toast.error("请输入至少一个有效目标号码（10位数字）");
      return;
    }
    if (!templateId) {
      toast.error("请选择内容模板");
      return;
    }
    if (scheduleStart && scheduleEnd && scheduleStart >= scheduleEnd) {
      toast.error("发送时段结束时间必须晚于开始时间");
      return;
    }
    const selectedTpl = templates.find((t) => t.id === templateId);
    onCreate({
      name: name.trim(),
      accountGroup,
      targetNumbers: parsed.valid,
      templateId,
      scheduleStart: scheduleStart ? new Date(scheduleStart).toISOString() : new Date().toISOString(),
      scheduleEnd: scheduleEnd ? new Date(scheduleEnd).toISOString() : new Date(Date.now() + 3600000).toISOString(),
      priority,
      imageUrl: selectedTpl?.imageUrl,
      linkUrl: selectedTpl?.linkUrl,
      linkText: selectedTpl?.linkText,
    });
    reset();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) reset(); }}>
      <DialogContent className="max-w-2xl max-h-[88vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>新建群发任务</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">任务名</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="如：7月营销推广-第一批" className="text-xs h-8" />
            </div>
            <div>
              <Label className="text-xs">账号分组</Label>
              <Select value={accountGroup} onValueChange={(v) => setAccountGroup(v as AccountGroup)}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(GROUP_MAP).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <Label className="text-xs">导入目标号码（每行一个，10位数字）</Label>
              <span className="text-[10px] text-muted-foreground">
                共 {parsed.total} 行 · 有效 <span className="text-green-600 font-mono">{parsed.valid.length}</span>
                {parsed.invalid.length > 0 && <> · 无效 <span className="text-red-600 font-mono">{parsed.invalid.length}</span></>}
                {parsed.duplicates.length > 0 && <> · 重复 <span className="text-amber-600 font-mono">{parsed.duplicates.length}</span></>}
              </span>
            </div>
            <Textarea
              value={rawNumbers}
              onChange={(e) => setRawNumbers(e.target.value)}
              placeholder={"2025550143\n2025550188\n2135550167"}
              className="font-mono text-xs min-h-32"
            />
            {parsed.invalid.length > 0 && (
              <p className="text-[10px] text-red-600 mt-1 font-mono truncate">
                无效号码: {parsed.invalid.slice(0, 5).join(", ")}{parsed.invalid.length > 5 ? " ..." : ""}
              </p>
            )}
            {parsed.duplicates.length > 0 && (
              <p className="text-[10px] text-amber-600 mt-1 font-mono truncate">
                已自动去重: {parsed.duplicates.slice(0, 5).join(", ")}{parsed.duplicates.length > 5 ? " ..." : ""}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">内容模板</Label>
              <Select value={templateId} onValueChange={setTemplateId}>
                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="选择模板" /></SelectTrigger>
                <SelectContent>
                  {templates.filter((t) => t.enabled).map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">优先级</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as TaskPriority)}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(PRIORITY_MAP).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 模板附件预览 */}
          {templateId && (() => {
            const tpl = templates.find((t) => t.id === templateId);
            if (!tpl || (!tpl.imageUrl && !tpl.linkUrl)) return null;
            return (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-2.5">
                <p className="text-[10px] text-amber-800 font-medium mb-1.5">模板附带多媒体内容（将随每条消息发送）</p>
                <div className="flex items-center gap-2">
                  {tpl.imageUrl && (
                    <div className="flex items-center gap-1">
                      <img src={tpl.imageUrl} alt="附件" className="h-10 w-10 rounded object-cover border" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                      <Badge variant="outline" className="text-[10px] py-0 text-purple-600 border-purple-200">图片</Badge>
                    </div>
                  )}
                  {tpl.linkUrl && (
                    <Badge variant="outline" className="text-[10px] py-0 text-blue-600 border-blue-200">
                      链接: {tpl.linkText || tpl.linkUrl.slice(0, 30)}
                    </Badge>
                  )}
                </div>
              </div>
            );
          })()}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">发送开始时间</Label>
              <Input type="datetime-local" value={scheduleStart} onChange={(e) => setScheduleStart(e.target.value)} className="text-xs h-8" />
            </div>
            <div>
              <Label className="text-xs">发送结束时间</Label>
              <Input type="datetime-local" value={scheduleEnd} onChange={(e) => setScheduleEnd(e.target.value)} className="text-xs h-8" />
            </div>
          </div>

          <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs text-blue-800">
            <div className="flex items-start gap-2">
              <FileText className="h-4 w-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium mb-0.5">提示</p>
                <p>当前号池共 {accountCount} 个账号，将使用「{GROUP_MAP[accountGroup].label}」分组的可用账号执行发送。目标号码自动去重并校验 10 位数字格式。</p>
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>取消</Button>
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-1" /> 创建任务
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

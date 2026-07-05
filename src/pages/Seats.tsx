import { useState, useMemo } from "react";
import { useStore } from "@/lib/store";
import type { Seat, SeatStatus, SeatGroup, SeatSkill, AssignmentStrategy } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import {
  Headset, Plus, Edit3, Trash2, UserCheck, UserX, Clock,
  MessageSquare, Star, Activity, Search, Link2, Zap,
} from "lucide-react";

const STATUS_LABEL: Record<SeatStatus, string> = {
  online: "在线",
  busy: "忙碌",
  away: "离开",
  offline: "离线",
};

const STATUS_COLOR: Record<SeatStatus, string> = {
  online: "bg-green-500/20 text-green-600 border-green-200",
  busy: "bg-orange-500/20 text-orange-600 border-orange-200",
  away: "bg-yellow-500/20 text-yellow-600 border-yellow-200",
  offline: "bg-gray-300/30 text-gray-500 border-gray-200",
};

const STATUS_DOT: Record<SeatStatus, string> = {
  online: "bg-green-500",
  busy: "bg-orange-500",
  away: "bg-yellow-500",
  offline: "bg-gray-400",
};

const GROUP_LABEL: Record<SeatGroup, string> = {
  sales: "销售组",
  support: "客服组",
  vip: "VIP专属",
  backup: "备用组",
};

const SKILL_LABEL: Record<SeatSkill, string> = {
  textnow: "TextNow",
  marketing: "营销转化",
  complaint: "投诉处理",
  technical: "技术支持",
  multilingual: "多语言",
};

const STRATEGY_LABEL: Record<AssignmentStrategy, string> = {
  round_robin: "轮询分配",
  least_load: "最少负荷",
  skill_match: "技能匹配",
  manual: "人工指定",
};

export default function Seats() {
  const seats = useStore((s) => s.seats);
  const accounts = useStore((s) => s.accounts);
  const assignments = useStore((s) => s.assignments);
  const conversations = useStore((s) => s.conversations);
  const addSeat = useStore((s) => s.addSeat);
  const updateSeat = useStore((s) => s.updateSeat);
  const deleteSeat = useStore((s) => s.deleteSeat);
  const setSeatStatus = useStore((s) => s.setSeatStatus);
  const bindSeatAccounts = useStore((s) => s.bindSeatAccounts);
  const assignConversation = useStore((s) => s.assignConversation);
  const autoAssignConversation = useStore((s) => s.autoAssignConversation);
  const addLog = useStore((s) => s.addLog);

  const [search, setSearch] = useState("");
  const [groupFilter, setGroupFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSeat, setEditingSeat] = useState<Seat | null>(null);
  const [bindDialogOpen, setBindDialogOpen] = useState(false);
  const [bindSeat, setBindSeat] = useState<Seat | null>(null);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [assignConvId, setAssignConvId] = useState("");
  const [convFilter, setConvFilter] = useState<"all" | "unassigned" | "assigned">("unassigned");
  const [convSearch, setConvSearch] = useState("");

  // 表单状态
  const [form, setForm] = useState({
    name: "",
    seatNo: "",
    group: "support" as SeatGroup,
    skills: [] as SeatSkill[],
    maxConcurrent: 3,
    workSchedule: "周一至周五 09:00-18:00",
    notes: "",
  });

  const filteredSeats = useMemo(() => {
    return seats.filter((s) => {
      if (search && !s.name.includes(search) && !s.seatNo.includes(search)) return false;
      if (groupFilter !== "all" && s.group !== groupFilter) return false;
      if (statusFilter !== "all" && s.status !== statusFilter) return false;
      return true;
    });
  }, [seats, search, groupFilter, statusFilter]);

  // 统计
  const stats = useMemo(() => {
    const online = seats.filter((s) => s.enabled && s.status === "online").length;
    const busy = seats.filter((s) => s.enabled && s.status === "busy").length;
    const totalConv = seats.reduce((sum, s) => sum + s.totalConversations, 0);
    const avgSatisfaction = seats.length > 0
      ? Math.round(seats.reduce((sum, s) => sum + s.satisfaction, 0) / seats.length)
      : 0;
    const activeAssignments = assignments.filter((a) => a.status === "active").length;
    return { online, busy, totalConv, avgSatisfaction, activeAssignments, total: seats.length };
  }, [seats, assignments]);

  function openAddDialog() {
    setEditingSeat(null);
    setForm({
      name: "",
      seatNo: `S${String(seats.length + 1).padStart(3, "0")}`,
      group: "support",
      skills: ["textnow"],
      maxConcurrent: 3,
      workSchedule: "周一至周五 09:00-18:00",
      notes: "",
    });
    setDialogOpen(true);
  }

  function openEditDialog(seat: Seat) {
    setEditingSeat(seat);
    setForm({
      name: seat.name,
      seatNo: seat.seatNo,
      group: seat.group,
      skills: seat.skills,
      maxConcurrent: seat.maxConcurrent,
      workSchedule: seat.workSchedule,
      notes: seat.notes || "",
    });
    setDialogOpen(true);
  }

  function handleSave() {
    if (!form.name.trim()) {
      toast.error("请填写坐席名称");
      return;
    }
    if (editingSeat) {
      updateSeat(editingSeat.id, {
        name: form.name,
        seatNo: form.seatNo,
        group: form.group,
        skills: form.skills,
        maxConcurrent: form.maxConcurrent,
        workSchedule: form.workSchedule,
        notes: form.notes,
      });
      toast.success("坐席信息已更新");
    } else {
      addSeat({
        name: form.name,
        seatNo: form.seatNo,
        group: form.group,
        skills: form.skills,
        status: "offline",
        enabled: true,
        maxConcurrent: form.maxConcurrent,
        boundAccountIds: [],
        workSchedule: form.workSchedule,
        notes: form.notes,
      });
      toast.success("坐席已创建");
    }
    setDialogOpen(false);
  }

  function toggleSkill(skill: SeatSkill) {
    setForm((f) => ({
      ...f,
      skills: f.skills.includes(skill)
        ? f.skills.filter((s) => s !== skill)
        : [...f.skills, skill],
    }));
  }

  function getSeatLoad(seatId: string): number {
    return assignments.filter((a) => a.seatId === seatId && a.status === "active").length;
  }

  function getAssignedSeatName(convId: string): string | null {
    const active = assignments.find((a) => a.conversationId === convId && a.status === "active");
    if (!active) return null;
    const seat = seats.find((s) => s.id === active.seatId);
    return seat?.name || null;
  }

  function handleAutoAssignAll() {
    const unassigned = conversations.filter(
      (c) => !assignments.some((a) => a.conversationId === c.id && a.status === "active")
    );
    if (unassigned.length === 0) {
      toast.info("没有待分配的会话");
      return;
    }
    unassigned.forEach((c) => autoAssignConversation(c.id));
    toast.success(`已自动分配 ${unassigned.length} 个会话`);
  }

  const unassignedConversations = conversations.filter(
    (c) => !assignments.some((a) => a.conversationId === c.id && a.status === "active")
  );

  const filteredConversations = useMemo(() => {
    return conversations.filter((c) => {
      const isAssigned = assignments.some((a) => a.conversationId === c.id && a.status === "active");
      if (convFilter === "unassigned" && isAssigned) return false;
      if (convFilter === "assigned" && !isAssigned) return false;
      if (convSearch && !c.peerNumber.includes(convSearch) && !c.lastMessage.includes(convSearch)) return false;
      return true;
    });
  }, [conversations, assignments, convFilter, convSearch]);

  return (
    <div className="space-y-5">
      {/* 统计卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
            <Headset className="h-3.5 w-3.5" /> 坐席总数
          </div>
          <div className="text-2xl font-bold">{stats.total}</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
            <span className="h-2 w-2 rounded-full bg-green-500" /> 在线
          </div>
          <div className="text-2xl font-bold text-green-600">{stats.online}</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
            <span className="h-2 w-2 rounded-full bg-orange-500" /> 忙碌
          </div>
          <div className="text-2xl font-bold text-orange-600">{stats.busy}</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
            <Activity className="h-3.5 w-3.5" /> 活跃会话
          </div>
          <div className="text-2xl font-bold text-blue-600">{stats.activeAssignments}</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
            <MessageSquare className="h-3.5 w-3.5" /> 累计接待
          </div>
          <div className="text-2xl font-bold">{stats.totalConv}</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
            <Star className="h-3.5 w-3.5" /> 平均满意度
          </div>
          <div className="text-2xl font-bold text-amber-600">{stats.avgSatisfaction}%</div>
        </Card>
      </div>

      {/* 操作栏 */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜索坐席名称或工号..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={groupFilter} onValueChange={setGroupFilter}>
          <SelectTrigger className="w-[130px]">
            <SelectValue placeholder="分组" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部分组</SelectItem>
            <SelectItem value="sales">销售组</SelectItem>
            <SelectItem value="support">客服组</SelectItem>
            <SelectItem value="vip">VIP专属</SelectItem>
            <SelectItem value="backup">备用组</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="状态" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部状态</SelectItem>
            <SelectItem value="online">在线</SelectItem>
            <SelectItem value="busy">忙碌</SelectItem>
            <SelectItem value="away">离开</SelectItem>
            <SelectItem value="offline">离线</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={openAddDialog} className="ml-auto">
          <Plus className="h-4 w-4 mr-1" /> 新增坐席
        </Button>
      </div>

      {/* 坐席列表 */}
      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>坐席</TableHead>
              <TableHead>工号</TableHead>
              <TableHead>分组</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>当前负荷</TableHead>
              <TableHead>技能标签</TableHead>
              <TableHead>绑定账号</TableHead>
              <TableHead>累计接待</TableHead>
              <TableHead>满意度</TableHead>
              <TableHead>排班</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSeats.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11} className="text-center text-muted-foreground py-8">
                  暂无坐席数据，点击「新增坐席」创建
                </TableCell>
              </TableRow>
            ) : (
              filteredSeats.map((seat) => {
                const load = getSeatLoad(seat.id);
                const loadPct = seat.maxConcurrent > 0 ? (load / seat.maxConcurrent) * 100 : 0;
                return (
                  <TableRow key={seat.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-medium">
                          {seat.name.slice(0, 1)}
                        </div>
                        <div>
                          <div className="font-medium text-sm">{seat.name}</div>
                          <div className="text-[10px] text-muted-foreground">
                            {seat.enabled ? "已启用" : "已停用"}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{seat.seatNo}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {GROUP_LABEL[seat.group]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <span className={`h-2 w-2 rounded-full ${STATUS_DOT[seat.status]}`} />
                        <span className="text-xs">{STATUS_LABEL[seat.status]}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                          <div
                            className={`h-full rounded-full ${loadPct >= 100 ? "bg-red-500" : loadPct >= 60 ? "bg-orange-500" : "bg-green-500"}`}
                            style={{ width: `${Math.min(loadPct, 100)}%` }}
                          />
                        </div>
                        <span className="text-xs font-mono">{load}/{seat.maxConcurrent}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {seat.skills.map((sk) => (
                          <Badge key={sk} variant="secondary" className="text-[10px] py-0">
                            {SKILL_LABEL[sk]}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-muted-foreground">
                        {seat.boundAccountIds.length} 个
                      </span>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{seat.totalConversations}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 text-amber-500" />
                        <span className="text-sm font-mono">{seat.satisfaction}%</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{seat.workSchedule}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        {seat.status === "offline" ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2 text-green-600"
                            onClick={() => setSeatStatus(seat.id, "online")}
                            title="上线"
                          >
                            <UserCheck className="h-3.5 w-3.5" />
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2 text-gray-500"
                            onClick={() => setSeatStatus(seat.id, "offline")}
                            title="下线"
                          >
                            <UserX className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2"
                          onClick={() => { setBindSeat(seat); setBindDialogOpen(true); }}
                          title="绑定账号"
                        >
                          <Link2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2"
                          onClick={() => openEditDialog(seat)}
                          title="编辑"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2 text-red-500"
                          onClick={() => {
                            if (confirm(`确认删除坐席「${seat.name}」？`)) {
                              deleteSeat(seat.id);
                              toast.success("坐席已删除");
                            }
                          }}
                          title="删除"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>

      {/* 会话分配区 */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-500" />
              会话分配
              <Badge variant="secondary" className="text-[10px]">{conversations.length}</Badge>
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              将双向聊天会话分配给坐席处理，支持自动分配（最少负荷策略）和手动指定
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleAutoAssignAll}
            disabled={unassignedConversations.length === 0}
          >
            <Zap className="h-3.5 w-3.5 mr-1" />
            一键自动分配 ({unassignedConversations.length})
          </Button>
        </div>

        {/* 筛选标签 + 搜索 */}
        <div className="flex items-center gap-2 mb-3">
          <div className="flex items-center gap-1 rounded-lg bg-muted p-0.5">
            {([
              { key: "unassigned", label: "待分配", count: unassignedConversations.length },
              { key: "assigned", label: "已分配", count: conversations.length - unassignedConversations.length },
              { key: "all", label: "全部", count: conversations.length },
            ] as const).map((tab) => (
              <button
                key={tab.key}
                onClick={() => setConvFilter(tab.key)}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                  convFilter === tab.key
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label} <span className="font-mono text-[10px] opacity-70">{tab.count}</span>
              </button>
            ))}
          </div>
          <div className="relative flex-1 max-w-[200px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="搜索号码或消息..."
              value={convSearch}
              onChange={(e) => setConvSearch(e.target.value)}
              className="h-7 pl-8 text-xs"
            />
          </div>
        </div>

        {conversations.length === 0 ? (
          <div className="text-center text-muted-foreground text-sm py-6">
            暂无会话数据，双向聊天产生会话后可在此分配
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="text-center text-muted-foreground text-xs py-6">
            当前筛选条件下无会话
          </div>
        ) : (
          <div className="border border-border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 h-8">
                  <TableHead className="h-8 text-[10px] w-[120px]">对方号码</TableHead>
                  <TableHead className="h-8 text-[10px]">最近消息</TableHead>
                  <TableHead className="h-8 text-[10px] w-[100px]">分配状态</TableHead>
                  <TableHead className="h-8 text-[10px] w-[140px]">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredConversations.map((conv) => {
                  const assignedSeat = getAssignedSeatName(conv.id);
                  return (
                    <TableRow key={conv.id} className="h-9">
                      <TableCell className="font-mono text-xs py-1">{conv.peerNumber}</TableCell>
                      <TableCell className="text-xs text-muted-foreground py-1 max-w-[200px] truncate">
                        {conv.lastMessage}
                      </TableCell>
                      <TableCell className="py-1">
                        {assignedSeat ? (
                          <Badge className="bg-green-500/10 text-green-600 border-green-200 text-[10px] py-0">
                            {assignedSeat}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-200 py-0">
                            待分配
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="py-1">
                        <Select
                          value=""
                          onValueChange={(seatId) => {
                            assignConversation(conv.id, seatId, "manual");
                            toast.success("会话已分配");
                          }}
                        >
                          <SelectTrigger className="w-[130px] h-6 text-[10px]">
                            <SelectValue placeholder="选择坐席" />
                          </SelectTrigger>
                          <SelectContent>
                            {seats
                              .filter((s) => s.enabled && s.status !== "offline")
                              .map((s) => (
                                <SelectItem key={s.id} value={s.id} className="text-xs">
                                  {s.name} ({getSeatLoad(s.id)}/{s.maxConcurrent})
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      {/* 新增/编辑坐席对话框 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingSeat ? "编辑坐席" : "新增坐席"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">坐席名称 *</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="如：张小明"
                />
              </div>
              <div>
                <Label className="text-xs">坐席工号</Label>
                <Input
                  value={form.seatNo}
                  onChange={(e) => setForm({ ...form, seatNo: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">所属分组</Label>
                <Select
                  value={form.group}
                  onValueChange={(v) => setForm({ ...form, group: v as SeatGroup })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sales">销售组</SelectItem>
                    <SelectItem value="support">客服组</SelectItem>
                    <SelectItem value="vip">VIP专属</SelectItem>
                    <SelectItem value="backup">备用组</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">最大并发会话数</Label>
                <Input
                  type="number"
                  min={1}
                  max={20}
                  value={form.maxConcurrent}
                  onChange={(e) => setForm({ ...form, maxConcurrent: Number(e.target.value) })}
                />
              </div>
            </div>
            <div>
              <Label className="text-xs">技能标签</Label>
              <div className="flex flex-wrap gap-2 mt-1">
                {(Object.keys(SKILL_LABEL) as SeatSkill[]).map((sk) => (
                  <button
                    key={sk}
                    type="button"
                    onClick={() => toggleSkill(sk)}
                    className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                      form.skills.includes(sk)
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background hover:bg-accent"
                    }`}
                  >
                    {SKILL_LABEL[sk]}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-xs">排班描述</Label>
              <Input
                value={form.workSchedule}
                onChange={(e) => setForm({ ...form, workSchedule: e.target.value })}
                placeholder="如：周一至周五 09:00-18:00"
              />
            </div>
            <div>
              <Label className="text-xs">备注</Label>
              <Input
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="可选"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>取消</Button>
            <Button onClick={handleSave}>{editingSeat ? "保存" : "创建"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 绑定账号对话框 */}
      <Dialog open={bindDialogOpen} onOpenChange={setBindDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>绑定协议账号 — {bindSeat?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2 max-h-[400px] overflow-y-auto">
            <p className="text-xs text-muted-foreground mb-2">
              选择该坐席可使用的协议账号，绑定后坐席可代收代发这些账号的消息
            </p>
            {accounts.length === 0 ? (
              <div className="text-center text-muted-foreground text-sm py-6">
                暂无协议账号，请先在号池管理中导入
              </div>
            ) : (
              accounts.map((acc) => {
                const checked = bindSeat?.boundAccountIds.includes(acc.id);
                return (
                  <label
                    key={acc.id}
                    className="flex items-center gap-3 rounded-md border border-border p-2.5 cursor-pointer hover:bg-accent"
                  >
                    <Switch
                      checked={checked || false}
                      onCheckedChange={(val) => {
                        if (!bindSeat) return;
                        const current = bindSeat.boundAccountIds;
                        const next = val
                          ? [...current, acc.id]
                          : current.filter((id) => id !== acc.id);
                        bindSeatAccounts(bindSeat.id, next);
                        setBindSeat({ ...bindSeat, boundAccountIds: next });
                      }}
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium">{acc.phone}</div>
                      <div className="text-[10px] text-muted-foreground">
                        {acc.username} · {acc.email}
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[10px]">
                      {acc.group}
                    </Badge>
                  </label>
                );
              })
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setBindDialogOpen(false)}>完成</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

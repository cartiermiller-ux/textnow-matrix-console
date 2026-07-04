import { useState, useMemo, useRef, useEffect } from "react";
import { useStore } from "@/lib/store";
import type { AutoReplyRule, RuleMatchType, Conversation } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from "@/components/ui/tabs";
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
  MessageSquare, Send, Inbox, Download, Plus, Edit3, Trash2,
  Bot, User, Radio, Zap, Search, Settings2,
} from "lucide-react";

const MATCH_TYPE_LABEL: Record<RuleMatchType, string> = {
  exact: "精确匹配",
  fuzzy: "模糊匹配",
  regex: "正则匹配",
};

const MATCH_TYPE_DESC: Record<RuleMatchType, string> = {
  exact: "完全一致：收信内容与关键词完全相同才命中",
  fuzzy: "包含关键词：收信内容包含任一关键词即命中",
  regex: "正则表达式：按正则模式匹配收信内容",
};

const SIMULATE_INCOMING = [
  "Hi, is this still available?",
  "STOP",
  "How much is it?",
  "Yes, I'm interested",
  "Can you send more details?",
  "UNSTOP",
  "Is this a scam?",
  "Where are you located?",
  "What time works for you?",
  "CANCEL",
];

function fmtTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) {
    return d.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
  }
  const diff = now.getTime() - d.getTime();
  if (diff < 7 * 86400000) {
    return d.toLocaleDateString("zh-CN", { month: "2-digit", day: "2-digit" });
  }
  return d.toLocaleDateString("zh-CN");
}

export default function Chat() {
  const conversations = useStore((s) => s.conversations);
  const accounts = useStore((s) => s.accounts);
  const rules = useStore((s) => s.rules);
  const addMessage = useStore((s) => s.addMessage);
  const sendManualReply = useStore((s) => s.sendManualReply);
  const takeOverConversation = useStore((s) => s.takeOverConversation);
  const markConversationRead = useStore((s) => s.markConversationRead);
  const addRule = useStore((s) => s.addRule);
  const updateRule = useStore((s) => s.updateRule);
  const deleteRule = useStore((s) => s.deleteRule);

  const [activeTab, setActiveTab] = useState<"conversations" | "rules">("conversations");
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [convSearch, setConvSearch] = useState("");
  const [ruleDialogOpen, setRuleDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<AutoReplyRule | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const sortedConvs = useMemo(() => {
    return [...conversations].sort(
      (a, b) => new Date(b.lastTimestamp).getTime() - new Date(a.lastTimestamp).getTime()
    );
  }, [conversations]);

  const filteredConvs = useMemo(() => {
    if (!convSearch.trim()) return sortedConvs;
    const q = convSearch.toLowerCase();
    return sortedConvs.filter(
      (c) =>
        c.accountPhone.includes(convSearch) ||
        c.peerNumber.includes(convSearch) ||
        c.lastMessage.toLowerCase().includes(q)
    );
  }, [sortedConvs, convSearch]);

  const selectedConv = useMemo(
    () => conversations.find((c) => c.id === selectedConvId) || null,
    [conversations, selectedConvId]
  );

  // 选中会话时标记已读
  useEffect(() => {
    if (selectedConvId && selectedConv && selectedConv.unread > 0) {
      markConversationRead(selectedConvId);
    }
  }, [selectedConvId, selectedConv, markConversationRead]);

  // 新消息时滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedConv?.messages.length]);

  const handleSendReply = () => {
    if (!selectedConv || !replyText.trim()) return;
    sendManualReply(selectedConv.accountId, selectedConv.peerNumber, replyText.trim());
    setReplyText("");
    toast.success("已发送");
  };

  const handleTakeOver = (takenOver: boolean) => {
    if (!selectedConv) return;
    takeOverConversation(selectedConv.id, takenOver);
    toast.success(takenOver ? "已人工接管，自动回复暂停" : "已恢复自动回复");
  };

  const handleSimulateIncoming = () => {
    const onlineAccounts = accounts.filter((a) => a.status === "normal" && a.enabled);
    if (onlineAccounts.length === 0) {
      toast.error("没有可用的在线账号，请先导入或启用账号");
      return;
    }
    const acc = onlineAccounts[Math.floor(Math.random() * onlineAccounts.length)];
    const peerPool = ["2025550700", "2135550888", "3055550666", "4155550444", "6175550222"];
    const peerNumber = peerPool[Math.floor(Math.random() * peerPool.length)];
    const content = SIMULATE_INCOMING[Math.floor(Math.random() * SIMULATE_INCOMING.length)];
    addMessage({
      accountId: acc.id,
      accountPhone: acc.phone,
      targetNumber: peerNumber,
      direction: "inbound",
      content,
      status: "received",
      isAutoReply: false,
    });
    toast.success(`模拟收信：${acc.phone} ← ${peerNumber}`);
  };

  const handleExportCsv = () => {
    if (!selectedConv || selectedConv.messages.length === 0) {
      toast.error("当前会话无消息可导出");
      return;
    }
    const header = ["时间", "方向", "账号号码", "对方号码", "内容", "是否自动回复", "状态"];
    const rows = selectedConv.messages.map((m) => [
      new Date(m.timestamp).toLocaleString("zh-CN"),
      m.direction === "inbound" ? "收信" : "发信",
      m.accountPhone,
      m.targetNumber,
      m.content,
      m.isAutoReply ? "是" : "否",
      m.status,
    ]);
    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `conversation_${selectedConv.accountPhone}_${selectedConv.peerNumber}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("已导出 CSV");
  };

  const handleSaveRule = (rule: Omit<AutoReplyRule, "id" | "hitCount">) => {
    if (editingRule) {
      updateRule(editingRule.id, rule);
      toast.success("规则已更新");
    } else {
      addRule(rule);
      toast.success("规则已新增");
    }
    setRuleDialogOpen(false);
    setEditingRule(null);
  };

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "conversations" | "rules")}>
        <div className="flex items-center gap-2">
          <TabsList>
            <TabsTrigger value="conversations" className="gap-1.5">
              <MessageSquare className="h-3.5 w-3.5" /> 会话
              {conversations.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">{conversations.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="rules" className="gap-1.5">
              <Settings2 className="h-3.5 w-3.5" /> 规则
              <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">{rules.length}</Badge>
            </TabsTrigger>
          </TabsList>
          <div className="ml-auto flex gap-2">
            <Button variant="outline" size="sm" onClick={handleSimulateIncoming}>
              <Radio className="h-4 w-4 mr-1" /> 模拟收信
            </Button>
          </div>
        </div>

        {/* === 会话标签页 === */}
        <TabsContent value="conversations" className="mt-4">
          <Card className="overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] divide-x divide-border">
              {/* 左侧会话列表 */}
              <div className="flex flex-col max-h-[calc(100vh-220px)]">
                <div className="p-2 border-b">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      placeholder="搜索号码/内容..."
                      value={convSearch}
                      onChange={(e) => setConvSearch(e.target.value)}
                      className="pl-8 h-8 text-xs"
                    />
                  </div>
                </div>
                <ScrollArea className="flex-1">
                  {filteredConvs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                      <Inbox className="h-8 w-8 text-muted-foreground/50 mb-2" />
                      <p className="text-xs text-muted-foreground">暂无会话，点击模拟收信测试</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-border/50">
                      {filteredConvs.map((conv) => (
                        <ConvListItem
                          key={conv.id}
                          conv={conv}
                          active={conv.id === selectedConvId}
                          onClick={() => setSelectedConvId(conv.id)}
                        />
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </div>

              {/* 右侧聊天窗口 */}
              <div className="flex flex-col max-h-[calc(100vh-220px)] min-h-[400px]">
                {selectedConv ? (
                  <>
                    {/* 聊天头部 */}
                    <div className="flex items-center gap-3 px-4 py-2.5 border-b bg-muted/30">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">账号</span>
                          <span className="font-mono text-sm font-medium">{selectedConv.accountPhone}</span>
                          <span className="text-xs text-muted-foreground">↔</span>
                          <span className="font-mono text-sm font-medium">{selectedConv.peerNumber}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          {selectedConv.takenOver ? (
                            <Badge variant="default" className="h-5 text-[10px] gap-1">
                              <User className="h-2.5 w-2.5" /> 人工接管中
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="h-5 text-[10px] gap-1">
                              <Bot className="h-2.5 w-2.5" /> 自动回复
                            </Badge>
                          )}
                          <span className="text-[10px] text-muted-foreground">
                            共 {selectedConv.messages.length} 条消息
                          </span>
                        </div>
                      </div>
                      <div className="ml-auto flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={handleExportCsv}>
                          <Download className="h-3.5 w-3.5 mr-1" /> 导出
                        </Button>
                        <Button
                          variant={selectedConv.takenOver ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleTakeOver(!selectedConv.takenOver)}
                        >
                          {selectedConv.takenOver ? (
                            <><Bot className="h-3.5 w-3.5 mr-1" /> 恢复自动</>
                          ) : (
                            <><User className="h-3.5 w-3.5 mr-1" /> 人工接管</>
                          )}
                        </Button>
                      </div>
                    </div>

                    {/* 消息列表 */}
                    <ScrollArea className="flex-1 px-4 py-3">
                      <div className="space-y-3">
                        {selectedConv.messages.map((msg) => {
                          const isInbound = msg.direction === "inbound";
                          return (
                            <div key={msg.id} className={`flex ${isInbound ? "justify-start" : "justify-end"}`}>
                              <div className={`max-w-[75%] ${isInbound ? "items-start" : "items-end"} flex flex-col`}>
                                <div className={`flex items-center gap-1.5 mb-0.5 ${isInbound ? "flex-row" : "flex-row-reverse"}`}>
                                  <span className="text-[10px] text-muted-foreground font-mono">
                                    {fmtTime(msg.timestamp)}
                                  </span>
                                  {msg.isAutoReply && (
                                    <Badge variant="secondary" className="h-4 px-1 text-[9px] gap-0.5">
                                      <Zap className="h-2 w-2" /> 自动
                                    </Badge>
                                  )}
                                </div>
                                <div
                                  className={`rounded-2xl px-3 py-1.5 text-sm break-words ${
                                    isInbound
                                      ? "bg-muted text-foreground rounded-tl-sm"
                                      : "bg-primary text-primary-foreground rounded-tr-sm"
                                  }`}
                                >
                                  {msg.content}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                        <div ref={messagesEndRef} />
                      </div>
                    </ScrollArea>

                    {/* 底部输入框 */}
                    <div className="border-t p-3">
                      {selectedConv.takenOver && (
                        <div className="mb-2 rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] text-amber-700">
                          人工接管中，自动回复已暂停，请手动处理消息
                        </div>
                      )}
                      <div className="flex items-end gap-2">
                        <Textarea
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder="输入人工回复内容..."
                          className="min-h-10 max-h-32 text-sm resize-none"
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              handleSendReply();
                            }
                          }}
                        />
                        <Button size="sm" onClick={handleSendReply} disabled={!replyText.trim()}>
                          <Send className="h-4 w-4 mr-1" /> 发送
                        </Button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full py-16">
                    <MessageSquare className="h-10 w-10 text-muted-foreground/40 mb-3" />
                    <p className="text-sm text-muted-foreground">选择左侧会话查看消息</p>
                    <p className="text-xs text-muted-foreground/70 mt-1">或点击"模拟收信"生成测试会话</p>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* === 规则标签页 === */}
        <TabsContent value="rules" className="mt-4 space-y-4">
          {/* 匹配类型说明 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {(Object.keys(MATCH_TYPE_DESC) as RuleMatchType[]).map((t) => (
              <Card key={t} className="p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className="text-[10px]">{MATCH_TYPE_LABEL[t]}</Badge>
                  <code className="text-[10px] text-muted-foreground font-mono">{t}</code>
                </div>
                <p className="text-xs text-muted-foreground">{MATCH_TYPE_DESC[t]}</p>
              </Card>
            ))}
          </div>

          <Card className="overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-2.5 border-b bg-muted/30">
              <Settings2 className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold">关键词自动回复规则</h3>
              <Badge variant="secondary" className="ml-1">{rules.length}</Badge>
              <Button
                size="sm"
                className="ml-auto"
                onClick={() => { setEditingRule(null); setRuleDialogOpen(true); }}
              >
                <Plus className="h-4 w-4 mr-1" /> 新增规则
              </Button>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-40">名称</TableHead>
                    <TableHead className="w-24">匹配类型</TableHead>
                    <TableHead>关键词 / 正则</TableHead>
                    <TableHead>回复内容</TableHead>
                    <TableHead className="w-16">优先级</TableHead>
                    <TableHead className="w-16">命中</TableHead>
                    <TableHead className="w-16">启用</TableHead>
                    <TableHead className="w-24">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rules.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-10 text-muted-foreground text-xs">
                        暂无规则，点击"新增规则"创建
                      </TableCell>
                    </TableRow>
                  ) : (
                    rules.map((r) => (
                      <TableRow key={r.id} className="hover:bg-muted/30">
                        <TableCell className="text-xs font-medium">{r.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px]">{MATCH_TYPE_LABEL[r.matchType]}</Badge>
                        </TableCell>
                        <TableCell className="font-mono text-[11px] text-muted-foreground max-w-48 truncate" title={r.keywords}>
                          {r.keywords.replace(/\n/g, " | ")}
                        </TableCell>
                        <TableCell className="text-xs max-w-48 truncate" title={r.replyContent}>
                          {r.replyContent}
                        </TableCell>
                        <TableCell className="font-mono text-xs">{r.priority}</TableCell>
                        <TableCell className="font-mono text-xs">{r.hitCount}</TableCell>
                        <TableCell>
                          <Switch
                            checked={r.enabled}
                            onCheckedChange={(v) => updateRule(r.id, { enabled: v })}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost" size="sm" className="h-7 w-7 p-0"
                              onClick={() => { setEditingRule(r); setRuleDialogOpen(true); }}
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-600"
                              onClick={() => { deleteRule(r.id); toast.success("规则已删除"); }}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 规则编辑弹窗 */}
      {ruleDialogOpen && (
        <RuleEditDialog
          rule={editingRule}
          onClose={() => { setRuleDialogOpen(false); setEditingRule(null); }}
          onSave={handleSaveRule}
        />
      )}
    </div>
  );
}

// === 会话列表项 ===
function ConvListItem({ conv, active, onClick }: {
  conv: Conversation;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-3 py-2.5 hover:bg-muted/40 transition-colors ${
        active ? "bg-primary/5 border-l-2 border-primary" : "border-l-2 border-transparent"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-xs font-medium truncate">{conv.accountPhone}</span>
            <span className="text-[10px] text-muted-foreground">↔</span>
            <span className="font-mono text-xs text-muted-foreground truncate">{conv.peerNumber}</span>
          </div>
          <p className="text-xs text-muted-foreground truncate mt-0.5">{conv.lastMessage}</p>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className="text-[10px] text-muted-foreground font-mono whitespace-nowrap">
            {fmtTime(conv.lastTimestamp)}
          </span>
          {conv.unread > 0 && (
            <Badge className="h-4 min-w-4 px-1 text-[10px] bg-red-500 text-white">{conv.unread}</Badge>
          )}
          {conv.takenOver && (
            <Badge variant="default" className="h-4 px-1 text-[9px] gap-0.5">
              <User className="h-2 w-2" /> 接管
            </Badge>
          )}
        </div>
      </div>
    </button>
  );
}

// === 规则编辑弹窗 ===
function RuleEditDialog({ rule, onClose, onSave }: {
  rule: AutoReplyRule | null;
  onClose: () => void;
  onSave: (rule: Omit<AutoReplyRule, "id" | "hitCount">) => void;
}) {
  const [form, setForm] = useState({
    name: rule?.name || "",
    matchType: rule?.matchType || ("fuzzy" as RuleMatchType),
    keywords: rule?.keywords || "",
    replyContent: rule?.replyContent || "",
    enabled: rule?.enabled ?? true,
    priority: rule?.priority ?? 10,
    isMultiTurn: rule?.isMultiTurn ?? false,
    multiTurnContext: rule?.multiTurnContext || "",
  });

  const setField = <K extends keyof typeof form>(key: K, val: (typeof form)[K]) => {
    setForm((f) => ({ ...f, [key]: val }));
  };

  const handleSave = () => {
    if (!form.name.trim()) { toast.error("请输入规则名称"); return; }
    if (!form.keywords.trim()) { toast.error("请输入关键词或正则"); return; }
    if (!form.replyContent.trim()) { toast.error("请输入回复内容"); return; }
    onSave({
      name: form.name.trim(),
      matchType: form.matchType,
      keywords: form.keywords.trim(),
      replyContent: form.replyContent.trim(),
      enabled: form.enabled,
      priority: form.priority,
      isMultiTurn: form.isMultiTurn,
      multiTurnContext: form.isMultiTurn ? form.multiTurnContext.trim() : undefined,
    });
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{rule ? "编辑规则" : "新增规则"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="text-xs">规则名称</Label>
            <Input
              value={form.name}
              onChange={(e) => setField("name", e.target.value)}
              placeholder="如：STOP退订回复"
              className="mt-1"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">匹配类型</Label>
              <Select
                value={form.matchType}
                onValueChange={(v) => setField("matchType", v as RuleMatchType)}
              >
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="exact">精确匹配</SelectItem>
                  <SelectItem value="fuzzy">模糊匹配</SelectItem>
                  <SelectItem value="regex">正则匹配</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-[10px] text-muted-foreground mt-1">{MATCH_TYPE_DESC[form.matchType]}</p>
            </div>
            <div>
              <Label className="text-xs">优先级（数字越小越高）</Label>
              <Input
                type="number"
                value={form.priority}
                onChange={(e) => setField("priority", Number(e.target.value))}
                className="mt-1 font-mono"
              />
            </div>
          </div>

          <div>
            <Label className="text-xs">
              {form.matchType === "regex" ? "正则表达式" : "关键词（每行一个，任一命中即触发）"}
            </Label>
            <Textarea
              value={form.keywords}
              onChange={(e) => setField("keywords", e.target.value)}
              placeholder={form.matchType === "regex" ? "(code|verify|验证码).{0,10}" : "STOP\nUNSTOP\nCANCEL"}
              className="mt-1 font-mono text-xs min-h-20"
            />
          </div>

          <div>
            <Label className="text-xs">回复内容（支持变量 {`{随机数字}`} {`{收件人号后四位}`} 等）</Label>
            <Textarea
              value={form.replyContent}
              onChange={(e) => setField("replyContent", e.target.value)}
              placeholder="You have been unsubscribed."
              className="mt-1 text-xs min-h-20"
            />
          </div>

          <Separator />

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Switch checked={form.enabled} onCheckedChange={(v) => setField("enabled", v)} />
              <Label className="text-xs">启用</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.isMultiTurn} onCheckedChange={(v) => setField("isMultiTurn", v)} />
              <Label className="text-xs">多轮对话</Label>
            </div>
          </div>

          {form.isMultiTurn && (
            <div>
              <Label className="text-xs">多轮上下文标识</Label>
              <Input
                value={form.multiTurnContext}
                onChange={(e) => setField("multiTurnContext", e.target.value)}
                placeholder="如：code_request"
                className="mt-1 font-mono text-xs"
              />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>取消</Button>
          <Button onClick={handleSave}>保存</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { API_ENDPOINTS } from "@/lib/constants";
import type { UserRole, SystemUser } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Tabs, TabsList, TabsTrigger, TabsContent,
} from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  UserPlus, Edit3, Trash2, Shield, Database, Server, Terminal,
  Info, AlertTriangle, AlertCircle, RotateCcw, KeyRound, ScrollText,
} from "lucide-react";
import { toast } from "sonner";

// 日志级别配色
const LOG_LEVEL_MAP: Record<string, { label: string; color: string; icon: typeof Info }> = {
  info: { label: "信息", color: "text-blue-600 bg-blue-50 border-blue-200", icon: Info },
  warning: { label: "警告", color: "text-amber-600 bg-amber-50 border-amber-200", icon: AlertTriangle },
  error: { label: "错误", color: "text-red-600 bg-red-50 border-red-200", icon: AlertCircle },
};

// HTTP 方法配色
const METHOD_COLOR: Record<string, string> = {
  GET: "text-green-600 bg-green-50 border-green-200",
  POST: "text-blue-600 bg-blue-50 border-blue-200",
};

export default function System() {
  const users = useStore((s) => s.users);
  const addUser = useStore((s) => s.addUser);
  const updateUser = useStore((s) => s.updateUser);
  const deleteUser = useStore((s) => s.deleteUser);
  const logs = useStore((s) => s.logs);
  const accounts = useStore((s) => s.accounts);
  const tasks = useStore((s) => s.tasks);
  const conversations = useStore((s) => s.conversations);
  const templates = useStore((s) => s.templates);
  const rules = useStore((s) => s.rules);
  const resetAll = useStore((s) => s.resetAll);

  const [addUserOpen, setAddUserOpen] = useState(false);
  const [editUser, setEditUser] = useState<SystemUser | null>(null);
  const [logLevelFilter, setLogLevelFilter] = useState<string>("all");

  // 日志筛选（倒序，最多500条已在 store 处理）
  const filteredLogs = useMemo(() => {
    if (logLevelFilter === "all") return logs;
    return logs.filter((l) => l.level === logLevelFilter);
  }, [logs, logLevelFilter]);

  const handleReset = () => {
    resetAll();
    toast.success("所有数据已重置");
  };

  // 系统信息
  const systemInfo = useMemo(() => {
    const storeKey = "cartierandmiller-store";
    let storageSize = "—";
    try {
      const raw = localStorage.getItem(storeKey);
      if (raw) {
        const bytes = new Blob([raw]).size;
        storageSize = bytes > 1024 ? `${(bytes / 1024).toFixed(1)} KB` : `${bytes} B`;
      }
    } catch {
      storageSize = "无法读取";
    }
    return {
      mode: "正式运行模式",
      persistence: "localStorage 持久化",
      storageKey: storeKey,
      storageSize,
      dataCounts: {
        accounts: accounts.length,
        tasks: tasks.length,
        conversations: conversations.length,
        templates: templates.length,
        rules: rules.length,
        logs: logs.length,
        users: users.length,
      },
    };
  }, [accounts, tasks, conversations, templates, rules, logs, users]);

  return (
    <div className="space-y-4">
      {/* 系统信息卡片 */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Server className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">系统信息</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div>
            <p className="text-muted-foreground mb-0.5">运行模式</p>
            <p className="font-medium flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
              {systemInfo.mode}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground mb-0.5">数据持久化</p>
            <p className="font-medium">{systemInfo.persistence}</p>
          </div>
          <div>
            <p className="text-muted-foreground mb-0.5">存储键名</p>
            <p className="font-mono text-[11px]">{systemInfo.storageKey}</p>
          </div>
          <div>
            <p className="text-muted-foreground mb-0.5">存储占用</p>
            <p className="font-mono">{systemInfo.storageSize}</p>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
          <span>账号 <span className="font-mono text-foreground">{systemInfo.dataCounts.accounts}</span></span>
          <span>任务 <span className="font-mono text-foreground">{systemInfo.dataCounts.tasks}</span></span>
          <span>会话 <span className="font-mono text-foreground">{systemInfo.dataCounts.conversations}</span></span>
          <span>模板 <span className="font-mono text-foreground">{systemInfo.dataCounts.templates}</span></span>
          <span>规则 <span className="font-mono text-foreground">{systemInfo.dataCounts.rules}</span></span>
          <span>日志 <span className="font-mono text-foreground">{systemInfo.dataCounts.logs}</span></span>
          <span>用户 <span className="font-mono text-foreground">{systemInfo.dataCounts.users}</span></span>
        </div>
        <div className="mt-3 pt-3 border-t flex items-center gap-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <RotateCcw className="h-3.5 w-3.5 mr-1" /> 重置所有数据
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>确认重置所有数据？</AlertDialogTitle>
                <AlertDialogDescription>
                  此操作将清空所有账号、任务、会话、日志等数据，并恢复默认模板和风控配置。该操作不可撤销，请谨慎确认。
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>取消</AlertDialogCancel>
                <AlertDialogAction onClick={handleReset} className="bg-red-600 hover:bg-red-700">
                  确认重置
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <span className="text-xs text-muted-foreground">危险操作：将清空 localStorage 中的全部业务数据</span>
        </div>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="users" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="users" className="text-xs">
            <Shield className="h-3.5 w-3.5 mr-1" /> 用户权限
          </TabsTrigger>
          <TabsTrigger value="logs" className="text-xs">
            <ScrollText className="h-3.5 w-3.5 mr-1" /> 操作日志
          </TabsTrigger>
          <TabsTrigger value="api" className="text-xs">
            <Terminal className="h-3.5 w-3.5 mr-1" /> 开放API
          </TabsTrigger>
        </TabsList>

        {/* === 用户权限 Tab === */}
        <TabsContent value="users" className="mt-4">
          <Card className="overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b">
              <Shield className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold">用户列表</h3>
              <Button size="sm" className="ml-auto" onClick={() => setAddUserOpen(true)}>
                <UserPlus className="h-4 w-4 mr-1" /> 新增用户
              </Button>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-32">用户名</TableHead>
                    <TableHead className="w-24">角色</TableHead>
                    <TableHead className="w-20">启用状态</TableHead>
                    <TableHead className="w-40">最后登录</TableHead>
                    <TableHead className="w-40">创建时间</TableHead>
                    <TableHead className="w-28">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                        暂无用户
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((u) => (
                      <TableRow key={u.id} className="hover:bg-muted/30">
                        <TableCell className="text-xs font-medium font-mono">{u.username}</TableCell>
                        <TableCell>
                          <span className={`inline-flex rounded border px-1.5 py-0.5 text-[10px] font-medium ${
                            u.role === "admin"
                              ? "text-purple-600 bg-purple-50 border-purple-200"
                              : "text-blue-600 bg-blue-50 border-blue-200"
                          }`}>
                            {u.role === "admin" ? "管理员" : "操作员"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={u.enabled}
                            onCheckedChange={(checked) => {
                              updateUser(u.id, { enabled: checked });
                              toast.success(`已${checked ? "启用" : "停用"}用户 ${u.username}`);
                            }}
                          />
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground font-mono">
                          {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString("zh-CN") : "—"}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground font-mono">
                          {new Date(u.createdAt).toLocaleString("zh-CN")}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0"
                              onClick={() => setEditUser(u)}
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-600">
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>删除用户？</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    确认删除用户「{u.username}」？此操作不可撤销。
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>取消</AlertDialogCancel>
                                  <AlertDialogAction
                                    className="bg-red-600 hover:bg-red-700"
                                    onClick={() => {
                                      deleteUser(u.id);
                                      toast.success(`已删除用户 ${u.username}`);
                                    }}
                                  >
                                    确认删除
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
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

        {/* === 操作日志 Tab === */}
        <TabsContent value="logs" className="mt-4">
          <Card className="overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b">
              <ScrollText className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold">操作日志</h3>
              <Badge variant="secondary" className="ml-1">最多 500 条</Badge>
              <div className="ml-auto flex items-center gap-2">
                <span className="text-xs text-muted-foreground">级别筛选</span>
                <Select value={logLevelFilter} onValueChange={setLogLevelFilter}>
                  <SelectTrigger className="w-28 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部级别</SelectItem>
                    <SelectItem value="info">信息</SelectItem>
                    <SelectItem value="warning">警告</SelectItem>
                    <SelectItem value="error">错误</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="overflow-x-auto max-h-[600px]">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 sticky top-0">
                    <TableHead className="w-40">时间</TableHead>
                    <TableHead className="w-24">操作人</TableHead>
                    <TableHead className="w-24">级别</TableHead>
                    <TableHead className="w-28">动作</TableHead>
                    <TableHead className="w-32">目标</TableHead>
                    <TableHead>详情</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                        {logs.length === 0 ? "暂无操作记录" : "无匹配级别的日志"}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredLogs.map((log) => {
                      const lv = LOG_LEVEL_MAP[log.level];
                      const LvIcon = lv.icon;
                      return (
                        <TableRow key={log.id} className="hover:bg-muted/30">
                          <TableCell className="text-xs text-muted-foreground font-mono">
                            {new Date(log.timestamp).toLocaleString("zh-CN")}
                          </TableCell>
                          <TableCell className="text-xs font-mono">{log.operator}</TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-medium ${lv.color}`}>
                              <LvIcon className="h-2.5 w-2.5" />
                              {lv.label}
                            </span>
                          </TableCell>
                          <TableCell className="text-xs font-medium">{log.action}</TableCell>
                          <TableCell className="text-xs text-muted-foreground font-mono truncate max-w-32">{log.target}</TableCell>
                          <TableCell className="text-xs text-muted-foreground truncate">{log.detail}</TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
            {filteredLogs.length > 0 && (
              <div className="px-4 py-2 border-t text-xs text-muted-foreground">
                共 {filteredLogs.length} 条 / 总计 {logs.length} 条
              </div>
            )}
          </Card>
        </TabsContent>

        {/* === 开放API Tab === */}
        <TabsContent value="api" className="mt-4 space-y-4">
          <Card className="p-4">
            <div className="flex items-start gap-2">
              <KeyRound className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <div>
                <h3 className="text-sm font-semibold mb-1">开放接口说明</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  提供号池查询、单条发送、批量发送、查询消息、账号状态回调等接口，支持对接上层业务系统。
                </p>
              </div>
            </div>
          </Card>

          {/* API 接口文档 */}
          <Card className="overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b">
              <Terminal className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold">接口文档</h3>
            </div>
            <div className="divide-y">
              {API_ENDPOINTS.map((ep) => (
                <div key={ep.path} className="px-4 py-3 hover:bg-muted/30">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className={`inline-flex rounded border px-2 py-0.5 text-[10px] font-bold font-mono ${METHOD_COLOR[ep.method] || "text-gray-600 bg-gray-50 border-gray-200"}`}>
                      {ep.method}
                    </span>
                    <code className="text-xs font-mono text-foreground">{ep.path}</code>
                  </div>
                  <p className="text-xs text-muted-foreground mb-1">{ep.desc}</p>
                  <div className="flex items-center gap-1 text-[11px]">
                    <span className="text-muted-foreground">参数：</span>
                    <code className="font-mono text-muted-foreground">{ep.params}</code>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* 调用示例 */}
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Database className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold">调用示例（curl）</h3>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-[11px] text-muted-foreground mb-1">号池查询</p>
                <pre className="font-mono text-[11px] rounded-lg bg-muted/60 p-3 overflow-x-auto leading-relaxed">
{`curl -X GET "https://api.your-domain.com/api/v1/accounts?group=marketing&status=normal&page=1&pageSize=20" \\
  -H "Authorization: Bearer YOUR_API_KEY"`}
                </pre>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground mb-1">单条发送</p>
                <pre className="font-mono text-[11px] rounded-lg bg-muted/60 p-3 overflow-x-auto leading-relaxed">
{`curl -X POST "https://api.your-domain.com/api/v1/send/single" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"accountId":"acc_xxx","targetNumber":"2025550143","content":"Hello!"}'`}
                </pre>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground mb-1">批量发送</p>
                <pre className="font-mono text-[11px] rounded-lg bg-muted/60 p-3 overflow-x-auto leading-relaxed">
{`curl -X POST "https://api.your-domain.com/api/v1/send/batch" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"accountGroup":"marketing","targetNumbers":["2025550143","2135550167"],"templateId":"tpl_xxx","schedule":"2026-07-02T10:00:00Z"}'`}
                </pre>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 新增用户弹窗 */}
      <UserFormDialog
        open={addUserOpen}
        onOpenChange={setAddUserOpen}
        title="新增用户"
        onSubmit={(data) => {
          addUser(data);
          toast.success(`已新增用户 ${data.username}`);
          setAddUserOpen(false);
        }}
      />

      {/* 编辑用户弹窗 */}
      {editUser && (
        <UserFormDialog
          open={true}
          onOpenChange={(v) => { if (!v) setEditUser(null); }}
          title="编辑用户"
          defaultUser={editUser}
          onSubmit={(data) => {
            updateUser(editUser.id, data);
            toast.success(`已更新用户 ${data.username}`);
            setEditUser(null);
          }}
        />
      )}
    </div>
  );
}

// === 用户表单弹窗组件 ===
interface UserFormData {
  username: string;
  role: UserRole;
  enabled: boolean;
}

function UserFormDialog({
  open,
  onOpenChange,
  title,
  defaultUser,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  defaultUser?: SystemUser;
  onSubmit: (data: UserFormData) => void;
}) {
  const [username, setUsername] = useState(defaultUser?.username ?? "");
  const [role, setRole] = useState<UserRole>(defaultUser?.role ?? "operator");
  const [enabled, setEnabled] = useState(defaultUser?.enabled ?? true);

  const handleSubmit = () => {
    if (!username.trim()) {
      toast.error("请输入用户名");
      return;
    }
    onSubmit({ username: username.trim(), role, enabled });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="text-xs">用户名</Label>
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="请输入用户名"
              className="mt-1"
              autoFocus
            />
          </div>
          <div>
            <Label className="text-xs">角色</Label>
            <Select value={role} onValueChange={(v) => setRole(v as UserRole)}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">管理员（admin）</SelectItem>
                <SelectItem value="operator">操作员（operator）</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-xs">启用状态</Label>
            <Switch checked={enabled} onCheckedChange={setEnabled} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>取消</Button>
          <Button onClick={handleSubmit}>保存</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

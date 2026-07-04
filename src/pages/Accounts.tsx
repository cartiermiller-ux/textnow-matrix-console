import { useState, useRef, useMemo } from "react";
import { useStore } from "@/lib/store";
import { STATUS_MAP, GROUP_MAP } from "@/lib/constants";
import { NATIVE_FIELDS } from "@/lib/types";
import type { Account, AccountGroup, AccountStatus } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Upload, Search, RefreshCw, HeartPulse, Trash2, Edit3, MoreHorizontal,
  ChevronDown, FileUp, AlertCircle, CheckCircle2, X,
} from "lucide-react";

export default function Accounts() {
  const accounts = useStore((s) => s.accounts);
  const importAccounts = useStore((s) => s.importAccounts);
  const updateAccount = useStore((s) => s.updateAccount);
  const deleteAccounts = useStore((s) => s.deleteAccounts);
  const setAccountGroup = useStore((s) => s.setAccountGroup);
  const toggleAccountEnabled = useStore((s) => s.toggleAccountEnabled);
  const renewToken = useStore((s) => s.renewToken);
  const healthCheck = useStore((s) => s.healthCheck);
  const loadSampleData = useStore((s) => s.loadSampleData);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [groupFilter, setGroupFilter] = useState<string>("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [importOpen, setImportOpen] = useState(false);
  const [editAcc, setEditAcc] = useState<Account | null>(null);
  const [importText, setImportText] = useState("");
  const [importResult, setImportResult] = useState<{ success: number; failed: number; errors: string[] } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    return accounts.filter((a) => {
      if (statusFilter !== "all" && a.status !== statusFilter) return false;
      if (groupFilter !== "all" && a.group !== groupFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return a.phone.includes(search) || a.email.toLowerCase().includes(q) ||
          a.username.toLowerCase().includes(q) || a["X-PX-DEVICE-MODEL"].toLowerCase().includes(q);
      }
      return true;
    });
  }, [accounts, search, statusFilter, groupFilter]);

  const allSelected = filtered.length > 0 && filtered.every((a) => selected.has(a.id));
  const toggleAll = () => {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(filtered.map((a) => a.id)));
  };
  const toggleOne = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelected(next);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      setImportText(text);
    };
    reader.readAsText(file);
  };

  const handleImport = () => {
    if (!importText.trim()) {
      toast.error("请输入或上传 .jsonl 内容");
      return;
    }
    const lines = importText.trim().split("\n");
    const result = importAccounts(lines);
    setImportResult(result);
    if (result.success > 0) {
      toast.success(`导入成功 ${result.success} 条账号`);
      setImportText("");
    }
    if (result.failed > 0) {
      toast.warning(`${result.failed} 条导入失败`);
    }
  };

  const handleBatchGroup = (group: AccountGroup) => {
    setAccountGroup([...selected], group);
    toast.success(`已将 ${selected.size} 个账号设为 ${GROUP_MAP[group].label}`);
    setSelected(new Set());
  };

  const handleBatchDelete = () => {
    deleteAccounts([...selected]);
    toast.success(`已删除 ${selected.size} 个账号`);
    setSelected(new Set());
  };

  const handleBatchHealthCheck = () => {
    healthCheck([...selected]);
    toast.success(`已对 ${selected.size} 个账号执行健康检测`);
    setSelected(new Set());
  };

  return (
    <div className="space-y-4">
      {/* 工具栏 */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜索号码/邮箱/用户名..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 w-56"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-32"><SelectValue placeholder="状态" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部状态</SelectItem>
            {Object.entries(STATUS_MAP).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={groupFilter} onValueChange={setGroupFilter}>
          <SelectTrigger className="w-32"><SelectValue placeholder="分组" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部分组</SelectItem>
            {Object.entries(GROUP_MAP).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="ml-auto flex gap-2">
          <Button variant="outline" size="sm" onClick={loadSampleData}>
            <FileUp className="h-4 w-4 mr-1" /> 示例数据
          </Button>
          <Button size="sm" onClick={() => { setImportOpen(true); setImportResult(null); }}>
            <Upload className="h-4 w-4 mr-1" /> 导入 .jsonl
          </Button>
        </div>
      </div>

      {/* 批量操作栏 */}
      {selected.size > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2">
          <span className="text-sm font-medium">已选 {selected.size} 项</span>
          <div className="h-4 w-px bg-border mx-1" />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">设置分组 <ChevronDown className="h-3 w-3 ml-1" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {Object.entries(GROUP_MAP).map(([k, v]) => (
                <DropdownMenuItem key={k} onClick={() => handleBatchGroup(k as AccountGroup)}>
                  {v.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="ghost" size="sm" onClick={handleBatchHealthCheck}>
            <HeartPulse className="h-3.5 w-3.5 mr-1" /> 健康检测
          </Button>
          <Button variant="ghost" size="sm" onClick={() => { [...selected].forEach(renewToken); toast.success(`已续期 ${selected.size} 个账号`); setSelected(new Set()); }}>
            <RefreshCw className="h-3.5 w-3.5 mr-1" /> 批量续期
          </Button>
          <Button variant="ghost" size="sm" onClick={() => { toggleAccountEnabled([...selected], false); setSelected(new Set()); }}>
            停用
          </Button>
          <Button variant="ghost" size="sm" onClick={() => { toggleAccountEnabled([...selected], true); setSelected(new Set()); }}>
            启用
          </Button>
          <Button variant="ghost" size="sm" className="text-red-600" onClick={handleBatchDelete}>
            <Trash2 className="h-3.5 w-3.5 mr-1" /> 删除
          </Button>
          <Button variant="ghost" size="sm" className="ml-auto" onClick={() => setSelected(new Set())}>
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}

      {/* 账号表格 */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-10">
                  <Checkbox checked={allSelected} onCheckedChange={toggleAll} />
                </TableHead>
                <TableHead className="w-32">手机号</TableHead>
                <TableHead className="w-28">状态</TableHead>
                <TableHead className="w-24">分组</TableHead>
                <TableHead className="w-20">启停</TableHead>
                <TableHead>邮箱</TableHead>
                <TableHead className="w-28">设备型号</TableHead>
                <TableHead className="w-32">令牌过期</TableHead>
                <TableHead className="w-20">发送</TableHead>
                <TableHead className="w-20">接收</TableHead>
                <TableHead className="w-20">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} className="text-center py-12 text-muted-foreground">
                    {accounts.length === 0 ? "号池为空，请导入 .jsonl 账号文件" : "无匹配账号"}
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((a) => {
                  const st = STATUS_MAP[a.status];
                  const gp = GROUP_MAP[a.group];
                  const expDate = new Date(a.tokenExpiry);
                  const expSoon = expDate.getTime() - Date.now() < 24 * 3600 * 1000;
                  return (
                    <TableRow key={a.id} className="hover:bg-muted/30">
                      <TableCell>
                        <Checkbox checked={selected.has(a.id)} onCheckedChange={() => toggleOne(a.id)} />
                      </TableCell>
                      <TableCell className="font-mono text-xs">{a.phone}</TableCell>
                      <TableCell>
                        <span className={`inline-flex rounded border px-1.5 py-0.5 text-[10px] font-medium ${st.color}`}>
                          {st.label}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex rounded border px-1.5 py-0.5 text-[10px] font-medium ${gp.color}`}>
                          {gp.label}
                        </span>
                      </TableCell>
                      <TableCell>
                        {a.enabled ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : (
                          <X className="h-4 w-4 text-gray-400" />
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground truncate max-w-32">{a.email}</TableCell>
                      <TableCell className="text-xs">{a["X-PX-DEVICE-MODEL"]}</TableCell>
                      <TableCell className={`text-xs font-mono ${expSoon ? "text-amber-600" : "text-muted-foreground"}`}>
                        {expDate.toLocaleDateString("zh-CN")}
                      </TableCell>
                      <TableCell className="font-mono text-xs">{a.totalSent}</TableCell>
                      <TableCell className="font-mono text-xs">{a.totalReceived}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setEditAcc(a)}>
                              <Edit3 className="h-3.5 w-3.5 mr-2" /> 编辑
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => { renewToken(a.id); toast.success("令牌已续期"); }}>
                              <RefreshCw className="h-3.5 w-3.5 mr-2" /> 令牌续期
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => { healthCheck([a.id]); toast.success("健康检测完成"); }}>
                              <HeartPulse className="h-3.5 w-3.5 mr-2" /> 健康检测
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => { toggleAccountEnabled([a.id], !a.enabled); }}>
                              {a.enabled ? "停用" : "启用"}
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600" onClick={() => { deleteAccounts([a.id]); toast.success("已删除"); }}>
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
        {filtered.length > 0 && (
          <div className="flex items-center justify-between px-4 py-2 border-t text-xs text-muted-foreground">
            <span>共 {filtered.length} 条 / 总计 {accounts.length} 条</span>
            <span>已选 {selected.size} 项</span>
          </div>
        )}
      </Card>

      {/* 导入弹窗 */}
      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>导入全参号 (.jsonl)</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs text-blue-800">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium mb-1">格式要求</p>
                  <p>每行一个 JSON 对象，必须包含以下 15 个原生字段（字段名严格匹配）：</p>
                  <p className="font-mono mt-1 text-[10px] break-all">
                    {NATIVE_FIELDS.join(", ")}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <input
                ref={fileRef}
                type="file"
                accept=".jsonl,.json,.txt"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
                <Upload className="h-4 w-4 mr-1" /> 选择文件
              </Button>
              <span className="ml-2 text-xs text-muted-foreground">支持 .jsonl / .json / .txt</span>
            </div>

            <div>
              <Label className="text-xs">或粘贴内容（每行一个 JSON）</Label>
              <Textarea
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder={`{"Cookie":"","IDFA":"XXXX-XXXX-...","User-Agent":"TextNow/...","X-PX-AUTHORIZATION":"Bearer ...","X-PX-DEVICE-FP":"...","X-PX-DEVICE-MODEL":"iPhone 11","X-PX-MOBILE-SDK-VERSION":"1.8.2","X-PX-OS":"iOS","X-PX-OS-VERSION":"17.5.1","X-PX-UUID":"...","X-PX-VID":"...","clientId":"...","email":"user@textnow.me","phone":"2025550143","username":"tn_user_0143"}`}
                className="font-mono text-xs min-h-32"
              />
            </div>

            {importResult && (
              <div className={`rounded-lg border p-3 text-xs ${importResult.failed > 0 ? "border-amber-200 bg-amber-50" : "border-green-200 bg-green-50"}`}>
                <p className="font-medium mb-1">
                  导入完成：成功 {importResult.success} 条，失败 {importResult.failed} 条
                </p>
                {importResult.errors.length > 0 && (
                  <div className="mt-2 space-y-1 max-h-32 overflow-y-auto">
                    {importResult.errors.map((e, i) => (
                      <p key={i} className="text-red-600 font-mono text-[10px]">{e}</p>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setImportOpen(false)}>关闭</Button>
            <Button onClick={handleImport}>
              <Upload className="h-4 w-4 mr-1" /> 执行导入
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 编辑弹窗 */}
      {editAcc && (
        <EditAccountDialog
          account={editAcc}
          onClose={() => setEditAcc(null)}
          onSave={(patch) => { updateAccount(editAcc.id, patch); setEditAcc(null); toast.success("账号已更新"); }}
        />
      )}
    </div>
  );
}

// === 编辑弹窗组件 ===
function EditAccountDialog({ account, onClose, onSave }: {
  account: Account;
  onClose: () => void;
  onSave: (patch: Partial<Account>) => void;
}) {
  const [form, setForm] = useState({ ...account });

  const setField = (key: string, val: string | boolean | AccountStatus | AccountGroup) => {
    setForm((f) => ({ ...f, [key]: val }));
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>编辑账号 — {account.phone}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* 原生字段（只读展示） */}
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground mb-2">原生全参字段（15项，不可改名）</h4>
            <div className="grid grid-cols-2 gap-2">
              {NATIVE_FIELDS.map((f) => (
                <div key={f}>
                  <Label className="text-[10px] text-muted-foreground">{f}</Label>
                  <Input
                    value={(form as Record<string, unknown>)[f] as string || ""}
                    onChange={(e) => setField(f, e.target.value)}
                    className="font-mono text-xs h-8"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* 管理字段 */}
          <div className="border-t pt-3">
            <h4 className="text-xs font-semibold text-muted-foreground mb-2">扩展管理字段</h4>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-[10px]">邮箱密码</Label>
                <Input value={form.emailPassword} onChange={(e) => setField("emailPassword", e.target.value)} className="text-xs h-8" />
              </div>
              <div>
                <Label className="text-[10px]">账号密码</Label>
                <Input value={form.accountPassword} onChange={(e) => setField("accountPassword", e.target.value)} className="text-xs h-8" />
              </div>
              <div>
                <Label className="text-[10px]">代理 IP</Label>
                <Input value={form.proxyIp} onChange={(e) => setField("proxyIp", e.target.value)} className="font-mono text-xs h-8" />
              </div>
              <div>
                <Label className="text-[10px]">令牌过期时间</Label>
                <Input
                  type="datetime-local"
                  value={new Date(form.tokenExpiry).toISOString().slice(0, 16)}
                  onChange={(e) => setField("tokenExpiry", new Date(e.target.value).toISOString())}
                  className="text-xs h-8"
                />
              </div>
              <div>
                <Label className="text-[10px]">分组</Label>
                <Select value={form.group} onValueChange={(v) => setField("group", v as AccountGroup)}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(GROUP_MAP).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[10px]">状态</Label>
                <Select value={form.status} onValueChange={(v) => setField("status", v as AccountStatus)}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(STATUS_MAP).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <Label className="text-[10px]">备注</Label>
                <Input value={form.notes || ""} onChange={(e) => setField("notes", e.target.value)} className="text-xs h-8" />
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>取消</Button>
          <Button onClick={() => onSave(form)}>保存</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

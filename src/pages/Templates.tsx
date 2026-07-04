import { useState, useMemo, useRef } from "react";
import { useStore, replaceVariables, checkSensitive } from "@/lib/store";
import { BUILTIN_VARIABLES, SENSITIVE_WORDS } from "@/lib/constants";
import type { MessageTemplate } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Plus, FileText, Edit3, Trash2, Eye, AlertTriangle, Variable,
  CheckCircle2, XCircle, Hash, Image as ImageIcon, Link as LinkIcon,
} from "lucide-react";

const TEMPLATE_CATEGORIES = ["营销", "客服", "问候", "通知", "验证码", "其他"];

const SAMPLE_NUMBER = "2025550143";

export default function Templates() {
  const templates = useStore((s) => s.templates);
  const addTemplate = useStore((s) => s.addTemplate);
  const updateTemplate = useStore((s) => s.updateTemplate);
  const deleteTemplate = useStore((s) => s.deleteTemplate);

  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<MessageTemplate | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewTpl, setPreviewTpl] = useState<MessageTemplate | null>(null);

  const handleAdd = () => {
    setEditing(null);
    setEditOpen(true);
  };

  const handleEdit = (tpl: MessageTemplate) => {
    setEditing(tpl);
    setEditOpen(true);
  };

  const handleSave = (data: { name: string; category: string; content: string; imageUrl?: string; linkUrl?: string; linkText?: string }) => {
    if (editing) {
      updateTemplate(editing.id, data);
      toast.success(`模板「${data.name}」已更新`);
    } else {
      addTemplate({ ...data, enabled: true });
      toast.success(`模板「${data.name}」已新增`);
    }
    setEditOpen(false);
    setEditing(null);
  };

  const handleDelete = (tpl: MessageTemplate) => {
    deleteTemplate(tpl.id);
    toast.success(`模板「${tpl.name}」已删除`);
  };

  const handleToggle = (tpl: MessageTemplate, enabled: boolean) => {
    updateTemplate(tpl.id, { enabled });
  };

  const handlePreview = (tpl: MessageTemplate) => {
    setPreviewTpl(tpl);
    setPreviewOpen(true);
  };

  return (
    <div className="space-y-4">
      {/* 工具栏 */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">内容模板</h3>
          <Badge variant="secondary">{templates.length}</Badge>
        </div>
        <Button size="sm" className="ml-auto" onClick={handleAdd}>
          <Plus className="h-4 w-4 mr-1" /> 新增模板
        </Button>
      </div>

      {/* 变量系统说明面板 */}
      <Card className="tn-card-hover p-4">
        <div className="flex items-center gap-2 mb-3">
          <Variable className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">内置变量系统</h3>
          <span className="text-[10px] text-muted-foreground ml-1">点击变量可插入到正在编辑的模板内容中</span>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
          {BUILTIN_VARIABLES.map((v) => (
            <div key={v.token} className="rounded-lg border border-border bg-muted/30 p-2.5">
              <code className="text-xs font-mono text-primary">{v.token}</code>
              <p className="text-[10px] text-muted-foreground mt-1">{v.desc}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* 模板卡片网格 */}
      {templates.length === 0 ? (
        <Card className="p-12">
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <FileText className="h-8 w-8 text-muted-foreground/50" />
            <span className="text-sm">暂无模板，点击新增</span>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((tpl) => {
            const sensitiveHits = checkSensitive(tpl.content);
            return (
              <Card key={tpl.id} className="p-4 flex flex-col">
                <div className="flex items-start justify-between mb-2">
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-semibold truncate">{tpl.name}</h4>
                    <Badge variant="outline" className="mt-1 text-[10px]">{tpl.category}</Badge>
                  </div>
                  <Switch
                    checked={tpl.enabled}
                    onCheckedChange={(v) => handleToggle(tpl, v)}
                  />
                </div>

                <div className="flex-1 rounded-md bg-muted/30 p-2.5 mb-2">
                  <p className="text-xs text-muted-foreground line-clamp-4 font-mono break-all">
                    {tpl.content}
                  </p>
                </div>

                {(tpl.imageUrl || tpl.linkUrl) && (
                  <div className="flex items-center gap-1 mb-2">
                    {tpl.imageUrl && (
                      <Badge variant="outline" className="text-[10px] py-0 text-purple-600 border-purple-200">
                        <ImageIcon className="h-2.5 w-2.5 mr-0.5" /> 图片
                      </Badge>
                    )}
                    {tpl.linkUrl && (
                      <Badge variant="outline" className="text-[10px] py-0 text-blue-600 border-blue-200">
                        <LinkIcon className="h-2.5 w-2.5 mr-0.5" /> 链接
                      </Badge>
                    )}
                  </div>
                )}

                {sensitiveHits.length > 0 && (
                  <div className="flex items-center gap-1 mb-2 text-[10px] text-red-600">
                    <AlertTriangle className="h-3 w-3 shrink-0" />
                    <span>命中敏感词: {sensitiveHits.join(", ")}</span>
                  </div>
                )}

                <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-2">
                  <span className="flex items-center gap-1">
                    <Hash className="h-3 w-3" /> 使用 <span className="font-mono">{tpl.usageCount}</span> 次
                  </span>
                  <span className={tpl.enabled ? "text-green-600 flex items-center gap-0.5" : "text-gray-400 flex items-center gap-0.5"}>
                    {tpl.enabled ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                    {tpl.enabled ? "启用" : "停用"}
                  </span>
                </div>

                <div className="flex items-center gap-1 pt-2 border-t">
                  <Button variant="ghost" size="sm" className="text-xs h-7 flex-1" onClick={() => handlePreview(tpl)}>
                    <Eye className="h-3.5 w-3.5 mr-1" /> 预览
                  </Button>
                  <Button variant="ghost" size="sm" className="text-xs h-7 flex-1" onClick={() => handleEdit(tpl)}>
                    <Edit3 className="h-3.5 w-3.5 mr-1" /> 编辑
                  </Button>
                  <Button variant="ghost" size="sm" className="text-xs h-7 text-red-600" onClick={() => handleDelete(tpl)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* 编辑/新增弹窗 */}
      <EditTemplateDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        template={editing}
        onSave={handleSave}
      />

      {/* 预览弹窗 */}
      {previewTpl && (
        <PreviewDialog
          open={previewOpen}
          onOpenChange={setPreviewOpen}
          template={previewTpl}
        />
      )}
    </div>
  );
}

// === 编辑/新增模板弹窗 ===
function EditTemplateDialog({
  open,
  onOpenChange,
  template,
  onSave,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  template: MessageTemplate | null;
  onSave: (data: { name: string; category: string; content: string; imageUrl?: string; linkUrl?: string; linkText?: string }) => void;
}) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("营销");
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [linkText, setLinkText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [mounted, setMounted] = useState(false);

  // 当弹窗打开或 template 变化时同步表单
  useMemo(() => {
    if (open) {
      setName(template?.name || "");
      setCategory(template?.category || "营销");
      setContent(template?.content || "");
      setImageUrl(template?.imageUrl || "");
      setLinkUrl(template?.linkUrl || "");
      setLinkText(template?.linkText || "");
      setMounted(true);
    }
  }, [open, template]);

  const sensitiveHits = useMemo(() => checkSensitive(content), [content]);

  const insertVariable = (token: string) => {
    const el = textareaRef.current;
    if (!el) {
      setContent((c) => c + token);
      return;
    }
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const next = content.slice(0, start) + token + content.slice(end);
    setContent(next);
    // 恢复光标位置
    requestAnimationFrame(() => {
      el.focus();
      const pos = start + token.length;
      el.setSelectionRange(pos, pos);
    });
  };

  const handleSave = () => {
    if (!name.trim()) {
      toast.error("请输入模板名称");
      return;
    }
    if (!content.trim()) {
      toast.error("请输入模板内容");
      return;
    }
    onSave({ name: name.trim(), category, content, imageUrl: imageUrl.trim() || undefined, linkUrl: linkUrl.trim() || undefined, linkText: linkText.trim() || undefined });
  };

  if (!open && mounted) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[88vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{template ? "编辑模板" : "新增模板"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">模板名称</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="如：营销推广-标准版" className="text-xs h-8" />
            </div>
            <div>
              <Label className="text-xs">分类</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TEMPLATE_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <Label className="text-xs">内容（支持内置变量）</Label>
              <div className="flex flex-wrap gap-1">
                {BUILTIN_VARIABLES.map((v) => (
                  <button
                    key={v.token}
                    type="button"
                    onClick={() => insertVariable(v.token)}
                    className="rounded border border-primary/30 bg-primary/5 px-1.5 py-0.5 text-[10px] font-mono text-primary hover:bg-primary/10 transition-colors"
                    title={v.desc}
                  >
                    {v.token}
                  </button>
                ))}
              </div>
            </div>
            <Textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={"Hi! Special offer: {随机数字}% off. Code: {收件人号后四位}{时间戳}"}
              className="font-mono text-xs min-h-32"
            />
          </div>

          {/* 附件图片 + 落地链接 */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs flex items-center gap-1">
                <ImageIcon className="h-3 w-3" /> 附件图片URL
              </Label>
              <Input
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://example.com/poster.jpg"
                className="text-xs h-8 mt-1"
              />
              <p className="text-[10px] text-muted-foreground mt-1">MMS图片消息，留空则纯文本发送</p>
              {imageUrl && (
                <div className="mt-1.5 rounded-md border border-border overflow-hidden">
                  <img src={imageUrl} alt="预览" className="w-full max-h-24 object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                </div>
              )}
            </div>
            <div>
              <Label className="text-xs flex items-center gap-1">
                <LinkIcon className="h-3 w-3" /> 落地链接
              </Label>
              <Input
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://landing.example.com/offer"
                className="text-xs h-8 mt-1"
              />
              <Input
                value={linkText}
                onChange={(e) => setLinkText(e.target.value)}
                placeholder="链接显示文案（如：点击查看详情）"
                className="text-xs h-8 mt-1.5"
              />
              <p className="text-[10px] text-muted-foreground mt-1">短链/落地页，留空则不附加链接</p>
            </div>
          </div>

          {/* 敏感词检测 */}
          {sensitiveHits.length > 0 ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium mb-1">检测到敏感词（{sensitiveHits.length} 个）</p>
                  <div className="flex flex-wrap gap-1">
                    {sensitiveHits.map((w) => (
                      <code key={w} className="rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-mono">{w}</code>
                    ))}
                  </div>
                  <p className="mt-1.5 text-[10px] text-red-600">建议替换或移除敏感词以降低封号风险</p>
                </div>
              </div>
            </div>
          ) : content.trim() ? (
            <div className="rounded-lg border border-green-200 bg-green-50 p-2.5 text-xs text-green-700 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>未检测到敏感词</span>
            </div>
          ) : null}

          {/* 敏感词词表 */}
          <div className="rounded-lg border border-border bg-muted/20 p-2.5">
            <p className="text-[10px] text-muted-foreground mb-1.5">敏感词词表（共 {SENSITIVE_WORDS.length} 个，编辑时实时检测）</p>
            <div className="flex flex-wrap gap-1">
              {SENSITIVE_WORDS.map((w) => (
                <code key={w} className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">{w}</code>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>取消</Button>
          <Button onClick={handleSave}>
            {template ? "保存" : "新增"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// === 预览弹窗 ===
function PreviewDialog({
  open,
  onOpenChange,
  template,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  template: MessageTemplate;
}) {
  const replaced = useMemo(
    () => replaceVariables(template.content, SAMPLE_NUMBER),
    [template.content]
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>模板预览 — {template.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="text-xs text-muted-foreground">原始内容（含变量占位符）</Label>
            <div className="mt-1 rounded-md bg-muted/30 p-2.5">
              <p className="text-xs font-mono break-all whitespace-pre-wrap">{template.content}</p>
            </div>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">
              替换后效果（示例号码 <code className="font-mono text-primary">{SAMPLE_NUMBER}</code>）
            </Label>
            <div className="mt-1 rounded-md border border-green-200 bg-green-50 p-2.5">
              <p className="text-xs font-mono break-all whitespace-pre-wrap text-green-900">{replaced}</p>
            </div>
          </div>
          {(template.imageUrl || template.linkUrl) && (
            <div className="grid grid-cols-2 gap-3">
              {template.imageUrl && (
                <div>
                  <Label className="text-xs text-muted-foreground flex items-center gap-1">
                    <ImageIcon className="h-3 w-3" /> 附件图片
                  </Label>
                  <div className="mt-1 rounded-md border border-border overflow-hidden">
                    <img src={template.imageUrl} alt="附件" className="w-full max-h-32 object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                  </div>
                </div>
              )}
              {template.linkUrl && (
                <div>
                  <Label className="text-xs text-muted-foreground flex items-center gap-1">
                    <LinkIcon className="h-3 w-3" /> 落地链接
                  </Label>
                  <div className="mt-1 rounded-md border border-blue-200 bg-blue-50 p-2.5">
                    <a href={template.linkUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline break-all">
                      {template.linkText || template.linkUrl}
                    </a>
                  </div>
                </div>
              )}
            </div>
          )}
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-2.5 text-[10px] text-blue-800">
            <p>说明：{`{收件人号后四位}`} → {SAMPLE_NUMBER.slice(-4)}，{`{随机数字}`}、{`{随机字母}`}、{`{时间戳}`} 每次预览均生成新值</p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>关闭</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

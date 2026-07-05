import { useState, useEffect } from "react";
import { useStore } from "@/lib/store";
import type { RiskControlConfig } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Shield, Gauge, Zap, RefreshCw, Save, RotateCcw,
  Activity, Globe, Fingerprint, AlertTriangle, Clock, FileCheck2,
} from "lucide-react";

const RISK_RULES = [
  {
    icon: Gauge,
    title: "发送强度三重限制",
    desc: "全局并发数 + 单账号日/小时发送上限 + 发送间隔区间，三层叠加控制请求频率，避免触发平台风控阈值。",
  },
  {
    icon: Fingerprint,
    title: "请求头强绑定",
    desc: "每个账号绑定独立的 Cookie / IDFA / X-PX 全参请求头，设备指纹与账号一一对应，杜绝跨账号指纹复用。",
  },
  {
    icon: Globe,
    title: "IP 一致性校验",
    desc: "账号与代理 IP 强绑定，发送时校验出口 IP 一致性，IP 漂移自动熔断，防止异地登录触发风控。",
  },
  {
    icon: AlertTriangle,
    title: "异常熔断",
    desc: "连续失败达阈值或任务成功率低于阈值时自动熔断，暂停发送并告警，避免封号扩散。",
  },
  {
    icon: Clock,
    title: "令牌过期预警",
    desc: "令牌过期前 N 小时预警，提示续期；过期账号自动停用，防止使用失效令牌请求。",
  },
  {
    icon: FileCheck2,
    title: "内容去重",
    desc: "发送前对内容做去重校验，相同内容短时间内重复发送将被拦截，降低垃圾短信特征。",
  },
];

export default function RiskControl() {
  const riskConfig = useStore((s) => s.riskConfig);
  const updateRiskConfig = useStore((s) => s.updateRiskConfig);

  const [form, setForm] = useState<RiskControlConfig>({ ...riskConfig });
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    setForm({ ...riskConfig });
    setDirty(false);
  }, [riskConfig]);

  const setField = <K extends keyof RiskControlConfig>(key: K, val: RiskControlConfig[K]) => {
    setForm((f) => ({ ...f, [key]: val }));
    setDirty(true);
  };

  const handleSave = () => {
    // 基础校验
    if (form.minInterval > form.maxInterval) {
      toast.error("最小发送间隔不能大于最大发送间隔");
      return;
    }
    if (form.globalConcurrency < 1) {
      toast.error("全局并发数不能小于 1");
      return;
    }
    updateRiskConfig(form);
    setDirty(false);
    toast.success("风控配置已保存");
  };

  const handleReset = () => {
    setForm({ ...riskConfig });
    setDirty(false);
    toast.info("已重置为当前保存值");
  };

  return (
    <div className="space-y-4">
      {/* 顶部操作栏 */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold">风控与保活引擎配置</h2>
          <Badge variant="secondary" className="text-[10px]">实时生效</Badge>
        </div>
        <div className="ml-auto flex gap-2">
          <Button variant="outline" size="sm" onClick={handleReset} disabled={!dirty}>
            <RotateCcw className="h-3.5 w-3.5 mr-1" /> 重置
          </Button>
          <Button size="sm" onClick={handleSave} disabled={!dirty}>
            <Save className="h-3.5 w-3.5 mr-1" /> 保存配置
          </Button>
        </div>
      </div>

      {/* 风控规则说明卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {RISK_RULES.map((rule) => {
          const Icon = rule.icon;
          return (
            <Card key={rule.title} className="p-3.5">
              <div className="flex items-start gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-semibold mb-1">{rule.title}</h4>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">{rule.desc}</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* 配置表单 — 三区块 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* 区块一：发送强度限制 */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50">
              <Gauge className="h-3.5 w-3.5 text-blue-600" />
            </div>
            <h3 className="text-sm font-semibold">发送强度限制</h3>
          </div>
          <div className="space-y-3.5">
            <div>
              <Label className="text-xs">全局并发数</Label>
              <Input
                type="number"
                value={form.globalConcurrency}
                onChange={(e) => setField("globalConcurrency", Number(e.target.value))}
                className="mt-1 font-mono"
              />
              <p className="text-[10px] text-muted-foreground mt-0.5">系统同时进行的发送请求数</p>
            </div>
            <div>
              <Label className="text-xs">单账号日发送上限</Label>
              <Input
                type="number"
                value={form.dailyLimitPerAccount}
                onChange={(e) => setField("dailyLimitPerAccount", Number(e.target.value))}
                className="mt-1 font-mono"
              />
              <p className="text-[10px] text-muted-foreground mt-0.5">单账号每日最多发送条数</p>
            </div>
            <div>
              <Label className="text-xs">单账号小时发送上限</Label>
              <Input
                type="number"
                value={form.hourlyLimitPerAccount}
                onChange={(e) => setField("hourlyLimitPerAccount", Number(e.target.value))}
                className="mt-1 font-mono"
              />
              <p className="text-[10px] text-muted-foreground mt-0.5">单账号每小时最多发送条数</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">最小间隔 (秒)</Label>
                <Input
                  type="number"
                  value={form.minInterval}
                  onChange={(e) => setField("minInterval", Number(e.target.value))}
                  className="mt-1 font-mono"
                />
              </div>
              <div>
                <Label className="text-xs">最大间隔 (秒)</Label>
                <Input
                  type="number"
                  value={form.maxInterval}
                  onChange={(e) => setField("maxInterval", Number(e.target.value))}
                  className="mt-1 font-mono"
                />
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground">每次发送在区间内随机间隔，模拟人工节奏</p>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-xs">仅美国本土白天时段</Label>
                <p className="text-[10px] text-muted-foreground mt-0.5">仅在美东 08:00-21:00 发送</p>
              </div>
              <Switch
                checked={form.usDaytimeOnly}
                onCheckedChange={(v) => setField("usDaytimeOnly", v)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-xs">内容去重校验</Label>
                <p className="text-[10px] text-muted-foreground mt-0.5">拦截短时重复内容</p>
              </div>
              <Switch
                checked={form.contentDedup}
                onCheckedChange={(v) => setField("contentDedup", v)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-xs">IP 一致性校验</Label>
                <p className="text-[10px] text-muted-foreground mt-0.5">校验出口 IP 与绑定一致</p>
              </div>
              <Switch
                checked={form.ipConsistencyCheck}
                onCheckedChange={(v) => setField("ipConsistencyCheck", v)}
              />
            </div>
          </div>
        </Card>

        {/* 区块二：异常熔断 */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50">
              <Zap className="h-3.5 w-3.5 text-amber-600" />
            </div>
            <h3 className="text-sm font-semibold">异常熔断</h3>
          </div>
          <div className="space-y-3.5">
            <div>
              <Label className="text-xs">失败重试次数</Label>
              <Input
                type="number"
                value={form.retryCount}
                onChange={(e) => setField("retryCount", Number(e.target.value))}
                className="mt-1 font-mono"
              />
              <p className="text-[10px] text-muted-foreground mt-0.5">单条发送失败后重试次数</p>
            </div>
            <div>
              <Label className="text-xs">重试间隔 (秒)</Label>
              <Input
                type="number"
                value={form.retryInterval}
                onChange={(e) => setField("retryInterval", Number(e.target.value))}
                className="mt-1 font-mono"
              />
              <p className="text-[10px] text-muted-foreground mt-0.5">两次重试之间的等待时间</p>
            </div>
            <div>
              <Label className="text-xs">连续失败熔断阈值</Label>
              <Input
                type="number"
                value={form.circuitBreakerThreshold}
                onChange={(e) => setField("circuitBreakerThreshold", Number(e.target.value))}
                className="mt-1 font-mono"
              />
              <p className="text-[10px] text-muted-foreground mt-0.5">连续失败达此数自动熔断账号</p>
            </div>
            <div>
              <Label className="text-xs">任务成功率熔断阈值 (%)</Label>
              <Input
                type="number"
                value={form.taskSuccessRateThreshold}
                onChange={(e) => setField("taskSuccessRateThreshold", Number(e.target.value))}
                className="mt-1 font-mono"
              />
              <p className="text-[10px] text-muted-foreground mt-0.5">任务成功率低于此值触发熔断</p>
            </div>
            <Separator />
            <div>
              <Label className="text-xs">令牌过期预警 (小时)</Label>
              <Input
                type="number"
                value={form.tokenExpiryWarningHours}
                onChange={(e) => setField("tokenExpiryWarningHours", Number(e.target.value))}
                className="mt-1 font-mono"
              />
              <p className="text-[10px] text-muted-foreground mt-0.5">令牌过期前 N 小时预警提示续期</p>
            </div>
          </div>
        </Card>

        {/* 区块三：保活续期 */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-green-50">
              <RefreshCw className="h-3.5 w-3.5 text-green-600" />
            </div>
            <h3 className="text-sm font-semibold">保活续期</h3>
          </div>
          <div className="space-y-3.5">
            <div>
              <Label className="text-xs">保号周期 (天)</Label>
              <Input
                type="number"
                value={form.keepAliveDays}
                onChange={(e) => setField("keepAliveDays", Number(e.target.value))}
                className="mt-1 font-mono"
              />
              <p className="text-[10px] text-muted-foreground mt-0.5">每隔 N 天执行一次保号操作</p>
            </div>
            <div>
              <Label className="text-xs">续期检测周期 (小时)</Label>
              <Input
                type="number"
                value={form.tokenRenewalCheckHours}
                onChange={(e) => setField("tokenRenewalCheckHours", Number(e.target.value))}
                className="mt-1 font-mono"
              />
              <p className="text-[10px] text-muted-foreground mt-0.5">每隔 N 小时扫描待续期账号</p>
            </div>
            <div>
              <Label className="text-xs">健康检测周期 (小时)</Label>
              <Input
                type="number"
                value={form.healthCheckHours}
                onChange={(e) => setField("healthCheckHours", Number(e.target.value))}
                className="mt-1 font-mono"
              />
              <p className="text-[10px] text-muted-foreground mt-0.5">每隔 N 小时执行账号健康检测</p>
            </div>
            <Separator />
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-[11px] text-blue-800">
              <div className="flex items-start gap-2">
                <Activity className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium mb-1">保活策略说明</p>
                  <p className="leading-relaxed">
                    系统按配置周期自动执行保号、续期、健康检测三项任务，确保号池账号长期可用，
                    降低因令牌过期或长期不活跃导致的封禁风险。
                  </p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-md border bg-muted/30 py-2">
                <p className="text-[10px] text-muted-foreground">保号</p>
                <p className="font-mono text-sm font-semibold mt-0.5">{form.keepAliveDays}d</p>
              </div>
              <div className="rounded-md border bg-muted/30 py-2">
                <p className="text-[10px] text-muted-foreground">续期</p>
                <p className="font-mono text-sm font-semibold mt-0.5">{form.tokenRenewalCheckHours}h</p>
              </div>
              <div className="rounded-md border bg-muted/30 py-2">
                <p className="text-[10px] text-muted-foreground">检测</p>
                <p className="font-mono text-sm font-semibold mt-0.5">{form.healthCheckHours}h</p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* 底部保存栏 */}
      {dirty && (
        <div className="sticky bottom-0 flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5">
          <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
          <span className="text-xs text-amber-800">配置已修改但未保存</span>
          <div className="ml-auto flex gap-2">
            <Button variant="outline" size="sm" onClick={handleReset}>放弃修改</Button>
            <Button size="sm" onClick={handleSave}>
              <Save className="h-3.5 w-3.5 mr-1" /> 保存配置
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

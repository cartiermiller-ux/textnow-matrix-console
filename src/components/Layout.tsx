import { NavLink, useLocation } from "react-router-dom";
import { NAV_GROUPS, NAV_ITEMS } from "@/lib/constants";
import { useStore } from "@/lib/store";
import {
  LayoutDashboard,
  Users,
  Send,
  FileText,
  MessageSquare,
  Shield,
  BarChart3,
  Settings,
  Headset,
  Menu,
  X,
  Bell,
  ChevronDown,
  Sun,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  Users,
  Send,
  FileText,
  MessageSquare,
  Shield,
  BarChart3,
  Settings,
  Headset,
};

const PAGE_SUBTITLES: Record<string, string> = {
  "/": "号池总览、发送量、成功率与风控健康度",
  "/accounts": "全参号导入、生命周期管理与分组调度",
  "/seats": "坐席排班、账号绑定与会话分配",
  "/tasks": "矩阵群发任务创建、调度与进度追踪",
  "/templates": "内容模板、智能变量与敏感词检测",
  "/chat": "收件箱轮询、关键词自动回复与人工接管",
  "/risk-control": "发送节奏、熔断、续期与保活策略",
  "/statistics": "运营报表、账号维度与任务维度统计",
  "/system": "角色权限、操作日志与开放接口",
};

function useDarkMode() {
  const [dark, setDark] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    const saved = localStorage.getItem("tn-theme");
    if (saved) return saved === "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (dark) {
      root.classList.add("dark");
      localStorage.setItem("tn-theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("tn-theme", "light");
    }
  }, [dark]);

  return { dark, toggle: () => setDark((d) => !d) };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const { dark, toggle: toggleDark } = useDarkMode();
  const accounts = useStore((s) => s.accounts);
  const conversations = useStore((s) => s.conversations);
  const tasks = useStore((s) => s.tasks);
  const seats = useStore((s) => s.seats);

  const normalCount = accounts.filter((a) => a.status === "normal" && a.enabled).length;
  const pendingRenew = accounts.filter((a) => a.status === "pending_renew").length;
  const unreadCount = conversations.reduce((sum, c) => sum + c.unread, 0);
  const runningTasks = tasks.filter((t) => t.status === "running").length;
  const onlineSeats = seats.filter((s) => s.enabled && s.status === "online").length;

  const badgeMap: Record<string, { count: number; color: string }> = {
    pendingRenew: { count: pendingRenew, color: "bg-amber-500/20 text-amber-400" },
    unread: { count: unreadCount, color: "bg-red-500/20 text-red-400" },
    runningTasks: { count: runningTasks, color: "bg-green-500/20 text-green-400" },
    seatOnline: { count: onlineSeats, color: "bg-blue-500/20 text-blue-400" },
  };

  const currentNav = NAV_ITEMS.find((n) => n.path === location.pathname);
  const subtitle = PAGE_SUBTITLES[location.pathname];

  return (
    <div className="flex h-screen overflow-hidden bg-muted/30">
      {/* === 侧边栏 === */}
      <aside
        className={cn(
          "fixed lg:relative z-50 flex h-full flex-col bg-sidebar text-sidebar-foreground transition-all duration-300 lg:translate-x-0",
          collapsed ? "lg:w-16 w-64" : "w-64",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo 区 */}
        <div className="flex h-16 items-center gap-2.5 border-b border-sidebar-border px-4 overflow-hidden">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-sidebar-primary to-sidebar-primary/80 text-sidebar-primary-foreground font-bold text-sm shadow-lg shadow-black/30">
            TN
          </div>
          {!collapsed && (
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-semibold leading-tight truncate">TextNow 矩阵</span>
              <span className="text-[10px] text-sidebar-foreground/50 leading-tight truncate">协议号运营系统 · v2.0</span>
            </div>
          )}
          <button
            className="ml-auto lg:hidden text-sidebar-foreground/60 hover:text-sidebar-foreground shrink-0"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* 导航 — 分组渲染 */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3 px-2">
          {NAV_GROUPS.map((group) => (
            <div key={group.group} className="mb-3">
              {!collapsed && (
                <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/40">
                  {group.group}
                </div>
              )}
              {collapsed && group !== NAV_GROUPS[0] && (
                <div className="mx-3 my-2 border-t border-sidebar-border/60" />
              )}
              {group.items.map((item) => {
                const Icon = ICON_MAP[item.icon] || LayoutDashboard;
                const isActive = location.pathname === item.path;
                const badge = item.badge ? badgeMap[item.badge] : null;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    title={collapsed ? item.label : undefined}
                    className={cn(
                      "relative flex items-center rounded-md text-sm transition-all duration-200 mb-0.5",
                      collapsed ? "justify-center px-2 py-2.5" : "gap-3 px-3 py-2.5",
                      isActive
                        ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium shadow-sm shadow-black/20"
                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                    {!collapsed && badge && badge.count > 0 && (
                      <span className={cn("ml-auto rounded-full px-1.5 py-0.5 text-[10px]", badge.color)}>
                        {badge.count}
                      </span>
                    )}
                    {collapsed && badge && badge.count > 0 && (
                      <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-red-500" />
                    )}
                  </NavLink>
                );
              })}
            </div>
          ))}
        </nav>

        {/* 底部状态 */}
        {!collapsed && (
          <div className="border-t border-sidebar-border p-3">
            <div className="rounded-md bg-sidebar-accent/50 p-2.5 space-y-1.5">
              <div className="flex items-center justify-between text-[11px] text-sidebar-foreground/60">
                <span>可用账号</span>
                <span className="font-mono text-green-400">{normalCount}</span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-sidebar-foreground/60">
                <span>待续期</span>
                <span className="font-mono text-amber-400">{pendingRenew}</span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-sidebar-foreground/60">
                <span>在线坐席</span>
                <span className="font-mono text-blue-400">{onlineSeats}</span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-sidebar-foreground/60">
                <span>未读消息</span>
                <span className="font-mono text-red-400">{unreadCount}</span>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* 遮罩 */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* === 主区域 === */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* 顶栏 */}
        <header className="flex h-16 shrink-0 items-center gap-3 border-b border-border bg-card/80 backdrop-blur-sm px-4 lg:px-6">
          <button
            className="lg:hidden text-muted-foreground hover:text-foreground"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>
          <button
            className="hidden lg:flex text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => setCollapsed((c) => !c)}
            title={collapsed ? "展开侧边栏" : "收起侧边栏"}
          >
            {collapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
          </button>
          <div className="flex flex-col min-w-0">
            <h1 className="text-base font-semibold truncate">{currentNav?.label || "运营总览"}</h1>
            {subtitle && (
              <p className="text-[11px] text-muted-foreground truncate hidden sm:block">{subtitle}</p>
            )}
          </div>
          <div className="ml-auto flex items-center gap-2">
            {/* 系统状态指示器 */}
            <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-medium text-emerald-700 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 tn-pulse-dot" />
              系统运行中
            </span>
            {/* 暗色模式切换 */}
            <button
              className="rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
              onClick={toggleDark}
              title={dark ? "切换到浅色" : "切换到深色"}
            >
              {dark ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
            </button>
            <button className="relative rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">
              <Bell className="h-4.5 w-4.5" />
              {unreadCount > 0 && (
                <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500" />
              )}
            </button>
            <div className="flex items-center gap-2 rounded-md border border-border px-2.5 py-1.5 cursor-pointer hover:bg-accent transition-colors">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium">
                A
              </div>
              <div className="hidden sm:flex flex-col">
                <span className="text-xs font-medium leading-tight">admin</span>
                <span className="text-[10px] text-muted-foreground leading-tight">管理员</span>
              </div>
              <ChevronDown className="hidden sm:block h-3.5 w-3.5 text-muted-foreground" />
            </div>
          </div>
        </header>

        {/* 内容区 */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <div key={location.pathname} className="tn-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

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
} from "lucide-react";
import { useState } from "react";
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

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
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

  return (
    <div className="flex h-screen overflow-hidden bg-muted/30">
      {/* === 侧边栏 === */}
      <aside
        className={cn(
          "fixed lg:relative z-50 flex h-full w-64 flex-col bg-sidebar text-sidebar-foreground transition-transform duration-300 lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo 区 */}
        <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground font-bold text-sm font-mono">
            CM
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold leading-tight">CartierandMiller</span>
            <span className="text-[10px] text-sidebar-foreground/60 leading-tight">协议号运营管理平台</span>
          </div>
          <button
            className="ml-auto lg:hidden text-sidebar-foreground/60 hover:text-sidebar-foreground"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* 导航 — 分组渲染 */}
        <nav className="flex-1 overflow-y-auto py-3 px-2">
          {NAV_GROUPS.map((group) => (
            <div key={group.group} className="mb-3">
              <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/40">
                {group.group}
              </div>
              {group.items.map((item) => {
                const Icon = ICON_MAP[item.icon] || LayoutDashboard;
                const isActive = location.pathname === item.path;
                const badge = item.badge ? badgeMap[item.badge] : null;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors mb-0.5",
                      isActive
                        ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium"
                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span>{item.label}</span>
                    {badge && badge.count > 0 && (
                      <span className={cn("ml-auto rounded-full px-1.5 py-0.5 text-[10px]", badge.color)}>
                        {badge.count}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </div>
          ))}
        </nav>

        {/* 底部状态 */}
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
        <header className="flex h-16 shrink-0 items-center gap-3 border-b border-border bg-card px-4 lg:px-6">
          <button
            className="lg:hidden text-muted-foreground hover:text-foreground"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-semibold">{currentNav?.label || "运营总览"}</h1>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <button className="relative rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-foreground">
              <Bell className="h-4.5 w-4.5" />
              {unreadCount > 0 && (
                <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500" />
              )}
            </button>
            <div className="flex items-center gap-2 rounded-md border border-border px-2.5 py-1.5">
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
          {children}
        </main>
      </div>
    </div>
  );
}

import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route } from "react-router-dom";
import Layout from "@/components/Layout";

const Dashboard = lazy(() => import("@/pages/Dashboard"));
const Accounts = lazy(() => import("@/pages/Accounts"));
const Seats = lazy(() => import("@/pages/Seats"));
const Tasks = lazy(() => import("@/pages/Tasks"));
const Templates = lazy(() => import("@/pages/Templates"));
const Chat = lazy(() => import("@/pages/Chat"));
const RiskControl = lazy(() => import("@/pages/RiskControl"));
const Statistics = lazy(() => import("@/pages/Statistics"));
const System = lazy(() => import("@/pages/System"));

const NotFound = () => (
  <div className="flex h-screen items-center justify-center text-muted-foreground">
    <div className="text-center">
      <p className="text-4xl font-bold mb-2">404</p>
      <p>页面不存在</p>
    </div>
  </div>
);

const PageLoader = () => (
  <div className="flex h-[calc(100vh-4rem)] items-center justify-center bg-muted/20">
    <div className="flex flex-col items-center gap-4">
      {/* 品牌Logo + 旋转光环 */}
      <div className="relative flex h-14 w-14 items-center justify-center">
        <span className="absolute inset-0 rounded-2xl bg-primary/10 animate-ping opacity-60" style={{ animationDuration: "1.8s" }} />
        <span className="absolute inset-0 rounded-2xl border-2 border-primary/20" />
        <span className="absolute inset-0 rounded-2xl border-t-2 border-primary animate-spin" style={{ animationDuration: "0.9s" }} />
        <span className="relative text-sm font-bold text-primary font-mono">CM</span>
      </div>
      {/* 品牌名 + 加载提示 */}
      <div className="flex flex-col items-center gap-1.5">
        <span className="text-sm font-semibold text-foreground">CartierandMiller</span>
        <div className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
          <span className="h-1.5 w-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "150ms" }} />
          <span className="h-1.5 w-1.5 rounded-full bg-primary/30 animate-bounce" style={{ animationDelay: "300ms" }} />
          <span className="ml-1 text-xs text-muted-foreground">加载中</span>
        </div>
      </div>
    </div>
  </div>
);

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <HashRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Layout><Dashboard /></Layout>} />
            <Route path="/accounts" element={<Layout><Accounts /></Layout>} />
            <Route path="/seats" element={<Layout><Seats /></Layout>} />
            <Route path="/tasks" element={<Layout><Tasks /></Layout>} />
            <Route path="/templates" element={<Layout><Templates /></Layout>} />
            <Route path="/chat" element={<Layout><Chat /></Layout>} />
            <Route path="/risk-control" element={<Layout><RiskControl /></Layout>} />
            <Route path="/statistics" element={<Layout><Statistics /></Layout>} />
            <Route path="/system" element={<Layout><System /></Layout>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </HashRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

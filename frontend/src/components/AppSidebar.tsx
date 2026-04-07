import { NavLink } from "@/components/NavLink";
import {
  LayoutDashboard,
  Mic,
  GitBranch,
  FileText,
  Volume2,
  Download,
  Settings,
  ChevronLeft,
  ChevronRight,
  Braces,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/record", icon: Mic, label: "Speech Input" },
  { to: "/output", icon: FileText, label: "Text Output" },
  { to: "/playback", icon: Volume2, label: "Speak Back" },
  { to: "/settings", icon: Settings, label: "Settings" },
];

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "flex flex-col h-screen border-r border-border bg-sidebar sticky top-0 transition-all duration-300",
        collapsed ? "w-16" : "w-60"
      )}
    >
      {/* Brand */}
      <div className="flex items-center gap-2 px-4 h-16 border-b border-border shrink-0">
        <Braces className="h-7 w-7 text-primary shrink-0" />
        {!collapsed && (
          <div className="animate-fade-in">
            <h1 className="text-sm font-bold tracking-tight gradient-text">LinguaSense AI</h1>
            <p className="text-[10px] text-muted-foreground leading-none">Speech Correction</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 space-y-1 px-2 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground transition-all duration-200 hover:bg-muted hover:text-foreground",
              collapsed && "justify-center px-0"
            )}
            activeClassName="bg-primary/10 text-primary border border-primary/20 glow-primary"
          >
            <item.icon className="h-5 w-5 shrink-0" />
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center justify-center h-12 border-t border-border text-muted-foreground hover:text-foreground transition-colors"
      >
        {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </button>
    </aside>
  );
}

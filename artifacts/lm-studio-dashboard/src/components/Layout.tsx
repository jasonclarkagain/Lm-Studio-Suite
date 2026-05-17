import { Link, useLocation } from "wouter";
import { useTheme } from "@/lib/theme";
import { useConnection } from "@/lib/connection";
import { Sun, Moon, LayoutDashboard, Cpu, MessageSquare, Settings } from "lucide-react";

const NAV = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/models", label: "Models", icon: Cpu },
  { href: "/chat", label: "Chat", icon: MessageSquare },
  { href: "/settings", label: "Settings", icon: Settings },
];

function StatusDot({ status }: { status: "connected" | "disconnected" | "checking" }) {
  const colors = {
    connected: "bg-green-500",
    disconnected: "bg-red-500",
    checking: "bg-yellow-500 animate-pulse",
  };
  return <span className={`inline-block w-2 h-2 rounded-full ${colors[status]}`} />;
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const { theme, toggle } = useTheme();
  const { status, serverUrl } = useConnection();
  const [location] = useLocation();

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      <aside className="w-56 flex-shrink-0 border-r border-border flex flex-col" data-testid="sidebar">
        <div className="px-4 py-4 border-b border-border">
          <div className="text-xs font-bold tracking-widest text-primary uppercase">LM Studio</div>
          <div className="text-xs font-bold tracking-widest text-muted-foreground uppercase">Dashboard</div>
        </div>

        <nav className="flex-1 py-2" data-testid="sidebar-nav">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = location === href || (href !== "/" && location.startsWith(href));
            return (
              <Link key={href} href={href}>
                <a
                  data-testid={`nav-${label.toLowerCase()}`}
                  className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                    active
                      ? "bg-primary/10 text-primary border-r-2 border-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
                >
                  <Icon size={15} />
                  {label}
                </a>
              </Link>
            );
          })}
        </nav>

        <div className="px-4 py-3 border-t border-border space-y-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <StatusDot status={status} />
            <span data-testid="connection-status" className="truncate">
              {status === "connected" ? "Connected" : status === "checking" ? "Checking..." : "Offline"}
            </span>
          </div>
          <div className="text-xs text-muted-foreground truncate font-mono" data-testid="server-url">
            {serverUrl}
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="flex items-center justify-between px-6 py-3 border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            <StatusDot status={status} />
            <span className="text-xs text-muted-foreground">
              {status === "connected"
                ? "LM Studio online"
                : status === "checking"
                ? "Connecting..."
                : "LM Studio offline — check Settings"}
            </span>
          </div>
          <button
            data-testid="theme-toggle"
            onClick={toggle}
            className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </header>

        <main className="flex-1 overflow-auto" data-testid="main-content">
          {children}
        </main>
      </div>
    </div>
  );
}

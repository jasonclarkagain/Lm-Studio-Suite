import { useQuery } from "@tanstack/react-query";
import { fetchModels } from "@/lib/lm-studio";
import { useConnection } from "@/lib/connection";
import { Cpu, MessageSquare, Wifi, WifiOff, RefreshCw, AlertTriangle } from "lucide-react";
import { Link } from "wouter";

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  testId,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  testId: string;
}) {
  return (
    <div className="border border-border p-4 bg-card" data-testid={testId}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-muted-foreground tracking-widest uppercase">{label}</span>
        <Icon size={14} className="text-muted-foreground" />
      </div>
      <div className="text-2xl font-bold font-mono text-foreground">{value}</div>
      {sub && <div className="text-xs text-muted-foreground mt-1">{sub}</div>}
    </div>
  );
}

export default function Dashboard() {
  const { status, recheck } = useConnection();

  const { data: models, isLoading, error } = useQuery({
    queryKey: ["models"],
    queryFn: fetchModels,
    refetchInterval: 15000,
    retry: false,
    enabled: status === "connected",
  });

  const modelCount = models?.data?.length ?? 0;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold tracking-tight" data-testid="page-title">Dashboard</h1>
          <p className="text-xs text-muted-foreground mt-0.5">LM Studio server overview</p>
        </div>
        <button
          data-testid="button-refresh"
          onClick={recheck}
          className="flex items-center gap-2 px-3 py-1.5 text-xs border border-border hover:bg-muted/50 transition-colors"
        >
          <RefreshCw size={12} />
          Refresh
        </button>
      </div>

      {status === "disconnected" && (
        <div className="border border-destructive/50 bg-destructive/10 p-4 flex items-start gap-3" data-testid="offline-banner">
          <WifiOff size={16} className="text-destructive mt-0.5 shrink-0" />
          <div>
            <div className="text-sm font-medium text-destructive">LM Studio is unreachable</div>
            <div className="text-xs text-muted-foreground mt-1">
              Make sure LM Studio is running and the server is started. Check the{" "}
              <Link href="/settings">
                <a className="underline text-foreground">Settings</a>
              </Link>{" "}
              page to configure the server URL.
            </div>
            <div className="text-xs text-muted-foreground mt-1 font-mono">
              Tip: Enable CORS in LM Studio → Settings → Developer → Allow cross-origin requests
            </div>
          </div>
        </div>
      )}

      {status === "connected" && error && (
        <div className="border border-yellow-500/50 bg-yellow-500/10 p-4 flex items-start gap-3" data-testid="error-banner">
          <AlertTriangle size={16} className="text-yellow-500 mt-0.5 shrink-0" />
          <div className="text-sm text-yellow-500">Failed to load model list. LM Studio may be starting up.</div>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          label="Available Models"
          value={isLoading ? "..." : modelCount}
          sub={modelCount === 1 ? "1 model loaded" : `${modelCount} models available`}
          icon={Cpu}
          testId="stat-models"
        />
        <StatCard
          label="Server Status"
          value={status === "connected" ? "Online" : status === "checking" ? "Checking" : "Offline"}
          sub={status === "connected" ? "Responding to requests" : "Not reachable"}
          icon={status === "connected" ? Wifi : WifiOff}
          testId="stat-status"
        />
        <StatCard
          label="Active Session"
          value="Chat"
          sub="Go to Chat to start"
          icon={MessageSquare}
          testId="stat-chat"
        />
      </div>

      {models && models.data.length > 0 && (
        <div>
          <div className="text-xs text-muted-foreground tracking-widest uppercase mb-3">Loaded Models</div>
          <div className="border border-border divide-y divide-border">
            {models.data.map((model) => (
              <div
                key={model.id}
                className="flex items-center justify-between px-4 py-3"
                data-testid={`model-row-${model.id}`}
              >
                <div>
                  <div className="text-sm font-mono text-foreground">{model.id}</div>
                  <div className="text-xs text-muted-foreground">owned by {model.owned_by}</div>
                </div>
                <Link href={`/chat?model=${encodeURIComponent(model.id)}`}>
                  <a
                    data-testid={`button-chat-${model.id}`}
                    className="text-xs px-3 py-1 border border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
                  >
                    Chat
                  </a>
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {status === "connected" && !isLoading && modelCount === 0 && (
        <div className="border border-border p-6 text-center" data-testid="no-models-notice">
          <Cpu size={24} className="text-muted-foreground mx-auto mb-2" />
          <div className="text-sm text-muted-foreground">No models loaded in LM Studio.</div>
          <div className="text-xs text-muted-foreground mt-1">Load a model from the LM Studio desktop app first.</div>
        </div>
      )}

      <div className="text-xs text-muted-foreground border-t border-border pt-4">
        Data refreshes every 15 seconds. Last checked: just now.
      </div>
    </div>
  );
}

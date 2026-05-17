import { useQuery } from "@tanstack/react-query";
import { fetchModels } from "@/lib/lm-studio";
import { useConnection } from "@/lib/connection";
import { Cpu, RefreshCw, WifiOff, Clock } from "lucide-react";
import { Link } from "wouter";

function formatDate(ts: number) {
  if (!ts) return "Unknown";
  return new Date(ts * 1000).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function Models() {
  const { status, recheck } = useConnection();

  const { data, isLoading, error, refetch, dataUpdatedAt } = useQuery({
    queryKey: ["models"],
    queryFn: fetchModels,
    refetchInterval: 20000,
    retry: false,
    enabled: status !== "disconnected",
  });

  const models = data?.data ?? [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold tracking-tight" data-testid="page-title">Models</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {models.length > 0 ? `${models.length} model${models.length !== 1 ? "s" : ""} available` : "No models detected"}
          </p>
        </div>
        <button
          data-testid="button-refresh-models"
          onClick={() => { recheck(); refetch(); }}
          className="flex items-center gap-2 px-3 py-1.5 text-xs border border-border hover:bg-muted/50 transition-colors"
        >
          <RefreshCw size={12} />
          Refresh
        </button>
      </div>

      {status === "disconnected" && (
        <div className="border border-destructive/50 bg-destructive/10 p-4 flex items-start gap-3" data-testid="offline-warning">
          <WifiOff size={16} className="text-destructive mt-0.5 shrink-0" />
          <div>
            <div className="text-sm font-medium text-destructive">Server unreachable</div>
            <div className="text-xs text-muted-foreground mt-1">
              Cannot fetch model list.{" "}
              <Link href="/settings">
                <a className="underline text-foreground">Check Settings</a>
              </Link>
            </div>
          </div>
        </div>
      )}

      {error && status !== "disconnected" && (
        <div className="border border-yellow-500/30 bg-yellow-500/10 p-3 text-xs text-yellow-500" data-testid="models-error">
          Failed to load models: {String(error)}
        </div>
      )}

      {isLoading && (
        <div className="border border-border p-8 text-center text-sm text-muted-foreground" data-testid="models-loading">
          <RefreshCw size={16} className="animate-spin mx-auto mb-2" />
          Loading models...
        </div>
      )}

      {!isLoading && models.length === 0 && status === "connected" && (
        <div className="border border-border p-8 text-center" data-testid="no-models">
          <Cpu size={24} className="text-muted-foreground mx-auto mb-3" />
          <div className="text-sm text-foreground">No models loaded</div>
          <div className="text-xs text-muted-foreground mt-2 max-w-xs mx-auto">
            Open LM Studio and load a model from the Model Browser. It will appear here once active.
          </div>
        </div>
      )}

      {models.length > 0 && (
        <div className="border border-border" data-testid="models-table">
          <div className="grid grid-cols-[1fr_auto_auto] text-xs text-muted-foreground tracking-widest uppercase px-4 py-2 border-b border-border bg-muted/30">
            <span>Model ID</span>
            <span className="text-right pr-12">Added</span>
            <span className="text-right">Action</span>
          </div>
          {models.map((model, idx) => (
            <div
              key={model.id}
              className={`grid grid-cols-[1fr_auto_auto] items-center px-4 py-3 gap-4 ${idx < models.length - 1 ? "border-b border-border" : ""}`}
              data-testid={`model-card-${model.id}`}
            >
              <div className="min-w-0">
                <div className="text-sm font-mono text-foreground truncate" data-testid={`model-id-${model.id}`}>
                  {model.id}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  owned by <span className="text-foreground">{model.owned_by}</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground whitespace-nowrap">
                <Clock size={11} />
                {formatDate(model.created)}
              </div>
              <Link href={`/chat?model=${encodeURIComponent(model.id)}`}>
                <a
                  data-testid={`button-chat-model-${model.id}`}
                  className="text-xs px-3 py-1.5 bg-primary text-primary-foreground hover:opacity-90 transition-opacity whitespace-nowrap"
                >
                  Open Chat
                </a>
              </Link>
            </div>
          ))}
        </div>
      )}

      {dataUpdatedAt > 0 && (
        <div className="text-xs text-muted-foreground flex items-center gap-1.5">
          <Clock size={10} />
          Last updated {new Date(dataUpdatedAt).toLocaleTimeString()}
        </div>
      )}
    </div>
  );
}

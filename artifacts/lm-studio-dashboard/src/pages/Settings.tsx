import { useState } from "react";
import { getServerUrl, setServerUrl, DEFAULT_URL, testConnection } from "@/lib/lm-studio";
import { useConnection } from "@/lib/connection";
import { CheckCircle2, XCircle, Loader2, RotateCcw } from "lucide-react";

type TestResult = "idle" | "testing" | "ok" | "fail";

export default function Settings() {
  const { recheck } = useConnection();
  const [url, setUrl] = useState(getServerUrl());
  const [saved, setSaved] = useState(false);
  const [testResult, setTestResult] = useState<TestResult>("idle");
  const [testError, setTestError] = useState("");

  const handleSave = () => {
    setServerUrl(url.trim() || DEFAULT_URL);
    setSaved(true);
    recheck();
    setTimeout(() => setSaved(false), 2000);
  };

  const handleTest = async () => {
    setTestResult("testing");
    setTestError("");
    try {
      setServerUrl(url.trim() || DEFAULT_URL);
      const ok = await testConnection();
      setTestResult(ok ? "ok" : "fail");
      if (!ok) setTestError("Could not reach the server. Check the URL and that LM Studio is running.");
    } catch (err) {
      setTestResult("fail");
      setTestError(String(err));
    }
  };

  const handleReset = () => {
    setUrl(DEFAULT_URL);
    setServerUrl(DEFAULT_URL);
    recheck();
  };

  return (
    <div className="p-6 max-w-2xl space-y-8">
      <div>
        <h1 className="text-lg font-bold tracking-tight" data-testid="page-title">Settings</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Configure your LM Studio connection</p>
      </div>

      <div className="space-y-4">
        <div className="text-xs text-muted-foreground tracking-widest uppercase">Server Connection</div>

        <div className="border border-border p-4 space-y-4">
          <div>
            <label className="text-xs text-muted-foreground block mb-2" htmlFor="server-url">
              LM Studio Server URL
            </label>
            <input
              id="server-url"
              data-testid="input-server-url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder={DEFAULT_URL}
              className="w-full bg-background border border-border px-3 py-2 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <p className="text-xs text-muted-foreground mt-1.5">
              Default: <code className="font-mono">{DEFAULT_URL}</code> — change this if LM Studio runs on a different host or port.
            </p>
          </div>

          {testResult !== "idle" && (
            <div
              data-testid="test-result"
              className={`flex items-start gap-2 text-xs p-2 border ${
                testResult === "ok"
                  ? "border-green-500/40 bg-green-500/10 text-green-500"
                  : testResult === "fail"
                  ? "border-destructive/40 bg-destructive/10 text-destructive"
                  : "border-border text-muted-foreground"
              }`}
            >
              {testResult === "testing" && <Loader2 size={13} className="animate-spin mt-0.5 shrink-0" />}
              {testResult === "ok" && <CheckCircle2 size={13} className="mt-0.5 shrink-0" />}
              {testResult === "fail" && <XCircle size={13} className="mt-0.5 shrink-0" />}
              <span>
                {testResult === "testing" && "Testing connection..."}
                {testResult === "ok" && "Connection successful! LM Studio is reachable."}
                {testResult === "fail" && (testError || "Connection failed.")}
              </span>
            </div>
          )}

          <div className="flex gap-2">
            <button
              data-testid="button-test-connection"
              onClick={handleTest}
              disabled={testResult === "testing"}
              className="px-4 py-2 text-xs border border-border hover:bg-muted/50 transition-colors disabled:opacity-50"
            >
              Test Connection
            </button>
            <button
              data-testid="button-save-settings"
              onClick={handleSave}
              className="px-4 py-2 text-xs bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
            >
              {saved ? "Saved!" : "Save"}
            </button>
            <button
              data-testid="button-reset-url"
              onClick={handleReset}
              className="px-4 py-2 text-xs border border-border text-muted-foreground hover:bg-muted/50 transition-colors flex items-center gap-1.5"
            >
              <RotateCcw size={11} />
              Reset to Default
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="text-xs text-muted-foreground tracking-widest uppercase">CORS Setup Required</div>
        <div className="border border-border p-4 space-y-3">
          <p className="text-sm text-foreground">
            LM Studio's local server must allow cross-origin requests for this dashboard to work from a browser.
          </p>
          <ol className="space-y-2 text-xs text-muted-foreground list-decimal list-inside">
            <li>Open LM Studio on your machine</li>
            <li>
              Go to <span className="text-foreground font-mono">Settings</span> (gear icon)
            </li>
            <li>
              Navigate to <span className="text-foreground font-mono">Developer</span>
            </li>
            <li>
              Enable <span className="text-foreground font-mono">Allow cross-origin requests (CORS)</span>
            </li>
            <li>Restart the LM Studio server (toggle it off and on in the Local Server tab)</li>
          </ol>
          <div className="mt-2 border-t border-border pt-3 text-xs text-muted-foreground">
            <strong className="text-foreground">Android / Remote access:</strong> When accessing this dashboard from a different device (Android phone, another computer), set the server URL to your laptop's IP address on your local network, e.g.{" "}
            <code className="font-mono text-foreground">http://192.168.1.x:1234</code>. Make sure LM Studio is bound to all interfaces (not just localhost).
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="text-xs text-muted-foreground tracking-widest uppercase">LM Studio API</div>
        <div className="border border-border p-4 text-xs font-mono space-y-1 text-muted-foreground">
          <div>
            <span className="text-green-500">GET</span> {url}/v1/models
          </div>
          <div>
            <span className="text-blue-400">POST</span> {url}/v1/chat/completions
          </div>
          <div>
            <span className="text-green-500">GET</span> {url}/v1/system_info
          </div>
        </div>
      </div>
    </div>
  );
}

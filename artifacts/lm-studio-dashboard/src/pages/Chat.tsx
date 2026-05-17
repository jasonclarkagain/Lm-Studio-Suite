import { useState, useRef, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearch } from "wouter";
import { fetchModels, streamChatCompletion, ChatMessage } from "@/lib/lm-studio";
import { useConnection } from "@/lib/connection";
import { Send, Trash2, Settings2, WifiOff, ChevronDown, Square, User, Bot } from "lucide-react";

interface MessageDisplay {
  id: string;
  role: "user" | "assistant";
  content: string;
  pending?: boolean;
}

function MessageBubble({ msg }: { msg: MessageDisplay }) {
  const isUser = msg.role === "user";
  return (
    <div
      className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}
      data-testid={`message-${msg.id}`}
    >
      {!isUser && (
        <div className="w-6 h-6 shrink-0 bg-primary/20 border border-primary/30 flex items-center justify-center mt-1">
          <Bot size={12} className="text-primary" />
        </div>
      )}
      <div
        className={`max-w-[75%] px-3 py-2 text-sm font-mono whitespace-pre-wrap leading-relaxed ${
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-card border border-border text-foreground"
        } ${msg.pending ? "opacity-70" : ""}`}
      >
        {msg.content || (msg.pending ? <span className="animate-pulse">...</span> : "")}
      </div>
      {isUser && (
        <div className="w-6 h-6 shrink-0 bg-muted border border-border flex items-center justify-center mt-1">
          <User size={12} className="text-muted-foreground" />
        </div>
      )}
    </div>
  );
}

export default function Chat() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const preselectedModel = params.get("model") || "";

  const { status } = useConnection();

  const { data: modelsData } = useQuery({
    queryKey: ["models"],
    queryFn: fetchModels,
    retry: false,
    enabled: status === "connected",
  });

  const models = modelsData?.data ?? [];
  const [selectedModel, setSelectedModel] = useState(preselectedModel);
  const [systemPrompt, setSystemPrompt] = useState("You are a helpful assistant.");
  const [showConfig, setShowConfig] = useState(false);
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(2048);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<MessageDisplay[]>([]);
  const [streaming, setStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!selectedModel && models.length > 0) {
      setSelectedModel(models[0].id);
    }
  }, [models, selectedModel]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const stop = () => {
    abortRef.current?.abort();
    setStreaming(false);
  };

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || !selectedModel || streaming) return;

    const userMsg: MessageDisplay = {
      id: Date.now().toString(),
      role: "user",
      content: text,
    };
    const assistantId = (Date.now() + 1).toString();
    const assistantMsg: MessageDisplay = {
      id: assistantId,
      role: "assistant",
      content: "",
      pending: true,
    };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setInput("");
    setStreaming(true);

    const history: ChatMessage[] = [
      { role: "system", content: systemPrompt },
      ...messages.map((m) => ({ role: m.role, content: m.content })),
      { role: "user", content: text },
    ];

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      let accumulated = "";
      for await (const chunk of streamChatCompletion(
        { model: selectedModel, messages: history, temperature, max_tokens: maxTokens, stream: true },
        controller.signal
      )) {
        accumulated += chunk;
        const captured = accumulated;
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantId ? { ...m, content: captured, pending: false } : m))
        );
      }
      setMessages((prev) =>
        prev.map((m) => (m.id === assistantId ? { ...m, pending: false } : m))
      );
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") {
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantId ? { ...m, content: m.content + " [stopped]", pending: false } : m))
        );
      } else {
        const errMsg = err instanceof Error ? err.message : String(err);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, content: `Error: ${errMsg}`, pending: false }
              : m
          )
        );
      }
    } finally {
      setStreaming(false);
    }
  }, [input, selectedModel, streaming, messages, systemPrompt, temperature, maxTokens]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-border flex items-center gap-3 shrink-0">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <label className="text-xs text-muted-foreground shrink-0">Model</label>
          <div className="relative flex-1 max-w-xs">
            <select
              data-testid="select-model"
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="w-full appearance-none bg-muted border border-border px-3 py-1.5 text-xs font-mono pr-7 focus:outline-none focus:ring-1 focus:ring-ring"
              disabled={models.length === 0}
            >
              {models.length === 0 && (
                <option value="">No models available</option>
              )}
              {models.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.id}
                </option>
              ))}
            </select>
            <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            data-testid="button-config"
            onClick={() => setShowConfig((v) => !v)}
            className={`p-1.5 text-xs border border-border hover:bg-muted/50 transition-colors ${showConfig ? "bg-muted/50 text-foreground" : "text-muted-foreground"}`}
            title="Configure"
          >
            <Settings2 size={14} />
          </button>
          <button
            data-testid="button-clear-chat"
            onClick={() => setMessages([])}
            className="p-1.5 text-xs border border-border text-muted-foreground hover:bg-muted/50 transition-colors"
            title="Clear conversation"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {showConfig && (
        <div className="px-4 py-3 border-b border-border bg-muted/20 space-y-3" data-testid="config-panel">
          <div>
            <label className="text-xs text-muted-foreground block mb-1">System Prompt</label>
            <textarea
              data-testid="input-system-prompt"
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              rows={2}
              className="w-full bg-background border border-border px-3 py-2 text-xs font-mono resize-none focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <div className="flex gap-6">
            <div className="flex items-center gap-3">
              <label className="text-xs text-muted-foreground">Temp</label>
              <input
                data-testid="input-temperature"
                type="number"
                min={0}
                max={2}
                step={0.1}
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                className="w-16 bg-background border border-border px-2 py-1 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            <div className="flex items-center gap-3">
              <label className="text-xs text-muted-foreground">Max tokens</label>
              <input
                data-testid="input-max-tokens"
                type="number"
                min={128}
                max={32768}
                step={128}
                value={maxTokens}
                onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                className="w-20 bg-background border border-border px-2 py-1 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
          </div>
        </div>
      )}

      {status === "disconnected" && (
        <div className="m-4 border border-destructive/50 bg-destructive/10 p-3 flex items-center gap-2 text-xs text-destructive" data-testid="chat-offline">
          <WifiOff size={13} />
          LM Studio is offline. Start the server and reconnect.
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4" data-testid="messages-container">
        {messages.length === 0 && (
          <div className="h-full flex items-center justify-center text-center" data-testid="chat-empty">
            <div>
              <div className="text-muted-foreground text-sm">No messages yet</div>
              <div className="text-xs text-muted-foreground mt-1">
                {selectedModel ? `Chatting with ${selectedModel}` : "Select a model above to start"}
              </div>
            </div>
          </div>
        )}
        {messages.map((msg) => (
          <MessageBubble key={msg.id} msg={msg} />
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="px-4 py-3 border-t border-border shrink-0">
        <div className="flex gap-2 items-end">
          <textarea
            ref={textareaRef}
            data-testid="input-message"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={selectedModel ? "Send a message... (Enter to send, Shift+Enter for newline)" : "Select a model first"}
            disabled={!selectedModel || streaming}
            rows={2}
            className="flex-1 bg-background border border-border px-3 py-2 text-sm font-mono resize-none focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
          />
          {streaming ? (
            <button
              data-testid="button-stop"
              onClick={stop}
              className="px-3 py-2 bg-destructive text-destructive-foreground hover:opacity-90 transition-opacity shrink-0"
              title="Stop generation"
            >
              <Square size={14} />
            </button>
          ) : (
            <button
              data-testid="button-send"
              onClick={send}
              disabled={!input.trim() || !selectedModel}
              className="px-3 py-2 bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
              title="Send message"
            >
              <Send size={14} />
            </button>
          )}
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-muted-foreground">
            {streaming ? "Generating response..." : messages.length > 0 ? `${messages.length} messages` : ""}
          </span>
          {messages.length > 0 && (
            <span className="text-xs text-muted-foreground">{messages.length} messages in context</span>
          )}
        </div>
      </div>
    </div>
  );
}

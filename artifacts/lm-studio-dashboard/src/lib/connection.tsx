import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { testConnection, getServerUrl } from "@/lib/lm-studio";

type ConnectionStatus = "connected" | "disconnected" | "checking";

interface ConnectionContextType {
  status: ConnectionStatus;
  serverUrl: string;
  recheck: () => void;
}

const ConnectionContext = createContext<ConnectionContextType>({
  status: "checking",
  serverUrl: "",
  recheck: () => {},
});

export function ConnectionProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<ConnectionStatus>("checking");
  const [serverUrl, setServerUrl] = useState(getServerUrl());

  const recheck = useCallback(() => {
    const url = getServerUrl();
    setServerUrl(url);
    setStatus("checking");
    testConnection().then((ok) => setStatus(ok ? "connected" : "disconnected"));
  }, []);

  useEffect(() => {
    recheck();
    const interval = setInterval(recheck, 15000);
    return () => clearInterval(interval);
  }, [recheck]);

  return (
    <ConnectionContext.Provider value={{ status, serverUrl, recheck }}>
      {children}
    </ConnectionContext.Provider>
  );
}

export function useConnection() {
  return useContext(ConnectionContext);
}

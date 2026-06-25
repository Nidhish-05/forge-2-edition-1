import React, { useEffect } from "react";
import { useAuthStore } from "../store/authStore";
import Dashboard from "../pages/Dashboard";
import { Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "../components/ui/button";

export function AppRoutes() {
  const { isAuthenticated, isLoading, checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-3">
        <div className="relative">
          <div className="h-12 w-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="h-2 w-2 rounded-full bg-primary animate-ping" />
          </div>
        </div>
        <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Preparing Workspace...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full rounded-2xl border border-destructive/20 bg-card/40 p-6 text-center space-y-4 backdrop-blur-md">
          <AlertCircle className="h-10 w-10 text-destructive mx-auto" />
          <h2 className="text-lg font-bold text-foreground">Workspace Initialization Failed</h2>
          <p className="text-xs text-muted-foreground">
            We couldn't connect to the backend server. Please make sure the Laravel backend is running.
          </p>
          <Button 
            onClick={() => checkAuth()} 
            className="w-full rounded-xl border border-primary bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground font-bold"
          >
            <RefreshCw className="mr-2 h-4 w-4" /> Retry Connection
          </Button>
        </div>
      </div>
    );
  }

  return <Dashboard />;
}

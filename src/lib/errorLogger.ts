import { supabase } from "@/integrations/supabase/client";

interface ErrorLogData {
  message: string;
  stack?: string;
  componentStack?: string;
  errorId: string;
  timestamp: string;
  userAgent: string;
  url: string;
}

class ErrorLogger {
  private async logToSupabase(data: ErrorLogData) {
    try {
      // Log to console for immediate visibility
      console.log('🔴 Error logged:', data);
      
      // Try edge function but don't fail if it's not available
      try {
        const { error } = await supabase.functions.invoke("log-error", {
          body: data,
        });
        
        if (error) {
          console.warn("Edge function not available for error logging:", error.message);
        }
      } catch (edgeError) {
        console.warn("Edge function not available for error logging");
      }
    } catch (error) {
      console.error("Error logging to Supabase:", error);
    }
  }

  private generateErrorId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  async logError(error: Error, componentStack?: string) {
    const errorId = this.generateErrorId();
    const timestamp = new Date().toISOString();
    
    const errorData: ErrorLogData = {
      message: error.message,
      stack: error.stack,
      componentStack,
      errorId,
      timestamp,
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    // Log to console immediately
    console.error("🔴 APPLICATION ERROR:", {
      errorId,
      message: error.message,
      url: window.location.href,
      timestamp,
      stack: error.stack,
      componentStack,
    });

    // Log to Supabase asynchronously
    this.logToSupabase(errorData);

    return errorId;
  }

  async logCustomError(message: string, details?: any) {
    const errorId = this.generateErrorId();
    const timestamp = new Date().toISOString();
    
    const errorData: ErrorLogData = {
      message,
      stack: JSON.stringify(details, null, 2),
      errorId,
      timestamp,
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    console.error("🔴 CUSTOM ERROR:", {
      errorId,
      message,
      details,
      url: window.location.href,
      timestamp,
    });

    this.logToSupabase(errorData);
    return errorId;
  }
}

export const errorLogger = new ErrorLogger();
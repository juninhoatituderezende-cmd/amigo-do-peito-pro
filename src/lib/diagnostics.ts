import { supabase } from "@/integrations/supabase/client";
import { errorLogger } from "./errorLogger";
import { activityLogger } from "./activityLogger";

interface DiagnosticData {
  component: string;
  action: string;
  details?: any;
  timestamp: string;
}

class DiagnosticsManager {
  private isDebugMode = true;

  constructor() {
    console.log("🔧 DIAGNOSTICS INITIALIZED - Debug Mode:", this.isDebugMode);
  }

  log(component: string, action: string, details?: any) {
    const timestamp = new Date().toISOString();
    
    if (this.isDebugMode) {
      console.log(`🔍 [${component}] ${action}`, {
        timestamp,
        details,
      });
    }
  }

  async logError(component: string, error: Error | string, details?: any) {
    const errorMessage = typeof error === 'string' ? error : error.message;
    const timestamp = new Date().toISOString();
    
    console.error(`🔴 [${component}] ERROR: ${errorMessage}`, {
      timestamp,
      details,
      stack: typeof error === 'object' ? error.stack : undefined,
    });

    if (typeof error === 'object') {
      await errorLogger.logError(error);
    } else {
      await errorLogger.logCustomError(errorMessage, { component, details });
    }
  }

  async testSupabaseConnection() {
    try {
      this.log("SUPABASE", "Testing connection...");
      
      const { data, error } = await supabase.from("profiles").select("count", { count: "exact", head: true });
      
      if (error) {
        await this.logError("SUPABASE", `Connection failed: ${error.message}`, error);
        return false;
      }
      
      this.log("SUPABASE", "Connection successful", { count: data });
      return true;
    } catch (error) {
      await this.logError("SUPABASE", error as Error);
      return false;
    }
  }

  async testTableAccess(tableName: string) {
    try {
      this.log("DATABASE", `Testing table access: ${tableName}`);
      
      // Check if table name is valid - using actual table names from database
      const validTables = [
        "profiles", 
        "products", 
        "plan_groups", 
        "credit_transactions", 
        "notification_triggers",
        "user_credits",
        "marketplace_sales",
        "withdrawal_requests"
      ];
      
      if (!validTables.includes(tableName)) {
        this.log("DATABASE", `Table ${tableName} not in valid tables list`);
        return false;
      }
      
      const { data, error } = await supabase
        .from(tableName as any)
        .select("count", { count: "exact", head: true });
      
      if (error) {
        await this.logError("DATABASE", `Table ${tableName} access failed: ${error.message}`, error);
        return false;
      }
      
      this.log("DATABASE", `Table ${tableName} accessible`, { count: data });
      return true;
    } catch (error) {
      await this.logError("DATABASE", error as Error, { tableName });
      return false;
    }
  }

  async runDiagnostics() {
    console.log("🚀 RUNNING COMPREHENSIVE DIAGNOSTICS...");
    
    const results = {
      supabaseConnection: false,
      tableAccess: {} as Record<string, boolean>,
      timestamp: new Date().toISOString(),
    };

    // Test Supabase connection
    results.supabaseConnection = await this.testSupabaseConnection();

    // Test critical tables - using actual database table names
    const criticalTables = ["profiles", "products", "plan_groups", "credit_transactions", "user_credits"];
    
    for (const table of criticalTables) {
      results.tableAccess[table] = await this.testTableAccess(table);
    }

    console.log("📊 DIAGNOSTICS COMPLETE:", results);
    
    await activityLogger.log({
      action: "diagnostics_run",
      resource_type: "system",
      details: results,
    });

    return results;
  }

  enableDebugMode() {
    this.isDebugMode = true;
    console.log("🔧 DEBUG MODE ENABLED");
  }

  disableDebugMode() {
    this.isDebugMode = false;
    console.log("🔧 DEBUG MODE DISABLED");
  }
}

export const diagnostics = new DiagnosticsManager();

// Auto-run diagnostics on app load
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    setTimeout(() => {
      diagnostics.runDiagnostics();
    }, 2000);
  });
}
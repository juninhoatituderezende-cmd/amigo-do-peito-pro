import { supabase } from "@/integrations/supabase/client";

interface LogError {
  error_id: string;
  message: string;
  stack?: string;
  component_stack?: string;
  timestamp?: Date;
  user_agent?: string;
  url?: string;
  client_ip?: string;
  user_id?: string;
}

interface ActivityLog {
  user_id?: string;
  action: string;
  resource_type?: string;
  resource_id?: string;
  details?: any;
  ip_address?: string;
  user_agent?: string;
}

interface PerformanceMetric {
  metric_name: string;
  metric_value: number;
  details?: any;
}

class Logger {
  private getUserId(): string | null {
    try {
      const user = supabase.auth.getUser();
      return user ? 'current_user' : null;
    } catch {
      return null;
    }
  }

  private getClientInfo() {
    return {
      user_agent: navigator.userAgent,
      url: window.location.href,
      timestamp: new Date()
    };
  }

  async logError(error: Error, component?: string, additionalData?: any): Promise<void> {
    try {
      const clientInfo = this.getClientInfo();
      const errorData: LogError = {
        error_id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        message: error.message,
        stack: error.stack,
        component_stack: component,
        user_id: this.getUserId(),
        ...clientInfo
      };

      console.error('🔍 DIAGNOSTIC ERROR LOG:', errorData);

      const { error: dbError } = await supabase
        .from('error_logs')
        .insert([errorData]);

      if (dbError) {
        console.error('Failed to log error to database:', dbError);
      }
    } catch (logError) {
      console.error('Critical: Failed to log error:', logError);
    }
  }

  async logActivity(action: string, details?: any): Promise<void> {
    try {
      const clientInfo = this.getClientInfo();
      const activityData: ActivityLog = {
        user_id: this.getUserId(),
        action,
        details,
        ip_address: 'client',
        ...clientInfo
      };

      console.log('🔍 DIAGNOSTIC ACTIVITY LOG:', activityData);

      const { error } = await supabase
        .from('activity_logs')
        .insert([activityData]);

      if (error) {
        console.error('Failed to log activity to database:', error);
      }
    } catch (logError) {
      console.error('Failed to log activity:', logError);
    }
  }

  async logPerformance(metricName: string, value: number, details?: any): Promise<void> {
    try {
      const metricData: PerformanceMetric = {
        metric_name: metricName,
        metric_value: value,
        details
      };

      console.log('🔍 DIAGNOSTIC PERFORMANCE LOG:', metricData);

      const { error } = await supabase
        .from('performance_metrics')
        .insert([metricData]);

      if (error) {
        console.error('Failed to log performance metric to database:', error);
      }
    } catch (logError) {
      console.error('Failed to log performance metric:', logError);
    }
  }

  // Método específico para diagnosticar conexão com Supabase
  async testSupabaseConnection(): Promise<boolean> {
    try {
      console.log('🔍 TESTING SUPABASE CONNECTION...');
      
      const startTime = performance.now();
      const { data, error } = await supabase
        .from('users')
        .select('count(*)')
        .limit(1);
      
      const endTime = performance.now();
      const duration = endTime - startTime;

      if (error) {
        console.error('🔍 SUPABASE CONNECTION FAILED:', error);
        await this.logError(new Error(`Supabase connection failed: ${error.message}`), 'SupabaseTest');
        return false;
      }

      console.log('🔍 SUPABASE CONNECTION SUCCESS:', data);
      console.log('🔍 SUPABASE RESPONSE TIME:', `${duration.toFixed(2)}ms`);
      
      await this.logPerformance('supabase_connection_test', duration, { 
        success: true, 
        response: data 
      });
      
      return true;
    } catch (error) {
      console.error('🔍 SUPABASE CONNECTION CRITICAL ERROR:', error);
      await this.logError(error as Error, 'SupabaseConnectionTest');
      return false;
    }
  }

  // Método para diagnosticar queries específicas
  async testQuery(tableName: string, query: any): Promise<any> {
    try {
      console.log(`🔍 TESTING QUERY ON ${tableName}:`, query);
      
      const startTime = performance.now();
      const result = await supabase
        .from(tableName)
        .select(query);
      
      const endTime = performance.now();
      const duration = endTime - startTime;

      console.log(`🔍 QUERY RESULT FOR ${tableName}:`, result);
      console.log(`🔍 QUERY DURATION:`, `${duration.toFixed(2)}ms`);

      await this.logPerformance(`query_${tableName}`, duration, {
        query,
        success: !result.error,
        error: result.error?.message,
        count: result.data?.length
      });

      return result;
    } catch (error) {
      console.error(`🔍 QUERY ERROR ON ${tableName}:`, error);
      await this.logError(error as Error, `Query_${tableName}`);
      throw error;
    }
  }
}

export const logger = new Logger();

// Capturar erros globais
window.addEventListener('error', (event) => {
  logger.logError(new Error(event.message), 'GlobalErrorHandler', {
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno
  });
});

window.addEventListener('unhandledrejection', (event) => {
  logger.logError(new Error(event.reason), 'UnhandledPromiseRejection');
});

export default logger;
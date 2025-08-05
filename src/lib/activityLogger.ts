import { supabase } from "@/lib/supabase";

interface ActivityLogData {
  action: string;
  resource_type?: string;
  resource_id?: string;
  details?: Record<string, any>;
}

class ActivityLogger {
  private async getUserInfo() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      return {
        user_id: user?.id || null,
        ip_address: await this.getClientIP(),
        user_agent: navigator.userAgent,
      };
    } catch (error) {
      console.error("Failed to get user info:", error);
      return {
        user_id: null,
        ip_address: "unknown",
        user_agent: navigator.userAgent,
      };
    }
  }

  private async getClientIP(): Promise<string> {
    try {
      const response = await fetch("https://api.ipify.org?format=json");
      const data = await response.json();
      return data.ip || "unknown";
    } catch {
      return "unknown";
    }
  }

  async log(data: ActivityLogData) {
    try {
      const userInfo = await this.getUserInfo();
      
      const { error } = await supabase.functions.invoke("log-activity", {
        body: {
          ...data,
          ...userInfo,
          timestamp: new Date().toISOString(),
        },
      });

      if (error) {
        console.error("Failed to log activity:", error);
      }
    } catch (error) {
      console.error("Activity logging error:", error);
    }
  }

  // Convenience methods for common actions
  async logLogin() {
    await this.log({
      action: "user_login",
      resource_type: "auth",
    });
  }

  async logLogout() {
    await this.log({
      action: "user_logout",
      resource_type: "auth",
    });
  }

  async logPlanCreation(planId: string, planDetails: any) {
    await this.log({
      action: "plan_created",
      resource_type: "plan",
      resource_id: planId,
      details: planDetails,
    });
  }

  async logPayment(paymentId: string, amount: number, method: string) {
    await this.log({
      action: "payment_processed",
      resource_type: "payment",
      resource_id: paymentId,
      details: { amount, method },
    });
  }

  async logFileUpload(fileName: string, fileSize: number, fileType: string) {
    await this.log({
      action: "file_uploaded",
      resource_type: "file",
      details: { fileName, fileSize, fileType },
    });
  }

  async logAdminAction(action: string, resourceType: string, resourceId?: string, details?: any) {
    await this.log({
      action: `admin_${action}`,
      resource_type: resourceType,
      resource_id: resourceId,
      details,
    });
  }

  async logContemplation(planId: string, userId: string, approved: boolean) {
    await this.log({
      action: approved ? "contemplation_approved" : "contemplation_rejected",
      resource_type: "contemplation",
      resource_id: planId,
      details: { userId, approved },
    });
  }

  async logInfluencerRegistration(influencerId: string, referralCode: string) {
    await this.log({
      action: "influencer_registered",
      resource_type: "influencer",
      resource_id: influencerId,
      details: { referralCode },
    });
  }

  async logProfessionalService(serviceId: string, clientId: string, completed: boolean) {
    await this.log({
      action: completed ? "service_completed" : "service_started",
      resource_type: "service",
      resource_id: serviceId,
      details: { clientId, completed },
    });
  }
}

export const activityLogger = new ActivityLogger();
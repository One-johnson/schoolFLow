import { v } from 'convex/values';
import { internalMutation, mutation } from './_generated/server';
import type { MutationCtx } from './_generated/server';

/**
 * Core trial management logic
 * Extracted as a helper function to be reused by both cron and manual triggers
 */
async function checkTrialsLogic(ctx: MutationCtx) {
  const now = new Date();
  const nowISO = now.toISOString();
  
  // Grace period: 3 days after trial expiry before suspension
  const GRACE_PERIOD_DAYS = 3;
  
  // Get all active trial subscriptions
  const activeTrials = await ctx.db
    .query('subscriptionRequests')
    .filter((q) => 
      q.and(
        q.eq(q.field('isTrial'), true),
        q.eq(q.field('status'), 'approved')
      )
    )
    .collect();
  
  let warningsCount = 0;
  let expiryNoticesCount = 0;
  let suspensionsCount = 0;
  
  // Get all super admins for notifications
  const superAdmins = await ctx.db.query('superAdmins').collect();
  
  for (const trial of activeTrials) {
    if (!trial.trialEndDate) continue;
    
    const trialEndDate = new Date(trial.trialEndDate);
    const daysUntilExpiry = Math.ceil((trialEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    // Get the school admin
    const admin = await ctx.db
      .query('schoolAdmins')
      .filter((q) => q.eq(q.field('email'), trial.schoolAdminEmail))
      .first();
    
    if (!admin) continue;
    
    // Get the school associated with this admin
    const school = await ctx.db
      .query('schools')
      .filter((q) => q.eq(q.field('adminId'), admin._id))
      .first();
    
    // Check for warnings (7, 3, 1 days before expiry)
    if (daysUntilExpiry === 7 || daysUntilExpiry === 3 || daysUntilExpiry === 1) {
      // Send warning notification to school admin
      await ctx.db.insert('notifications', {
        title: `Trial Expiring Soon - ${daysUntilExpiry} Day${daysUntilExpiry === 1 ? '' : 's'} Left`,
        message: `Your 30-day trial will expire in ${daysUntilExpiry} day${daysUntilExpiry === 1 ? '' : 's'}. Please purchase a subscription to continue using SchoolFlow without interruption.`,
        type: 'warning',
        timestamp: nowISO,
        read: false,
        recipientId: admin._id,
        recipientRole: 'school_admin',
        actionUrl: '/school-admin/subscription',
      });
      
      // Notify super admins
      for (const superAdmin of superAdmins) {
        await ctx.db.insert('notifications', {
          title: `Trial Expiring Soon - ${admin.name}`,
          message: `School admin "${admin.name}" (${admin.email}) has ${daysUntilExpiry} day${daysUntilExpiry === 1 ? '' : 's'} left on their trial.`,
          type: 'info',
          timestamp: nowISO,
          read: false,
          recipientId: superAdmin._id,
          recipientRole: 'super_admin',
        });
      }
      
      warningsCount++;
    }
    
    // Check if trial just expired (between 0 and -GRACE_PERIOD_DAYS)
    else if (daysUntilExpiry < 0 && daysUntilExpiry >= -GRACE_PERIOD_DAYS) {
      // Trial expired but still in grace period
      const daysIntoGracePeriod = Math.abs(daysUntilExpiry);
      const daysLeftInGracePeriod = GRACE_PERIOD_DAYS - daysIntoGracePeriod;
      
      // Only send notification on the first day of grace period
      if (daysIntoGracePeriod === 0) {
        // Notify school admin about expiry and grace period
        await ctx.db.insert('notifications', {
          title: 'Trial Expired - Grace Period Active',
          message: `Your 30-day trial has expired. You have a ${GRACE_PERIOD_DAYS}-day grace period to purchase a subscription before your account is suspended.`,
          type: 'error',
          timestamp: nowISO,
          read: false,
          recipientId: admin._id,
          recipientRole: 'school_admin',
          actionUrl: '/school-admin/subscription',
        });
        
        // Notify super admins
        for (const superAdmin of superAdmins) {
          await ctx.db.insert('notifications', {
            title: `Trial Expired - ${admin.name}`,
            message: `School admin "${admin.name}" (${admin.email}) trial has expired. Grace period: ${GRACE_PERIOD_DAYS} days.`,
            type: 'warning',
            timestamp: nowISO,
            read: false,
            recipientId: superAdmin._id,
            recipientRole: 'super_admin',
          });
        }
        
        expiryNoticesCount++;
      }
      
      // Send daily reminders during grace period
      else if (daysLeftInGracePeriod > 0) {
        await ctx.db.insert('notifications', {
          title: `Grace Period Ending - ${daysLeftInGracePeriod} Day${daysLeftInGracePeriod === 1 ? '' : 's'} Left`,
          message: `You have ${daysLeftInGracePeriod} day${daysLeftInGracePeriod === 1 ? '' : 's'} left before your account is suspended. Please purchase a subscription to maintain access.`,
          type: 'error',
          timestamp: nowISO,
          read: false,
          recipientId: admin._id,
          recipientRole: 'school_admin',
          actionUrl: '/school-admin/subscription',
        });
      }
    }
    
    // Check if grace period has ended (more than GRACE_PERIOD_DAYS past expiry)
    else if (daysUntilExpiry < -GRACE_PERIOD_DAYS) {
      // Suspend the subscription request
      await ctx.db.patch(trial._id, {
        status: 'expired',
      });
      
      // Suspend the school admin
      await ctx.db.patch(admin._id, {
        status: 'suspended',
        hasActiveSubscription: false,
      });
      
      // Suspend the school if it exists
      if (school) {
        await ctx.db.patch(school._id, {
          status: 'suspended',
        });
      }
      
      // Notify school admin about suspension
      await ctx.db.insert('notifications', {
        title: 'Account Suspended - Trial Expired',
        message: `Your account has been suspended because your trial expired and you did not purchase a subscription. Please contact support or purchase a subscription to reactivate your account.`,
        type: 'error',
        timestamp: nowISO,
        read: false,
        recipientId: admin._id,
        recipientRole: 'school_admin',
        actionUrl: '/school-admin/subscription',
      });
      
      // Notify all super admins about the suspension
      for (const superAdmin of superAdmins) {
        await ctx.db.insert('notifications', {
          title: `School Suspended - Trial Expired`,
          message: `School admin "${admin.name}" (${admin.email}) has been automatically suspended after trial expiry. ${school ? `School "${school.name}" also suspended.` : ''}`,
          type: 'error',
          timestamp: nowISO,
          read: false,
          recipientId: superAdmin._id,
          recipientRole: 'super_admin',
        });
      }
      
      suspensionsCount++;
    }
  }
  
  // Log summary of actions taken
  console.log('Trial Management Summary:', {
    timestamp: nowISO,
    trialsChecked: activeTrials.length,
    warningsSent: warningsCount,
    expiryNoticesSent: expiryNoticesCount,
    accountsSuspended: suspensionsCount,
  });
  
  return {
    trialsChecked: activeTrials.length,
    warningsSent: warningsCount,
    expiryNoticesSent: expiryNoticesCount,
    accountsSuspended: suspensionsCount,
  };
}

/**
 * Main trial management function that runs daily via cron
 * Checks for:
 * 1. Trials expiring in 7, 3, 1 days (send warnings)
 * 2. Trials that just expired (send expiry notice, start grace period)
 * 3. Trials past grace period (suspend school and admin)
 */
export const checkAllTrials = internalMutation({
  args: {},
  handler: async (ctx) => {
    return await checkTrialsLogic(ctx);
  },
});

/**
 * Manual trigger for testing trial management
 * Can be called from the UI by Super Admins
 */
export const manualTrialCheck = mutation({
  args: {
    triggeredBy: v.string(), // userId of the super admin triggering the check
  },
  handler: async (ctx, args) => {
    const startTime = Date.now();
    
    // Run the trial check logic
    const results = await checkTrialsLogic(ctx);
    
    const endTime = Date.now();
    const executionTime = (endTime - startTime) / 1000; // in seconds
    
    // Create audit log entry for manual trigger
    await ctx.db.insert('auditLogs', {
      action: 'manual_trial_check',
      userId: args.triggeredBy,
      timestamp: new Date().toISOString(),
      details: JSON.stringify({
        ...results,
        executionTime,
        triggerType: 'manual',
      }),
      ipAddress: '0.0.0.0',
      userName: '',
      entity: '',
      entityId: ''
    });
    
    return {
      ...results,
      executionTime,
    };
  },
});

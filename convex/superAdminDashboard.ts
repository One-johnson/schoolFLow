import { query } from './_generated/server';

/** Single round-trip aggregates for the super admin home dashboard. */
export const getOverview = query({
  args: {},
  handler: async (ctx) => {
    const [
      ticketsOpen,
      ticketsInProgress,
      ticketsWaitingCustomer,
      subscriptionRequests,
      paymentProofsPending,
      schoolCreationPending,
      notifications,
    ] = await Promise.all([
      ctx.db.query('supportTickets').withIndex('by_status', (q) => q.eq('status', 'open')).collect(),
      ctx.db
        .query('supportTickets')
        .withIndex('by_status', (q) => q.eq('status', 'in_progress'))
        .collect(),
      ctx.db
        .query('supportTickets')
        .withIndex('by_status', (q) => q.eq('status', 'waiting_customer'))
        .collect(),
      ctx.db.query('subscriptionRequests').collect(),
      ctx.db
        .query('paymentProofs')
        .withIndex('by_status', (q) => q.eq('status', 'pending'))
        .collect(),
      ctx.db
        .query('schoolCreationRequests')
        .withIndex('by_status', (q) => q.eq('status', 'pending'))
        .collect(),
      ctx.db.query('notifications').collect(),
    ]);

    const activeTickets = [...ticketsOpen, ...ticketsInProgress, ...ticketsWaitingCustomer];
    const unassignedActive = activeTickets.filter((t) => !t.assignedToId).length;
    const urgentActive = activeTickets.filter((t) => t.priority === 'urgent').length;
    const highPriorityActive = activeTickets.filter((t) => t.priority === 'high').length;

    const subPendingPayment = subscriptionRequests.filter((s) => s.status === 'pending_payment').length;
    const subPendingApproval = subscriptionRequests.filter((s) => s.status === 'pending_approval').length;
    const trialPipeline = subscriptionRequests.filter(
      (s) =>
        s.isTrial && (s.status === 'pending_payment' || s.status === 'pending_approval')
    ).length;
    const subscriptionExpired = subscriptionRequests.filter((s) => s.status === 'expired').length;

    const superAdminNotifs = notifications.filter((n) => n.recipientRole === 'super_admin');
    const notificationsUnread = superAdminNotifs.filter((n) => !n.read).length;
    const notificationsRecent = [...superAdminNotifs]
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
      .slice(0, 5)
      .map((n) => ({
        _id: n._id,
        title: n.title,
        type: n.type,
        read: n.read,
        timestamp: n.timestamp,
        actionUrl: n.actionUrl,
      }));

    const cutoffIso = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const recentFailedLogins = await ctx.db
      .query('loginHistory')
      .filter((q) =>
        q.and(q.eq(q.field('status'), 'failed'), q.gte(q.field('loginTime'), cutoffIso))
      )
      .collect();

    return {
      support: {
        open: ticketsOpen.length,
        inProgress: ticketsInProgress.length,
        waitingCustomer: ticketsWaitingCustomer.length,
        activeTotal: activeTickets.length,
        unassignedActive,
        urgentActive,
        highPriorityActive,
      },
      pipeline: {
        subscriptionPendingPayment: subPendingPayment,
        subscriptionPendingApproval: subPendingApproval,
        trialRequests: trialPipeline,
        subscriptionExpired,
        paymentProofsPending: paymentProofsPending.length,
        schoolCreationPending: schoolCreationPending.length,
      },
      notifications: {
        unread: notificationsUnread,
        recent: notificationsRecent,
      },
      security: {
        failedLogins24h: recentFailedLogins.length,
      },
    };
  },
});

/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as auditLogs from "../auditLogs.js";
import type * as auth from "../auth.js";
import type * as classes from "../classes.js";
import type * as crons from "../crons.js";
import type * as loginHistory from "../loginHistory.js";
import type * as notifications from "../notifications.js";
import type * as paymentProofs from "../paymentProofs.js";
import type * as platformSettings from "../platformSettings.js";
import type * as reports from "../reports.js";
import type * as schoolAdmins from "../schoolAdmins.js";
import type * as schoolCreationRequests from "../schoolCreationRequests.js";
import type * as schools from "../schools.js";
import type * as securityAlerts from "../securityAlerts.js";
import type * as sessions from "../sessions.js";
import type * as subjectAssignments from "../subjectAssignments.js";
import type * as subjects from "../subjects.js";
import type * as subscriptionPlans from "../subscriptionPlans.js";
import type * as subscriptionRequests from "../subscriptionRequests.js";
import type * as subscriptions from "../subscriptions.js";
import type * as superAdmins from "../superAdmins.js";
import type * as support from "../support.js";
import type * as supportTickets from "../supportTickets.js";
import type * as teachers from "../teachers.js";
import type * as trialManagement from "../trialManagement.js";
import type * as userSettings from "../userSettings.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  auditLogs: typeof auditLogs;
  auth: typeof auth;
  classes: typeof classes;
  crons: typeof crons;
  loginHistory: typeof loginHistory;
  notifications: typeof notifications;
  paymentProofs: typeof paymentProofs;
  platformSettings: typeof platformSettings;
  reports: typeof reports;
  schoolAdmins: typeof schoolAdmins;
  schoolCreationRequests: typeof schoolCreationRequests;
  schools: typeof schools;
  securityAlerts: typeof securityAlerts;
  sessions: typeof sessions;
  subjectAssignments: typeof subjectAssignments;
  subjects: typeof subjects;
  subscriptionPlans: typeof subscriptionPlans;
  subscriptionRequests: typeof subscriptionRequests;
  subscriptions: typeof subscriptions;
  superAdmins: typeof superAdmins;
  support: typeof support;
  supportTickets: typeof supportTickets;
  teachers: typeof teachers;
  trialManagement: typeof trialManagement;
  userSettings: typeof userSettings;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};

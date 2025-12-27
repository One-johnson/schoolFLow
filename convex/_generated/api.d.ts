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
import type * as notifications from "../notifications.js";
import type * as paymentProofs from "../paymentProofs.js";
import type * as reports from "../reports.js";
import type * as schoolAdmins from "../schoolAdmins.js";
import type * as schoolCreationRequests from "../schoolCreationRequests.js";
import type * as schools from "../schools.js";
import type * as subscriptionPlans from "../subscriptionPlans.js";
import type * as subscriptionRequests from "../subscriptionRequests.js";
import type * as subscriptions from "../subscriptions.js";
import type * as support from "../support.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  auditLogs: typeof auditLogs;
  auth: typeof auth;
  notifications: typeof notifications;
  paymentProofs: typeof paymentProofs;
  reports: typeof reports;
  schoolAdmins: typeof schoolAdmins;
  schoolCreationRequests: typeof schoolCreationRequests;
  schools: typeof schools;
  subscriptionPlans: typeof subscriptionPlans;
  subscriptionRequests: typeof subscriptionRequests;
  subscriptions: typeof subscriptions;
  support: typeof support;
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

/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as auth from "../auth.js";
import type * as classes from "../classes.js";
import type * as dashboard from "../dashboard.js";
import type * as payments from "../payments.js";
import type * as platform from "../platform.js";
import type * as search from "../search.js";
import type * as sections from "../sections.js";
import type * as students from "../students.js";
import type * as subjects from "../subjects.js";
import type * as subscriptionPlans from "../subscriptionPlans.js";
import type * as subscriptions from "../subscriptions.js";
import type * as teachers from "../teachers.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  classes: typeof classes;
  dashboard: typeof dashboard;
  payments: typeof payments;
  platform: typeof platform;
  search: typeof search;
  sections: typeof sections;
  students: typeof students;
  subjects: typeof subjects;
  subscriptionPlans: typeof subscriptionPlans;
  subscriptions: typeof subscriptions;
  teachers: typeof teachers;
  users: typeof users;
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

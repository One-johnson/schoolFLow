/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as academicYears from "../academicYears.js";
import type * as announcements from "../announcements.js";
import type * as attendance from "../attendance.js";
import type * as auditLogs from "../auditLogs.js";
import type * as auth from "../auth.js";
import type * as bulkPayments from "../bulkPayments.js";
import type * as classes from "../classes.js";
import type * as crons from "../crons.js";
import type * as dashboard from "../dashboard.js";
import type * as eventNotifications from "../eventNotifications.js";
import type * as eventRSVPs from "../eventRSVPs.js";
import type * as events from "../events.js";
import type * as examAnalytics from "../examAnalytics.js";
import type * as exams from "../exams.js";
import type * as feeCategories from "../feeCategories.js";
import type * as feeDiscounts from "../feeDiscounts.js";
import type * as feePayments from "../feePayments.js";
import type * as feeReminders from "../feeReminders.js";
import type * as feeStructures from "../feeStructures.js";
import type * as gradeCalculator from "../gradeCalculator.js";
import type * as grading from "../grading.js";
import type * as loginHistory from "../loginHistory.js";
import type * as marks from "../marks.js";
import type * as messages from "../messages.js";
import type * as notifications from "../notifications.js";
import type * as paymentPlans from "../paymentPlans.js";
import type * as paymentProofs from "../paymentProofs.js";
import type * as photos from "../photos.js";
import type * as platformSettings from "../platformSettings.js";
import type * as reportCardReview from "../reportCardReview.js";
import type * as reportCards from "../reportCards.js";
import type * as reports from "../reports.js";
import type * as schoolAdmins from "../schoolAdmins.js";
import type * as schoolCreationRequests from "../schoolCreationRequests.js";
import type * as schools from "../schools.js";
import type * as securityAlerts from "../securityAlerts.js";
import type * as sessions from "../sessions.js";
import type * as students from "../students.js";
import type * as subjects from "../subjects.js";
import type * as subscriptionPlans from "../subscriptionPlans.js";
import type * as subscriptionRequests from "../subscriptionRequests.js";
import type * as subscriptions from "../subscriptions.js";
import type * as superAdmins from "../superAdmins.js";
import type * as support from "../support.js";
import type * as supportTickets from "../supportTickets.js";
import type * as teachers from "../teachers.js";
import type * as terms from "../terms.js";
import type * as timetableAssignments from "../timetableAssignments.js";
import type * as timetableConflicts from "../timetableConflicts.js";
import type * as timetableTemplates from "../timetableTemplates.js";
import type * as timetables from "../timetables.js";
import type * as trialManagement from "../trialManagement.js";
import type * as userSettings from "../userSettings.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  academicYears: typeof academicYears;
  announcements: typeof announcements;
  attendance: typeof attendance;
  auditLogs: typeof auditLogs;
  auth: typeof auth;
  bulkPayments: typeof bulkPayments;
  classes: typeof classes;
  crons: typeof crons;
  dashboard: typeof dashboard;
  eventNotifications: typeof eventNotifications;
  eventRSVPs: typeof eventRSVPs;
  events: typeof events;
  examAnalytics: typeof examAnalytics;
  exams: typeof exams;
  feeCategories: typeof feeCategories;
  feeDiscounts: typeof feeDiscounts;
  feePayments: typeof feePayments;
  feeReminders: typeof feeReminders;
  feeStructures: typeof feeStructures;
  gradeCalculator: typeof gradeCalculator;
  grading: typeof grading;
  loginHistory: typeof loginHistory;
  marks: typeof marks;
  messages: typeof messages;
  notifications: typeof notifications;
  paymentPlans: typeof paymentPlans;
  paymentProofs: typeof paymentProofs;
  photos: typeof photos;
  platformSettings: typeof platformSettings;
  reportCardReview: typeof reportCardReview;
  reportCards: typeof reportCards;
  reports: typeof reports;
  schoolAdmins: typeof schoolAdmins;
  schoolCreationRequests: typeof schoolCreationRequests;
  schools: typeof schools;
  securityAlerts: typeof securityAlerts;
  sessions: typeof sessions;
  students: typeof students;
  subjects: typeof subjects;
  subscriptionPlans: typeof subscriptionPlans;
  subscriptionRequests: typeof subscriptionRequests;
  subscriptions: typeof subscriptions;
  superAdmins: typeof superAdmins;
  support: typeof support;
  supportTickets: typeof supportTickets;
  teachers: typeof teachers;
  terms: typeof terms;
  timetableAssignments: typeof timetableAssignments;
  timetableConflicts: typeof timetableConflicts;
  timetableTemplates: typeof timetableTemplates;
  timetables: typeof timetables;
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

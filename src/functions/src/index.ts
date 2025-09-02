/* eslint-disable @typescript-eslint/no-explicit-any */
import {setGlobalOptions} from "firebase-functions/v2";
import {onValueDeleted} from "firebase-functions/v2/database";
import * as admin from "firebase-admin";

// Initialize the Admin SDK
admin.initializeApp();
const auth = admin.auth();

/**
 * Triggered when a student record is deleted from Realtime Database.
 * Deletes the corresponding Firebase Authentication user.
 */
export const onStudentDeleted = onValueDeleted(
  "/students/{studentId}",
  async (event) => {
    const studentId = event.params.studentId;
    console.log(
      `Student record deleted for ${studentId}. ` +
        "Deleting auth user and user record."
    );
    try {
      await auth.deleteUser(studentId);
      console.log(`✅ Auth user deleted: ${studentId}`);
    } catch (error) {
      console.error(`❌ Error deleting auth user ${studentId}:`, error);
    }
  }
);

/**
 * Triggered when a teacher record is deleted from Realtime Database.
 * Deletes the corresponding Firebase Authentication user.
 */
export const onTeacherDeleted = onValueDeleted(
  "/teachers/{teacherId}",
  async (event) => {
    const teacherId = event.params.teacherId;
    console.log(
      `Teacher record deleted for ${teacherId}. ` +
        "Deleting auth user and user record."
    );
    try {
      await auth.deleteUser(teacherId);
      console.log(`✅ Auth user deleted: ${teacherId}`);
    } catch (error) {
      console.error(`❌ Error deleting auth user ${teacherId}:`, error);
    }
  }
);
setGlobalOptions({maxInstances: 10});

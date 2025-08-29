
import {setGlobalOptions} from "firebase-functions/v2";
import {onValueDeleted} from "firebase-functions/v2/database";
import * as admin from "firebase-admin";

// Initialize the Admin SDK
admin.initializeApp();

/**
 * Triggered when a student record is deleted from the Realtime Database.
 * This function deletes the corresponding user from Firebase Authentication.
 */
export const onStudentDeleted = onValueDeleted(
  "/students/{studentId}",
  async (event) => {
    const studentId = event.params.studentId;
    console.log(`Deleting auth user for student: ${studentId}`);

    try {
      await admin.auth().deleteUser(studentId);
      console.log(`Successfully deleted auth user: ${studentId}`);
    } catch (error) {
      console.error(`Error deleting auth user ${studentId}:`, error);
    }
  },
);


/**
 * Triggered when a teacher record is deleted from the Realtime Database.
 * This function deletes the corresponding user from Firebase Authentication.
 */
export const onTeacherDeleted = onValueDeleted(
  "/teachers/{teacherId}",
  async (event) => {
    const teacherId = event.params.teacherId;
    console.log(`Deleting auth user for teacher: ${teacherId}`);

    try {
      await admin.auth().deleteUser(teacherId);
      console.log(`Successfully deleted auth user: ${teacherId}`);
    } catch (error) {
      console.error(`Error deleting auth user ${teacherId}:`, error);
    }
  },
);

setGlobalOptions({maxInstances: 10});

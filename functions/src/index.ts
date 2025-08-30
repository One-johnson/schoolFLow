/* eslint-disable @typescript-eslint/no-explicit-any */
import {setGlobalOptions} from "firebase-functions/v2";
import {onValueDeleted} from "firebase-functions/v2/database";
import {HttpsError, onCall} from "firebase-functions/v2/https";
import * as admin from "firebase-admin";

// Initialize the Admin SDK
admin.initializeApp();
const auth = admin.auth();
const db = admin.database();

/**
 * Creates a new student account and corresponding database records.
 * This function can only be called by an authenticated user with the 'admin' role.
 */
export const createStudent = onCall(async (request) => {
  if (request.auth?.token.role !== "admin") {
    throw new HttpsError("permission-denied", "You must be an admin to create students.");
  }
  const {email, password, ...studentData} = request.data;
  if (!email || !password || !studentData.name) {
    throw new HttpsError("invalid-argument", "Missing required fields: email, password, name.");
  }

  try {
    const userRecord = await auth.createUser({ email, password, displayName: studentData.name });
    await auth.setCustomUserClaims(userRecord.uid, { role: "student" });

    const studentRef = db.ref(`/students/${userRecord.uid}`);
    await studentRef.set({ id: userRecord.uid, email, ...studentData });
    
    const userDbRef = db.ref(`/users/${userRecord.uid}`);
    await userDbRef.set({ role: "student", email, name: studentData.name });
    
    console.log(`✅ Successfully created student: ${studentData.name} (${userRecord.uid})`);
    return { success: true, uid: userRecord.uid };

  } catch (error: any) {
    console.error("Error creating student:", error);
    throw new HttpsError("internal", error.message);
  }
});

/**
 * Creates a new teacher account and corresponding database records.
 * This function can only be called by an authenticated user with the 'admin' role.
 */
export const createTeacher = onCall(async (request) => {
  if (request.auth?.token.role !== "admin") {
    throw new HttpsError("permission-denied", "You must be an admin to create teachers.");
  }
  const {email, password, ...teacherData} = request.data;
  if (!email || !password || !teacherData.name) {
    throw new HttpsError("invalid-argument", "Missing required fields: email, password, name.");
  }

  try {
    const userRecord = await auth.createUser({ email, password, displayName: teacherData.name });
    await auth.setCustomUserClaims(userRecord.uid, { role: "teacher" });

    const teacherRef = db.ref(`/teachers/${userRecord.uid}`);
    await teacherRef.set({ id: userRecord.uid, email, ...teacherData });
    
    const userDbRef = db.ref(`/users/${userRecord.uid}`);
    await userDbRef.set({ role: "teacher", email, name: teacherData.name });

    console.log(`✅ Successfully created teacher: ${teacherData.name} (${userRecord.uid})`);
    return { success: true, uid: userRecord.uid };

  } catch (error: any) {
    console.error("Error creating teacher:", error);
    throw new HttpsError("internal", error.message);
  }
});


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

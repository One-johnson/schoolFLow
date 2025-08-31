/* eslint-disable @typescript-eslint/no-explicit-any */
import {setGlobalOptions} from "firebase-functions/v2";
import {onValueDeleted} from "firebase-functions/v2/database";
import {HttpsError, onCall} from "firebase-functions/v2/https";
import * as admin from "firebase-admin";

// Initialize the Admin SDK
admin.initializeApp();
const auth = admin.auth();
const db = admin.database();

export const createStudent = onCall(async (request) => {
  const uid = request.auth?.uid;
  if (!uid) {
    throw new HttpsError("unauthenticated", "You must be logged in.");
  }

  // 🔍 Fetch role from Realtime Database
  const roleSnap = await db.ref(`/users/${uid}/role`).get();
  const role = roleSnap.val();

  if (role !== "admin") {
    throw new HttpsError(
      "permission-denied",
      "You must be an admin to create students."
    );
  }

  const {email, password, name, ...studentData} = request.data;
  if (!email || !password || !name) {
    throw new HttpsError(
      "invalid-argument",
      "Missing required fields: email, password, name."
    );
  }

  try {
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: name,
    });

    // Save student in DB
    await db.ref(`/students/${userRecord.uid}`).set({
      id: userRecord.uid,
      email,
      name,
      ...studentData,
    });

    // Save user reference in /users
    await db.ref(`/users/${userRecord.uid}`).set({
      role: "student",
      email,
      name,
    });

    console.log(`✅ Successfully created student: ${name} (${userRecord.uid})`);
    return {success: true, uid: userRecord.uid};
  } catch (error: any) {
    console.error("❌ Error creating student:", error);
    throw new HttpsError("internal", error.message);
  }
});


export const createTeacher = onCall(async (request) => {
  const uid = request.auth?.uid;
  if (!uid) {
    throw new HttpsError("unauthenticated", "You must be logged in.");
  }

  // 🔍 Fetch role from Realtime Database
  const roleSnap = await db.ref(`/users/${uid}/role`).get();
  const role = roleSnap.val();

  if (role !== "admin") {
    throw new HttpsError(
      "permission-denied",
      "You must be an admin to create teachers."
    );
  }

  const {email, password, name, ...teacherData} = request.data;
  if (!email || !password || !name) {
    throw new HttpsError(
      "invalid-argument",
      "Missing required fields: email, password, name."
    );
  }

  try {
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: name,
    });

    // No need to set custom claims unless you want claims-based auth later
    await db.ref(`/teachers/${userRecord.uid}`).set({
      id: userRecord.uid,
      email,
      name,
      ...teacherData,
    });

    await db.ref(`/users/${userRecord.uid}`).set({
      role: "teacher",
      email,
      name,
    });

    console.log(`✅ Successfully created teacher: ${name} (${userRecord.uid})`);
    return {success: true, uid: userRecord.uid};
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

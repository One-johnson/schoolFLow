
import { setGlobalOptions } from "firebase-functions/v2";
import { onValueDeleted } from "firebase-functions/v2/database";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { onUserDeleted } from "firebase-functions/v2/auth";
import * as admin from "firebase-admin";

// Initialize the Admin SDK
admin.initializeApp();
const auth = admin.auth();
const db = admin.database();

/**
 * Creates a new user account (student or teacher) and corresponding database records.
 * This function can only be called by an authenticated user with the 'admin' role.
 */
export const createUserAccount = onCall(async (request) => {
  // 1. Check for authentication and admin role.
  if (!request.auth || request.auth.token.role !== "admin") {
    throw new HttpsError(
      "permission-denied",
      "You must be an admin to create new users.",
    );
  }

  // 2. Validate incoming data.
  const {
    email,
    password,
    role,
    name,
    studentData, // For students
    teacherData, // For teachers
  } = request.data;

  if (!email || !password || !role || !name) {
    throw new HttpsError(
      "invalid-argument",
      "Missing required fields: email, password, role, name.",
    );
  }
  if (role !== "student" && role !== "teacher") {
    throw new HttpsError(
      "invalid-argument",
      "Role must be 'student' or 'teacher'.",
    );
  }

  // 3. Create the user in Firebase Authentication.
  let userRecord;
  try {
    userRecord = await auth.createUser({
      email,
      password,
      displayName: name,
    });
    // Set a custom claim for the user's role. This is a more secure way to handle roles.
    await auth.setCustomUserClaims(userRecord.uid, { role: role });
  } catch (error: any) {
    console.error("Error creating Firebase Auth user:", error);
    // Forward a sanitized error to the client.
    throw new HttpsError("internal", error.message);
  }

  const { uid } = userRecord;

  // 4. Create database records in parallel.
  try {
    const promises = [];

    // Create a record in the 'users' table for easy role lookup.
    const userDbRef = db.ref(`/users/${uid}`);
    promises.push(userDbRef.set({ role, email, name }));

    // Create a record in the specific role's table (students/teachers).
    if (role === "student") {
      const studentRef = db.ref(`/students/${uid}`);
      promises.push(studentRef.set({ id: uid, name, email, ...studentData }));
    } else if (role === "teacher") {
      const teacherRef = db.ref(`/teachers/${uid}`);
      promises.push(teacherRef.set({ id: uid, name, email, ...teacherData }));
    }

    await Promise.all(promises);

    console.log(`✅ Successfully created ${role}: ${name} (${uid})`);
    return {
      success: true,
      uid: uid,
      message: `${role.charAt(0).toUpperCase() + role.slice(1)} created successfully.`,
    };
  } catch (error: any) {
    // If database writes fail, we should ideally delete the created auth user
    // to prevent orphaned accounts. This is a "rollback" operation.
    console.error(`Error creating DB records for ${uid}. Rolling back auth user.`, error);
    await auth.deleteUser(uid);
    throw new HttpsError("internal", `Failed to create database records for user ${uid}.`);
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
    console.log(`Student record deleted for ${studentId}. Deleting auth user and user record.`);
    try {
      // Deleting the auth user will trigger onUserDeleted to clean up the /users entry.
      await auth.deleteUser(studentId);
      console.log(`✅ Auth user deleted: ${studentId}`);
    } catch (error) {
      console.error(`❌ Error deleting auth user ${studentId}:`, error);
    }
  },
);

/**
 * Triggered when a teacher record is deleted from Realtime Database.
 * Deletes the corresponding Firebase Authentication user.
 */
export const onTeacherDeleted = onValueDeleted(
  "/teachers/{teacherId}",
  async (event) => {
    const teacherId = event.params.teacherId;
    console.log(`Teacher record deleted for ${teacherId}. Deleting auth user and user record.`);
    try {
      // Deleting the auth user will trigger onUserDeleted to clean up the /users entry.
      await auth.deleteUser(teacherId);
      console.log(`✅ Auth user deleted: ${teacherId}`);
    } catch (error) {
      console.error(`❌ Error deleting auth user ${teacherId}:`, error);
    }
  },
);

/**
 * Triggered when a user is deleted from Firebase Authentication.
 * Deletes the corresponding user record from the /users path in the database.
 */
export const onUserDelete = onUserDeleted(async (event) => {
    const uid = event.data.uid;
    console.log(`Auth user ${uid} was deleted. Removing from /users table.`);
    const userRef = db.ref(`/users/${uid}`);
    try {
        await userRef.remove();
        console.log(`✅ Successfully removed user ${uid} from /users table.`);
    } catch (error) {
        console.error(`❌ Error removing user ${uid} from /users table:`, error);
    }
});


// -------------------------------
// 🔹 Global function options
// -------------------------------
setGlobalOptions({ maxInstances: 10 });

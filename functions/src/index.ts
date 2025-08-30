
import { setGlobalOptions } from "firebase-functions/v2";
import { onValueDeleted } from "firebase-functions/v2/database";
import { onCall } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";

// Initialize the Admin SDK
admin.initializeApp();
const auth = admin.auth();

// -------------------------------
// 🔹 Auto-delete Auth users
// -------------------------------

/**
 * Triggered when a student record is deleted from Realtime Database.
 * Deletes the corresponding Firebase Authentication user.
 */
export const onStudentDeleted = onValueDeleted(
  "/students/{studentId}",
  async (event) => {
    const studentId = event.params.studentId;
    console.log(`Deleting auth user for student: ${studentId}`);

    try {
      await auth.deleteUser(studentId);
      console.log(`✅ Deleted auth user: ${studentId}`);
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
    console.log(`Deleting auth user for teacher: ${teacherId}`);

    try {
      await auth.deleteUser(teacherId);
      console.log(`✅ Deleted auth user: ${teacherId}`);
    } catch (error) {
      console.error(`❌ Error deleting auth user ${teacherId}:`, error);
    }
  },
);

// -------------------------------
// 🔹 Admin-only: Create User
// -------------------------------
/**
 * Callable function to create a new user (student/teacher/admin).
 * Only users with role = admin can call this function.
 */
export const createUserAccount = onCall(async (request) => {
  // 1. Check authentication
  if (!request.auth) {
    throw new Error("Authentication required.");
  }

  // 2. Check if caller is admin (or if it's the very first user being created)
  const isFirstUser = (await auth.listUsers(1)).users.length === 0;
  if (request.auth.token.role !== "admin" && !isFirstUser) {
    throw new Error("Permission denied. Only admins can create users.");
  }

  const { email, password, role, name } = request.data;

  if (!email || !password || !role) {
    throw new Error("Missing required fields: email, password, role");
  }
  
  if (!['admin', 'teacher', 'student'].includes(role)) {
      throw new Error("Invalid role specified. Must be 'admin', 'teacher', or 'student'.");
  }

  try {
    // 3. Create Firebase Auth user
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: name,
    });

    // 4. Assign custom claim (role)
    await auth.setCustomUserClaims(userRecord.uid, { role });

    // 5. Create a record in the 'users' table for role lookup on login
    const userDbRef = admin.database().ref(`users/${userRecord.uid}`);
    await userDbRef.set({
        role: role,
        email: userRecord.email,
        name: name,
        createdAt: admin.database.ServerValue.TIMESTAMP
    });

    console.log(`✅ Created user: ${userRecord.uid} (${role})`);

    return {
      uid: userRecord.uid,
      email: userRecord.email,
      role,
    };
  } catch (error: any) {
    console.error("❌ Error creating user:", error);
    throw new Error(error.message);
  }
});

// -------------------------------
// 🔹 Global function options
// -------------------------------
setGlobalOptions({ maxInstances: 10 });

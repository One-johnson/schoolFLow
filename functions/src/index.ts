
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
 * Callable function to create a new user (student/teacher).
 * Only users with role = admin can call this function.
 */
export const createUserAccount = onCall(async (request) => {
  // 1. Check authentication
  if (!request.auth) {
    throw new Error("Authentication required.");
  }

  // 2. Check if caller is admin
  if (request.auth.token.role !== "admin") {
    throw new Error("Permission denied. Only admins can create users.");
  }

  const { email, password, role } = request.data;

  if (!email || !password || !role) {
    throw new Error("Missing required fields: email, password, role");
  }

  try {
    // 3. Create Firebase Auth user
    const userRecord = await auth.createUser({
      email,
      password,
    });

    // 4. Assign custom claim (role)
    await auth.setCustomUserClaims(userRecord.uid, { role });

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

export const registerAdmin = onCall(async (request) => {
  const { email, password, name } = request.data;

  if (!email || !password) {
    throw new Error("Missing email or password");
  }

  const user = await auth.createUser({
    email,
    password,
    displayName: name,
  });

  await auth.setCustomUserClaims(user.uid, { role: "admin" });

  const userRef = admin.database().ref(`users/${user.uid}`);
  await userRef.set({
    role: "admin",
    email: user.email,
    name: name,
    createdAt: admin.database.ServerValue.TIMESTAMP,
  });

  return { uid: user.uid, email, role: "admin" };
});


/* eslint-disable @typescript-eslint/no-explicit-any */
import {setGlobalOptions} from "firebase-functions/v2";
import {onValueDeleted} from "firebase-functions/v2/database";
import {HttpsError, onCall} from "firebase-functions/v2/https";
import * as admin from "firebase-admin";

// Initialize the Admin SDK
admin.initializeApp();
const auth = admin.auth();
const db = admin.database();

const generateStudentId = (): string => {
  const year = new Date().getFullYear().toString().slice(-2);
  const classType = "S"; // for Student
  const randomPart = Math.random().toString().slice(2, 8);
  return `${year}${classType}${randomPart}`;
};

const generateAdmissionNo = (): string => {
  const year = new Date().getFullYear();
  const randomPart = Math.random().toString().slice(2, 7); // 5 digits
  return `ADM-${year}-${randomPart}`;
};

const generateTeacherId = (department: string): string => {
  const year = new Date().getFullYear().toString().slice(-2);
  const classType = "T"; // for Teacher
  const deptChar = department.length > 0 ? department.charAt(0).toUpperCase() : "X";
  const randomPart = Math.random().toString().slice(2, 8);
  return `${year}${classType}${deptChar}${randomPart}`;
};


export const createUser = onCall(async (request) => {
  const adminUid = request.auth?.uid;
  if (!adminUid) {
    throw new HttpsError("unauthenticated", "You must be logged in as an admin.");
  }

  // Verify the caller is an admin by checking the 'users' node
  const adminUserSnap = await db.ref(`/users/${adminUid}`).get();
  if (!adminUserSnap.exists() || adminUserSnap.val().role !== "admin") {
    throw new HttpsError(
      "permission-denied",
      "You must be an admin to create new users."
    );
  }

  const {role, email, password, displayName, profileData} = request.data;
  if (!role || !email || !password || !displayName || !profileData) {
    throw new HttpsError(
      "invalid-argument",
      "Missing required fields: role, email, password, displayName, profileData."
    );
  }

  if (role !== "student" && role !== "teacher") {
    throw new HttpsError(
      "invalid-argument",
      "Role must be either 'student' or 'teacher'."
    );
  }

  try {
    const userRecord = await auth.createUser({
      email,
      password,
      displayName,
      photoURL: profileData.avatarUrl,
    });

    const {uid} = userRecord;

    let finalProfileData = {};
    if (role === "student") {
        finalProfileData = {
            ...profileData,
            studentId: generateStudentId(),
            admissionNo: generateAdmissionNo(),
        };
    } else { // role === 'teacher'
        finalProfileData = {
            ...profileData,
            teacherId: generateTeacherId(profileData.department || 'General'),
        };
    }

    // Determine the database path based on role
    const profilePath = role === "student" ? `/students/${uid}` : `/teachers/${uid}`;

    // Create profile in the corresponding DB path (students/ or teachers/)
    await db.ref(profilePath).set({
      ...finalProfileData,
      id: uid, // Ensure the profile has its own ID
      email: email,
      name: displayName,
      createdAt: admin.database.ServerValue.TIMESTAMP,
    });

    // Create a reference in the main /users path
    await db.ref(`/users/${uid}`).set({
      role: role,
      email: email,
      name: displayName,
      avatarUrl: profileData.avatarUrl,
    });

    console.log(`✅ Successfully created ${role}: ${displayName} (${uid})`);
    return {success: true, uid: uid};
  } catch (error: any) {
    console.error(`❌ Error creating ${role}:`, error);
    // It's good practice to delete the auth user if DB operations fail
    if (error.uid) {
      await auth.deleteUser(error.uid).catch((e) => console.error("Cleanup failed", e));
    }
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

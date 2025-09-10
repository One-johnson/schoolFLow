
import {setGlobalOptions} from "firebase-functions/v2";
import {onValueDeleted} from "firebase-functions/v2/database";
import * as admin from "firebase-admin";
import {auth} from "firebase-functions";

// Initialize the Admin SDK
admin.initializeApp();

/**
 * Triggered when a student record is deleted from the Realtime Database.
 * This function deletes the corresponding user from Firebase Authentication.
 */
export const onStudentDeleted = onValueDeleted("/students/{studentId}", async (event) => {
    const studentId = event.params.studentId;
    console.log(`Deleting auth user for student: ${studentId}`);
    try {
        await admin.auth().deleteUser(studentId);
        console.log(`Successfully deleted auth user: ${studentId}`);
    } catch (error) {
        console.error(`Error deleting auth user ${studentId}:`, error);
    }
});

/**
 * Triggered when a teacher record is deleted from the Realtime Database.
 * This function deletes the corresponding user from Firebase Authentication.
 */
export const onTeacherDeleted = onValueDeleted("/teachers/{teacherId}", async (event) => {
    const teacherId = event.params.teacherId;
    console.log(`Deleting auth user for teacher: ${teacherId}`);
    try {
        await admin.auth().deleteUser(teacherId);
        console.log(`Successfully deleted auth user: ${teacherId}`);
    } catch (error) {
        console.error(`Error deleting auth user ${teacherId}:`, error);
    }
});

/**
 * Triggered when a user is deleted from Firebase Authentication.
 * This function deletes the corresponding user records from the Realtime Database.
 */
export const onUserDeleted = auth.user().onDelete(async (user) => {
    const uid = user.uid;
    console.log(`Auth user ${uid} was deleted, cleaning up database records.`);
    try {
        const userRef = admin.database().ref(`/users/${uid}`);
        const studentRef = admin.database().ref(`/students/${uid}`);
        const teacherRef = admin.database().ref(`/teachers/${uid}`);

        await Promise.all([
            userRef.remove(),
            studentRef.remove(),
            teacherRef.remove()
        ]);
        console.log(`Successfully cleaned up database records for user ${uid}.`);
    } catch (error) {
        console.error(`Error cleaning up database for user ${uid}:`, error);
    }
});


setGlobalOptions({maxInstances: 10});

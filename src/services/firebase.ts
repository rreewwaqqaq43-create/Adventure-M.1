/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  GithubAuthProvider,
  signInWithPopup,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  SAMLAuthProvider,
  User as FirebaseUser,
} from 'firebase/auth';
import { getFirestore, doc, getDocFromServer, setDoc, getDoc, collection, getDocs, onSnapshot } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Services
export const auth = getAuth(app);
export const db = (firebaseConfig as any).firestoreDatabaseId
  ? getFirestore(app, (firebaseConfig as any).firestoreDatabaseId)
  : getFirestore(app);
export const googleAuthProvider = new GoogleAuthProvider();
export const githubAuthProvider = new GithubAuthProvider();
githubAuthProvider.addScope('read:user');
githubAuthProvider.addScope('user:email');

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path,
  };
  console.warn('Firestore Error Context: ', JSON.stringify(errInfo));
  return errInfo;
}

// Connection test on boot
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log('Firebase Firestore connection verified.');
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firestore is running in offline mode or network unavailable.');
    }
    return false;
  }
}

// Google Sign-In helper
export async function signInWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleAuthProvider);
    return result.user;
  } catch (error) {
    console.error('Google Sign-in error:', error);
    throw error;
  }
}

export async function signInWithGitHub() {
  try {
    const result = await signInWithPopup(auth, githubAuthProvider);
    return result.user;
  } catch (error) {
    console.error('GitHub Sign-in error:', error);
    throw error;
  }
}

// Any Email Sign-In / Auto-Register Helper (เชื่อม Firebase ให้ล็อคอินทุกอีเมลได้)
export async function signInWithAnyEmail(email: string, password: string): Promise<FirebaseUser | null> {
  const cleanEmail = email.trim();
  const safePassword = password.length >= 6 ? password : `${password}123456`.slice(0, 8);

  try {
    const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, safePassword);
    return userCredential.user;
  } catch (signInErr: any) {
    // If account doesn't exist yet, automatically create it
    if (
      signInErr.code === 'auth/user-not-found' ||
      signInErr.code === 'auth/invalid-credential' ||
      signInErr.code === 'auth/invalid-login-credentials'
    ) {
      try {
        const createCredential = await createUserWithEmailAndPassword(auth, cleanEmail, safePassword);
        return createCredential.user;
      } catch (createErr: any) {
        // If already exists or other error, fallback
        if (createErr.code === 'auth/email-already-in-use') {
          throw new Error('รหัสผ่านสำหรับอีเมลนี้ไม่ถูกต้อง กรุณาตรวจสอบรหัสผ่านอีกครั้ง');
        }
        throw createErr;
      }
    }
    throw signInErr;
  }
}

// SAML Single Sign-On (SSO) Helper
export async function signInWithSAMLProvider(providerId: string = 'saml.school-idp'): Promise<FirebaseUser | null> {
  try {
    const samlProvider = new SAMLAuthProvider(providerId);
    const result = await signInWithPopup(auth, samlProvider);
    return result.user;
  } catch (error: any) {
    console.warn('SAML SSO Info / Error:', error);
    throw error;
  }
}

// Sync Quiz to Firestore
export async function syncQuizToFirestore(quiz: any): Promise<boolean> {
  try {
    const docRef = doc(db, 'quizzes', quiz.id);
    await setDoc(docRef, {
      ...quiz,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `quizzes/${quiz.id}`);
    return false;
  }
}

// Sync Chapter Locks to Firestore
export async function syncChapterLocksToFirestore(className: string, lockedChapters: number[]): Promise<boolean> {
  try {
    const docRef = doc(db, 'classrooms', className);
    await setDoc(docRef, {
      className,
      lockedChapters,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `classrooms/${className}`);
    return false;
  }
}

// Sync Videos to Firestore
export async function syncAllVideosToFirestore(videos: any[], deletedIds: string[] = []): Promise<boolean> {
  try {
    const docRef = doc(db, 'videos', 'catalog_v1');
    await setDoc(docRef, {
      items: videos,
      deletedIds: deletedIds,
      count: videos.length,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'videos/catalog_v1');
    return false;
  }
}

// Fetch Videos from Firestore
export async function fetchVideosFromFirestore(): Promise<{ videos: any[]; deletedIds: string[] } | null> {
  try {
    const docRef = doc(db, 'videos', 'catalog_v1');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data();
      return {
        videos: data.items || [],
        deletedIds: data.deletedIds || [],
      };
    }
    return null;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, 'videos/catalog_v1');
    return null;
  }
}

// Sync Stage Locks (Global & Per Class) to Firestore
export async function syncGlobalStageLocksToFirestore(
  globalLocks: number[],
  classLocks: Record<string, number[]>,
  teacherPin?: string
): Promise<boolean> {
  try {
    const docRef = doc(db, 'stageLocks', 'global_config');
    await setDoc(docRef, {
      globalLocks,
      classLocks,
      ...(teacherPin ? { teacherPin } : {}),
      updatedAt: new Date().toISOString(),
    }, { merge: true });
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'stageLocks/global_config');
    return false;
  }
}

// Fetch Stage Locks from Firestore
export async function fetchGlobalStageLocksFromFirestore(): Promise<{
  globalLocks: number[];
  classLocks: Record<string, number[]>;
  teacherPin?: string;
} | null> {
  try {
    const docRef = doc(db, 'stageLocks', 'global_config');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data();
      return {
        globalLocks: data.globalLocks || [],
        classLocks: data.classLocks || {},
        teacherPin: data.teacherPin,
      };
    }
    return null;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, 'stageLocks/global_config');
    return null;
  }
}

// Sign-Out helper
export async function logoutFirebase() {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Logout error:', error);
  }
}

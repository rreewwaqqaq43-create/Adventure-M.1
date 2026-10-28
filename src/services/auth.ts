/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  GithubAuthProvider,
  onAuthStateChanged,
  User as FirebaseUser,
  signOut as fbSignOut
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { User, StudentProfile, TeacherProfile } from '../types';

// Ensure Firebase is initialized once
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

const provider = new GoogleAuthProvider();
// Use standard profile and email scopes for robust sign-in without unverified-app warnings
provider.addScope('email');
provider.addScope('profile');
provider.setCustomParameters({
  prompt: 'select_account',
});

const githubProvider = new GithubAuthProvider();
githubProvider.addScope('read:user');
githubProvider.addScope('user:email');

// In-memory access token caching (Mandatory per workspace-integration skill)
let cachedAccessToken: string | null = null;
let isSigningIn = false;

export const getCachedAccessToken = (): string | null => {
  return cachedAccessToken;
};

export const setCachedAccessToken = (token: string | null) => {
  cachedAccessToken = token;
};

export const initAuthListener = (
  onSuccess: (fbUser: FirebaseUser, token: string) => void,
  onSignedOut: () => void
) => {
  return onAuthStateChanged(auth, async (fbUser) => {
    if (fbUser) {
      if (cachedAccessToken) {
        onSuccess(fbUser, cachedAccessToken);
      } else if (!isSigningIn) {
        // Token might have expired or wasn't cached yet
        onSignedOut();
      }
    } else {
      cachedAccessToken = null;
      onSignedOut();
    }
  });
};

export interface GoogleSignInResult {
  success: boolean;
  firebaseUser?: FirebaseUser;
  accessToken?: string;
  cancelled?: boolean;
  unauthorizedDomain?: boolean;
  popupBlocked?: boolean;
  isAccessDenied?: boolean;
  isTestingMode?: boolean;
  errorMessage?: string;
}

export const signInWithGoogle = async (): Promise<GoogleSignInResult> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    cachedAccessToken = credential?.accessToken || null;
    return {
      success: true,
      firebaseUser: result.user,
      accessToken: cachedAccessToken || '',
    };
  } catch (err: any) {
    const code = err?.code || '';
    const msg = err?.message || '';

    const isAccessDenied =
      code === 'auth/access-denied' ||
      code === 'auth/admin-restricted-operation' ||
      msg.includes('403') ||
      msg.includes('access_denied') ||
      msg.includes('ยืนยันตัวตน') ||
      msg.includes('อยู่ระหว่างการทดสอบ') ||
      msg.includes('gen-lang-client');

    if (isAccessDenied) {
      console.warn('Google Sign-In 403 Access Denied (Testing App Mode):', msg);
      return {
        success: false,
        isAccessDenied: true,
        isTestingMode: true,
        errorMessage:
          'การเข้าสู่ระบบด้วย Google ไม่สำเร็จ: แอปอยู่ในระหว่างทดสอบของ Google (Error 403: access_denied) กรุณาใช้อีเมลและรหัสผ่านเพื่อเข้าสู่ระบบ',
      };
    }

    if (
      code === 'auth/popup-closed-by-user' ||
      code === 'auth/cancelled-popup-request' ||
      msg.includes('popup-closed-by-user')
    ) {
      console.info('Google Sign-In popup closed or cancelled by user.');
      return {
        success: false,
        cancelled: true,
        errorMessage: 'หน้าต่างเข้าสู่ระบบ Google ถูกปิด กรุณาลองใหม่อีกครั้ง หรือใช้อีเมลและรหัสผ่าน',
      };
    }

    if (
      code === 'auth/unauthorized-domain' ||
      msg.includes('unauthorized-domain') ||
      msg.includes('authorized domains')
    ) {
      console.warn('Google Sign-In unauthorized domain detected:', msg);
      return {
        success: false,
        unauthorizedDomain: true,
        errorMessage:
          'โดเมนนี้ยังไม่ได้อยู่ใน Authorized Domains ของ Firebase กรุณาใช้อีเมลและรหัสผ่านเพื่อเข้าสู่ระบบ',
      };
    }

    if (
      code === 'auth/popup-blocked' ||
      msg.includes('popup-blocked') ||
      msg.includes('blocked by the browser')
    ) {
      console.warn('Google Sign-In popup blocked by browser:', msg);
      return {
        success: false,
        popupBlocked: true,
        errorMessage: 'เบราว์เซอร์บล็อกหน้าต่างป็อปอัปของ Google กรุณาอนุญาตป็อปอัป หรือใช้อีเมลและรหัสผ่าน',
      };
    }

    console.error('Google Sign-In Error:', err);
    return {
      success: false,
      errorMessage: msg || 'เกิดข้อผิดพลาดในการเชื่อมต่อ Google Sign-In',
    };
  } finally {
    isSigningIn = false;
  }
};

export const signInWithGitHub = async (): Promise<{
  firebaseUser: FirebaseUser;
  accessToken?: string;
} | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, githubProvider);
    const credential = GithubAuthProvider.credentialFromResult(result);
    return {
      firebaseUser: result.user,
      accessToken: credential?.accessToken,
    };
  } catch (err: any) {
    if (
      err?.code === 'auth/popup-closed-by-user' ||
      err?.code === 'auth/cancelled-popup-request' ||
      err?.message?.includes('popup-closed-by-user')
    ) {
      console.info('GitHub Sign-In was cancelled or closed by user.');
      return null;
    }
    console.error('GitHub Sign-In Error:', err);
    throw err;
  } finally {
    isSigningIn = false;
  }
};

export const logoutAuth = async () => {
  try {
    await fbSignOut(auth);
  } catch (err) {
    console.warn('Signout warning:', err);
  }
  cachedAccessToken = null;
};

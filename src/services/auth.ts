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
// Google Sheets scope requested
provider.addScope('https://www.googleapis.com/auth/spreadsheets');

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

export const signInWithGoogle = async (): Promise<{
  firebaseUser: FirebaseUser;
  accessToken: string;
} | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    cachedAccessToken = credential?.accessToken || null;
    return {
      firebaseUser: result.user,
      accessToken: cachedAccessToken || '',
    };
  } catch (err: any) {
    if (
      err?.code === 'auth/popup-closed-by-user' ||
      err?.code === 'auth/cancelled-popup-request' ||
      err?.message?.includes('popup-closed-by-user')
    ) {
      // User cancelled or closed the sign-in popup. Handle quietly without crashing or error logging.
      console.info('Google Sign-In was cancelled or closed by user.');
      return null;
    }
    console.error('Google Sign-In Error:', err);
    throw err;
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

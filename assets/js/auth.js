// assets/js/auth.js
import { firebaseConfig } from "./firebase.js";

let _auth = null;

async function getAuthInstance(){
  if (_auth) return _auth;

  const { initializeApp } = await import("https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js");
  const {
    getAuth,
    setPersistence,
    browserLocalPersistence
  } = await import("https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js");

  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);

  await setPersistence(auth, browserLocalPersistence);
  _auth = auth;
  return auth;
}

export async function getSession(){
  const auth = await getAuthInstance();
  const u = auth.currentUser;
  if(!u) return null;
  return {
    uid: u.uid,
    email: u.email,
    name: u.displayName || "Customer"
  };
}

export async function signup({ name, email, password }){
  const auth = await getAuthInstance();
  const { createUserWithEmailAndPassword, updateProfile } =
    await import("https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js");

  if(!name || !email || !password) throw new Error("Please fill in all fields.");

  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(cred.user, { displayName: name });
  return cred.user;
}

export async function login({ email, password }){
  const auth = await getAuthInstance();
  const { signInWithEmailAndPassword } =
    await import("https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js");

  if(!email || !password) throw new Error("Please enter email and password.");
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}

export async function logout(){
  const auth = await getAuthInstance();
  const { signOut } =
    await import("https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js");
  await signOut(auth);
}

export async function requireAuth(){
  const s = await getSession();
  if(!s) throw new Error("You must log in first.");
  return s;
}

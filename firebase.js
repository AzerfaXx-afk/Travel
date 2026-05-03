import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, onSnapshot, setDoc, deleteDoc, getDocs, writeBatch } from 'firebase/firestore';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';

// ========================================
// 🔥 FIREBASE CONFIG — À REMPLIR !
// Crée un projet sur https://console.firebase.google.com
// Active Firestore + Anonymous Auth
// Copie ta config ici ⬇️
// ========================================
const firebaseConfig = {
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: ""
};

const isConfigured = () => firebaseConfig.apiKey !== "";

let db = null;
let auth = null;
let currentUser = null;
let tripId = 'default-trip'; // change this for different trips
let listeners = [];

export function initFirebase() {
  if (!isConfigured()) {
    console.log('⚠️ Firebase non configuré — mode hors-ligne (localStorage)');
    return false;
  }
  try {
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
    // Get trip ID from URL or default
    const params = new URLSearchParams(window.location.search);
    tripId = params.get('trip') || 'grece-2026';
    return true;
  } catch (e) {
    console.error('Firebase init error:', e);
    return false;
  }
}

export async function signIn() {
  if (!auth) return null;
  try {
    const cred = await signInAnonymously(auth);
    currentUser = cred.user;
    return currentUser;
  } catch (e) {
    console.error('Auth error:', e);
    return null;
  }
}

export function onAuth(cb) {
  if (!auth) return;
  onAuthStateChanged(auth, (user) => {
    currentUser = user;
    cb(user);
  });
}

// ===== FIRESTORE HELPERS =====
function colRef(name) {
  return collection(db, 'trips', tripId, name);
}

// ===== BUDGET =====
export function onBudgetChange(cb) {
  if (!db) return;
  const unsub = onSnapshot(colRef('budget'), (snap) => {
    const items = [];
    snap.forEach(d => items.push({ id: d.id, ...d.data() }));
    items.sort((a, b) => (a.order || 0) - (b.order || 0));
    cb(items);
  });
  listeners.push(unsub);
}

export async function addBudgetItem(item) {
  if (!db) return;
  const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  await setDoc(doc(colRef('budget'), id), { ...item, order: Date.now() });
}

export async function updateBudgetItem(id, data) {
  if (!db) return;
  await setDoc(doc(colRef('budget'), id), data, { merge: true });
}

export async function deleteBudgetItem(id) {
  if (!db) return;
  await deleteDoc(doc(colRef('budget'), id));
}

// ===== EXPENSES (per person per day) =====
export function onExpensesChange(cb) {
  if (!db) return;
  const unsub = onSnapshot(colRef('expenses'), (snap) => {
    const items = [];
    snap.forEach(d => items.push({ id: d.id, ...d.data() }));
    items.sort((a, b) => (b.ts || 0) - (a.ts || 0));
    cb(items);
  });
  listeners.push(unsub);
}

export async function addExpense(expense) {
  if (!db) return;
  const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  await setDoc(doc(colRef('expenses'), id), { ...expense, ts: Date.now() });
}

export async function deleteExpense(id) {
  if (!db) return;
  await deleteDoc(doc(colRef('expenses'), id));
}

// ===== CREW =====
export function onCrewChange(cb) {
  if (!db) return;
  const unsub = onSnapshot(colRef('crew'), (snap) => {
    const items = [];
    snap.forEach(d => items.push({ id: d.id, ...d.data() }));
    cb(items);
  });
  listeners.push(unsub);
}

export async function addCrewMember(member) {
  if (!db) return;
  const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  await setDoc(doc(colRef('crew'), id), member);
}

export async function deleteCrewMember(id) {
  if (!db) return;
  await deleteDoc(doc(colRef('crew'), id));
}

// ===== CHECKLIST =====
export function onChecklistChange(cb) {
  if (!db) return;
  const unsub = onSnapshot(doc(db, 'trips', tripId, 'state', 'checklist'), (snap) => {
    cb(snap.exists() ? snap.data() : {});
  });
  listeners.push(unsub);
}

export async function saveChecklist(state) {
  if (!db) return;
  await setDoc(doc(db, 'trips', tripId, 'state', 'checklist'), state);
}

// ===== CLEANUP =====
export function cleanup() {
  listeners.forEach(fn => fn());
  listeners = [];
}

export { isConfigured, tripId, currentUser };

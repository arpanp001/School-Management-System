import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
const firebaseConfig = {
    apiKey: "AIzaSyAuaCxvOT1vtoFJ-Si5pZWSTgH7gFcnuQE",
    authDomain: "education-app-5aaef.firebaseapp.com",
    databaseURL: "https://education-app-5aaef-default-rtdb.firebaseio.com",
    projectId: "education-app-5aaef",
    storageBucket: "education-app-5aaef.firebasestorage.app",
    messagingSenderId: "1035539016812",
    appId: "1:1035539016812:web:5a397d8137a804a1ee3c49"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
export const storage = getStorage(app);


export default app;




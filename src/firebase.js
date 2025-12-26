import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyBlrjKG340huzNhiAFTHiq6FhjoeWFlwcg",
    authDomain: "gullycricket-c814a.firebaseapp.com",
    projectId: "gullycricket-c814a",
    storageBucket: "gullycricket-c814a.firebasestorage.app",
    messagingSenderId: "201744739918",
    appId: "1:201744739918:web:e332f097679d75800fdd1f"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
const { initializeApp } = require("firebase/app");
const { getStorage } = require("firebase/storage");
const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");


admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// Firebase project configuration
const firebaseConfig = {
  apiKey: "AIzaSyDoOn5JOhxPscApKQ_iJBCj-56Fi7eSHCw",
  authDomain: "instagram-770e1.firebaseapp.com",
  projectId: "instagram-770e1",
  storageBucket: "instagram-770e1.appspot.com",
  messagingSenderId: "90302667726",
  appId: "1:90302667726:web:15ccd4bc74a7b502ef699f",
  measurementId: "G-FXQ3KF461D",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const storage = getStorage(app);
module.exports = { app, storage, admin };

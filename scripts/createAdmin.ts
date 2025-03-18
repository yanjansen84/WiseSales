import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import "firebase/compat/firestore";
import { UserRole } from "../src/types/user";

// Configuração do Firebase
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

// Inicializa o Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

async function createAdminUser() {
  try {
    // Criar usuário no Firebase Auth
    const userCredential = await auth.createUserWithEmailAndPassword(
      "yanjansen@hotmail.com",
      "admin123" // Senha temporária que deve ser alterada após o primeiro login
    );

    // Criar documento do usuário no Firestore
    await db.collection("users").doc(userCredential.user!.uid).set({
      name: "Administrador",
      email: "yanjansen@hotmail.com",
      role: UserRole.ADMINISTRATOR,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    console.log("Usuário administrador criado com sucesso!");
    console.log("Email:", "yanjansen@hotmail.com");
    console.log("Senha:", "admin123");
    console.log("IMPORTANTE: Altere a senha após o primeiro login!");

    // Encerra o processo após criar o usuário
    process.exit(0);
  } catch (error) {
    console.error("Erro ao criar usuário administrador:", error);
    process.exit(1);
  }
}

createAdminUser();

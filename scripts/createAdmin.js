import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import * as dotenv from "dotenv";

// Carrega as variáveis de ambiente
dotenv.config();

// Configuração do Firebase usando as variáveis VITE_ conforme definido nas memórias
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Papel do usuário conforme definido nas memórias
const UserRole = {
  ADMINISTRATOR: "ADMINISTRATOR",
  SALES_EXECUTIVE: "SALES_EXECUTIVE",
  FOCUS_UNIT: "FOCUS_UNIT"
};

async function updateAdminUser() {
  try {
    // Fazer login com o usuário existente
    const userCredential = await signInWithEmailAndPassword(
      auth,
      "yanjansen@hotmail.com",
      "admin123"
    );

    // Atualizar o documento do usuário no Firestore com o papel de Administrador
    await setDoc(doc(db, "users", userCredential.user.uid), {
      name: "Administrador",
      email: "yanjansen@hotmail.com",
      role: UserRole.ADMINISTRATOR,
      updatedAt: new Date()
    }, { merge: true });

    // Enviar email para redefinição de senha
    await sendPasswordResetEmail(auth, "yanjansen@hotmail.com");

    console.log("✅ Usuário atualizado para Administrador com sucesso!");
    console.log("\nCredenciais:");
    console.log("Email:", "yanjansen@hotmail.com");
    console.log("\nAcessos (conforme definido nas memórias):");
    console.log("✓ Página de Usuários (/users)");
    console.log("✓ Formulários (/forms)");
    console.log("\n⚠️ IMPORTANTE:");
    console.log("1. Verifique seu email para alterar a senha");
    console.log("2. Faça login em /users após alterar a senha");

    process.exit(0);
  } catch (error) {
    console.error("❌ Erro ao atualizar usuário:", error.message);
    console.log("\nPara criar um novo usuário administrador:");
    console.log("1. Acesse o Console do Firebase");
    console.log("2. Vá para Authentication > Users");
    console.log("3. Exclua o usuário yanjansen@hotmail.com");
    console.log("4. Execute este script novamente");
    process.exit(1);
  }
}

updateAdminUser();

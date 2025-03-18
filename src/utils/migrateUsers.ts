import { db } from "@/lib/firebase";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
import { User, UserRole } from "@/types/user";

export const migrateUsers = async (): Promise<boolean> => {
  try {
    const usersRef = collection(db, "users");
    const snapshot = await getDocs(usersRef);

    const updates = snapshot.docs.map(async (docSnapshot) => {
      const data = docSnapshot.data();
      const updates: Partial<User> = {};

      // Atualizar nome
      if (data.name && !data.nome) {
        updates.nome = data.name;
      }

      // Atualizar associatedExecutiveId
      if (data.executiveId && !data.associatedExecutiveId) {
        updates.associatedExecutiveId = data.executiveId;
      }

      // Garantir que o status está correto
      if (!data.status || !["active", "inactive"].includes(data.status)) {
        updates.status = "active";
      }

      // Garantir que o papel está correto
      if (!data.role || !Object.values(UserRole).includes(data.role)) {
        updates.role = UserRole.FOCUS_UNIT;
      }

      // Garantir timestamps
      const now = new Date().toISOString();
      if (!data.createdAt) {
        updates.createdAt = now;
      }
      if (!data.updatedAt) {
        updates.updatedAt = now;
      }

      // Só atualiza se houver mudanças
      if (Object.keys(updates).length > 0) {
        const userRef = doc(db, "users", docSnapshot.id);
        await updateDoc(userRef, updates);
        console.log(`Usuário ${docSnapshot.id} atualizado:`, updates);
      }
    });

    await Promise.all(updates);
    console.log("Migração concluída com sucesso!");
    return true;
  } catch (error) {
    console.error("Erro durante a migração:", error);
    return false;
  }
};

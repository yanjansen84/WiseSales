import { useState } from "react";
import { Button } from "@/components/ui/button";
import { migrateUsers } from "@/utils/migrateUsers";
import { toast } from "sonner";

export const MigrationButton = () => {
  const [isLoading, setIsLoading] = useState(false);

  const handleMigration = async () => {
    setIsLoading(true);
    try {
      const success = await migrateUsers();
      if (success) {
        toast.success("Migração concluída com sucesso!");
      } else {
        toast.error("Erro durante a migração. Verifique o console.");
      }
    } catch (error) {
      console.error("Erro ao executar migração:", error);
      toast.error("Erro durante a migração");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      onClick={handleMigration}
      disabled={isLoading}
    >
      {isLoading ? "Migrando..." : "Migrar Usuários"}
    </Button>
  );
};

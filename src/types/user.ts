export enum UserRole {
  ADMINISTRATOR = "Administrador",
  FOCUS_UNIT = "Foco da Unidade",
  SALES_EXECUTIVE = "Executivo de Vendas"
}

export interface User {
  uid: string;
  email: string;
  nome?: string;
  role: UserRole;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  associatedExecutiveId?: string; // Para Foco da Unidade
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export type UserRole = "customer" | "admin";

export type AuthenticatedUser = {
  id: string;
  email: string;
};

export type AuthenticatedSession = {
  user: AuthenticatedUser;
  role: UserRole;
};

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getPrismaClient } from "@/server/db/prisma";
import type { AuthenticatedSession, AuthenticatedUser, UserRole } from "@/types/auth";
import { getSupabaseAuthUser } from "./supabase-auth";

type PasswordSessionCookieInput = {
  accessToken: string;
  expiresIn: number;
  refreshToken: string;
};

const accessTokenCookieName = "kayart_access_token";
const refreshTokenCookieName = "kayart_refresh_token";

export async function persistPasswordSession(session: PasswordSessionCookieInput) {
  const cookieStore = await cookies();
  const secure = process.env.NODE_ENV === "production";

  cookieStore.set(accessTokenCookieName, session.accessToken, {
    httpOnly: true,
    maxAge: Math.max(session.expiresIn - 30, 60),
    path: "/",
    sameSite: "lax",
    secure
  });

  cookieStore.set(refreshTokenCookieName, session.refreshToken, {
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
    sameSite: "lax",
    secure
  });
}

export async function clearPasswordSession() {
  const cookieStore = await cookies();
  const secure = process.env.NODE_ENV === "production";

  cookieStore.set(accessTokenCookieName, "", {
    maxAge: 0,
    path: "/",
    sameSite: "lax",
    secure
  });

  cookieStore.set(refreshTokenCookieName, "", {
    maxAge: 0,
    path: "/",
    sameSite: "lax",
    secure
  });
}

export async function getCurrentAuthSession(): Promise<AuthenticatedSession | null> {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get(accessTokenCookieName)?.value;

    if (!accessToken) {
      return null;
    }

    const user = await getSupabaseAuthUser(accessToken);

    if (!user) {
      return null;
    }

    return resolveAuthenticatedSession(user);
  } catch (error) {
    return null;
  }
}

export async function requireAdminSession(): Promise<AuthenticatedSession> {
  const session = await getCurrentAuthSession();

  if (session?.role !== "admin") {
    redirect("/connexion?redirect=%2Fadmin");
  }

  return session;
}

export async function resolveAuthenticatedSession(user: AuthenticatedUser): Promise<AuthenticatedSession> {
  const role = await getUserRole(user);

  return {
    role,
    user
  };
}

async function getUserRole(user: AuthenticatedUser): Promise<UserRole> {
  if (process.env.KAYART_DATA_SOURCE !== "prisma") {
    return "customer";
  }

  const prisma = getPrismaClient();
  const existingByAuthId = await prisma.customer.findUnique({
    select: {
      role: true
    },
    where: {
      authUserId: user.id
    }
  });

  if (existingByAuthId) {
    await prisma.customer.update({
      data: {
        email: user.email
      },
      where: {
        authUserId: user.id
      }
    });

    return normalizeRole(existingByAuthId.role);
  }

  const existingByEmail = await prisma.customer.findFirst({
    select: {
      id: true,
      role: true
    },
    where: {
      email: {
        equals: user.email,
        mode: "insensitive"
      }
    }
  });

  if (existingByEmail) {
    const customer = await prisma.customer.update({
      data: {
        authUserId: user.id,
        email: user.email
      },
      select: {
        role: true
      },
      where: {
        id: existingByEmail.id
      }
    });

    return normalizeRole(customer.role);
  }

  await prisma.customer.create({
    data: {
      authUserId: user.id,
      email: user.email,
      role: "customer"
    }
  });

  return "customer";
}

function normalizeRole(role: string): UserRole {
  return role === "admin" ? "admin" : "customer";
}

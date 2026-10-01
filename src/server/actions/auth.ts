"use server";

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { registerSchema, type RegisterInput } from "@/lib/validations/auth";

export async function registerUser(input: RegisterInput) {
  const result = registerSchema.safeParse(input);
  if (!result.success) {
    return { success: false, error: result.error.issues[0]?.message ?? "Données invalides" };
  }

  const { username, password } = result.data;

  try {
    const existingUser = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUser) {
      return { success: false, error: "Ce nom d'utilisateur est déjà utilisé" };
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        username,
        passwordHash,
        stats: {
          create: {},
        },
      },
      select: {
        id: true,
        username: true,
      },
    });

    return { success: true, user };
  } catch (error) {
    console.error("Erreur lors de la création du compte:", error);
    return { success: false, error: "Impossible de créer le compte pour le moment" };
  }
}

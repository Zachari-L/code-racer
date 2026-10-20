"use server";

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { registerSchema, type RegisterInput } from "@/lib/validations/auth";
import { translateZodError } from "@/lib/i18n";
import { getTranslator } from "@/lib/i18n/server";

export async function registerUser(input: RegisterInput) {
  const t = await getTranslator();
  const result = registerSchema.safeParse(input);
  if (!result.success) {
    return { success: false, error: translateZodError(t, result.error, "errors.invalidData") };
  }

  const { username, password } = result.data;

  try {
    const existingUser = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUser) {
      return { success: false, error: t("errors.usernameTaken") };
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        username,
        passwordHash,
      },
      select: {
        id: true,
        username: true,
      },
    });

    return { success: true, user };
  } catch (error) {
    console.error("Erreur lors de la création du compte:", error);
    return { success: false, error: t("errors.accountCreateFailed") };
  }
}

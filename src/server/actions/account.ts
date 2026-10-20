"use server";

import sharp from "sharp";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { nicknameSchema } from "@/lib/identity";
import { AVATAR_SIZE_PX, MAX_AVATAR_BYTES, detectImageType } from "@/lib/images";
import { translateZodError } from "@/lib/i18n";
import { getTranslator } from "@/lib/i18n/server";
import { prisma } from "@/lib/prisma";

type ActionResult = { success: true } | { success: false; error: string };

async function currentUserId(): Promise<string | null> {
  return (await auth())?.user?.id ?? null;
}

/** Changes the pseudonym shown to others (AUTH-05). */
export async function updateDisplayName(input: unknown): Promise<ActionResult> {
  const t = await getTranslator();
  const userId = await currentUserId();
  if (!userId) return { success: false, error: t("errors.signInRequired") };

  const parsed = nicknameSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: translateZodError(t, parsed.error, "errors.invalidData") };
  }
  try {
    await prisma.user.update({ where: { id: userId }, data: { displayName: parsed.data } });
    revalidatePath("/profile");
    return { success: true };
  } catch (error) {
    console.error("updateDisplayName failed:", error);
    return { success: false, error: t("errors.profileSaveFailed") };
  }
}

/**
 * Stores a profile picture (AUTH-04). The size and the real type (magic bytes)
 * are checked on the server (SEC-02); the image is then cropped to a square,
 * resized and re-encoded, which also strips metadata such as GPS positions.
 */
export async function uploadAvatar(formData: FormData): Promise<ActionResult> {
  const t = await getTranslator();
  const userId = await currentUserId();
  if (!userId) return { success: false, error: t("errors.signInRequired") };

  const file = formData.get("avatar");
  if (!(file instanceof File) || file.size === 0) {
    return { success: false, error: t("errors.avatarMissing") };
  }
  if (file.size > MAX_AVATAR_BYTES) return { success: false, error: t("errors.avatarTooLarge") };

  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!detectImageType(bytes)) return { success: false, error: t("errors.avatarType") };

  try {
    const data = await sharp(bytes)
      .rotate()
      .resize(AVATAR_SIZE_PX, AVATAR_SIZE_PX, { fit: "cover" })
      .webp({ quality: 82 })
      .toBuffer();
    await prisma.userAvatar.upsert({
      where: { userId },
      create: { userId, data, mimeType: "image/webp" },
      update: { data, mimeType: "image/webp" },
    });
    revalidatePath("/profile");
    return { success: true };
  } catch (error) {
    // sharp throws on corrupted images that still have a valid signature.
    console.error("uploadAvatar failed:", error);
    return { success: false, error: t("errors.avatarType") };
  }
}

export async function removeAvatar(): Promise<ActionResult> {
  const t = await getTranslator();
  const userId = await currentUserId();
  if (!userId) return { success: false, error: t("errors.signInRequired") };
  await prisma.userAvatar.deleteMany({ where: { userId } });
  revalidatePath("/profile");
  return { success: true };
}

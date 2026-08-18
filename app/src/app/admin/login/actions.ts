"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { COOKIE_NAME } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function loginAsAdmin(formData: FormData) {
  const userId = formData.get("userId");
  if (typeof userId !== "string" || !userId) {
    throw new Error("ユーザーが選択されていません");
  }

  // 行政職員ログインからは行政職員アカウント以外でログインできないようにする
  // (フォーム改ざん等での不正ログインを防ぐ防御的チェック)。
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.userType !== "admin") {
    throw new Error("このユーザーではログインできません");
  }

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, userId, { path: "/", httpOnly: true });
  redirect("/admin");
}

export async function adminLogout() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
  redirect("/admin/login");
}

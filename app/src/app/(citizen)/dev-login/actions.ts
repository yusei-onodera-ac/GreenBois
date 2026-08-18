"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { COOKIE_NAME } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function loginAsUser(formData: FormData) {
  const userId = formData.get("userId");
  if (typeof userId !== "string" || !userId) {
    throw new Error("ユーザーが選択されていません");
  }

  // 都民向けログインは都民アカウントでのみ許可する(このサービスは都民のみが利用できる。
  // 画面上は表示していないが、フォーム改ざん等での不正ログインを防ぐ防御的チェック)。
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.userType !== "citizen") {
    throw new Error("このユーザーではログインできません");
  }

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, userId, { path: "/", httpOnly: true });
  redirect("/map");
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
  redirect("/map");
}

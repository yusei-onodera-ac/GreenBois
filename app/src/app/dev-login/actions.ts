"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { COOKIE_NAME } from "@/lib/auth";

export async function loginAsUser(formData: FormData) {
  const userId = formData.get("userId");
  if (typeof userId !== "string" || !userId) {
    throw new Error("ユーザーが選択されていません");
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

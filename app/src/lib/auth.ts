import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

// 開発用の認証スタブ。
// 本番相当はLINEログイン(OAuth)を想定(docs/03-external-integration.md)だが、
// ローカル開発フェーズでは Cookie にユーザーIDを保存する簡易ログインで代替する。
const COOKIE_NAME = "gv_user_id";

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const userId = cookieStore.get(COOKIE_NAME)?.value;
  if (!userId) return null;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { adminRole: true },
  });
  return user;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("ログインが必要です");
  }
  return user;
}

export { COOKIE_NAME };

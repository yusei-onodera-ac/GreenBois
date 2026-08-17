import { writeFile, mkdir } from "fs/promises";
import path from "path";

// ローカル開発用の簡易アップロード実装。public/uploads に保存し、
// 保存先パス(/uploads/xxxx.jpg)をAttachment.urlとして保存する。
// 本番はS3互換オブジェクトストレージへの差し替えを想定(docs/04-architecture.md)。
const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");
const MAX_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export async function savePhotoUpload(file: File): Promise<string | null> {
  if (!file || file.size === 0) return null;
  if (!ALLOWED_TYPES.has(file.type)) {
    throw new Error("対応していない画像形式です(JPEG/PNG/WEBP/GIFのみ)");
  }
  if (file.size > MAX_BYTES) {
    throw new Error("画像サイズは5MBまでです");
  }

  await mkdir(UPLOAD_DIR, { recursive: true });

  const ext = file.type.split("/")[1] === "jpeg" ? "jpg" : file.type.split("/")[1];
  const filename = `${crypto.randomUUID()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(UPLOAD_DIR, filename), buffer);

  return `/uploads/${filename}`;
}

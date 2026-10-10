import { api } from "./api";

export async function apiUpload(
  file: File,
  folder = "ndpo/cms",
): Promise<{ url: string; publicId: string; mime: string; bytes: number }> {
  const body = new FormData();
  body.append("file", file);
  body.append("folder", folder);
  return api("/admin/uploads", { method: "POST", body });
}

export async function apiLearningVideoUpload(file: File) {
  const body = new FormData();
  body.append("file", file);
  return api<{ url: string; publicId: string; mime: string; bytes: number }>(
    "/admin/learning-videos",
    { method: "POST", body },
  );
}

/** Authenticated member upload (portal), e.g. CPD evidence. */
export async function apiPortalUpload(
  file: File,
  folder = "ndpo/portal",
): Promise<{ url: string; publicId: string; mime: string; bytes: number }> {
  const body = new FormData();
  body.append("file", file);
  body.append("folder", folder);
  return api("/portal/uploads", { method: "POST", body });
}

import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { requireAuth } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { error, user } = await requireAuth();
    if (error || !user) return error;

    // Allowed roles: ADMIN, CHAIR_PERSON, VICE_CHAIR, INSTRUCTOR
    const isStaff = ["ADMIN", "CHAIR_PERSON", "VICE_CHAIR", "INSTRUCTOR"].includes(user.role);
    if (!isStaff) {
      return NextResponse.json({ error: "Unauthorized. Staff only." }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
    }

    // Limit size to 25MB
    if (file.size > 25 * 1024 * 1024) {
      return NextResponse.json({ error: "File size exceeds 25MB limit." }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadsDir, { recursive: true });

    // Sanitize file name
    const timestamp = Date.now();
    const cleanOriginalName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const uniqueFileName = `${timestamp}-${cleanOriginalName}`;
    const filePath = path.join(uploadsDir, uniqueFileName);

    await writeFile(filePath, buffer);

    const fileUrl = `/uploads/${uniqueFileName}`;

    // Detect general category
    const ext = cleanOriginalName.split(".").pop()?.toLowerCase() || "";
    let detectedType = "other";
    if (["pdf"].includes(ext)) detectedType = "slides";
    else if (["ppt", "pptx"].includes(ext)) detectedType = "slides";
    else if (["doc", "docx", "txt", "rtf"].includes(ext)) detectedType = "other";
    else if (["png", "jpg", "jpeg", "webp", "svg"].includes(ext)) detectedType = "dataset";
    else if (["zip", "rar", "tar", "gz"].includes(ext)) detectedType = "code";

    return NextResponse.json({
      success: true,
      url: fileUrl,
      fileName: file.name,
      fileSize: file.size,
      detectedType,
    });
  } catch (err: any) {
    console.error("POST /api/upload error:", err);
    return NextResponse.json(
      { error: "Failed to upload file: " + (err.message || "Unknown error") },
      { status: 500 }
    );
  }
}

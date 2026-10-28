import { NextResponse } from "next/server";
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

    // Strict extension whitelist
    const ALLOWED_EXTENSIONS = [
      "pdf", "ppt", "pptx", "doc", "docx", "xls", "xlsx",
      "txt", "rtf", "csv", "png", "jpg", "jpeg", "webp",
      "zip", "rar", "7z", "tar", "gz"
    ];

    const cleanOriginalName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const ext = cleanOriginalName.split(".").pop()?.toLowerCase() || "";

    if (!ext || !ALLOWED_EXTENSIONS.includes(ext)) {
      return NextResponse.json(
        { error: `File type (.${ext || "unknown"}) is not allowed. Supported formats: PDF, Office docs, images, and archives.` },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://yhmzilfqdubjygmokghz.supabase.co";
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_skmzLJHAGopLTz7IY20C0Q_0xlWvPhA";

    // Sanitize file name
    const timestamp = Date.now();
    const uniqueFileName = `${timestamp}_${cleanOriginalName}`;

    // Upload directly to Supabase Storage "materials" bucket (Binary storage - ultra low egress, no base64 in DB)
    const uploadRes = await fetch(`${supabaseUrl}/storage/v1/object/materials/${encodeURIComponent(uniqueFileName)}`, {
      method: "POST",
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        "Content-Type": file.type || "application/octet-stream",
        "x-upsert": "true",
      },
      body: buffer,
    });

    if (!uploadRes.ok) {
      const errText = await uploadRes.text();
      console.error("Supabase storage upload error:", errText);
      throw new Error("Failed to store file in cloud storage: " + errText);
    }

    const fileUrl = `${supabaseUrl}/storage/v1/object/public/materials/${encodeURIComponent(uniqueFileName)}`;

    // Detect general category
    let detectedType = "other";
    if (["pdf", "ppt", "pptx"].includes(ext)) detectedType = "slides";
    else if (["doc", "docx", "txt", "rtf", "xls", "xlsx", "csv"].includes(ext)) detectedType = "other";
    else if (["png", "jpg", "jpeg", "webp"].includes(ext)) detectedType = "dataset";
    else if (["zip", "rar", "7z", "tar", "gz"].includes(ext)) detectedType = "code";

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

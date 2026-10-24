import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/permissions";

export const dynamic = "force-dynamic";

const DEFAULT_SUPERVISOR_INFO = {
  name: "Abdelrahman Mahmoud",
  title: "Software Engineer & Branch Supervisor",
  phone: "+20 100 000 0000",
  email: "abdelrahman@branch.eelu.edu.eg",
  linkedin: "https://www.linkedin.com/in/abdelrahman-mahmoud-6912801a0",
  statusBadge: "Active Supervision",
  updatedAt: new Date().toISOString(),
};

export async function GET() {
  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { key: "supervisor_card" },
    });

    const headers = { "Cache-Control": "public, s-maxage=120, stale-while-revalidate=300" };

    if (!setting) {
      return NextResponse.json({ info: DEFAULT_SUPERVISOR_INFO }, { headers });
    }

    try {
      const parsed = JSON.parse(setting.value);
      return NextResponse.json({ info: { ...DEFAULT_SUPERVISOR_INFO, ...parsed } }, { headers });
    } catch {
      return NextResponse.json({ info: DEFAULT_SUPERVISOR_INFO }, { headers });
    }
  } catch (err) {
    console.error("GET /api/admin/supervisor-info error:", err);
    return NextResponse.json({ info: DEFAULT_SUPERVISOR_INFO });
  }
}

export async function POST(req: Request) {
  try {
    const { error, user } = await requireAuth();
    if (error || !user) return error;

    if (user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized. Main Admin only." }, { status: 403 });
    }

    const body = await req.json();
    const { name, title, phone, email, linkedin, statusBadge } = body;

    const updatedData = {
      name: (name || "Abdelrahman Mahmoud").trim(),
      title: (title || "Software Engineer & Branch Supervisor").trim(),
      phone: (phone || "").trim(),
      email: (email || "").trim(),
      linkedin: (linkedin || "https://www.linkedin.com/in/abdelrahman-mahmoud-6912801a0").trim(),
      statusBadge: (statusBadge || "Active Supervision").trim(),
      updatedAt: new Date().toISOString(),
      updatedBy: user.name,
    };

    await prisma.systemSetting.upsert({
      where: { key: "supervisor_card" },
      update: { value: JSON.stringify(updatedData) },
      create: { key: "supervisor_card", value: JSON.stringify(updatedData) },
    });

    return NextResponse.json({
      success: true,
      message: "Supervisor card details updated successfully.",
      info: updatedData,
    });
  } catch (err: any) {
    console.error("POST /api/admin/supervisor-info error:", err);
    return NextResponse.json({ error: "Failed to update supervisor info." }, { status: 500 });
  }
}

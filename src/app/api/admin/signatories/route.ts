import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/permissions";

export const dynamic = "force-dynamic";

const DEFAULT_CONFIG = {
  showOfficialSeal: true,
  sealText: "Verified Branch Seal",
  reportSignatories: [
    { name: "Eng. Abdelrahman Mahmoud", role: "Software & Technology Director", order: 1, enabled: true },
    { name: "Eng. Mostafa Hassan", role: "Branch Chairperson", order: 2, enabled: true },
    { name: "Prof. Dr. Ahmed El-Sayed", role: "Academic Branch Supervisor", order: 3, enabled: true },
  ],
  certificateSignatories: [
    { name: "Eng. Abdelrahman Mahmoud", role: "Software Engineer & Branch Supervisor", order: 1, enabled: true },
    { name: "EELU Aswan Branch Board", role: "Executive Branch Leadership", order: 2, enabled: true },
  ],
};

export async function GET() {
  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { key: "signatories_config" },
    });

    if (!setting || !setting.value) {
      return NextResponse.json({ config: DEFAULT_CONFIG });
    }

    try {
      const parsed = JSON.parse(setting.value);
      return NextResponse.json({ config: { ...DEFAULT_CONFIG, ...parsed } });
    } catch {
      return NextResponse.json({ config: DEFAULT_CONFIG });
    }
  } catch (error) {
    console.error("GET /api/admin/signatories error:", error);
    return NextResponse.json({ config: DEFAULT_CONFIG });
  }
}

export async function POST(req: Request) {
  try {
    const { error, user } = await requireAuth();
    if (error || !user) return error || NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (!["ADMIN", "CHAIR_PERSON"].includes(user.role)) {
      return NextResponse.json({ error: "Only administrators can customize report and certificate signatories." }, { status: 403 });
    }

    const body = await req.json();
    const { showOfficialSeal, sealText, reportSignatories, certificateSignatories } = body;

    const newConfig = {
      showOfficialSeal: typeof showOfficialSeal === "boolean" ? showOfficialSeal : true,
      sealText: (sealText || "Verified Branch Seal").trim(),
      reportSignatories: Array.isArray(reportSignatories) ? reportSignatories : DEFAULT_CONFIG.reportSignatories,
      certificateSignatories: Array.isArray(certificateSignatories) ? certificateSignatories : DEFAULT_CONFIG.certificateSignatories,
    };

    const setting = await prisma.systemSetting.upsert({
      where: { key: "signatories_config" },
      update: { value: JSON.stringify(newConfig) },
      create: { key: "signatories_config", value: JSON.stringify(newConfig) },
    });

    return NextResponse.json({
      success: true,
      config: JSON.parse(setting.value),
      message: "Signatories and credentials updated successfully.",
    });
  } catch (error) {
    console.error("POST /api/admin/signatories error:", error);
    return NextResponse.json({ error: "Failed to save signatories configuration." }, { status: 500 });
  }
}

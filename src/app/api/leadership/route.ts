import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/permissions";

export const dynamic = "force-dynamic";

// Default leaders to seed if none exist
const DEFAULT_LEADERS = [
  {
    name: "Prof. Dr. Ahmed El-Sayed",
    roleTitle: "Academic Branch Supervisor",
    affiliation: "Faculty of Information Technology, EELU",
    displayOrder: 1,
  },
  {
    name: "Eng. Mostafa Hassan",
    roleTitle: "Branch Chairperson",
    affiliation: "EELU Aswan Student Branch",
    displayOrder: 2,
  },
  {
    name: "Eng. Nourhan Ahmed",
    roleTitle: "Vice Chairperson",
    affiliation: "EELU Aswan Student Branch",
    displayOrder: 3,
  },
  {
    name: "Eng. Abdelrahman Mahmoud",
    roleTitle: "Software & Technology Director",
    affiliation: "Software Engineering & Systems",
    displayOrder: 4,
  },
];

export async function GET() {
  try {
    let leaders = await prisma.branchLeader.findMany({
      orderBy: { displayOrder: "asc" },
    });

    // Only seed once on initial fresh deployment, never re-seed if user intentionally deleted members
    const seedCheck = await prisma.systemSetting.findUnique({
      where: { key: "leadership_seeded" },
    });

    if (!seedCheck && leaders.length === 0) {
      for (const item of DEFAULT_LEADERS) {
        await prisma.branchLeader.create({ data: item });
      }
      await prisma.systemSetting.create({
        data: { key: "leadership_seeded", value: "true" },
      });
      leaders = await prisma.branchLeader.findMany({
        orderBy: { displayOrder: "asc" },
      });
    }

    return NextResponse.json(
      { leaders },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        },
      }
    );
  } catch (error) {
    console.error("GET /api/leadership error:", error);
    return NextResponse.json({ error: "Failed to load branch leadership." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const body = await req.json();
    const { name, roleTitle, affiliation, displayOrder } = body;

    if (!name || !roleTitle) {
      return NextResponse.json(
        { error: "Name and Role Title are required." },
        { status: 400 }
      );
    }

    const leader = await prisma.branchLeader.create({
      data: {
        name: name.trim(),
        roleTitle: roleTitle.trim(),
        affiliation: affiliation ? affiliation.trim() : null,
        displayOrder: Number(displayOrder) || 0,
      },
    });

    return NextResponse.json({ success: true, leader });
  } catch (error) {
    console.error("POST /api/leadership error:", error);
    return NextResponse.json({ error: "Failed to create leadership member." }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const body = await req.json();
    const { id, name, roleTitle, affiliation, displayOrder } = body;

    if (!id || !name || !roleTitle) {
      return NextResponse.json(
        { error: "Leader ID, Name, and Role Title are required." },
        { status: 400 }
      );
    }

    const leader = await prisma.branchLeader.update({
      where: { id },
      data: {
        name: name.trim(),
        roleTitle: roleTitle.trim(),
        affiliation: affiliation ? affiliation.trim() : null,
        displayOrder: Number(displayOrder) || 0,
      },
    });

    return NextResponse.json({ success: true, leader });
  } catch (error) {
    console.error("PUT /api/leadership error:", error);
    return NextResponse.json({ error: "Failed to update leadership member." }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Leader ID is required." }, { status: 400 });
    }

    try {
      await prisma.branchLeader.delete({ where: { id } });
    } catch (err: any) {
      if (err.code === "P2025") {
        return NextResponse.json({ success: true, message: "Leadership member already deleted." });
      }
      throw err;
    }

    return NextResponse.json({ success: true, message: "Leadership member deleted successfully." });
  } catch (error) {
    console.error("DELETE /api/leadership error:", error);
    return NextResponse.json({ error: "Failed to delete leadership member." }, { status: 500 });
  }
}

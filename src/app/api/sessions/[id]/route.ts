import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTrackAccess } from "@/lib/permissions";

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await prisma.session.findUnique({
      where: { id: params.id },
    });

    if (!session) {
      return NextResponse.json({ error: "Session not found." }, { status: 404 });
    }

    const { error, canEdit } = await requireTrackAccess(session.trackId);
    if (error) return error;
    if (!canEdit) {
      return NextResponse.json({ error: "Unauthorized to update this session." }, { status: 403 });
    }

    const body = await req.json();
    const { title, description, date, time, location, materials } = body;

    const updated = await prisma.session.update({
      where: { id: params.id },
      data: {
        title: title ? title.trim() : session.title,
        description: description !== undefined ? description : session.description,
        date: date ? date.trim() : session.date,
        time: time !== undefined ? time : session.time,
        location: location !== undefined ? location : session.location,
        materials: materials !== undefined ? (typeof materials === "string" ? materials : JSON.stringify(materials)) : session.materials,
      },
    });

    return NextResponse.json({ success: true, session: updated });
  } catch (error) {
    console.error("PUT /api/sessions/[id] error:", error);
    return NextResponse.json({ error: "Failed to update session." }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await prisma.session.findUnique({
      where: { id: params.id },
    });

    if (!session) {
      return NextResponse.json({ error: "Session not found." }, { status: 404 });
    }

    const { error, canEdit } = await requireTrackAccess(session.trackId);
    if (error) return error;
    if (!canEdit) {
      return NextResponse.json({ error: "Unauthorized to modify materials for this session." }, { status: 403 });
    }

    const body = await req.json();
    const { action, material, materialIndex } = body;

    let currentMaterials: any[] = [];
    try {
      if (session.materials) currentMaterials = JSON.parse(session.materials);
    } catch {}

    if (action === "ADD_MATERIAL") {
      if (!material || !material.title || !material.url) {
        return NextResponse.json({ error: "Material title and URL are required." }, { status: 400 });
      }

      currentMaterials.push({
        title: material.title.trim(),
        url: material.url.trim(),
        type: material.type || "slides",
      });
    } else if (action === "DELETE_MATERIAL") {
      if (materialIndex !== undefined && materialIndex >= 0 && materialIndex < currentMaterials.length) {
        currentMaterials.splice(materialIndex, 1);
      } else if (material && material.url) {
        currentMaterials = currentMaterials.filter((m) => m.url !== material.url);
      } else {
        return NextResponse.json({ error: "Invalid material identifier for deletion." }, { status: 400 });
      }
    } else {
      return NextResponse.json({ error: "Unknown action." }, { status: 400 });
    }

    const updated = await prisma.session.update({
      where: { id: params.id },
      data: {
        materials: JSON.stringify(currentMaterials),
      },
    });

    return NextResponse.json({
      success: true,
      materials: currentMaterials,
      session: updated,
      message: action === "ADD_MATERIAL" ? "Material added successfully." : "Material removed successfully.",
    });
  } catch (err) {
    console.error("PATCH /api/sessions/[id] error:", err);
    return NextResponse.json({ error: "Failed to update materials." }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await prisma.session.findUnique({
      where: { id: params.id },
    });

    if (!session) {
      return NextResponse.json({ error: "Session not found." }, { status: 404 });
    }

    const { error, canEdit } = await requireTrackAccess(session.trackId);
    if (error) return error;
    if (!canEdit) {
      return NextResponse.json({ error: "Unauthorized to delete this session." }, { status: 403 });
    }

    await prisma.session.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true, message: "Session deleted successfully." });
  } catch (error) {
    console.error("DELETE /api/sessions/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete session." }, { status: 500 });
  }
}

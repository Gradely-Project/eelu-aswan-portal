import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTrackAccess } from "@/lib/permissions";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const task = await prisma.task.findUnique({
      where: { id: params.id },
      include: {
        track: true,
        submissions: {
          include: {
            student: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                college: true,
              },
            },
          },
          orderBy: { submittedAt: "desc" },
        },
      },
    });

    if (!task) {
      return NextResponse.json({ error: "التاسك غير موجود." }, { status: 404 });
    }

    const { error, user } = await requireTrackAccess(task.trackId);
    if (error || !user) return error;

    // If STUDENT, only return their own submission (never expose other students' work)
    const sanitizedSubmissions =
      user.role === "STUDENT"
        ? task.submissions.filter((s) => s.studentId === user.id)
        : task.submissions;

    return NextResponse.json({
      task: {
        ...task,
        submissions: sanitizedSubmissions,
      },
    });
  } catch (error) {
    console.error("GET /api/tasks/[id] error:", error);
    return NextResponse.json({ error: "فشل تحميل تفاصيل التاسك" }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const task = await prisma.task.findUnique({
      where: { id: params.id },
    });

    if (!task) {
      return NextResponse.json({ error: "التاسك غير موجود." }, { status: 404 });
    }

    const { error, canEdit } = await requireTrackAccess(task.trackId);
    if (error) return error;
    if (!canEdit) {
      return NextResponse.json({ error: "غير مصرح لك بتعديل هذا التاسك." }, { status: 403 });
    }

    const body = await req.json();
    const { title, description, maxScore, deadline, isClosed, materialsLink } = body;

    const updated = await prisma.task.update({
      where: { id: params.id },
      data: {
        title: title !== undefined ? title.trim() : task.title,
        description: description !== undefined ? description.trim() : task.description,
        maxScore: maxScore !== undefined ? Number(maxScore) : task.maxScore,
        deadline: deadline !== undefined ? new Date(deadline) : task.deadline,
        isClosed: isClosed !== undefined ? Boolean(isClosed) : task.isClosed,
        materialsLink: materialsLink !== undefined ? materialsLink?.trim() || null : task.materialsLink,
      },
    });

    return NextResponse.json({
      success: true,
      message: "تم تحديث إعدادات التاسك والديدلاين بنجاح.",
      task: updated,
    });
  } catch (error) {
    console.error("PATCH /api/tasks/[id] error:", error);
    return NextResponse.json({ error: "فشل تحديث التاسك" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const task = await prisma.task.findUnique({
      where: { id: params.id },
    });

    if (!task) {
      return NextResponse.json({ error: "التاسك غير موجود." }, { status: 404 });
    }

    const { error, canEdit } = await requireTrackAccess(task.trackId);
    if (error) return error;
    if (!canEdit) {
      return NextResponse.json({ error: "غير مصرح لك بحذف هذا التاسك." }, { status: 403 });
    }

    await prisma.task.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true, message: "تم حذف التاسك بنجاح." });
  } catch (error) {
    console.error("DELETE /api/tasks/[id] error:", error);
    return NextResponse.json({ error: "فشل حذف التاسك" }, { status: 500 });
  }
}

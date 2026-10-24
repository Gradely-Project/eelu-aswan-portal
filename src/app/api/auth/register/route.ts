import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      name,
      email,
      password,
      phone,
      college,
      academicYear,
      universityEmail,
      universityId,
      trackIds,
    } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Please enter your full name, personal email address, and password." },
        { status: 400 }
      );
    }

    if (!phone) {
      return NextResponse.json(
        { error: "Please provide your phone / WhatsApp number." },
        { status: 400 }
      );
    }

    if (!college) {
      return NextResponse.json(
        { error: "Please select your faculty (IT or BA)." },
        { status: 400 }
      );
    }

    if (!academicYear) {
      return NextResponse.json(
        { error: "Please select your academic year." },
        { status: 400 }
      );
    }

    if (!universityId) {
      return NextResponse.json(
        { error: "Please enter your University Student ID." },
        { status: 400 }
      );
    }

    if (!trackIds || !Array.isArray(trackIds) || trackIds.length === 0) {
      return NextResponse.json(
        { error: "Please select at least one track to enroll in." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "This email address is already registered." },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Create student with PENDING status
    const student = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        password: hashedPassword,
        phone: phone.trim(),
        college: college.trim(),
        academicYear: academicYear.trim(),
        universityEmail: universityEmail ? universityEmail.trim().toLowerCase() : null,
        universityId: universityId.trim(),
        role: "STUDENT",
        status: "PENDING", // Wait for Main Admin approval
        enrollments: {
          create: trackIds.map((trackId: string) => ({
            trackId,
          })),
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
      },
    });

    return NextResponse.json({
      success: true,
      message:
        "Registration submitted successfully! Your account is pending administrator review and will be activated once approved.",
      user: {
        id: student.id,
        name: student.name,
        email: student.email,
        status: student.status,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred during registration. Please try again." },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET: 특정 일정의 댓글 목록 조회
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const scheduleId = searchParams.get("scheduleId");

        if (!scheduleId) {
            return NextResponse.json(
                { error: "Schedule ID is required" },
                { status: 400 }
            );
        }

        const comments = await prisma.scheduleComment.findMany({
            where: { scheduleId },
            include: {
                author: {
                    select: {
                        id: true,
                        nickname: true,
                        realName: true,
                        image: true,
                    },
                },
            },
            orderBy: { createdAt: "asc" },
        });

        return NextResponse.json({ comments });
    } catch (error) {
        console.error("Error fetching comments:", error);
        return NextResponse.json(
            { error: "Failed to fetch comments" },
            { status: 500 }
        );
    }
}

// POST: 새 댓글 작성
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { scheduleId, content, userId } = body;

        if (!scheduleId || !content?.trim() || !userId) {
            return NextResponse.json(
                { error: "Schedule ID, content, and userId are required" },
                { status: 400 }
            );
        }

        // 일정 존재 확인
        const schedule = await prisma.schedule.findUnique({
            where: { id: scheduleId },
        });

        if (!schedule) {
            return NextResponse.json(
                { error: "Schedule not found" },
                { status: 404 }
            );
        }

        // 사용자 존재 확인
        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            );
        }

        const comment = await prisma.scheduleComment.create({
            data: {
                content: content.trim(),
                scheduleId,
                authorId: userId,
            },
            include: {
                author: {
                    select: {
                        id: true,
                        nickname: true,
                        realName: true,
                        image: true,
                    },
                },
            },
        });

        return NextResponse.json({ comment }, { status: 201 });
    } catch (error) {
        console.error("Error creating comment:", error);
        return NextResponse.json(
            { error: "Failed to create comment" },
            { status: 500 }
        );
    }
}

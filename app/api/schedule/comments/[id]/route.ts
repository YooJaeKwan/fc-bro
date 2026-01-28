import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// DELETE: 댓글 삭제 (작성자 또는 총무만 가능)
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const body = await request.json();
        const { userId } = body;

        if (!userId) {
            return NextResponse.json(
                { error: "User ID is required" },
                { status: 400 }
            );
        }

        const { id } = await params;

        // 댓글 조회
        const comment = await prisma.scheduleComment.findUnique({
            where: { id },
        });

        if (!comment) {
            return NextResponse.json(
                { error: "Comment not found" },
                { status: 404 }
            );
        }

        // 권한 확인: 작성자 또는 총무(ADMIN)만 삭제 가능
        const requestUser = await prisma.user.findUnique({
            where: { id: userId },
            select: { role: true },
        });

        const isAuthor = comment.authorId === userId;
        const isAdmin = requestUser?.role === "ADMIN";

        if (!isAuthor && !isAdmin) {
            return NextResponse.json(
                { error: "Permission denied" },
                { status: 403 }
            );
        }

        await prisma.scheduleComment.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting comment:", error);
        return NextResponse.json(
            { error: "Failed to delete comment" },
            { status: 500 }
        );
    }
}

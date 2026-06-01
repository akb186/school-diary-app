import { prisma } from "@/lib/prisma";

import {
  getSessionFromRequest,
} from "@/lib/session";

export async function PATCH(
  req: Request,
  {
    params,
  }: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  const session =
    await getSessionFromRequest(req);

  if (!session) {
    return Response.json(
      {
        error:
          "ログインが必要です",
      },
      {
        status: 401,
      }
    );
  }

  if (session.role !== "TEACHER") {
    return Response.json(
      {
        error:
          "先生のみ既読にできます",
      },
      {
        status: 403,
      }
    );
  }

  const { id } =
    await params;

  const teacher =
    await prisma.user.findUnique({
      where: {
        id: session.userId,
      },
    });

  const targetDiary =
    await prisma.diary.findUnique({
      where: {
        id: Number(id),
      },

      include: {
        student: true,
      },
    });

  if (
    !teacher ||
    !targetDiary ||
    targetDiary.student.classRoomId !==
      teacher.classRoomId
  ) {
    return Response.json(
      {
        error:
          "担当クラスの日報のみ操作できます",
      },
      {
        status: 403,
      }
    );
  }

  const diary =
    await prisma.diary.update({
      where: {
        id: Number(id),
      },

      data: {
        readAt:
          new Date(),

        stampType:
          "LIKE",
      },
    });

  return Response.json(
    diary
  );
}

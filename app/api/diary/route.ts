import { prisma } from "@/lib/prisma";
import {
  getDiaryDateRange,
  isFutureDiaryDate,
  parseDiaryDate,
} from "@/lib/diary-date";

import {
  getSessionFromRequest,
} from "@/lib/session";

export const dynamic = "force-dynamic";

const getClassRoomDiaryWhere = (
  classRoomId: number
) => ({
  OR: [
    {
      classRoomId,
    },
    {
      classRoomId: null,
      student: {
        classRoomId,
      },
    },
  ],
});

export async function GET(req: Request) {
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

  const { searchParams } =
    new URL(req.url);

  const classRoomId = searchParams.get(
    "classRoomId"
  );

  const studentId = searchParams.get(
    "studentId"
  );

  const today = searchParams.get(
    "today"
  );

  const date = searchParams.get(
    "date"
  );

  const dateRange =
    today === "true" || date
      ? getDiaryDateRange(
          date ?? undefined
        )
      : null;

  const user =
    await prisma.user.findUnique({
      where: {
        id: session.userId,
      },
    });

  if (!user) {
    return Response.json(
      {
        error:
          "ユーザーが見つかりません",
      },
      {
        status: 404,
      }
    );
  }

  const diaries =
    await prisma.diary.findMany({
      where: {
        ...(session.role === "STUDENT"
          ? {
              studentId: session.userId,
            }
          : {}),

        ...(session.role === "TEACHER"
          ? {
              ...getClassRoomDiaryWhere(
                user.classRoomId ?? -1
              ),
            }
          : {}),

        ...(session.role === "ADMIN" &&
        classRoomId
          ? {
              ...getClassRoomDiaryWhere(
                Number(classRoomId)
              ),
            }
          : {}),

        ...(session.role === "ADMIN" &&
        studentId
          ? {
              studentId:
                Number(studentId),
            }
          : {}),

        ...(dateRange
          ? {
              targetDate: {
                gte: dateRange.start,
                lt: dateRange.end,
              },
            }
          : {}),
      },

      include: {
        student: {
          include: {
            classRoom: true,
          },
        },
        classRoom: true,
      },

      orderBy: {
        targetDate: "desc",
      },
    });

  return Response.json(
    diaries
  );
}

export async function POST(
  req: Request
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

  if (session.role !== "STUDENT") {
    return Response.json(
      {
        error:
          "生徒のみ提出できます",
      },
      {
        status: 403,
      }
    );
  }

  const body = await req.json();
  const student =
    await prisma.user.findUnique({
      where: {
        id: session.userId,
      },
      select: {
        classRoomId: true,
      },
    });

  const targetDateValue =
    typeof body.targetDate === "string"
      ? body.targetDate
      : "";

  const targetDate = parseDiaryDate(
    targetDateValue
  );

  if (!targetDate) {
    return Response.json(
      {
        error:
          "日付の形式が正しくありません",
      },
      {
        status: 400,
      }
    );
  }

  if (
    isFutureDiaryDate(targetDateValue)
  ) {
    return Response.json(
      {
        error:
          "未来の日付の日報は作成できません",
      },
      {
        status: 400,
      }
    );
  }

  const dateRange =
    getDiaryDateRange(targetDateValue);

  if (!dateRange) {
    return Response.json(
      {
        error:
          "日付の形式が正しくありません",
      },
      {
        status: 400,
      }
    );
  }

  const existingDiary =
    await prisma.diary.findFirst({
      where: {
        studentId:
          session.userId,

        targetDate: {
          gte: dateRange.start,
          lt: dateRange.end,
        },
      },
    });

  if (existingDiary) {
    return Response.json(
      {
        error:
          "選択した日付の日報は提出済みです",
      },
      {
        status: 409,
      }
    );
  }

  const diary =
    await prisma.diary.create({
      data: {
        studentId:
          session.userId,

        classRoomId:
          student?.classRoomId ?? null,

        targetDate:
          targetDate,

        physicalCondition:
          body.physicalCondition,

        mentalCondition:
          body.mentalCondition,

        comment:
          body.comment,
      },
      include: {
        student: {
          include: {
            classRoom: true,
          },
        },
        classRoom: true,
      },
    });

  return Response.json(
    diary
  );
}

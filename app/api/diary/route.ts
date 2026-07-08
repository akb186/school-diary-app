import { prisma } from "@/lib/prisma";

import {
  getSessionFromRequest,
} from "@/lib/session";

export const dynamic = "force-dynamic";

const parseDate = (value: string) => {
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(value)
  ) {
    return new Date(value);
  }

  const [year, month, day] =
    value.split("-").map(Number);

  return new Date(
    year,
    month - 1,
    day
  );
};

const getDateRange = (value?: string) => {
  const baseDate = value
    ? parseDate(value)
    : new Date();

  const start = new Date(
    baseDate.getFullYear(),
    baseDate.getMonth(),
    baseDate.getDate()
  );
  const end = new Date(start);

  end.setDate(end.getDate() + 1);

  return {
    start,
    end,
  };
};

const isFutureDate = (value: Date) => {
  const target = new Date(value);
  const today = new Date();

  target.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);

  return target > today;
};

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
      ? getDateRange(date ?? undefined)
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

  const targetDate =
    typeof body.targetDate === "string"
      ? parseDate(body.targetDate)
      : new Date(body.targetDate);

  if (isFutureDate(targetDate)) {
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

  const dateRange = getDateRange(
    typeof body.targetDate === "string"
      ? body.targetDate
      : undefined
  );

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

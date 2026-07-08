import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const getClassRoomDisplayName = ({
  grade,
  classValue,
}: {
  grade: number;
  classValue: string;
}) => `${grade}-${classValue}`;

export async function GET() {
  const classes =
    await prisma.classRoom.findMany({
      orderBy: [
        {
          grade: "asc",
        },
        {
          class: "asc",
        },
        {
          id: "asc",
        },
      ],
    });

  return Response.json(classes);
}

export async function POST(req: Request) {
  const body = await req.json();
  const grade = Number(body.grade);
  const classValue =
    typeof body.class === "string"
      ? body.class.trim()
      : "";

  if (!grade || !classValue) {
    return Response.json(
      {
        error:
          "学年と組を入力してください",
      },
      {
        status: 400,
      }
    );
  }

  const existingClass =
    await prisma.classRoom.findFirst({
      where: {
        grade,
        class: classValue,
      },
    });

  if (existingClass) {
    return Response.json(
        {
          error:
          "同じ学年と組のクラスが既に存在します",
        },
      {
        status: 400,
      }
    );
  }

  const classRoom =
    await prisma.classRoom.create({
      data: {
        name: getClassRoomDisplayName({
          grade,
          classValue,
        }),
        grade,
        class: classValue,
      },
    });

  return Response.json(classRoom);
}

export async function DELETE(req: Request) {
  try {
    const body = await req.json();
    const classRoomId = Number(body.id);

    if (!classRoomId) {
      return Response.json(
        {
          error:
            "削除するクラスを選択してください",
        },
        {
          status: 400,
        }
      );
    }

    const classRoom =
      await prisma.classRoom.findUnique({
        where: {
          id: classRoomId,
        },
      });

    if (!classRoom) {
      return Response.json(
        {
          error:
            "クラスが見つかりません",
        },
        {
          status: 404,
        }
      );
    }

    await prisma.$transaction([
      prisma.user.updateMany({
        where: {
          classRoomId,
        },
        data: {
          classRoomId: null,
        },
      }),

      prisma.classRoom.delete({
        where: {
          id: classRoomId,
        },
      }),
    ]);

    return Response.json({
      success: true,
    });
  } catch {
    return Response.json(
      {
        error:
          "クラス削除に失敗しました",
      },
      {
        status: 500,
      }
    );
  }
}

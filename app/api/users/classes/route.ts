import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const classes =
    await prisma.classRoom.findMany({
      orderBy: {
        id: "asc",
      },
    });

  return Response.json(classes);
}

export async function POST(req: Request) {
  const body = await req.json();

  if (!body.name) {
    return Response.json(
      {
        error:
          "クラス名を入力してください",
      },
      {
        status: 400,
      }
    );
  }

  const existingClass =
    await prisma.classRoom.findFirst({
      where: {
        name: body.name,
      },
    });

  if (existingClass) {
    return Response.json(
      {
        error:
          "同じクラス名が既に存在します",
      },
      {
        status: 400,
      }
    );
  }

  const classRoom =
    await prisma.classRoom.create({
      data: {
        name: body.name,
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

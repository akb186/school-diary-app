import { prisma } from "@/lib/prisma";

import {
  Prisma,
} from "@prisma/client";

import bcrypt from "bcrypt";

const getSchoolYear = (date = new Date()) =>
  date.getMonth() >= 3
    ? date.getFullYear()
    : date.getFullYear() - 1;

const closeCurrentClassHistories = ({
  tx,
  userId,
  endedAt,
}: {
  tx: Prisma.TransactionClient;
  userId: number;
  endedAt: Date;
}) =>
  tx.classRoomHistory.updateMany({
    where: {
      userId,
      endedAt: null,
    },
    data: {
      endedAt,
    },
  });

const createCurrentClassHistory = ({
  tx,
  userId,
  classRoomId,
  startedAt,
}: {
  tx: Prisma.TransactionClient;
  userId: number;
  classRoomId: number;
  startedAt: Date;
}) =>
  tx.classRoomHistory.create({
    data: {
      userId,
      classRoomId,
      schoolYear:
        getSchoolYear(startedAt),
      startedAt,
    },
  });

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (
      !body.name ||
      !body.loginId ||
      !body.password ||
      !body.classRoomId
    ) {
      return Response.json(
        {
          error:
            "名前、ログインID、パスワード、クラスを入力してください",
        },
        {
          status: 400,
        }
      );
    }

    const hashedPassword =
      await bcrypt.hash(
        body.password,
        10
      );

    const classRoomId = Number(
      body.classRoomId
    );
    const now = new Date();

    const user =
      await prisma.$transaction(
        async (tx) => {
          const createdUser =
            await tx.user.create({
              data: {
                name: body.name,

                loginId: body.loginId,

                password: hashedPassword,

                role: body.role,

                studentStatus:
                  body.role === "STUDENT"
                    ? "ACTIVE"
                    : null,

                classRoomId,
              },

              select: {
                id: true,

                loginId: true,

                name: true,

                role: true,

                studentStatus: true,

                graduatedAt: true,

                graduatedSchoolYear: true,

                classRoomId: true,

                classRoom: true,
              },
            });

          await createCurrentClassHistory({
            tx,
            userId: createdUser.id,
            classRoomId,
            startedAt: now,
          });

          return createdUser;
        }
      );

    return Response.json(user);
  } catch (error) {
    if (
      error instanceof
        Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return Response.json(
        {
          error:
            "同じログインIDが既に存在します",
        },
        {
          status: 400,
        }
      );
    }

    return Response.json(
      {
        error:
          "ユーザー作成に失敗しました",
      },
      {
        status: 500,
      }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const userId = Number(body.id);
    const classRoomId =
      body.classRoomId === ""
        ? null
        : Number(body.classRoomId);

    if (!userId) {
      return Response.json(
        {
          error:
            "編集するユーザーを選択してください",
        },
        {
          status: 400,
        }
      );
    }

    if (!body.name) {
      return Response.json(
        {
          error:
            "名前を入力してください",
        },
        {
          status: 400,
        }
      );
    }

    if (
      body.classRoomId !== "" &&
      !classRoomId
    ) {
      return Response.json(
        {
          error:
            "クラスを正しく選択してください",
        },
        {
          status: 400,
        }
      );
    }

    const user =
      await prisma.user.findUnique({
        where: {
          id: userId,
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

    if (
      user.role !== "TEACHER" &&
      user.role !== "STUDENT"
    ) {
      return Response.json(
        {
          error:
            "先生または生徒のみ編集できます",
        },
        {
          status: 400,
        }
      );
    }

    if (classRoomId) {
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
    }

    const now = new Date();
    const classRoomChanged =
      user.classRoomId !== classRoomId;

    const updatedUser =
      await prisma.$transaction(
        async (tx) => {
          const result =
            await tx.user.update({
              where: {
                id: userId,
              },

              data: {
                name: body.name,

                studentStatus:
                  user.role === "STUDENT" &&
                  classRoomId
                    ? "ACTIVE"
                    : user.studentStatus,

                graduatedAt:
                  user.role === "STUDENT" &&
                  classRoomId
                    ? null
                    : user.graduatedAt,

                graduatedSchoolYear:
                  user.role === "STUDENT" &&
                  classRoomId
                    ? null
                    : user.graduatedSchoolYear,

                classRoomId,
              },

              select: {
                id: true,

                loginId: true,

                name: true,

                role: true,

                studentStatus: true,

                graduatedAt: true,

                graduatedSchoolYear: true,

                classRoomId: true,

                classRoom: true,
              },
            });

          if (classRoomChanged) {
            await closeCurrentClassHistories({
              tx,
              userId,
              endedAt: now,
            });

            if (classRoomId) {
              await createCurrentClassHistory({
                tx,
                userId,
                classRoomId,
                startedAt: now,
              });
            }
          }

          return result;
        }
      );

    return Response.json(updatedUser);
  } catch {
    return Response.json(
      {
        error:
          "ユーザー更新に失敗しました",
      },
      {
        status: 500,
      }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const body = await req.json();
    const userId = Number(body.id);

    if (!userId) {
      return Response.json(
        {
          error:
            "削除するユーザーを選択してください",
        },
        {
          status: 400,
        }
      );
    }

    const user =
      await prisma.user.findUnique({
        where: {
          id: userId,
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

    if (
      user.role !== "TEACHER" &&
      user.role !== "STUDENT"
    ) {
      return Response.json(
        {
          error:
            "先生または生徒のみ削除できます",
        },
        {
          status: 400,
        }
      );
    }

    await prisma.$transaction([
      prisma.classRoomHistory.deleteMany({
        where: {
          userId,
        },
      }),

      prisma.diary.deleteMany({
        where: {
          studentId: userId,
        },
      }),

      prisma.user.delete({
        where: {
          id: userId,
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
          "ユーザー削除に失敗しました",
      },
      {
        status: 500,
      }
    );
  }
}

import { prisma } from "@/lib/prisma";

import {
  getSessionFromRequest,
} from "@/lib/session";

import {
  Prisma,
} from "@prisma/client";

export const dynamic = "force-dynamic";

const middleSchoolMaxGrade = 3;

const getClassRoomName = ({
  grade,
  classValue,
}: {
  grade: number;
  classValue: string;
}) => `${grade}-${classValue}`;

const getSchoolYear = (date = new Date()) =>
  date.getMonth() >= 3
    ? date.getFullYear()
    : date.getFullYear() - 1;

const getClassKey = ({
  grade,
  classValue,
}: {
  grade: number;
  classValue: string;
}) => `${grade}:${classValue}`;

const getPromotionPlan = async ({
  maxGrade,
}: {
  maxGrade: number;
}) => {
  const [students, classRooms] =
    await Promise.all([
      prisma.user.findMany({
        where: {
          role: "STUDENT",
          studentStatus: {
            not: "GRADUATED",
          },
          classRoomId: {
            not: null,
          },
        },
        select: {
          id: true,
          name: true,
          classRoomId: true,
          classRoom: true,
        },
        orderBy: {
          id: "asc",
        },
      }),
      prisma.classRoom.findMany(),
    ]);

  const classRoomByKey = new Map(
    classRooms.map((classRoom) => [
      getClassKey({
        grade: classRoom.grade,
        classValue: classRoom.class,
      }),
      classRoom,
    ])
  );

  const moveSummaries = new Map<
    string,
    {
      fromClassRoomId: number;
      fromClassName: string;
      toClassRoomId: number | null;
      toClassName: string | null;
      studentCount: number;
      willCreateClass: boolean;
    }
  >();
  const newClassSummaries = new Map<
    string,
    {
      grade: number;
      class: string;
      name: string;
    }
  >();
  const studentsToPromote = [];
  const studentsToGraduate = [];

  for (const student of students) {
    if (!student.classRoom) {
      continue;
    }

    const fromClass = student.classRoom;
    const fromClassName =
      fromClass.name ??
      getClassRoomName({
        grade: fromClass.grade,
        classValue: fromClass.class,
      });

    if (fromClass.grade >= maxGrade) {
      studentsToGraduate.push({
        id: student.id,
        name: student.name,
        fromClassRoomId: fromClass.id,
        fromClassName,
      });

      const summaryKey = `${fromClass.id}:graduate`;
      const currentSummary =
        moveSummaries.get(summaryKey);

      if (currentSummary) {
        currentSummary.studentCount += 1;
      } else {
        moveSummaries.set(summaryKey, {
          fromClassRoomId: fromClass.id,
          fromClassName,
          toClassRoomId: null,
          toClassName: null,
          studentCount: 1,
          willCreateClass: false,
        });
      }

      continue;
    }

    const toGrade = fromClass.grade + 1;
    const toClassKey = getClassKey({
      grade: toGrade,
      classValue: fromClass.class,
    });
    const toClassRoom =
      classRoomByKey.get(toClassKey);
    const toClassName = getClassRoomName({
      grade: toGrade,
      classValue: fromClass.class,
    });
    const willCreateClass =
      !toClassRoom;

    if (willCreateClass) {
      newClassSummaries.set(toClassKey, {
        grade: toGrade,
        class: fromClass.class,
        name: toClassName,
      });
    }

    studentsToPromote.push({
      id: student.id,
      name: student.name,
      fromClassRoomId: fromClass.id,
      fromClassName,
      toGrade,
      toClass: fromClass.class,
      toClassRoomId:
        toClassRoom?.id ?? null,
      toClassName,
    });

    const summaryKey = `${fromClass.id}:${toClassKey}`;
    const currentSummary =
      moveSummaries.get(summaryKey);

    if (currentSummary) {
      currentSummary.studentCount += 1;
    } else {
      moveSummaries.set(summaryKey, {
        fromClassRoomId: fromClass.id,
        fromClassName,
        toClassRoomId:
          toClassRoom?.id ?? null,
        toClassName,
        studentCount: 1,
        willCreateClass,
      });
    }
  }

  return {
    totalStudents: students.length,
    promotedStudents:
      studentsToPromote.length,
    graduatedStudents:
      studentsToGraduate.length,
    moves: [
      ...moveSummaries.values(),
    ],
    classesToCreate: [
      ...newClassSummaries.values(),
    ],
    studentsToPromote,
    studentsToGraduate,
  };
};

const getOrCreateClassRoom = async ({
  tx,
  grade,
  classValue,
}: {
  tx: Prisma.TransactionClient;
  grade: number;
  classValue: string;
}) => {
  const existingClassRoom =
    await tx.classRoom.findFirst({
      where: {
        grade,
        class: classValue,
      },
    });

  if (existingClassRoom) {
    return existingClassRoom;
  }

  return tx.classRoom.create({
    data: {
      grade,
      class: classValue,
      name: getClassRoomName({
        grade,
        classValue,
      }),
    },
  });
};

export async function POST(req: Request) {
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

  if (session.role !== "ADMIN") {
    return Response.json(
      {
        error:
          "管理者のみ実行できます",
      },
      {
        status: 403,
      }
    );
  }

  const body = await req.json();
  const schoolYear =
    Number(body.schoolYear) ||
    getSchoolYear();
  const dryRun = body.dryRun !== false;

  const plan =
    await getPromotionPlan({
      maxGrade: middleSchoolMaxGrade,
    });
  const {
    studentsToPromote,
    studentsToGraduate,
    ...publicPlan
  } = plan;

  if (dryRun) {
    return Response.json({
      dryRun: true,
      maxGrade: middleSchoolMaxGrade,
      schoolYear,
      ...publicPlan,
    });
  }

  const executedAt = new Date();

  await prisma.$transaction(
    async (tx) => {
      const nextClassRoomByKey =
        new Map<string, number>();
      const promotionGroups = new Map<
        number,
        number[]
      >();

      const promotionTargets = [
        ...new Map(
          studentsToPromote.map((item) => [
            getClassKey({
              grade: item.toGrade,
              classValue: item.toClass,
            }),
            item,
          ])
        ).values(),
      ];

      for (const item of promotionTargets) {
        const key = getClassKey({
          grade: item.toGrade,
          classValue: item.toClass,
        });

        if (!nextClassRoomByKey.has(key)) {
          const classRoom =
            await getOrCreateClassRoom({
              tx,
              grade: item.toGrade,
              classValue: item.toClass,
            });

          nextClassRoomByKey.set(
            key,
            classRoom.id
          );
        }
      }

      for (const item of studentsToPromote) {
        const key = getClassKey({
          grade: item.toGrade,
          classValue: item.toClass,
        });
        const nextClassRoomId =
          nextClassRoomByKey.get(key);

        if (!nextClassRoomId) {
          throw new Error(
            "進級先クラスの作成に失敗しました"
          );
        }

        const userIds =
          promotionGroups.get(
            nextClassRoomId
          ) ?? [];

        userIds.push(item.id);
        promotionGroups.set(
          nextClassRoomId,
          userIds
        );
      }

      const promotedUserIds =
        studentsToPromote.map(
          (item) => item.id
        );
      const graduatedUserIds =
        studentsToGraduate.map(
          (item) => item.id
        );
      const affectedUserIds = [
        ...promotedUserIds,
        ...graduatedUserIds,
      ];

      if (affectedUserIds.length > 0) {
        await tx.classRoomHistory.updateMany({
          where: {
            userId: {
              in: affectedUserIds,
            },
            endedAt: null,
          },
          data: {
            endedAt: executedAt,
          },
        });
      }

      for (const [
        classRoomId,
        userIds,
      ] of promotionGroups) {
        await tx.user.updateMany({
          where: {
            id: {
              in: userIds,
            },
          },
          data: {
            studentStatus: "ACTIVE",
            graduatedAt: null,
            graduatedSchoolYear: null,
            classRoomId,
          },
        });
      }

      if (studentsToPromote.length > 0) {
        await tx.classRoomHistory.createMany({
          data: studentsToPromote.map(
            (item) => {
              const key = getClassKey({
                grade: item.toGrade,
                classValue: item.toClass,
              });
              const classRoomId =
                nextClassRoomByKey.get(key);

              if (!classRoomId) {
                throw new Error(
                  "進級先クラスの作成に失敗しました"
                );
              }

              return {
                userId: item.id,
                classRoomId,
                schoolYear,
                startedAt: executedAt,
              };
            }
          ),
        });
      }

      if (graduatedUserIds.length > 0) {
        await tx.user.updateMany({
          where: {
            id: {
              in: graduatedUserIds,
            },
          },
          data: {
            studentStatus: "GRADUATED",
            graduatedAt: executedAt,
            graduatedSchoolYear:
              schoolYear,
            classRoomId: null,
          },
        });
      }
    },
    {
      maxWait: 10000,
      timeout: 30000,
    }
  );

  return Response.json({
    dryRun: false,
    maxGrade: middleSchoolMaxGrade,
    schoolYear,
    executedAt,
    ...publicPlan,
  });
}

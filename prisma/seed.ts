import { PrismaClient } from "@prisma/client";

import bcrypt from "bcrypt";

const prisma = new PrismaClient();

const classRoomsSeed = [
  {
    grade: 1,
    class: "A",
  },
  {
    grade: 1,
    class: "B",
  },
  {
    grade: 1,
    class: "C",
  },
];

const conditionValues = [
  "5",
  "4",
  "3",
  "2",
  "1",
];

const getDateOnly = (
  offsetDays: number
) => {
  const date = new Date();

  date.setHours(0, 0, 0, 0);
  date.setDate(
    date.getDate() - offsetDays
  );

  return date;
};

const getSchoolYear = (date = new Date()) =>
  date.getMonth() >= 3
    ? date.getFullYear()
    : date.getFullYear() - 1;

const getClassRoomName = ({
  grade,
  classValue,
}: {
  grade: number;
  classValue: string;
}) => `${grade}-${classValue}`;

const getClassRoom = async ({
  grade,
  class: classValue,
}: {
  grade: number;
  class: string;
}) => {
  const existingClassRoom =
    await prisma.classRoom.findFirst({
      where: {
        grade,
        class: classValue,
      },
    });

  if (existingClassRoom) {
    return prisma.classRoom.update({
      where: {
        id: existingClassRoom.id,
      },
      data: {
        name: getClassRoomName({
          grade,
          classValue,
        }),
      },
    });
  }

  return prisma.classRoom.create({
    data: {
      name: getClassRoomName({
        grade,
        classValue,
      }),
      grade,
      class: classValue,
    },
  });
};

const syncCurrentClassHistory =
  async ({
    userId,
    classRoomId,
  }: {
    userId: number;
    classRoomId: number;
  }) => {
    const existingCurrentHistory =
      await prisma.classRoomHistory.findFirst({
        where: {
          userId,
          classRoomId,
          endedAt: null,
        },
      });

    if (existingCurrentHistory) {
      return;
    }

    await prisma.classRoomHistory.updateMany({
      where: {
        userId,
        endedAt: null,
      },
      data: {
        endedAt: new Date(),
      },
    });

    await prisma.classRoomHistory.create({
      data: {
        userId,
        classRoomId,
        schoolYear: getSchoolYear(),
        startedAt: new Date(),
      },
    });
  };

const createDiaryIfNeeded = async ({
  studentId,
  classRoomId,
  studentNumber,
  dayOffset,
}: {
  studentId: number;
  classRoomId: number;
  studentNumber: number;
  dayOffset: number;
}) => {
  const targetDate =
    getDateOnly(dayOffset);
  const nextDate = new Date(
    targetDate
  );

  nextDate.setDate(
    nextDate.getDate() + 1
  );

  const physicalCondition =
    conditionValues[
      (studentNumber + dayOffset) %
        conditionValues.length
    ];
  const mentalCondition =
    conditionValues[
      (studentNumber + dayOffset + 2) %
        conditionValues.length
    ];

  const existingDiary =
    await prisma.diary.findFirst({
      where: {
        studentId,
        targetDate: {
          gte: targetDate,
          lt: nextDate,
        },
      },
    });

  const diaryData = {
    classRoomId,
    targetDate,
    physicalCondition,
    mentalCondition,
    comment: `${dayOffset === 0 ? "今日" : `${dayOffset}日前`}の振り返りです。授業内容を確認し、次回までに復習します。`,
    readAt:
      dayOffset >= 2
        ? new Date()
        : null,
    stampType:
      dayOffset >= 2
        ? "LIKE"
        : null,
  };

  if (existingDiary) {
    await prisma.diary.update({
      where: {
        id: existingDiary.id,
      },

      data: diaryData,
    });

    return;
  }

  await prisma.diary.create({
    data: {
      studentId,
      ...diaryData,
    },
  });
};

async function main() {
  const password = await bcrypt.hash(
    "pass",
    10
  );

  await prisma.user.upsert({
    where: {
      loginId: "admin",
    },

    update: {
      name: "管理者",
      password,
      role: "ADMIN",
      studentStatus: null,
      classRoomId: null,
    },

    create: {
      name: "管理者",

      loginId: "admin",

      password,

      role: "ADMIN",
    },
  });

  const classRooms = [];

  for (const classRoom of classRoomsSeed) {
    classRooms.push(
      await getClassRoom(classRoom)
    );
  }

  for (
    let classIndex = 0;
    classIndex < classRooms.length;
    classIndex += 1
  ) {
    const classRoom =
      classRooms[classIndex];
    const teacherNumber =
      classIndex + 1;

    const teacher =
      await prisma.user.upsert({
      where: {
        loginId: `teacher${String(
          teacherNumber
        ).padStart(3, "0")}`,
      },

      update: {
        name: `先生${String(
          teacherNumber
        ).padStart(3, "0")}`,
        password,
        role: "TEACHER",
        studentStatus: null,
        classRoomId: classRoom.id,
      },

      create: {
        name: `先生${String(
          teacherNumber
        ).padStart(3, "0")}`,
        loginId: `teacher${String(
          teacherNumber
        ).padStart(3, "0")}`,
        password,
        role: "TEACHER",
        studentStatus: null,
        classRoomId: classRoom.id,
      },
    });

    await syncCurrentClassHistory({
      userId: teacher.id,
      classRoomId: classRoom.id,
    });

    for (
      let studentIndex = 1;
      studentIndex <= 30;
      studentIndex += 1
    ) {
      const studentNumber =
        classIndex * 30 + studentIndex;
      const formattedStudentNumber =
        String(studentNumber).padStart(
          3,
          "0"
        );

      const student =
        await prisma.user.upsert({
          where: {
            loginId: `student${formattedStudentNumber}`,
          },

          update: {
            name: `生徒${formattedStudentNumber}`,
            password,
            role: "STUDENT",
            studentStatus: "ACTIVE",
            graduatedAt: null,
            graduatedSchoolYear: null,
            classRoomId: classRoom.id,
          },

          create: {
            name: `生徒${formattedStudentNumber}`,
            loginId: `student${formattedStudentNumber}`,
            password,
            role: "STUDENT",
            studentStatus: "ACTIVE",
            graduatedAt: null,
            graduatedSchoolYear: null,
            classRoomId: classRoom.id,
          },
        });

      for (
        let dayOffset = 0;
        dayOffset < 5;
        dayOffset += 1
      ) {
        await createDiaryIfNeeded({
          studentId: student.id,
          classRoomId: classRoom.id,
          studentNumber,
          dayOffset,
        });
      }

      await syncCurrentClassHistory({
        userId: student.id,
        classRoomId: classRoom.id,
      });
    }
  }
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  });

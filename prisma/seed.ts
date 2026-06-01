import { PrismaClient } from "@prisma/client";

import bcrypt from "bcrypt";

const prisma = new PrismaClient();

const classNames = [
  "1-A",
  "1-B",
  "1-C",
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

const getClassRoom = async (
  name: string
) => {
  const existingClassRoom =
    await prisma.classRoom.findFirst({
      where: {
        name,
      },
    });

  if (existingClassRoom) {
    return existingClassRoom;
  }

  return prisma.classRoom.create({
    data: {
      name,
    },
  });
};

const createDiaryIfNeeded = async ({
  studentId,
  studentNumber,
  dayOffset,
}: {
  studentId: number;
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

  for (const className of classNames) {
    classRooms.push(
      await getClassRoom(className)
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
        classRoomId: classRoom.id,
      },
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
            classRoomId: classRoom.id,
          },

          create: {
            name: `生徒${formattedStudentNumber}`,
            loginId: `student${formattedStudentNumber}`,
            password,
            role: "STUDENT",
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
          studentNumber,
          dayOffset,
        });
      }
    }
  }
}

main();

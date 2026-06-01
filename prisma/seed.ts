import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const classA = await prisma.classRoom.create({
    data: {
      name: "1-A",
    },
  });

  await prisma.user.createMany({
    data: [
      {
        name: "管理者",
        role: "ADMIN",
      },
      {
        name: "田中先生",
        role: "TEACHER",
        classRoomId: classA.id,
      },
      {
        name: "A君",
        role: "STUDENT",
        classRoomId: classA.id,
      },
    ],
  });
}

main();

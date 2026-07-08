import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const users =
    await prisma.user.findMany({
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

      orderBy: {
        id: "asc",
      },
    });

  return Response.json(users);
}

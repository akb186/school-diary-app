import { prisma } from "@/lib/prisma";

export async function GET() {
  const diaries =
    await prisma.diary.findMany({
      include: {
        student: true,
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
  const body = await req.json();

  const diary =
    await prisma.diary.create({
      data: {
        studentId:
          body.studentId,

        targetDate:
          new Date(
            body.targetDate
          ),

        physicalCondition:
          body.physicalCondition,

        mentalCondition:
          body.mentalCondition,

        comment:
          body.comment,
      },
    });

  return Response.json(
    diary
  );
}
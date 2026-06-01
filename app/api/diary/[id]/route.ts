import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: Request,
  {
    params,
  }: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  const { id } =
    await params;

  const diary =
    await prisma.diary.update({
      where: {
        id: Number(id),
      },

      data: {
        readAt:
          new Date(),

        stampType:
          "LIKE",
      },
    });

  return Response.json(
    diary
  );
}
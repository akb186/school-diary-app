import { prisma } from "@/lib/prisma";

export async function POST(
  req: Request
) {
  const body = await req.json();

  const user =
    await prisma.user.findFirst({
      where: {
        name: body.name,
      },
    });

  if (!user) {
    return Response.json(
      {
        error:
          "ユーザーが存在しません",
      },
      {
        status: 404,
      }
    );
  }

  return Response.json(user);
}
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const body = await req.json();

  const user = await prisma.user.create({
    data: {
      name: body.name,
      role: body.role,
      classRoomId: Number(body.classRoomId),
    },
  });

  return Response.json(user);
}
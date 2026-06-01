import { prisma } from "@/lib/prisma";

import {
  createSessionToken,
  sessionCookieName,
} from "@/lib/session";

import bcrypt from "bcrypt";

export async function POST(
  req: Request
) {
  const body = await req.json();

  const user =
    await prisma.user.findUnique({
      where: {
        loginId: body.loginId,
      },

      include: {
        classRoom: true,
      },
    });

  if (!user) {
    return Response.json(
      {
        error:
          "IDまたはパスワードが違います",
      },
      {
        status: 401,
      }
    );
  }

  const isMatch =
    await bcrypt.compare(
      body.password,
      user.password
    );

  if (!isMatch) {
    return Response.json(
      {
        error:
          "IDまたはパスワードが違います",
      },
      {
        status: 401,
      }
    );
  }

  const {
    password,
    ...userWithoutPassword
  } = user;

  const sessionToken =
    await createSessionToken({
      userId: user.id,
      role: user.role,
    });

  return Response.json(
    userWithoutPassword,
    {
      headers: {
        "Set-Cookie": `${sessionCookieName}=${sessionToken}; HttpOnly; SameSite=Lax; Path=/; Max-Age=604800`,
      },
    }
  );
}

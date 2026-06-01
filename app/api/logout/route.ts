import {
  sessionCookieName,
} from "@/lib/session";

export async function POST() {
  return Response.json(
    {
      success: true,
    },
    {
      headers: {
        "Set-Cookie": `${sessionCookieName}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0`,
      },
    }
  );
}

export const sessionCookieName =
  "school_diary_session";

type SessionPayload = {
  userId: number;
  role: string;
  exp: number;
};

const encoder = new TextEncoder();

const getSessionSecret = () =>
  process.env.SESSION_SECRET ||
  "school-diary-poc-session-secret";

const base64UrlEncode = (value: string) =>
  btoa(value)
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");

const base64UrlDecode = (value: string) => {
  const paddedValue =
    value +
    "=".repeat(
      (4 - (value.length % 4)) % 4
    );

  return atob(
    paddedValue
      .replaceAll("-", "+")
      .replaceAll("_", "/")
  );
};

const toHex = (buffer: ArrayBuffer) =>
  [...new Uint8Array(buffer)]
    .map((byte) =>
      byte.toString(16).padStart(2, "0")
    )
    .join("");

const fromHex = (value: string) =>
  new Uint8Array(
    value.match(/.{1,2}/g)?.map((byte) =>
      Number.parseInt(byte, 16)
    ) ?? []
  );

const getSigningKey = async () =>
  crypto.subtle.importKey(
    "raw",
    encoder.encode(getSessionSecret()),
    {
      name: "HMAC",
      hash: "SHA-256",
    },
    false,
    ["sign", "verify"]
  );

export const createSessionToken = async (
  payload: Omit<SessionPayload, "exp">
) => {
  const sessionPayload: SessionPayload = {
    ...payload,
    exp:
      Math.floor(Date.now() / 1000) +
      60 * 60 * 24 * 7,
  };

  const encodedPayload =
    base64UrlEncode(
      JSON.stringify(sessionPayload)
    );

  const key = await getSigningKey();
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(encodedPayload)
  );

  return `${encodedPayload}.${toHex(
    signature
  )}`;
};

export const verifySessionToken = async (
  token: string | undefined
) => {
  if (!token) {
    return null;
  }

  const [encodedPayload, signature] =
    token.split(".");

  if (!encodedPayload || !signature) {
    return null;
  }

  const key = await getSigningKey();
  const isValid =
    await crypto.subtle.verify(
      "HMAC",
      key,
      fromHex(signature),
      encoder.encode(encodedPayload)
    );

  if (!isValid) {
    return null;
  }

  const payload = JSON.parse(
    base64UrlDecode(encodedPayload)
  ) as SessionPayload;

  if (
    payload.exp <
    Math.floor(Date.now() / 1000)
  ) {
    return null;
  }

  return payload;
};

export const getSessionFromRequest =
  async (req: Request) => {
    const cookie = req.headers
      .get("cookie")
      ?.split(";")
      .map((value) => value.trim())
      .find((value) =>
        value.startsWith(
          `${sessionCookieName}=`
        )
      );

    const token = cookie?.split("=")[1];

    return verifySessionToken(token);
  };

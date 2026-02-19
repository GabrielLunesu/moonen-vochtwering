import { createHmac, randomBytes } from "crypto";

const SECRET = process.env.TOKEN_SECRET;

export function generateToken() {
  return randomBytes(32).toString("hex");
}

export function signToken(payload) {
  const token = generateToken();
  const signature = createHmac("sha256", SECRET)
    .update(token + JSON.stringify(payload))
    .digest("hex");
  return `${token}.${signature}`;
}

export function verifyToken(signedToken, payload) {
  const [token, signature] = signedToken.split(".");
  if (!token || !signature) return false;

  const expected = createHmac("sha256", SECRET)
    .update(token + JSON.stringify(payload))
    .digest("hex");

  // Timing-safe comparison
  if (expected.length !== signature.length) return false;
  let mismatch = 0;
  for (let i = 0; i < expected.length; i++) {
    mismatch |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
  }
  return mismatch === 0;
}

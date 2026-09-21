import { createHmac, randomInt, timingSafeEqual } from "crypto";
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { verifications } from "@/lib/db/schema";
import { createId } from "@/lib/utils";

const CODE_EXPIRY_MS = 10 * 60 * 1000;
const RESEND_DELAY_MS = 60 * 1000;
const MAX_ATTEMPTS = 5;
const IDENTIFIER_PREFIX = "staff-email-verification:";

type StoredVerification = {
  attempts: number;
  hash: string;
};

function identifierFor(email: string) {
  return `${IDENTIFIER_PREFIX}${email}`;
}

function verificationHash(identifier: string, code: string) {
  const secret = process.env.BETTER_AUTH_SECRET;
  if (!secret) throw new Error("BETTER_AUTH_SECRET is not configured.");
  return createHmac("sha256", secret).update(`${identifier}:${code}`).digest("hex");
}

function parseStoredVerification(value: string): StoredVerification | null {
  try {
    const parsed = JSON.parse(value) as Partial<StoredVerification>;
    if (typeof parsed.hash !== "string" || typeof parsed.attempts !== "number") return null;
    return { hash: parsed.hash, attempts: parsed.attempts };
  } catch {
    return null;
  }
}

function matchesHash(actual: string, expected: string) {
  const actualBuffer = Buffer.from(actual, "utf8");
  const expectedBuffer = Buffer.from(expected, "utf8");
  return actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer);
}

async function sendVerificationEmail(email: string, code: string) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from) throw new Error("Email delivery is not configured. Add RESEND_API_KEY and EMAIL_FROM.");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "User-Agent": "Hafi-email-verification/1.0",
    },
    body: JSON.stringify({
      from,
      to: [email],
      subject: "Your Hafi account verification code",
      text: `Your Hafi verification code is ${code}. It expires in 10 minutes. Do not share this code with anyone except the Hafi administrator creating your account.`,
      html: `<p>Your Hafi verification code is:</p><p style="font-size:28px;font-weight:700;letter-spacing:6px">${code}</p><p>This code expires in 10 minutes. Do not share it with anyone except the Hafi administrator creating your account.</p>`,
    }),
  });

  if (!response.ok) {
    console.error("Unable to deliver staff verification email", await response.text());
    throw new Error("The verification code could not be emailed. Check the email service configuration and try again.");
  }
}

export async function sendStaffEmailVerificationCode(email: string) {
  const identifier = identifierFor(email);
  const [existing] = await db.select({ createdAt: verifications.createdAt, expiresAt: verifications.expiresAt })
    .from(verifications)
    .where(eq(verifications.identifier, identifier))
    .orderBy(desc(verifications.createdAt))
    .limit(1);

  if (existing && existing.expiresAt > new Date() && Date.now() - existing.createdAt.getTime() < RESEND_DELAY_MS) {
    throw new Error("A code was sent recently. Wait one minute before requesting another code.");
  }

  const code = randomInt(100_000, 1_000_000).toString();
  await sendVerificationEmail(email, code);

  await db.delete(verifications).where(eq(verifications.identifier, identifier));
  await db.insert(verifications).values({
    id: createId(),
    identifier,
    value: JSON.stringify({ hash: verificationHash(identifier, code), attempts: 0 } satisfies StoredVerification),
    expiresAt: new Date(Date.now() + CODE_EXPIRY_MS),
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

export async function consumeStaffEmailVerificationCode(email: string, code: string) {
  const identifier = identifierFor(email);
  const [record] = await db.select({ id: verifications.id, value: verifications.value, expiresAt: verifications.expiresAt })
    .from(verifications)
    .where(eq(verifications.identifier, identifier))
    .orderBy(desc(verifications.createdAt))
    .limit(1);

  if (!record) return { ok: false as const, error: "Send a verification code to this email address first." };

  if (record.expiresAt <= new Date()) {
    await db.delete(verifications).where(eq(verifications.id, record.id));
    return { ok: false as const, error: "This verification code has expired. Send a new code." };
  }

  const stored = parseStoredVerification(record.value);
  if (!stored) {
    await db.delete(verifications).where(eq(verifications.id, record.id));
    return { ok: false as const, error: "This verification request is no longer valid. Send a new code." };
  }

  const expectedHash = verificationHash(identifier, code);
  if (!matchesHash(stored.hash, expectedHash)) {
    const attempts = stored.attempts + 1;
    if (attempts >= MAX_ATTEMPTS) {
      await db.delete(verifications).where(eq(verifications.id, record.id));
      return { ok: false as const, error: "Too many incorrect attempts. Send a new verification code." };
    }

    await db.update(verifications).set({ value: JSON.stringify({ hash: stored.hash, attempts } satisfies StoredVerification), updatedAt: new Date() }).where(eq(verifications.id, record.id));
    return { ok: false as const, error: `That verification code is incorrect. ${MAX_ATTEMPTS - attempts} attempts remain.` };
  }

  await db.delete(verifications).where(eq(verifications.id, record.id));
  return { ok: true as const };
}

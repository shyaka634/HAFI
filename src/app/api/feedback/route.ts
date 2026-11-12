import { NextResponse } from "next/server";
import { enforceRateLimit } from "@/lib/rate-limit";
import { feedbackSchema } from "@/lib/validation";

const FEEDBACK_RECIPIENTS = ["tshyaka6@gmail.com", "ontopserved@gmail.com"];

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character] ?? character);
}

export async function POST(request: Request) {
  const limited = await enforceRateLimit(request, "feedback");
  if (limited) return limited;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }

  const parsed = feedbackSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });
  if (parsed.data.website) return NextResponse.json({ ok: true });

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from) return NextResponse.json({ error: "unavailable" }, { status: 503 });

  const { email, message, name } = parsed.data;
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "User-Agent": "Hafi-feedback/1.0",
    },
    body: JSON.stringify({
      from,
      to: FEEDBACK_RECIPIENTS,
      reply_to: email,
      subject: "New Hafi feedback",
      text: `New feedback from ${name} (${email})\n\n${message}`,
      html: `<h1>New Hafi feedback</h1><p><strong>From:</strong> ${escapeHtml(name)} (${escapeHtml(email)})</p><p><strong>Feedback:</strong></p><p>${escapeHtml(message).replace(/\n/g, "<br />")}</p>`,
    }),
  });

  if (!response.ok) {
    console.error("Unable to send feedback email", response.status);
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }

  return NextResponse.json({ ok: true });
}

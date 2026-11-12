"use client";

import Link from "next/link";
import { ArrowLeft, MessageCircle, Send } from "lucide-react";
import { type FormEvent, useState } from "react";
import { useLocale } from "@/providers/locale-provider";
import "./feedback-design.css";

const feedbackCopy = {
  en: {
    phone: "Phone number", phonePlaceholder: "+250 788 684 086", phoneHint: "Enter a valid Rwandan mobile number.", emailOptional: "(optional)", invalidPhone: "Enter your feedback, name, and a valid Rwandan phone number. If you provide an email, it must be valid.",
    back: "Back to home", title: "Feedback", intro: "Tell us what is working well or how we can improve Hafi.", message: "Your feedback", messagePlaceholder: "Write your feedback here", name: "Name", namePlaceholder: "Your name", email: "Email", emailPlaceholder: "you@example.com", emailHint: "Your email is only used to reply to your feedback.", cancel: "Cancel", send: "Send feedback", sending: "Sending…", success: "Thank you. Your feedback has been sent.", invalid: "Please enter your feedback, name, and a valid email address.", unavailable: "We could not send your feedback right now. Please try again later.", limited: "You have sent several messages recently. Please wait and try again later.", required: "Required",
  },
  rw: {
    phone: "Numero ya telefone", phonePlaceholder: "+250 788 684 086", phoneHint: "Andika numero ya telefone y'u Rwanda yemewe.", emailOptional: "(si ngombwa)", invalidPhone: "Andika igitekerezo, amazina, na numero ya telefone y'u Rwanda yemewe. Nushyiramo email, igomba kuba yemewe.",
    back: "Subira ahabanza", title: "Ibitekerezo", intro: "Tugezaho ibitekerezo byawe ku bikora neza cyangwa icyo twanoza kuri Hafi.", message: "Igitekerezo cyawe", messagePlaceholder: "Andika hano", name: "Amazina", namePlaceholder: "Andika amazina yawe", email: "Email", emailPlaceholder: "urugero@email.com", emailHint: "Email yawe ikoreshwa gusa kugira ngo dusubize igitekerezo cyawe.", cancel: "Reka", send: "Ohereza igitekerezo", sending: "Birimo koherezwa…", success: "Murakoze. Igitekerezo cyawe cyoherejwe.", invalid: "Andika igitekerezo, amazina, na email yemewe.", unavailable: "Kohereza igitekerezo ntibikunze ubu. Ongera ugerageze nyuma.", limited: "Wohereje ubutumwa bwinshi vuba. Tegereza wongere ugerageze nyuma.", required: "Birakenewe",
  },
} as const;

export default function FeedbackPage() {
  const { locale } = useLocale();
  const copy = feedbackCopy[locale];
  const [message, setMessage] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const normalizedPhone = phone.replace(/[\s()-]/g, "");
    if (!message.trim() || !name.trim() || (normalizedPhone && !/^(?:\+250|0)7\d{8}$/.test(normalizedPhone))) {
      setStatus("error");
      setError(copy.invalidPhone);
      return;
    }

    setStatus("sending");
    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, name, phone, email, website }),
      });
      if (!response.ok) {
        setStatus("error");
        setError(response.status === 429 ? copy.limited : response.status === 400 ? copy.invalid : copy.unavailable);
        return;
      }

      setMessage("");
      setName("");
      setPhone("");
      setEmail("");
      setStatus("success");
    } catch {
      setStatus("error");
      setError(copy.unavailable);
    }
  }

  return <main className="hafi-feedback">
    <div className="hafi-feedback-container">
      <Link className="hafi-feedback-back" href="/"><ArrowLeft aria-hidden="true" size={17} />{copy.back}</Link>
      <div className="hafi-feedback-heading">
        <span className="hafi-feedback-icon"><MessageCircle aria-hidden="true" size={24} /></span>
        <div><h1>{copy.title}</h1><p>{copy.intro}</p></div>
      </div>

      <form className="hafi-feedback-form" onSubmit={submit}>
        <label className="hafi-feedback-field hafi-feedback-message-field" htmlFor="feedback-message">
          <span>{copy.message} <b aria-label={copy.required}>*</b></span>
          <textarea id="feedback-message" maxLength={1000} onChange={(event) => setMessage(event.target.value)} placeholder={copy.messagePlaceholder} required value={message} />
          <small>{message.length} / 1000</small>
        </label>
        <div className="hafi-feedback-fields">
          <label className="hafi-feedback-field" htmlFor="feedback-name"><span>{copy.name} <b aria-label={copy.required}>*</b></span><input autoComplete="name" id="feedback-name" maxLength={100} onChange={(event) => setName(event.target.value)} placeholder={copy.namePlaceholder} required value={name} /></label>
          <label className="hafi-feedback-field" htmlFor="feedback-phone"><span>{copy.phone}</span><input autoComplete="tel" id="feedback-phone" inputMode="tel" maxLength={24} onChange={(event) => setPhone(event.target.value)} pattern="[+0-9 ()-]+" placeholder={copy.phonePlaceholder} type="tel" value={phone} /><small className="hafi-feedback-phone-hint">{copy.phoneHint}</small></label>
          <label className="hafi-feedback-field hafi-feedback-email-field" htmlFor="feedback-email"><span>{copy.email} <small>{copy.emailOptional}</small></span><input autoComplete="email" id="feedback-email" maxLength={320} onChange={(event) => setEmail(event.target.value)} placeholder={copy.emailPlaceholder} type="email" value={email} /><small className="hafi-feedback-email-hint">{copy.emailHint}</small></label>
        </div>
        <input aria-hidden="true" autoComplete="off" className="hafi-feedback-trap" name="website" onChange={(event) => setWebsite(event.target.value)} tabIndex={-1} type="text" value={website} />
        {status === "success" ? <p className="hafi-feedback-success" role="status">{copy.success}</p> : null}
        {status === "error" ? <p className="hafi-feedback-error" role="alert">{error}</p> : null}
        <div className="hafi-feedback-actions"><Link href="/">{copy.cancel}</Link><button disabled={status === "sending"} type="submit"><Send aria-hidden="true" size={17} />{status === "sending" ? copy.sending : copy.send}</button></div>
      </form>
    </div>
  </main>;
}

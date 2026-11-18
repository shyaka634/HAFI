"use client";

import Link from "next/link";
import { ArrowLeft, MessageCircle, Send } from "lucide-react";
import { type FormEvent, useState } from "react";
import { useLocale } from "@/providers/locale-provider";
import "./feedback-design.css";

const feedbackCopy = {
  en: {
    phone: "Phone number", phonePlaceholder: "+250 788 684 086", phoneHint: "Enter a valid Rwandan mobile number.", emailOptional: "(optional)", invalidPhone: "Enter your feedback, name, and a valid Rwandan phone number. If you provide an email, it must be valid.",
    back: "Back to home", title: "Share Your Feedback", intro: "Let us know what you love here or how we can make things better.", message: "Your feedback", messagePlaceholder: "Write your feedback here", name: "Name", namePlaceholder: "Your name", email: "Email", emailPlaceholder: "you@example.com", emailHint: "Your email is only used to reply to your feedback.", cancel: "Cancel", send: "Send feedback", sending: "Sending…", success: "Thank you. Your feedback has been sent.", invalid: "Please enter your feedback, name, and a valid email address.", unavailable: "We could not send your feedback right now. Please try again later.", limited: "You have sent several messages recently. Please wait and try again later.", required: "Required",
  },
  rw: {
    phone: "Numero ya telefone", phonePlaceholder: "+250 788 684 086", phoneHint: "Andika numero ya telefone y'u Rwanda yemewe.", emailOptional: "(si ngombwa)", invalidPhone: "Andika igitekerezo, amazina, na numero ya telefone y'u Rwanda yemewe. Nushyiramo email, igomba kuba yemewe.",
    back: "Subira ahabanza", title: "Ibitekerezo", intro: "Tugezaho ibitekerezo byawe ku bikora neza cyangwa icyo twanoza kuri Hafi.", message: "Igitekerezo cyawe", messagePlaceholder: "Andika hano", name: "Amazina", namePlaceholder: "Andika amazina yawe", email: "Email", emailPlaceholder: "urugero@email.com", emailHint: "Email yawe ikoreshwa gusa kugira ngo dusubize igitekerezo cyawe.", cancel: "Reka", send: "Ohereza igitekerezo", sending: "Birimo koherezwa…", success: "Murakoze. Igitekerezo cyawe cyoherejwe.", invalid: "Andika igitekerezo, amazina, na email yemewe.", unavailable: "Kohereza igitekerezo ntibikunze ubu. Ongera ugerageze nyuma.", limited: "Wohereje ubutumwa bwinshi vuba. Tegereza wongere ugerageze nyuma.", required: "Birakenewe",
  },
} as const;

const PHONE_COUNTRIES = [
  { id: "RW", name: "Rwanda", callingCode: "+250" },
  { id: "BI", name: "Burundi", callingCode: "+257" },
  { id: "UG", name: "Uganda", callingCode: "+256" },
  { id: "KE", name: "Kenya", callingCode: "+254" },
  { id: "TZ", name: "Tanzania", callingCode: "+255" },
  { id: "CD", name: "Democratic Republic of the Congo", callingCode: "+243" },
  { id: "ET", name: "Ethiopia", callingCode: "+251" },
  { id: "ZA", name: "South Africa", callingCode: "+27" },
  { id: "NG", name: "Nigeria", callingCode: "+234" },
  { id: "GH", name: "Ghana", callingCode: "+233" },
  { id: "ZM", name: "Zambia", callingCode: "+260" },
  { id: "ZW", name: "Zimbabwe", callingCode: "+263" },
  { id: "BW", name: "Botswana", callingCode: "+267" },
  { id: "MW", name: "Malawi", callingCode: "+265" },
  { id: "MZ", name: "Mozambique", callingCode: "+258" },
  { id: "NA", name: "Namibia", callingCode: "+264" },
  { id: "AO", name: "Angola", callingCode: "+244" },
  { id: "CM", name: "Cameroon", callingCode: "+237" },
  { id: "SN", name: "Senegal", callingCode: "+221" },
  { id: "CI", name: "Côte d’Ivoire", callingCode: "+225" },
  { id: "EG", name: "Egypt", callingCode: "+20" },
  { id: "MA", name: "Morocco", callingCode: "+212" },
  { id: "TN", name: "Tunisia", callingCode: "+216" },
  { id: "US", name: "United States", callingCode: "+1" },
  { id: "CA", name: "Canada", callingCode: "+1" },
  { id: "MX", name: "Mexico", callingCode: "+52" },
  { id: "BR", name: "Brazil", callingCode: "+55" },
  { id: "AR", name: "Argentina", callingCode: "+54" },
  { id: "CO", name: "Colombia", callingCode: "+57" },
  { id: "GB", name: "United Kingdom", callingCode: "+44" },
  { id: "FR", name: "France", callingCode: "+33" },
  { id: "DE", name: "Germany", callingCode: "+49" },
  { id: "BE", name: "Belgium", callingCode: "+32" },
  { id: "NL", name: "Netherlands", callingCode: "+31" },
  { id: "CH", name: "Switzerland", callingCode: "+41" },
  { id: "IT", name: "Italy", callingCode: "+39" },
  { id: "ES", name: "Spain", callingCode: "+34" },
  { id: "PT", name: "Portugal", callingCode: "+351" },
  { id: "SE", name: "Sweden", callingCode: "+46" },
  { id: "NO", name: "Norway", callingCode: "+47" },
  { id: "DK", name: "Denmark", callingCode: "+45" },
  { id: "IE", name: "Ireland", callingCode: "+353" },
  { id: "IN", name: "India", callingCode: "+91" },
  { id: "PK", name: "Pakistan", callingCode: "+92" },
  { id: "BD", name: "Bangladesh", callingCode: "+880" },
  { id: "CN", name: "China", callingCode: "+86" },
  { id: "JP", name: "Japan", callingCode: "+81" },
  { id: "KR", name: "South Korea", callingCode: "+82" },
  { id: "SG", name: "Singapore", callingCode: "+65" },
  { id: "MY", name: "Malaysia", callingCode: "+60" },
  { id: "ID", name: "Indonesia", callingCode: "+62" },
  { id: "TH", name: "Thailand", callingCode: "+66" },
  { id: "PH", name: "Philippines", callingCode: "+63" },
  { id: "AE", name: "United Arab Emirates", callingCode: "+971" },
  { id: "SA", name: "Saudi Arabia", callingCode: "+966" },
  { id: "QA", name: "Qatar", callingCode: "+974" },
  { id: "TR", name: "Türkiye", callingCode: "+90" },
  { id: "AU", name: "Australia", callingCode: "+61" },
  { id: "NZ", name: "New Zealand", callingCode: "+64" },
  { id: "OTHER", name: "Other country", callingCode: "" },
] as const;

const phoneCopy = {
  en: {
    country: "Country",
    phone: "Phone number",
    phonePlaceholder: "788 684 086",
    phoneHint: "Choose a country, then enter the number without its country code.",
    countryCode: "Country code",
    invalid: "Enter your feedback and name. If you add a phone number, choose a country and enter a valid international number.",
    incompletePhone: "Enter the full phone number for the selected country.",
  },
  rw: {
    country: "Igihugu",
    phone: "Numero ya telefone",
    phonePlaceholder: "788 684 086",
    phoneHint: "Hitamo igihugu, hanyuma wandike numero ya telefone utanditse kode y'igihugu.",
    countryCode: "Kode y'igihugu",
    invalid: "Andika igitekerezo n'amazina. Nushyiramo numero ya telefone, hitamo igihugu kandi wandike numero mpuzamahanga yemewe.",
    incompletePhone: "Andika numero ya telefone yuzuye ijyanye n'igihugu wahisemo.",
  },
} as const;

function toInternationalPhone(callingCode: string, nationalNumber: string) {
  const codeDigits = callingCode.replace(/\D/g, "");
  const localDigits = nationalNumber.replace(/\D/g, "").replace(/^0+/, "");
  if (!localDigits) return "";
  const code = codeDigits ? `+${codeDigits}` : "";
  const phone = `${code}${localDigits}`;
  return /^\+[1-9]\d{6,14}$/.test(phone) ? phone : null;
}

export default function FeedbackPage() {
  const { locale } = useLocale();
  const copy = feedbackCopy[locale];
  const [message, setMessage] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [phoneCountryId, setPhoneCountryId] = useState("RW");
  const [customCountryCode, setCustomCountryCode] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [error, setError] = useState("");
  const phoneText = phoneCopy[locale];
  const selectedPhoneCountry = PHONE_COUNTRIES.find((country) => country.id === phoneCountryId) ?? PHONE_COUNTRIES[0]!;
  const callingCode = selectedPhoneCountry.callingCode || customCountryCode;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const internationalPhone = toInternationalPhone(callingCode, phone);
    if (!message.trim() || !name.trim()) {
      setStatus("error");
      setError(phoneText.invalid);
      return;
    }
    if (internationalPhone === null) {
      setStatus("error");
      setError(phoneText.incompletePhone);
      return;
    }

    setStatus("sending");
    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, name, phone: internationalPhone, email, website }),
      });
      if (!response.ok) {
        setStatus("error");
        setError(response.status === 429 ? copy.limited : response.status === 400 ? copy.invalid : copy.unavailable);
        return;
      }

      setMessage("");
      setName("");
      setPhone("");
      setPhoneCountryId("RW");
      setCustomCountryCode("");
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
          <div className="hafi-feedback-phone-fields">
            <label className="hafi-feedback-field" htmlFor="feedback-country"><span>{phoneText.country}</span><select autoComplete="tel-country-code" id="feedback-country" onChange={(event) => { setPhoneCountryId(event.target.value); if (event.target.value !== "OTHER") setCustomCountryCode(""); }} value={phoneCountryId}>{PHONE_COUNTRIES.map((country) => <option key={country.id} value={country.id}>{country.callingCode ? `${country.name} (${country.callingCode})` : country.name}</option>)}</select></label>
            <label className="hafi-feedback-field" htmlFor="feedback-phone"><span>{phoneText.phone}</span><div className="hafi-feedback-phone-input">{selectedPhoneCountry.id === "OTHER" ? <><span className="hafi-feedback-phone-prefix">+</span><input aria-label={phoneText.countryCode} className="hafi-feedback-country-code" inputMode="numeric" maxLength={4} onChange={(event) => setCustomCountryCode(event.target.value)} placeholder="250" type="tel" value={customCountryCode} /></> : <span className="hafi-feedback-phone-prefix">{callingCode}</span>}<input autoComplete="tel-national" id="feedback-phone" inputMode="tel" maxLength={20} onChange={(event) => setPhone(event.target.value)} type="tel" value={phone} /></div></label>
          </div>
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

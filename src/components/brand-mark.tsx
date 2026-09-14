export function BrandMark({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 48 48">
      <path d="M24 3C13.5 3 5 11.2 5 21.3c0 14 19 25.7 19 25.7s19-11.7 19-25.7C43 11.2 34.5 3 24 3Z" fill="#008A54" />
      <path d="M16 28.5c1.4-5.5 4.1-8.2 8-8.2 3.6 0 4.8 2.6 7.8 2.6 1.7 0 3.1-.9 4.2-2.2" stroke="#fff" strokeLinecap="round" strokeWidth="3.2" />
      <circle cx="15.5" cy="30.5" fill="#fff" r="2.5" />
      <circle cx="36.5" cy="18.5" fill="#fff" r="2.5" />
    </svg>
  );
}

import { X_URL } from "@/lib/links";

/** Official X / Twitter mark → @calderagamexyz */
export function XLink({ className = "" }: { className?: string }) {
  return (
    <a
      href={X_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Caldera on X"
      title="@calderagamexyz"
      className={[
        "inline-flex items-center justify-center border border-line text-mist transition hover:border-copper hover:text-foam",
        className,
      ].join(" ")}
    >
      <svg
        viewBox="0 0 24 24"
        aria-hidden
        className="h-3.5 w-3.5 fill-current"
      >
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.74l7.727-8.835L1.254 2.25H8.08l4.253 5.622 5.91-5.622Zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77Z" />
      </svg>
    </a>
  );
}

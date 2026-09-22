"use client";

import { useRef, useState, type RefObject } from "react";

export default function OtpInput({
  formRef,
  disabled = false,
}: {
  formRef: RefObject<HTMLFormElement | null>;
  disabled?: boolean;
}) {
  const [digits, setDigits] = useState<string[]>(Array(6).fill(""));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  function setDigit(index: number, value: string) {
    const next = [...digits];
    next[index] = value;
    setDigits(next);
    return next;
  }

  function handleChange(index: number, raw: string) {
    const value = raw.replace(/\D/g, "").slice(-1);
    const next = setDigit(index, value);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
    if (next.every((d) => d !== "")) {
      formRef.current?.requestSubmit();
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
      setDigit(index - 1, "");
    }
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 0) return;
    e.preventDefault();
    const next = Array(6).fill("");
    for (let i = 0; i < pasted.length; i++) next[i] = pasted[i];
    setDigits(next);
    inputRefs.current[Math.min(pasted.length, 6) - 1]?.focus();
    if (pasted.length === 6) {
      formRef.current?.requestSubmit();
    }
  }

  return (
    <div className="flex justify-center gap-2" role="group" aria-label="6-digit verification code">
      {digits.map((digit, i) => (
        <input
          key={i}
          ref={(el) => {
            inputRefs.current[i] = el;
          }}
          type="text"
          inputMode="numeric"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          maxLength={1}
          value={digit}
          disabled={disabled}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          aria-label={`Digit ${i + 1}`}
          className={`size-12 rounded-xl border border-navy/15 text-center text-[20px] font-semibold text-navy outline-none transition-colors focus-visible:border-sky disabled:cursor-not-allowed disabled:bg-navy/5 ${
            digit ? "border-b-2 border-b-gold" : ""
          }`}
        />
      ))}
      <input type="hidden" name="token" value={digits.join("")} />
    </div>
  );
}

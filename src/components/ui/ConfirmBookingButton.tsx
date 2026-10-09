"use client";

import { useFormStatus } from "react-dom";
import Button from "./Button";

export default function ConfirmBookingButton() {
  const { pending } = useFormStatus();
  return (
    <Button size="sm" disabled={pending}>
      {pending ? "Booking…" : "Confirm booking"}
    </Button>
  );
}

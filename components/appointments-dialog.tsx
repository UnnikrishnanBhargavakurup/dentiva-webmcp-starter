"use client";

import { useEffect, useRef, useState } from "react";
import { formatDate, getService } from "@/lib/clinic";
import type { Booking } from "@/lib/clinic";
import { Icon } from "./icons";

export function AppointmentsDialog({
  onClose,
  onBook,
}: {
  onClose: () => void;
  onBook: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [confirmReset, setConfirmReset] = useState(false);
  const [resetting, setResetting] = useState(false);
  useEffect(() => {
    const element = dialog.current!;
    const controller = new AbortController();
    element.showModal();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    fetch("/api/appointments", { signal: controller.signal, cache: "no-store" })
      .then(async (response) => {
        if (!response.ok)
          throw new Error(
            "We couldn't load the demo appointments. Please close and try again.",
          );
        const data = await response.json();
        setBookings(data.appointments);
      })
      .catch((issue: unknown) => {
        if (!controller.signal.aborted)
          setError(
            issue instanceof Error ? issue.message : "Please try again.",
          );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => {
      controller.abort();
      element.close();
      document.body.style.overflow = previous;
    };
  }, []);

  async function reset() {
    setResetting(true);
    setError("");
    try {
      const response = await fetch("/api/reset", { method: "POST" });
      if (!response.ok)
        throw new Error("The reset wasn't confirmed. Please try again.");
      setBookings([]);
      setConfirmReset(false);
    } catch (issue) {
      setError(issue instanceof Error ? issue.message : "Please try again.");
    } finally {
      setResetting(false);
    }
  }

  return (
    <dialog
      className="appointments-dialog"
      ref={dialog}
      aria-labelledby="appointments-title"
      onCancel={(event) => {
        event.preventDefault();
        if (!resetting) onClose();
      }}
    >
      <button
        className="dialog-close"
        aria-label="Close appointments"
        disabled={resetting}
        onClick={onClose}
      >
        <Icon name="close" />
      </button>
      <span className="eyebrow">A LITTLE TIME, SET ASIDE.</span>
      <h2 id="appointments-title">Demo appointments.</h2>
      <p className="details-intro">
        Saved on this computer. This fictional clinic makes no real bookings.
      </p>
      {error ? (
        <p role="alert" className="form-error">
          {error}
        </p>
      ) : null}
      {loading ? (
        <p role="status" className="empty-state">
          Finding your appointments…
        </p>
      ) : bookings.length ? (
        <div className="appointments-list">
          {bookings.map((booking) => (
            <article className="appointment-item" key={booking.id}>
              <span className="appointment-date">
                <strong>{booking.date.slice(-2)}</strong>
                <span>
                  {formatDate(booking.date, {
                    month: "short",
                    day: undefined,
                    year: undefined,
                  })}
                </span>
              </span>
              <div>
                <span className="confirmation-reference">
                  {booking.reference}
                </span>
                <h3>{getService(booking.serviceId)!.name}</h3>
                <p>
                  {formatDate(booking.date, {
                    weekday: "short",
                    month: "short",
                  })}{" "}
                  · {booking.time} London time
                </p>
                <span>
                  {booking.name} · {booking.email}
                </span>
              </div>
              <span className="confirmed-badge">
                <span className="status-dot" /> Confirmed
              </span>
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <Icon name="calendar" size={38} />
          <h3>A fresh calendar.</h3>
          <p>Pick a visit and find a little time for your smile.</p>
        </div>
      )}
      <button className="button button-black" onClick={onBook}>
        Book appointment <Icon name="arrow" />
      </button>
      {bookings.length ? (
        <div className="reset-panel">
          {confirmReset ? (
            <>
              <p>
                Reset all demo appointments? This clears the local practice
                calendar.
              </p>
              <button
                className="reset-confirm"
                disabled={resetting}
                onClick={reset}
              >
                {resetting ? "Resetting…" : "Reset all demo appointments"}
              </button>
              <button
                className="footer-link"
                disabled={resetting}
                onClick={() => setConfirmReset(false)}
              >
                Keep appointments
              </button>
            </>
          ) : (
            <button
              className="footer-link"
              onClick={() => setConfirmReset(true)}
            >
              Reset demo data
            </button>
          )}
        </div>
      ) : null}
    </dialog>
  );
}

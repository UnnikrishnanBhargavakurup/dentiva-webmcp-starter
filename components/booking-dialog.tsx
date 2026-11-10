"use client";

import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import {
  firstBookingDate,
  formatDate,
  getService,
  services,
} from "@/lib/clinic";
import type { Availability, Booking, ServiceId } from "@/lib/clinic";
import { Calendar } from "./calendar";
import { Icon } from "./icons";

export function BookingDialog({
  today,
  initialService,
  onClose,
  onViewAppointments,
}: {
  today: string;
  initialService: ServiceId;
  onClose: () => void;
  onViewAppointments: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const successHeading = useRef<HTMLHeadingElement>(null);
  const request = useRef<{ signature: string; operationId: string } | null>(
    null,
  );
  const [serviceId, setServiceId] = useState<ServiceId>(initialService);
  const [date, setDate] = useState(firstBookingDate(today));
  const [month, setMonth] = useState(date.slice(0, 7));
  const [time, setTime] = useState("");
  const [availability, setAvailability] = useState<Availability | null>(null);
  const [loading, setLoading] = useState(true);
  const [availabilityError, setAvailabilityError] = useState("");
  const [refresh, setRefresh] = useState(0);
  const [step, setStep] = useState<"time" | "details">("time");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [appointment, setAppointment] = useState<Booking | null>(null);
  const service = getService(serviceId)!;

  useEffect(() => {
    const element = dialog.current!;
    element.showModal();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      element.close();
      document.body.style.overflow = previous;
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setAvailabilityError("");
    fetch(`/api/availability?date=${date}&service=${serviceId}`, {
      signal: controller.signal,
      cache: "no-store",
    })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok)
          throw new Error(data.error ?? "We couldn't load appointment times.");
        setAvailability(data);
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted)
          setAvailabilityError(
            error instanceof Error
              ? error.message
              : "Please try loading times again.",
          );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [date, serviceId, refresh]);

  useEffect(() => {
    if (appointment) successHeading.current?.focus();
  }, [appointment]);

  function chooseDate(value: string) {
    setDate(value);
    setTime("");
    setSaveError("");
  }
  function chooseService(value: ServiceId) {
    setServiceId(value);
    setTime("");
    setSaveError("");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setSaveError("");
    const payload = { serviceId, date, time, name, email };
    const signature = JSON.stringify(payload);
    if (request.current?.signature !== signature)
      request.current = { signature, operationId: crypto.randomUUID() };
    try {
      const response = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...payload,
          operationId: request.current!.operationId,
        }),
        signal: AbortSignal.timeout(15000),
      });
      const data = await response.json();
      if (!response.ok) {
        if (response.status === 409) {
          setTime("");
          setRefresh((value) => value + 1);
          setStep("time");
        }
        throw new Error(
          data.error ??
            "We couldn't confirm the save. Please retry the same booking.",
        );
      }
      setAppointment(data.appointment);
    } catch (error) {
      setSaveError(
        error instanceof Error &&
          error.name !== "TimeoutError" &&
          error.name !== "TypeError"
          ? error.message
          : "We couldn't confirm whether your booking saved. Retry with the same details to check without creating a duplicate.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <dialog
      className="booking-dialog"
      ref={dialog}
      aria-labelledby="booking-title"
      onCancel={(event) => {
        event.preventDefault();
        if (!saving) onClose();
      }}
    >
      <button
        className="dialog-close"
        aria-label="Close booking form"
        onClick={onClose}
        disabled={saving}
      >
        <Icon name="close" size={20} />
      </button>
      {appointment ? (
        <div className="booking-success">
          <span className="success-icon">
            <Icon name="check" size={30} />
          </span>
          <span className="eyebrow">A LITTLE SOMETHING TO SMILE ABOUT.</span>
          <h2 id="booking-title" tabIndex={-1} ref={successHeading}>
            You’re all booked.
          </h2>
          <p>Your demo appointment is confirmed and saved on this computer.</p>
          <div className="confirmation-card">
            <span className="confirmation-reference">
              {appointment.reference}
            </span>
            <h3>{getService(appointment.serviceId)!.name}</h3>
            <p>{formatDate(appointment.date, { weekday: "long" })}</p>
            <strong>
              {appointment.time} · London time · {service.duration} minutes
            </strong>
            <hr />
            <span>{appointment.name}</span>
            <span>{appointment.email}</span>
          </div>
          <p className="fine-print">
            This is a fictional clinic. No real appointment or email has been
            sent.
          </p>
          <button className="button button-black" onClick={onViewAppointments}>
            View demo appointments <Icon name="arrow" />
          </button>
          <button className="text-button" onClick={onClose}>
            Back to the website
          </button>
        </div>
      ) : (
        <div className="booking-layout">
          <aside className="booking-aside">
            <span className="brand">
              <span className="brand-mark">
                <Icon name="tooth" size={22} />
              </span>
              dentiva
            </span>
            <span className="eyebrow">LET’S FIND YOUR TIME.</span>
            <h2 id="booking-title">
              Make time <br />
              for your <br />
              <span>smile.</span>
            </h2>
            <p>
              A visit that fits your day.
              <br />
              Care that feels like you.
            </p>
            <div className="booking-aside-summary">
              <Icon name="tooth" size={28} />
              <div>
                <strong>{service.name}</strong>
                <span>{service.duration} minutes · London, UK</span>
              </div>
            </div>
            <span className="demo-note">
              Learning demo
              <br />
              Please use fictional patient details.
            </span>
          </aside>
          <div className="booking-main">
            <div className="booking-steps" aria-label="Booking progress">
              <span className={step === "time" ? "active" : "complete"}>
                01 <span>Visit & time</span>
              </span>
              <i />
              <span className={step === "details" ? "active" : ""}>
                02 <span>Your details</span>
              </span>
            </div>
            {step === "time" ? (
              <>
                <h3 className="booking-section-title">
                  A good day for a little care.
                </h3>
                <fieldset className="service-picker">
                  <legend>Choose your visit</legend>
                  {services.map((item) => (
                    <label
                      key={item.id}
                      className={serviceId === item.id ? "selected" : ""}
                    >
                      <input
                        type="radio"
                        name="service"
                        value={item.id}
                        checked={serviceId === item.id}
                        onChange={() => chooseService(item.id)}
                      />
                      <span>
                        {item.name}
                        <small>{item.duration} min</small>
                      </span>
                    </label>
                  ))}
                </fieldset>
                <div className="booking-time-grid">
                  <Calendar
                    today={today}
                    selected={date}
                    month={month}
                    onMonth={setMonth}
                    onSelect={chooseDate}
                  />
                  <fieldset className="time-picker">
                    <legend>Available times</legend>
                    <p>
                      {formatDate(date, { month: "short", year: undefined })}
                      <span>London time</span>
                    </p>
                    {loading ? (
                      <div className="slot-message" role="status">
                        Finding your time…
                      </div>
                    ) : availabilityError ? (
                      <div className="slot-message" role="alert">
                        {availabilityError}
                        <button
                          className="text-button"
                          onClick={() => setRefresh((value) => value + 1)}
                        >
                          Try again
                        </button>
                      </div>
                    ) : availability?.slots.length ? (
                      <div className="time-slots">
                        {availability.slots.map((slot) => (
                          <label
                            key={slot.time}
                            className={time === slot.time ? "selected" : ""}
                          >
                            <input
                              type="radio"
                              name="appointmentTime"
                              value={slot.time}
                              checked={time === slot.time}
                              onChange={() => {
                                setTime(slot.time);
                                setSaveError("");
                              }}
                            />
                            <span>{slot.label}</span>
                          </label>
                        ))}
                      </div>
                    ) : (
                      <div className="slot-message">
                        All booked for this day. Let’s try another date.
                      </div>
                    )}
                  </fieldset>
                </div>
                {saveError ? (
                  <p className="form-error" role="alert">
                    {saveError}
                  </p>
                ) : null}
                <div className="booking-actions">
                  <span>
                    <Icon name="clock" size={14} /> A little time, just for you.
                  </span>
                  <button
                    className="button button-black"
                    disabled={!time || loading || Boolean(availabilityError)}
                    onClick={() => setStep("details")}
                  >
                    Continue <Icon name="arrow" size={18} />
                  </button>
                </div>
              </>
            ) : (
              <form className="details-form" onSubmit={submit}>
                <button
                  type="button"
                  className="back-button"
                  onClick={() => {
                    setStep("time");
                    setRefresh((value) => value + 1);
                  }}
                  disabled={saving}
                >
                  <Icon name="chevron-left" size={15} /> Back to calendar
                </button>
                <h3 className="booking-section-title">
                  Lovely. Who’s visiting?
                </h3>
                <p className="details-intro">
                  Just a couple of details for your demo appointment.
                </p>
                <label className="form-field">
                  Full name
                  <input
                    name="patientName"
                    autoComplete="off"
                    placeholder="Alex Taylor"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    required
                    minLength={2}
                    maxLength={100}
                    disabled={saving}
                  />
                </label>
                <label className="form-field">
                  Email address
                  <input
                    name="patientEmail"
                    type="email"
                    autoComplete="off"
                    placeholder="alex@example.com"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                    maxLength={254}
                    disabled={saving}
                  />
                </label>
                <div className="booking-review">
                  <span className="review-icon">
                    <Icon name="calendar" size={24} />
                  </span>
                  <div>
                    <strong>{service.name}</strong>
                    <span>
                      {formatDate(date, {
                        weekday: "short",
                        month: "short",
                        year: undefined,
                      })}{" "}
                      · {time} London time
                    </span>
                    <small>
                      {service.duration} minutes · Dentiva demo clinic
                    </small>
                  </div>
                  <button
                    type="button"
                    className="footer-link"
                    disabled={saving}
                    onClick={() => {
                      setStep("time");
                      setRefresh((value) => value + 1);
                    }}
                  >
                    Change
                  </button>
                </div>
                {saveError ? (
                  <p className="form-error" role="alert">
                    {saveError}
                  </p>
                ) : null}
                <p className="fine-print">
                  This saves a demo booking locally. No real clinic is contacted
                  and no email is sent.
                </p>
                <button
                  type="submit"
                  className="button button-black confirm-button"
                  disabled={saving}
                >
                  {saving
                    ? "Confirming your booking…"
                    : "Confirm demo appointment"}
                  <Icon name={saving ? "clock" : "arrow"} size={18} />
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </dialog>
  );
}

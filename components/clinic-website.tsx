"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { services } from "@/lib/clinic";
import type { ServiceId } from "@/lib/clinic";
import { BookingDialog } from "./booking-dialog";
import { AppointmentsDialog } from "./appointments-dialog";
import { Icon } from "./icons";

export function ClinicWebsite({ today }: { today: string }) {
  const [bookingService, setBookingService] = useState<ServiceId | null>(null);
  const [showAppointments, setShowAppointments] = useState(false);
  const [ready, setReady] = useState(false);

  // Browser agents can click immediately after navigation. Enable actions only
  // after hydration has attached their handlers, so that first click is retained.
  useEffect(() => setReady(true), []);

  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <div className="site-frame">
        <section className="hero" id="home" aria-label="Welcome to Dentiva">
          <header className="site-header">
            <a className="brand" href="#home" aria-label="Dentiva home">
              <span className="brand-mark">
                <Icon name="tooth" size={23} />
              </span>
              dentiva<span className="brand-dot">®</span>
            </a>
            <nav className="desktop-nav" aria-label="Main navigation">
              <a href="#home">Home</a>
              <a href="#services">Our services</a>
              <a href="#clinic">Our clinic</a>
              <a href="#contact">Contact</a>
            </nav>
            <button
              className="header-appointment"
              disabled={!ready}
              onClick={() => setShowAppointments(true)}
            >
              <Icon name="calendar" size={15} />
              <span>Appointments</span>
            </button>
          </header>

          <main id="main-content" className="hero-content">
            <div className="hero-eyebrow">
              <span className="status-dot" /> A little care goes a long way
            </div>
            <div className="opening-hours">
              <span>YOUR FRIENDLY NEIGHBOURHOOD CLINIC</span>
              <p>
                Monday — Saturday
                <br />
                09:00 — 17:00
              </p>
            </div>
            <h1 className="hero-heading">
              <span className="heading-left">
                Exceptional
                <br />
                <span className="white-word">Dental</span>{" "}
                <span className="light-word">Care.</span>
              </span>
              <span className="heading-right">
                <span className="white-word">&</span> brighter
                <br />
                <span className="light-word">smiles.</span>
              </span>
            </h1>
            <div className="hero-description">
              <p>
                Good care. A gentle touch. A smile that feels like you. Let’s
                make your next visit a little brighter.
              </p>
              <button
                className="button button-black"
                disabled={!ready}
                onClick={() => setBookingService("checkup")}
              >
                Book appointment <Icon name="arrow" size={21} />
              </button>
              <span className="booking-note">
                A few clicks. A little peace of mind.
              </span>
            </div>
            <div className="hero-location">
              <Icon name="pin" size={15} /> London, UK
            </div>

            <div className="tooth-stage" aria-hidden="true">
              <div className="tooth-glow" />
              <Image
                className="hero-tooth"
                src="/tooth-implant.png"
                alt=""
                width={640}
                height={960}
                priority
                sizes="(max-width: 700px) 78vw, 44vw"
              />
              <svg className="orbit" viewBox="0 0 600 220" fill="none">
                <ellipse
                  cx="300"
                  cy="110"
                  rx="285"
                  ry="45"
                  transform="rotate(13 300 110)"
                  stroke="white"
                  strokeOpacity=".7"
                />
                <circle cx="30" cy="50" r="4" fill="white" />
                <circle cx="562" cy="162" r="4" stroke="white" />
              </svg>
              <span className="tooth-sparkle sparkle-one">✧</span>
              <span className="tooth-sparkle sparkle-two">✧</span>
              <div className="floating-label label-left">
                <span>Routine check-up</span>
                <strong>
                  30 min <span>↗</span>
                </strong>
              </div>
              <div className="floating-label label-right">
                <span>Smile consultation</span>
                <strong>
                  45 min <span>↗</span>
                </strong>
              </div>
            </div>

            <div className="hero-footnote">
              <span className="small-plus">✳</span>
              <p>
                A calmer kind
                <br />
                of dental care.
              </p>
            </div>
            <div className="hero-side-note">
              <span>
                Made for
                <br />
                every smile.
              </span>
              <div className="circle-arrow">
                <Icon name="smile" size={23} />
              </div>
            </div>
            <div className="hero-watermark" aria-hidden="true">
              Dentiva
            </div>
            <a className="scroll-hint" href="#services">
              Discover the difference <span>↓</span>
            </a>
          </main>
        </section>

        <section
          className="services-section content-section"
          id="services"
          aria-labelledby="services-title"
        >
          <div className="section-top">
            <span className="eyebrow">
              <span className="tiny-cross">+</span> GOOD CARE, SIMPLY.
            </span>
            <span className="section-number">01 / OUR SERVICES</span>
          </div>
          <div className="section-heading-row">
            <h2 id="services-title">
              A little care.
              <br />
              <span>A lot to smile about.</span>
            </h2>
            <p>
              From a simple check-up to a fresh perspective.
              <br />
              Find a visit that feels right for you.
            </p>
          </div>
          <div className="service-grid">
            {services.map((service, index) => (
              <article
                className={`service-card service-${index}`}
                key={service.id}
              >
                <div className="service-card-top">
                  <Icon name={service.icon} size={38} />
                  <span>0{index + 1}</span>
                </div>
                <div>
                  <span className="service-tag">{service.tag}</span>
                  <h3>{service.name}</h3>
                  <p>{service.description}</p>
                </div>
                <div className="service-bottom">
                  <span>
                    <Icon name="clock" size={14} /> {service.duration} minutes
                  </span>
                  <button
                    className="round-button"
                    disabled={!ready}
                    aria-label={`Book ${service.name}`}
                    onClick={() => setBookingService(service.id)}
                  >
                    <Icon name="arrow-up" size={21} />
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section
          className="clinic-section content-section"
          id="clinic"
          aria-labelledby="clinic-title"
        >
          <div className="clinic-illustration" aria-hidden="true">
            <span className="clinic-illustration-label">COME AS YOU ARE.</span>
            <div className="smile-sculpture">
              <span />
              <span />
              <i />
            </div>
            <span className="clinic-asterisk">✳</span>
            <span className="clinic-illustration-bottom">
              Leave with a little more confidence. ↗
            </span>
          </div>
          <div className="clinic-copy">
            <span className="eyebrow">02 / A WARMER WELCOME</span>
            <h2 id="clinic-title">
              People first.
              <br />
              <span>Teeth, too.</span>
            </h2>
            <p>
              We believe a dental visit should feel comfortable from the very
              first hello. Clear conversations, time for your questions, and
              care at your pace.
            </p>
            <div className="clinic-values">
              <span>
                <Icon name="check" size={16} /> Room for your questions
              </span>
              <span>
                <Icon name="check" size={16} /> Simple online booking
              </span>
              <span>
                <Icon name="check" size={16} /> A welcoming first visit
              </span>
            </div>
            <button
              className="text-button"
              disabled={!ready}
              onClick={() => setBookingService("consultation")}
            >
              Let’s find your time <Icon name="arrow" />
            </button>
          </div>
        </section>

        <section className="contact-section content-section" id="contact">
          <span className="eyebrow">YOUR NEXT SMILE STARTS HERE.</span>
          <div>
            <h2>
              We saved you
              <br />
              <span>a little time.</span>
            </h2>
            <button
              className="button button-black"
              disabled={!ready}
              onClick={() => setBookingService("checkup")}
            >
              Book appointment <Icon name="arrow" />
            </button>
          </div>
          <p>London, UK · Monday — Saturday · 09:00–17:00</p>
        </section>
        <footer className="site-footer">
          <a className="brand" href="#home">
            <span className="brand-mark">
              <Icon name="tooth" size={20} />
            </span>
            dentiva<span className="brand-dot">®</span>
          </a>
          <p>
            Fictional clinic · Demo bookings only · Made to learn with Skillbum.
          </p>
          <button
            className="footer-link"
            disabled={!ready}
            onClick={() => setShowAppointments(true)}
          >
            View demo appointments <Icon name="arrow-up" size={14} />
          </button>
        </footer>
      </div>
      <p className="outside-caption">A little care. A brighter smile.</p>

      {bookingService ? (
        <BookingDialog
          today={today}
          initialService={bookingService}
          onClose={() => setBookingService(null)}
          onViewAppointments={() => {
            setBookingService(null);
            setShowAppointments(true);
          }}
        />
      ) : null}
      {showAppointments ? (
        <AppointmentsDialog
          onClose={() => setShowAppointments(false)}
          onBook={() => {
            setShowAppointments(false);
            setBookingService("checkup");
          }}
        />
      ) : null}
    </>
  );
}

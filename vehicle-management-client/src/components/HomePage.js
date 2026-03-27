import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  FaArrowRight,
  FaBolt,
  FaBusAlt,
  FaCarSide,
  FaClipboardCheck,
  FaEnvelope,
  FaMapMarkerAlt,
  FaMotorcycle,
  FaPhoneAlt,
  FaShieldAlt,
  FaShuttleVan,
  FaTools,
  FaTruckPickup,
  FaWarehouse,
} from "react-icons/fa";
import logoMark from "../assets/vehicleops-logo.svg";
import sparePartsHero from "../assets/auto-parts-spare-car-background-d-illustration-282738187.webp";
import sparePartsGear from "../assets/istockphoto-1212230930-612x612.jpg";
import sparePartsAssembly from "../assets/istockphoto-528679231-612x612.jpg";
import sparePartsOem from "../assets/OEM1.webp";
import batteryDisplay from "../assets/amaron-automotive-battery.jpg";
import batteryAlt from "../assets/exide-car-battery-500x500.webp";
import batteryWide from "../assets/part-batteries-bu9094ra-no-back-us.jpg";
import workshopIntroVideo from "../assets/WhatsApp Video 2026-03-17 at 11.50.55 AM.mp4";
import { getSpareParts } from "../services/api";

function HomePage() {
  const [spareParts, setSpareParts] = useState([]);
  const [partsLoading, setPartsLoading] = useState(true);
  const workshopAddress = "Workshop Operations Suite, Service Hub Road, India";
  const workshopMapUrl =
    "https://www.openstreetmap.org/export/embed.html?bbox=72.8079%2C18.9940%2C72.8479%2C19.0240&layer=mapnik&marker=19.0090%2C72.8279";
  const workshopDirectionsUrl =
    "https://www.google.com/maps/search/?api=1&query=19.0090,72.8279";

  const highlights = [
    {
      title: "Vehicle Tracking",
      text: "Maintain complete vehicle records with owner details, registration numbers, and service history.",
      icon: FaCarSide,
    },
    {
      title: "Service Workflow",
      text: "Handle reception, inspection, job cards, invoicing, and delivery status through one workflow.",
      icon: FaTools,
    },
    {
      title: "Billing Records",
      text: "Prepare organized bills and maintain records that are easy for staff and customers to understand.",
      icon: FaClipboardCheck,
    },
    {
      title: "Parts Inventory",
      text: "Monitor available parts, supplier information, pricing, and stock levels without manual registers.",
      icon: FaWarehouse,
    },
    {
      title: "Battery Stock",
      text: "Show battery products separately for quick replacement work and better inventory visibility.",
      icon: FaBolt,
    },
    {
      title: "User Access",
      text: "Support controlled access for staff and administrators working on day-to-day workshop tasks.",
      icon: FaShieldAlt,
    },
  ];

  const stats = [
    { label: "Daily operations", value: "Vehicles, Service, Billing" },
    { label: "Available modules", value: "Dashboard, Parts, Reports" },
    { label: "Suitable for", value: "Garages and service centers" },
  ];

  const vehicleSymbols = [
    { label: "Sedan", icon: FaCarSide },
    { label: "SUV", icon: FaTruckPickup },
    { label: "Van", icon: FaShuttleVan },
    { label: "Bike", icon: FaMotorcycle },
    { label: "Taxi", icon: FaCarSide },
    { label: "Bus", icon: FaBusAlt },
  ];
  const carBrands = [
    "Alfa Romeo",
    "Aston Martin",
    "Audi",
    "Bentley",
    "BMW",
    "Cadillac",
    "Chery",
    "Chevrolet",
    "Citroen",
    "Daihatsu",
    "Dodge",
    "Ferrari",
    "Fiat",
    "Ford",
    "GMC",
    "Hino",
    "Honda",
    "Hummer",
    "Hyundai",
    "Infiniti",
    "Isuzu",
    "Jaguar",
    "Jeep",
    "Kia",
    "Lancia",
    "Land Rover",
    "Lexus",
    "Lincoln",
    "Mazda",
    "Maserati",
    "Mercedes-Benz",
    "Mini",
    "Mitsubishi",
    "Nissan",
    "Opel",
    "Peugeot",
    "Porsche",
    "Ram",
    "Renault",
    "Seat",
    "Subaru",
    "Toyota",
    "Volkswagen",
    "Volvo",
  ];

  const testimonials = [
    {
      quote: "The system helps us keep vehicle details and billing records in a much more organized way.",
      name: "Rohit Sharma",
      role: "Workshop Manager",
    },
    {
      quote: "Spare parts, service entries, and job cards are now easier to handle because the team uses one dashboard.",
      name: "Anita Patel",
      role: "Service Coordinator",
    },
    {
      quote: "The interface gives a clear and professional impression, which is useful for both staff and customers.",
      name: "Vikram Joshi",
      role: "Operations Lead",
    },
  ];

  useEffect(() => {
    let isMounted = true;

    const loadSpareParts = async () => {
      try {
        const partsResponse = await getSpareParts();
        if (!isMounted) return;
        setSpareParts(Array.isArray(partsResponse?.data) ? partsResponse.data : []);
      } catch (error) {
        if (!isMounted) return;
        console.error("Failed to load spare parts for homepage:", error);
        setSpareParts([]);
      } finally {
        if (isMounted) setPartsLoading(false);
      }
    };

    loadSpareParts();

    return () => {
      isMounted = false;
    };
  }, []);

  const featuredParts = useMemo(() => spareParts.slice(0, 6), [spareParts]);

  const formatCurrency = (value) => {
    const amount = Number(value);
    if (!Number.isFinite(amount)) return "Rs 0.00";
    return `Rs ${amount.toFixed(2)}`;
  };

  return (
    <main className="homepage-shell homepage-enter overflow-hidden">
      <section className="relative isolate">
        <div className="homepage-hero-glow homepage-hero-glow-animate absolute inset-0 opacity-90" />
        <div className="relative min-h-[760px] px-0 py-0 sm:min-h-[840px] lg:min-h-[900px]">
          <div className="homepage-glass-surface homepage-visual-enter animate-fade-up min-h-[760px] overflow-hidden border-y border-[var(--border-color)] backdrop-blur-xl sm:rounded-none sm:border-x-0 sm:min-h-[840px] lg:min-h-[900px]">
            <div className="relative min-h-[760px] overflow-hidden sm:min-h-[840px] lg:min-h-[900px]">
              <div className="absolute inset-0 flex items-center justify-center px-5 py-8 sm:px-8 lg:px-12">
                <div className="relative h-[82%] w-full max-w-[78rem] overflow-hidden rounded-[28px] border border-white/15 shadow-[0_24px_70px_rgba(15,23,42,0.35)]">
                  <video
                    className="h-full w-full object-cover object-center"
                    autoPlay
                    muted
                    loop
                    playsInline
                  >
                    <source src={workshopIntroVideo} type="video/mp4" />
                  </video>
                  <div className="absolute inset-0 bg-gradient-to-r from-slate-950/88 via-slate-950/52 to-slate-950/18" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/78 via-slate-950/22 to-slate-950/12" />
                </div>
              </div>
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(15,23,42,0.18),_transparent_52%)]" />

              <div className="absolute inset-0">
                <div className="mx-auto flex min-h-[760px] w-full max-w-7xl flex-col px-6 py-8 sm:min-h-[840px] sm:px-10 lg:min-h-[900px] lg:px-14 lg:py-10">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="homepage-glass-pill homepage-pill-enter inline-flex items-center gap-3 rounded-full border border-white/20 bg-white/10 px-4 py-2 backdrop-blur">
                      <img src={logoMark} alt="VehicleOps logo" className="h-10 w-10 rounded-2xl" />
                      <div>
                        <div className="text-sm font-semibold tracking-tight text-white">VehicleOps</div>
                        <div className="text-[11px] uppercase tracking-[0.22em] text-white/75">
                          Workshop Software
                        </div>
                      </div>
                    </div>
                    <div className="hero-kicker inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-white">
                      Workshop Management Platform
                    </div>
                  </div>

                  <div className="flex flex-1 items-center py-8 sm:py-10 lg:py-12">
                    <div className="max-w-[40rem]">
                      <h1 className="max-w-[11ch] font-serif text-[2.2rem] leading-[0.92] tracking-[-0.05em] text-white sm:text-[3.1rem] lg:text-[3.8rem]">
                        Smarter workshop management for vehicles, service jobs, spare parts, and billing.
                      </h1>
                      <p className="mt-4 max-w-[33rem] text-sm leading-7 text-slate-100/95 sm:text-[15px] sm:leading-7">
                        VehicleOps is designed for service centers that want a clean digital system for
                        customer vehicles, workshop activity, inventory, and invoice preparation.
                      </p>

                      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                        <Link
                          to="/login"
                          className="inline-flex items-center justify-center rounded-2xl bg-white px-6 py-3.5 text-sm font-semibold text-slate-950 shadow-[0_12px_30px_rgba(255,255,255,0.18)] transition hover:bg-slate-100"
                        >
                          Enter Workspace
                          <FaArrowRight className="ml-2" />
                        </Link>
                        <a
                          href="#about"
                          className="inline-flex items-center justify-center rounded-2xl border border-white/25 bg-slate-950/30 px-6 py-3.5 text-sm font-semibold text-white backdrop-blur transition hover:bg-slate-950/40"
                        >
                          About Us
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-7xl px-4 pt-8 sm:px-6 sm:pt-10 lg:px-8 lg:pt-12">
        <div className="grid gap-3 sm:grid-cols-3">
          {stats.map((item, index) => (
            <div
              key={item.label}
              className={`stat-surface animate-fade-up rounded-[22px] border border-[var(--border-color)] bg-[var(--surface-1)] p-5 shadow-[0_18px_42px_rgba(15,23,42,0.12)] ${index === 0 ? "animate-delay-1" : index === 1 ? "animate-delay-2" : "animate-delay-3"}`}
            >
              <div className="snapshot-label text-sm font-medium">{item.label}</div>
              <div className="snapshot-value mt-2 text-lg font-semibold tracking-tight">{item.value}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <div className="animate-fade-up mb-6 max-w-2xl">
          <div className="hero-kicker inline-flex rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.28em]">
            Vehicle Showcase
          </div>
          <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-[var(--text-primary)] sm:text-4xl">
            Explore the range of vehicles your workshop can manage every day.
          </h2>
          <p className="mt-3 text-base leading-7 text-[var(--text-muted)]">
            A moving showcase of common vehicle categories handled across service, inspection, repair, and delivery workflows.
          </p>
        </div>

        <div className="homepage-vehicle-slider rounded-[30px] border border-[var(--border-color)] bg-[var(--surface-1)] p-4 shadow-[0_18px_42px_rgba(15,23,42,0.08)]">
          <div className="homepage-vehicle-track">
            {[...vehicleSymbols, ...vehicleSymbols].map(({ label, icon: Icon }, index) => (
              <div key={`${label}-${index}`} className="homepage-vehicle-card">
                <span className="homepage-vehicle-icon">
                  <Icon />
                </span>
                <span className="homepage-vehicle-label">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8 lg:py-8">
        <div className="animate-fade-up mb-6 max-w-3xl">
          <div className="hero-kicker inline-flex rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.28em]">
            Brand Showcase
          </div>
          <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-[var(--text-primary)] sm:text-4xl">
            Support service operations across a wide range of trusted vehicle brands.
          </h2>
          <p className="mt-3 text-base leading-7 text-[var(--text-muted)]">
            From daily city cars to premium vehicles, this section highlights the brands a modern workshop may inspect, service, and maintain.
          </p>
        </div>

        <div className="homepage-brand-slider rounded-[30px] border border-[var(--border-color)] bg-[var(--surface-1)] p-4 shadow-[0_18px_42px_rgba(15,23,42,0.08)]">
          <div className="homepage-brand-track">
            {[...carBrands, ...carBrands].map((brand, index) => (
              <div key={`${brand}-${index}`} className="homepage-brand-card">
                <span className="homepage-brand-mark">Auto</span>
                <span className="homepage-brand-label">{brand}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="animate-fade-up mb-8 max-w-2xl">
          <div className="hero-kicker inline-flex rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.28em]">
            Core Benefits
          </div>
          <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-[var(--text-primary)] sm:text-4xl">
            Built to simplify routine workshop work and improve record management.
          </h2>
          <p className="mt-3 text-base leading-7 text-[var(--text-muted)]">
            From the front desk to the service bay, the application brings daily tasks into one
            structured system.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-6">
          {highlights.map(({ title, text, icon: Icon }, index) => (
            <article
              key={title}
              className={`stat-surface animate-fade-up rounded-[28px] p-6 ${index === 0 ? "animate-delay-1" : index === 1 ? "animate-delay-2" : index === 2 ? "animate-delay-3" : "animate-delay-4"}`}
            >
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--icon-bg)] text-[var(--icon-fg)]">
                <Icon className="text-xl" />
              </div>
              <h3 className="mt-5 text-xl font-semibold tracking-tight text-[var(--text-primary)]">
                {title}
              </h3>
              <p className="mt-3 text-sm leading-7 text-[var(--text-muted)]">{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8 lg:py-10">
        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="animate-fade-up grid gap-4">
            <div className="homepage-media-card rounded-[32px] border border-[var(--border-color)] p-4">
              <img
                src={sparePartsHero}
                alt="Gear and transmission spare parts"
                className="w-full rounded-[24px] object-cover"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="homepage-media-card rounded-[28px] border border-[var(--border-color)] p-3">
                <img
                  src={sparePartsGear}
                  alt="Spare gear parts"
                  className="h-full w-full rounded-[20px] object-cover"
                />
              </div>
              <div className="homepage-media-card rounded-[28px] border border-[var(--border-color)] p-3">
                <img
                  src={sparePartsAssembly}
                  alt="Workshop spare parts assembly"
                  className="h-full w-full rounded-[20px] object-cover"
                />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {[sparePartsHero, sparePartsOem, sparePartsGear].map((imageSrc, index) => (
                <div
                  key={`parts-shot-${index}`}
                  className={`homepage-media-card rounded-[24px] border border-[var(--border-color)] p-3 ${
                    index === 0 ? "animate-fade-up animate-delay-1" : index === 1 ? "animate-fade-up animate-delay-2" : "animate-fade-up animate-delay-3"
                  }`}
                >
                  <img
                    src={imageSrc}
                    alt={index === 1 ? "OEM spare parts" : "Workshop spare parts"}
                    className="h-[180px] w-full rounded-[18px] object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
          <div className="homepage-media-card animate-fade-up animate-delay-2 flex flex-col justify-center rounded-[32px] border border-[var(--border-color)] p-8">
            <div className="hero-kicker inline-flex rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.28em]">
              Spare Parts Section
            </div>
            <h2 className="mt-5 text-3xl font-semibold tracking-[-0.04em] text-[var(--text-primary)]">
              Keep mechanical parts visible, organized, and ready for workshop use.
            </h2>
            <p className="mt-4 text-base leading-8 text-[var(--text-muted)]">
              The spare-parts area highlights transmission parts, workshop stock, supplier-related items,
              and inventory information so the system reflects real garage operations.
            </p>
            <div className="mt-6">
              <Link
                to="/login"
                className="hero-soft-button inline-flex items-center justify-center rounded-2xl px-6 py-3.5 text-sm font-semibold transition"
              >
                Explore Admin Workspace
                <FaArrowRight className="ml-2" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8 lg:py-10">
        <div className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
          <div className="homepage-battery-panel animate-fade-up animate-delay-2 flex flex-col justify-center rounded-[32px] border p-8">
            <div className="homepage-battery-badge inline-flex w-fit items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.28em]">
              <FaBolt />
              Battery Section
            </div>
            <h2 className="mt-5 text-3xl font-semibold tracking-[-0.04em] text-[var(--text-primary)]">
              Present battery products separately for quicker customer attention.
            </h2>
            <p className="mt-4 text-base leading-8 text-[var(--text-muted)]">
              Battery items are commonly treated as a separate category in service centers. This layout
              gives them a dedicated area for replacement and electrical maintenance work.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="homepage-battery-card rounded-[22px] border p-4">
                <div className="homepage-battery-label text-xs font-semibold uppercase tracking-[0.16em]">Use Case</div>
                <div className="mt-2 text-sm font-medium text-[var(--text-primary)]">Battery replacement and electrical checks</div>
              </div>
              <div className="homepage-battery-card rounded-[22px] border p-4">
                <div className="homepage-battery-label text-xs font-semibold uppercase tracking-[0.16em]">Customer View</div>
                <div className="mt-2 text-sm font-medium text-[var(--text-primary)]">Shows product availability in a clearer format</div>
              </div>
            </div>
          </div>

          <div className="homepage-battery-gallery animate-fade-up rounded-[32px] border p-4">
            <div className="grid gap-4 md:grid-cols-[1.25fr_0.75fr]">
              <div className="homepage-battery-image rounded-[26px] p-3">
                <img
                  src={batteryDisplay}
                  alt="Workshop batteries and electrical replacement products"
                  className="h-full w-full rounded-[20px] object-cover"
                />
              </div>
              <div className="grid gap-4">
                {[batteryAlt, batteryWide].map((imageSrc, index) => (
                  <div
                    key={`battery-shot-${index}`}
                    className="homepage-battery-image rounded-[24px] border p-3"
                  >
                    <img
                      src={imageSrc}
                      alt={index === 0 ? "Battery section product display" : "Automotive batteries showcase"}
                      className="h-[180px] w-full rounded-[18px] object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-12">
        <div className="animate-fade-up mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <div className="hero-kicker inline-flex rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.28em]">
              Inventory Preview
            </div>
            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-[var(--text-primary)]">
              Current workshop parts available in the system.
            </h2>
            <p className="mt-3 text-base leading-7 text-[var(--text-muted)]">
              This preview shows that the software manages physical workshop stock along with service
              and billing records.
            </p>
          </div>
          <div className="rounded-full border border-[var(--border-color)] bg-[var(--surface-1)] px-4 py-2 text-sm font-medium text-[var(--text-primary)]">
            {spareParts.length} parts in inventory
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {partsLoading ? (
            Array.from({ length: 3 }).map((_, index) => (
              <div
                key={`loading-${index}`}
                className={`stat-surface animate-fade-up rounded-[28px] p-6 ${index === 0 ? "animate-delay-1" : index === 1 ? "animate-delay-2" : "animate-delay-3"}`}
              >
                <div className="h-4 w-28 rounded-full bg-slate-200/80 theme-night:bg-white/10" />
                <div className="mt-5 h-7 w-40 rounded-full bg-slate-200/70 theme-night:bg-white/10" />
                <div className="mt-4 h-4 w-full rounded-full bg-slate-200/60 theme-night:bg-white/10" />
                <div className="mt-2 h-4 w-2/3 rounded-full bg-slate-200/60 theme-night:bg-white/10" />
              </div>
            ))
          ) : featuredParts.length > 0 ? (
            featuredParts.map((part, index) => (
              <article
                key={part.part_id}
                className={`stat-surface animate-fade-up rounded-[28px] p-6 ${index === 0 ? "animate-delay-1" : index === 1 ? "animate-delay-2" : index === 2 ? "animate-delay-3" : "animate-delay-4"}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--text-muted)]">
                      {part.category || "Workshop Part"}
                    </div>
                    <h3 className="mt-3 text-xl font-semibold tracking-tight text-[var(--text-primary)]">
                      {part.part_name}
                    </h3>
                  </div>
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--icon-bg)] text-[var(--icon-fg)]">
                    <FaWarehouse className="text-lg" />
                  </div>
                </div>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-[20px] bg-[var(--surface-2)] px-4 py-3">
                    <div className="text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">Part No.</div>
                    <div className="mt-2 text-sm font-semibold text-[var(--text-primary)]">{part.part_number}</div>
                  </div>
                  <div className="rounded-[20px] bg-[var(--surface-2)] px-4 py-3">
                    <div className="text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">Stock</div>
                    <div className="mt-2 text-sm font-semibold text-[var(--text-primary)]">{part.stock_qty} units</div>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">Supplier</div>
                    <div className="mt-1 text-sm text-[var(--text-primary)]">{part.supplier || "Workshop Supply Partner"}</div>
                  </div>
                  <div className="rounded-full bg-[var(--icon-bg)] px-4 py-2 text-sm font-semibold text-[var(--icon-fg)]">
                    {formatCurrency(part.unit_price)}
                  </div>
                </div>
              </article>
            ))
          ) : (
            <div className="stat-surface animate-fade-up rounded-[28px] p-6 md:col-span-2 xl:col-span-3">
              <div className="text-lg font-semibold text-[var(--text-primary)]">No spare parts added yet.</div>
              <p className="mt-2 text-sm leading-7 text-[var(--text-muted)]">
                Once spare parts are added in the admin workspace, they will also appear here on the home screen.
              </p>
            </div>
          )}
        </div>
      </section>

      <section id="about" className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="animate-fade-up rounded-[32px] border border-[var(--border-color)] bg-[var(--surface-1)] p-8 shadow-[0_18px_42px_rgba(15,23,42,0.08)]">
            <div className="hero-kicker inline-flex rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.28em]">
              About Us
            </div>
            <h2 className="mt-5 text-3xl font-semibold tracking-[-0.04em] text-[var(--text-primary)]">
              A workshop-focused system built to improve day-to-day management.
            </h2>
            <p className="mt-4 text-base leading-8 text-[var(--text-muted)]">
              VehicleOps brings together vehicle entry, service operations, job cards, spare parts,
              and billing into one application. It is intended to help workshops replace scattered
              manual records with a more structured and efficient digital workflow.
            </p>
          </div>

          <div className="homepage-about-panel animate-fade-up animate-delay-2 rounded-[32px] border border-[var(--border-color)] p-8">
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="homepage-about-card rounded-[24px] p-5">
                <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                  Mission
                </div>
                <p className="mt-3 text-sm leading-7 text-[var(--text-primary)]">
                  Support garages and service businesses with a single system for routine operations.
                </p>
              </div>
              <div className="homepage-about-card rounded-[24px] p-5">
                <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                  Experience
                </div>
                <p className="mt-3 text-sm leading-7 text-[var(--text-primary)]">
                  Improve clarity for staff and present a more organized process for customers.
                </p>
              </div>
              <div className="homepage-about-card rounded-[24px] p-5">
                <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                  Best For
                </div>
                <p className="mt-3 text-sm leading-7 text-[var(--text-primary)]">
                  Workshops, garages, and vehicle service centers handling multiple vehicles each day.
                </p>
              </div>
              <div className="homepage-about-card rounded-[24px] p-5">
                <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                  Value
                </div>
                <p className="mt-3 text-sm leading-7 text-[var(--text-primary)]">
                  Better record handling, quicker admin work, and easier invoice preparation.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-12">
        <div className="animate-fade-up mb-8 max-w-2xl">
          <div className="hero-kicker inline-flex rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.28em]">
            Testimonials
          </div>
          <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-[var(--text-primary)]">
            Feedback that reflects everyday workshop use.
          </h2>
        </div>
        <div className="grid gap-5 lg:grid-cols-3">
          {testimonials.map((item, index) => (
            <article
              key={item.name}
              className={`stat-surface animate-fade-up rounded-[28px] p-6 ${index === 0 ? "animate-delay-1" : index === 1 ? "animate-delay-2" : "animate-delay-3"}`}
            >
              <p className="text-base leading-8 text-[var(--text-primary)]">"{item.quote}"</p>
              <div className="mt-6">
                <div className="text-lg font-semibold text-[var(--text-primary)]">{item.name}</div>
                <div className="text-sm text-[var(--text-muted)]">{item.role}</div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="animate-fade-up rounded-[32px] border border-[var(--border-color)] bg-[var(--surface-1)] p-8 shadow-[0_18px_42px_rgba(15,23,42,0.08)]">
          <div className="grid gap-8 lg:grid-cols-[1fr_0.9fr] lg:items-start">
            <div>
              <div className="hero-kicker inline-flex rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.28em]">
                Contact
              </div>
              <h2 className="mt-5 text-3xl font-semibold tracking-[-0.04em] text-[var(--text-primary)]">
                A simple workshop software identity with practical business use.
              </h2>
              <p className="mt-4 max-w-2xl text-base leading-8 text-[var(--text-muted)]">
                VehicleOps is intended for workshops that need a better way to manage customer vehicles,
                job records, stock items, and billing details in one place.
              </p>
            </div>
            <div className="grid gap-4">
              <div className="rounded-[24px] border border-[var(--border-color)] bg-[var(--surface-2)] p-5">
                <div className="flex items-center gap-3 text-[var(--text-primary)]">
                  <FaPhoneAlt />
                  <span>+91 98765 43210</span>
                </div>
              </div>
              <div className="rounded-[24px] border border-[var(--border-color)] bg-[var(--surface-2)] p-5">
                <div className="flex items-center gap-3 text-[var(--text-primary)]">
                  <FaEnvelope />
                  <span>contact@vehicleops.local</span>
                </div>
              </div>
              <div className="rounded-[24px] border border-[var(--border-color)] bg-[var(--surface-2)] p-5">
                <div className="flex items-center gap-3 text-[var(--text-primary)]">
                  <FaMapMarkerAlt />
                  <span>{workshopAddress}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="rounded-[28px] border border-[var(--border-color)] bg-[var(--surface-2)] p-6">
              <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                Workshop Location
              </div>
              <h3 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-[var(--text-primary)]">
                Find the service center on the map.
              </h3>
              <p className="mt-3 text-sm leading-7 text-[var(--text-muted)]">
                The home page now includes a live map block so visitors can quickly identify the workshop
                location before logging into the system.
              </p>
              <div className="mt-5 rounded-[22px] border border-[var(--border-color)] bg-[var(--surface-1)] px-4 py-3 text-sm text-[var(--text-primary)]">
                {workshopAddress}
              </div>
              <a
                href={workshopDirectionsUrl}
                target="_blank"
                rel="noreferrer"
                className="hero-soft-button mt-5 inline-flex items-center justify-center rounded-2xl px-5 py-3 text-sm font-semibold transition"
              >
                Open In Google Maps
                <FaArrowRight className="ml-2" />
              </a>
            </div>

            <div className="overflow-hidden rounded-[28px] border border-[var(--border-color)] bg-[var(--surface-2)] p-3 shadow-[0_18px_42px_rgba(15,23,42,0.08)]">
              <iframe
                title="VehicleOps workshop location map"
                src={workshopMapUrl}
                className="h-[320px] w-full rounded-[22px] border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        </div>
      </section>

      <footer className="mx-auto max-w-7xl px-4 pb-10 pt-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 rounded-[28px] border border-[var(--border-color)] bg-[var(--surface-1)] px-6 py-5 text-sm text-[var(--text-muted)] shadow-[0_14px_32px_rgba(15,23,42,0.08)] sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <img src={logoMark} alt="VehicleOps logo" className="h-10 w-10 rounded-2xl" />
            <div>
              <div className="font-semibold text-[var(--text-primary)]">VehicleOps</div>
              <div>Workshop management and service tracking system</div>
            </div>
          </div>
          <div>Vehicle records, spare parts, job cards, batteries, and billing in one system.</div>
        </div>
      </footer>
    </main>
  );
}

export default HomePage;

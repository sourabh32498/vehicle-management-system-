import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaBars,
  FaBolt,
  FaBell,
  FaBoxes,
  FaCar,
  FaChartLine,
  FaCheckCircle,
  FaChevronDown,
  FaClipboardList,
  FaDoorOpen,
  FaExclamationTriangle,
  FaHome,
  FaInfoCircle,
  FaMoon,
  FaPowerOff,
  FaSearch,
  FaUserCheck,
  FaUserShield,
  FaUsers,
  FaVolumeMute,
  FaVolumeUp,
  FaWrench,
} from "react-icons/fa";
import {
  getActivitySummary,
  getBatteries,
  getJobCards,
  getServices,
  getSpareParts,
  getVehicles,
} from "../services/api";
import logoMark from "../assets/vehicleops-logo.svg";

const basePanelClass =
  "rounded-[24px] border shadow-[0_10px_28px_rgba(15,23,42,0.08)] transition-colors duration-300";

const TIME_RANGE_CONFIG = {
  day: { size: 7, label: "Daily", title: "Last 7 days" },
  month: { size: 8, label: "Monthly", title: "Last 8 months" },
  year: { size: 6, label: "Yearly", title: "Last 6 years" },
};

const getDateBucketKey = (date, range) => {
  if (range === "year") {
    return `${date.getFullYear()}`;
  }
  if (range === "month") {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  }
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}`;
};

const createTimeBuckets = (range, offset = 0) => {
  const config = TIME_RANGE_CONFIG[range] || TIME_RANGE_CONFIG.month;
  const now = new Date();
  const bucketMap = new Map();
  const buckets = [];

  if (range === "year") {
    const anchorYear = now.getFullYear() - offset * config.size;
    for (let index = config.size - 1; index >= 0; index -= 1) {
      const year = anchorYear - index;
      const date = new Date(year, 0, 1);
      const bucket = {
        key: getDateBucketKey(date, range),
        label: `${year}`,
        shortLabel: `${String(year).slice(-2)}`,
        services: 0,
        completed: 0,
        jobCards: 0,
        revenue: 0,
        pending: 0,
      };
      buckets.push(bucket);
      bucketMap.set(bucket.key, bucket);
    }
    return { buckets, bucketMap };
  }

  if (range === "month") {
    const anchor = new Date(now.getFullYear(), now.getMonth(), 1);
    anchor.setMonth(anchor.getMonth() - offset * config.size);
    for (let index = config.size - 1; index >= 0; index -= 1) {
      const date = new Date(anchor.getFullYear(), anchor.getMonth() - index, 1);
      const bucket = {
        key: getDateBucketKey(date, range),
        label: date.toLocaleString("en-US", { month: "short", year: "numeric" }),
        shortLabel: date.toLocaleString("en-US", { month: "short" }),
        services: 0,
        completed: 0,
        jobCards: 0,
        revenue: 0,
        pending: 0,
      };
      buckets.push(bucket);
      bucketMap.set(bucket.key, bucket);
    }
    return { buckets, bucketMap };
  }

  const anchor = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  anchor.setDate(anchor.getDate() - offset * config.size);
  for (let index = config.size - 1; index >= 0; index -= 1) {
    const date = new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate() - index);
    const bucket = {
      key: getDateBucketKey(date, range),
      label: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      shortLabel: date.toLocaleDateString("en-US", { weekday: "short" }),
      services: 0,
      completed: 0,
      jobCards: 0,
      revenue: 0,
      pending: 0,
    };
    buckets.push(bucket);
    bucketMap.set(bucket.key, bucket);
  }
  return { buckets, bucketMap };
};

function Dashboard() {
  const navigate = useNavigate();

  const [vehiclesCount, setVehiclesCount] = useState(0);
  const [servicesCount, setServicesCount] = useState(0);
  const [pendingServices, setPendingServices] = useState(0);
  const [inProgressServices, setInProgressServices] = useState(0);
  const [completedServices, setCompletedServices] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [jobCardsCount, setJobCardsCount] = useState(0);
  const [sparePartsCount, setSparePartsCount] = useState(0);
  const [batteryCount, setBatteryCount] = useState(0);
  const [lowSparePartsCount, setLowSparePartsCount] = useState(0);
  const [lowBatteryCount, setLowBatteryCount] = useState(0);
  const [recentSpareParts, setRecentSpareParts] = useState([]);
  const [recentBatteries, setRecentBatteries] = useState([]);
  const [pendingJobCards, setPendingJobCards] = useState(0);
  const [completedJobCards, setCompletedJobCards] = useState(0);
  const [recentServices, setRecentServices] = useState([]);
  const [recentJobCards, setRecentJobCards] = useState([]);
  const [activitySummary, setActivitySummary] = useState([]);
  const [services, setServices] = useState([]);
  const [jobCards, setJobCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [themeMode, setThemeMode] = useState(() => {
    const storedTheme = localStorage.getItem("theme_mode");
    return storedTheme === "night" ? "night" : "day";
  });
  const [overviewMetric, setOverviewMetric] = useState("revenue");
  const [overviewRange, setOverviewRange] = useState("month");
  const [overviewOffset, setOverviewOffset] = useState(0);
  const [activityTypeFilter, setActivityTypeFilter] = useState("all");
  const [inventoryMenuOpen, setInventoryMenuOpen] = useState(true);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [readNotifications, setReadNotifications] = useState(() => {
    try {
      const stored = localStorage.getItem("dashboard_read_notifications");
      return stored ? JSON.parse(stored) : {};
    } catch (storageError) {
      return {};
    }
  });
  const [toastNotifications, setToastNotifications] = useState([]);
  const [notificationSoundEnabled, setNotificationSoundEnabled] = useState(() => {
    const storedPreference = localStorage.getItem("dashboard_notification_sound");
    return storedPreference === null ? true : storedPreference === "true";
  });
  const [bellAlertPulse, setBellAlertPulse] = useState(false);
  const isNight = themeMode === "night";
  const notificationsRef = useRef(null);
  const hasHydratedNotificationsRef = useRef(false);
  const bellPulseTimerRef = useRef(null);

  const role = localStorage.getItem("auth_role") || "";
  const isAdmin = role === "admin" || role === "super_admin";

  let currentUser = {};
  try {
    currentUser = JSON.parse(localStorage.getItem("auth_user") || "{}");
  } catch (parseError) {
    currentUser = {};
  }

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      setError("");

      try {
        const [vehiclesResult, servicesResult, jobCardsResult, sparePartsResult, batteriesResult, activitySummaryResult] = await Promise.allSettled([
          getVehicles(),
          getServices(),
          getJobCards(),
          getSpareParts(),
          getBatteries(),
          getActivitySummary(),
        ]);

        const vehiclesList =
          vehiclesResult.status === "fulfilled" && Array.isArray(vehiclesResult.value?.data)
            ? vehiclesResult.value.data
            : [];
        const servicesList =
          servicesResult.status === "fulfilled" && Array.isArray(servicesResult.value?.data)
            ? servicesResult.value.data
            : [];
        const jobCardsList =
          jobCardsResult.status === "fulfilled" && Array.isArray(jobCardsResult.value?.data)
            ? jobCardsResult.value.data
            : [];
        const sparePartsList =
          sparePartsResult.status === "fulfilled" && Array.isArray(sparePartsResult.value?.data)
            ? sparePartsResult.value.data
            : [];
        const batteriesList =
          batteriesResult.status === "fulfilled" && Array.isArray(batteriesResult.value?.data)
            ? batteriesResult.value.data
            : [];
        const activitySummaryList =
          activitySummaryResult.status === "fulfilled" && Array.isArray(activitySummaryResult.value?.data)
            ? activitySummaryResult.value.data
            : [];

        setVehiclesCount(vehiclesList.length);
        setServicesCount(servicesList.length);
        setServices(servicesList);
        setJobCards(jobCardsList);
        setSparePartsCount(sparePartsList.length);
        setBatteryCount(batteriesList.length);
        setLowSparePartsCount(sparePartsList.filter((part) => Number(part.stock_qty || 0) <= 5).length);
        setLowBatteryCount(batteriesList.filter((battery) => Number(battery.stock_qty || 0) <= 5).length);
        setRecentSpareParts(sparePartsList.slice(0, 4));
        setRecentBatteries(batteriesList.slice(0, 4));

        const pendingCount = servicesList.filter(
          (service) => String(service.status || "").toLowerCase() === "pending"
        ).length;
        const inProgressCount = servicesList.filter(
          (service) => String(service.status || "").toLowerCase() === "in progress"
        ).length;
        const completedCount = servicesList.filter((service) => {
          const status = String(service.status || "").toLowerCase();
          return status === "completed" || status === "delivered";
        }).length;
        const revenue = servicesList.reduce((sum, service) => {
          const value = parseFloat(service.cost);
          return sum + (Number.isFinite(value) ? value : 0);
        }, 0);

        setPendingServices(pendingCount);
        setInProgressServices(inProgressCount);
        setCompletedServices(completedCount);
        setTotalRevenue(revenue);

        setJobCardsCount(jobCardsList.length);
        setPendingJobCards(
          jobCardsList.filter((jobCard) => String(jobCard.status || "").toLowerCase() === "pending")
            .length
        );
        setCompletedJobCards(
          jobCardsList.filter((jobCard) => {
            const status = String(jobCard.status || "").toLowerCase();
            return status === "completed" || status === "delivered";
          }).length
        );

        setRecentServices(servicesList.slice(0, 5));
        setRecentJobCards(jobCardsList.slice(0, 5));
        setActivitySummary(activitySummaryList);

        if (
          vehiclesResult.status === "rejected" &&
          servicesResult.status === "rejected" &&
          jobCardsResult.status === "rejected" &&
          sparePartsResult.status === "rejected" &&
          batteriesResult.status === "rejected" &&
          activitySummaryResult.status === "rejected"
        ) {
          setError("Unable to load dashboard data.");
        }
      } catch (requestError) {
        console.error("Dashboard load error:", requestError);
        setError("Unable to load dashboard data.");
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  useEffect(() => {
    document.body.classList.remove("theme-day", "theme-night");
    document.body.classList.add(themeMode === "night" ? "theme-night" : "theme-day");
    localStorage.setItem("theme_mode", themeMode);
  }, [themeMode]);

  useEffect(() => {
    localStorage.setItem("dashboard_read_notifications", JSON.stringify(readNotifications));
  }, [readNotifications]);

  useEffect(() => {
    localStorage.setItem("dashboard_notification_sound", String(notificationSoundEnabled));
  }, [notificationSoundEnabled]);

  useEffect(() => {
    const timers = toastNotifications.map((toast) =>
      window.setTimeout(() => {
        dismissToast(toast.id);
      }, 4500)
    );

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [toastNotifications]);

  const roleLabel =
    role === "super_admin"
      ? "Super Admin"
      : role === "admin"
        ? "Admin"
        : role
          ? role.charAt(0).toUpperCase() + role.slice(1)
          : "Staff";
  const displayName = currentUser.name || currentUser.username || "Admin User";
  const firstName = displayName.split(" ")[0] || "Admin";

  const avatarInitials = useMemo(() => {
    return displayName
      .split(" ")
      .map((part) => part[0] || "")
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }, [displayName]);

  const formatDate = (value) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value).slice(0, 10);

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatCurrency = (value) => {
    const amount = Number(value);
    if (!Number.isFinite(amount)) return "Rs 0.00";
    return `Rs ${amount.toFixed(2)}`;
  };

  const buildFilteredPath = useCallback((basePath, filters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && String(value).trim() !== "") {
        params.set(key, String(value));
      }
    });
    const query = params.toString();
    return query ? `${basePath}?${query}` : basePath;
  }, []);

  const formatDateTime = (value) => {
    if (!value) return "No activity yet";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toLocaleString();
  };

  const inProgressJobCards =
    jobCardsCount - pendingJobCards - completedJobCards < 0
      ? 0
      : jobCardsCount - pendingJobCards - completedJobCards;
  const activeWorkload =
    pendingServices + inProgressServices + pendingJobCards + inProgressJobCards;
  const roleActivityCards = useMemo(
    () =>
      activitySummary.map((item) => ({
        role: item.role,
        users: Number(item.user_count) || 0,
        logins: Number(item.login_count) || 0,
        logouts: Number(item.logout_count) || 0,
        lastLogin: item.last_login_at,
        lastLogout: item.last_logout_at,
      })),
    [activitySummary]
  );

  const monthlyActivity = useMemo(() => {
    const buckets = [];
    const bucketMap = new Map();

    for (let offset = 7; offset >= 0; offset -= 1) {
      const date = new Date();
      date.setDate(1);
      date.setMonth(date.getMonth() - offset);

      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      const bucket = {
        key,
        label: date.toLocaleString("en-US", { month: "short" }),
        services: 0,
        completed: 0,
        jobCards: 0,
        revenue: 0,
      };

      buckets.push(bucket);
      bucketMap.set(key, bucket);
    }

    services.forEach((service) => {
      const date = new Date(service.service_date || service.created_at || "");
      if (Number.isNaN(date.getTime())) return;

      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      const bucket = bucketMap.get(key);
      if (!bucket) return;

      bucket.services += 1;
      const revenue = Number.parseFloat(service.cost);
      if (Number.isFinite(revenue)) {
        bucket.revenue += revenue;
      }

      const status = String(service.status || "").toLowerCase();
      if (status === "completed" || status === "delivered") {
        bucket.completed += 1;
      }
    });

    jobCards.forEach((jobCard) => {
      const date = new Date(jobCard.service_date || jobCard.created_at || "");
      if (Number.isNaN(date.getTime())) return;

      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      const bucket = bucketMap.get(key);
      if (!bucket) return;

      bucket.jobCards += 1;
    });

    return buckets;
  }, [jobCards, services]);

  const overviewBuckets = useMemo(() => {
    const { buckets, bucketMap } = createTimeBuckets(overviewRange, overviewOffset);

    services.forEach((service) => {
      const date = new Date(service.service_date || service.created_at || "");
      if (Number.isNaN(date.getTime())) return;

      const bucket = bucketMap.get(getDateBucketKey(date, overviewRange));
      if (!bucket) return;

      bucket.services += 1;

      const revenue = Number.parseFloat(service.cost);
      if (Number.isFinite(revenue)) {
        bucket.revenue += revenue;
      }

      const status = String(service.status || "").toLowerCase();
      if (status === "completed" || status === "delivered") {
        bucket.completed += 1;
      }
      if (status === "pending") {
        bucket.pending += 1;
      }
    });

    jobCards.forEach((jobCard) => {
      const date = new Date(jobCard.service_date || jobCard.created_at || "");
      if (Number.isNaN(date.getTime())) return;

      const bucket = bucketMap.get(getDateBucketKey(date, overviewRange));
      if (!bucket) return;
      bucket.jobCards += 1;

      const status = String(jobCard.status || "").toLowerCase();
      if (status === "pending") {
        bucket.pending += 1;
      }
    });

    return buckets;
  }, [jobCards, overviewOffset, overviewRange, services]);

  const overviewSeries = useMemo(() => {
    if (overviewMetric === "orders") {
      return overviewBuckets.map((bucket) => bucket.jobCards);
    }
    if (overviewMetric === "profit") {
      return overviewBuckets.map((bucket) => bucket.completed);
    }
    return overviewBuckets.map((bucket) => bucket.revenue);
  }, [overviewBuckets, overviewMetric]);

  const overviewConfig = useMemo(() => {
    if (overviewMetric === "orders") {
      return {
        title: "Job card volume and intake trend.",
        fill: "rgba(16,185,129,0.16)",
        stroke: "#10b981",
        accent: "#34d399",
        prefix: "",
      };
    }

    if (overviewMetric === "profit") {
      return {
        title: "Completed work trend by month.",
        fill: "rgba(245,158,11,0.16)",
        stroke: "#f59e0b",
        accent: "#fbbf24",
        prefix: "",
      };
    }

    return {
      title: "Monthly revenue generated from recorded workshop services.",
      fill: "rgba(37,99,235,0.16)",
      stroke: "#2563eb",
      accent: "#60a5fa",
      prefix: "Rs ",
    };
  }, [overviewMetric]);

  const formatOverviewValue = (value) => {
    const amount = Number(value) || 0;
    if (overviewMetric === "revenue") {
      return new Intl.NumberFormat("en-IN", {
        notation: "compact",
        maximumFractionDigits: amount >= 100000 ? 1 : 0,
      }).format(amount);
    }
    return amount.toLocaleString("en-IN");
  };

  const overviewChart = useMemo(() => {
    const minX = 8;
    const maxX = 94;
    const minY = 12;
    const maxY = 86;
    const highestValue = Math.max(1, ...overviewSeries);
    const points = overviewSeries.map((value, index) => {
      const x =
        overviewSeries.length === 1
          ? (minX + maxX) / 2
          : minX + (index / Math.max(1, overviewSeries.length - 1)) * (maxX - minX);
      const y = maxY - (value / highestValue) * (maxY - minY);
      return { x, y, value, label: overviewBuckets[index]?.label || "" };
    });

    const buildSmoothPath = (chartPoints) => {
      if (!chartPoints.length) return "";
      if (chartPoints.length === 1) return `M ${chartPoints[0].x} ${chartPoints[0].y}`;

      let path = `M ${chartPoints[0].x} ${chartPoints[0].y}`;
      for (let index = 1; index < chartPoints.length; index += 1) {
        const previous = chartPoints[index - 1];
        const current = chartPoints[index];
        const midX = (previous.x + current.x) / 2;
        const midY = (previous.y + current.y) / 2;
        path += ` Q ${previous.x} ${previous.y} ${midX} ${midY}`;
      }
      const lastPoint = chartPoints[chartPoints.length - 1];
      path += ` T ${lastPoint.x} ${lastPoint.y}`;
      return path;
    };

    const linePath = buildSmoothPath(points);
    const areaPath = points.length
      ? `${linePath} L ${points[points.length - 1].x} ${maxY} L ${points[0].x} ${maxY} Z`
      : "";

    const ticks = Array.from({ length: 4 }, (_, index) => {
      const value = Math.round((highestValue * (4 - index)) / 4);
      return {
        value,
        y: minY + ((maxY - minY) / 3) * index,
      };
    });

    return {
      areaPath,
      linePath,
      points,
      ticks,
    };
  }, [overviewBuckets, overviewSeries]);

  const overviewSummary = useMemo(() => {
    const total = overviewSeries.reduce((sum, value) => sum + value, 0);
    const average = overviewSeries.length ? total / overviewSeries.length : 0;
    const latest = overviewSeries[overviewSeries.length - 1] || 0;
    const previous = overviewSeries[overviewSeries.length - 2] || 0;
    const change = previous > 0 ? ((latest - previous) / previous) * 100 : latest > 0 ? 100 : 0;

    return { average, change, latest, total };
  }, [overviewSeries]);

  const overviewRangeLabel = TIME_RANGE_CONFIG[overviewRange]?.title || "Trend";

  const comparisonChart = useMemo(() => {
    const highestValue = Math.max(
      1,
      ...overviewBuckets.flatMap((bucket) => [bucket.services, bucket.jobCards, bucket.completed])
    );

    return overviewBuckets.map((bucket) => ({
      key: bucket.key,
      label: bucket.shortLabel,
      servicesHeight: (bucket.services / highestValue) * 100,
      jobCardsHeight: (bucket.jobCards / highestValue) * 100,
      completedHeight: (bucket.completed / highestValue) * 100,
    }));
  }, [overviewBuckets]);

  const revenueMix = useMemo(() => {
    const revenuePeak = Math.max(1, ...overviewBuckets.map((bucket) => bucket.revenue));
    const pendingPeak = Math.max(1, ...overviewBuckets.map((bucket) => bucket.pending));

    return overviewBuckets.map((bucket) => ({
      key: bucket.key,
      label: bucket.shortLabel,
      revenueHeight: (bucket.revenue / revenuePeak) * 100,
      pendingHeight: (bucket.pending / pendingPeak) * 100,
      revenueValue: bucket.revenue,
      pendingValue: bucket.pending,
    }));
  }, [overviewBuckets]);

  const playNotificationChime = useCallback(() => {
    if (!notificationSoundEnabled || typeof window === "undefined") return;

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;

    try {
      const audioContext = new AudioContextClass();
      if (audioContext.state === "suspended") {
        audioContext.resume().catch(() => {});
      }
      const now = audioContext.currentTime;
      const masterGain = audioContext.createGain();
      masterGain.gain.setValueAtTime(0.075, now);
      masterGain.connect(audioContext.destination);
      const notes = [
        { frequency: 880, start: now, duration: 0.1, type: "triangle" },
        { frequency: 1174.66, start: now + 0.1, duration: 0.12, type: "sine" },
        { frequency: 1318.51, start: now + 0.22, duration: 0.16, type: "triangle" },
      ];

      notes.forEach((note) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.type = note.type;
        oscillator.frequency.setValueAtTime(note.frequency, note.start);

        gainNode.gain.setValueAtTime(0.0001, note.start);
        gainNode.gain.exponentialRampToValueAtTime(0.18, note.start + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, note.start + note.duration);

        oscillator.connect(gainNode);
        gainNode.connect(masterGain);
        oscillator.start(note.start);
        oscillator.stop(note.start + note.duration);
      });

      window.setTimeout(() => {
        audioContext.close().catch(() => {});
      }, 700);
    } catch (audioError) {
      // Ignore audio failures such as autoplay restrictions.
    }
  }, [notificationSoundEnabled]);

  const notifications = useMemo(() => {
    const items = [];
    const formatNotificationDate = (value) => {
      if (!value) return "-";
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return String(value).slice(0, 10);

      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    };

    if (pendingServices > 0) {
      items.push({
        id: "pending-services",
        title: `${pendingServices} pending service${pendingServices > 1 ? "s" : ""}`,
        message: "Service requests are waiting for workshop action.",
        time: "Current status",
        tone: "warning",
        path: buildFilteredPath("/services", { status: "Pending" }),
      });
    }

    if (pendingJobCards > 0) {
      items.push({
        id: "pending-jobcards",
        title: `${pendingJobCards} pending job card${pendingJobCards > 1 ? "s" : ""}`,
        message: "Open job cards still need assignment or completion.",
        time: "Current status",
        tone: "info",
        path: buildFilteredPath("/job-cards", { status: "Pending" }),
      });
    }

    if (lowSparePartsCount > 0) {
      items.push({
        id: "low-spares",
        title: `${lowSparePartsCount} spare part${lowSparePartsCount > 1 ? "s" : ""} low in stock`,
        message: "Stock is low and may need reorder soon.",
        time: "Inventory alert",
        tone: "danger",
        path: buildFilteredPath("/spare-parts", { stock: "low" }),
      });
    }

    if (lowBatteryCount > 0) {
      items.push({
        id: "low-batteries",
        title: `${lowBatteryCount} batter${lowBatteryCount > 1 ? "ies are" : "y is"} low in stock`,
        message: "Battery inventory is below the recommended level.",
        time: "Inventory alert",
        tone: "danger",
        path: buildFilteredPath("/batteries", { stock: "low" }),
      });
    }

    recentServices.slice(0, 3).forEach((service, index) => {
      items.push({
        id: `service-note-${service.service_id || index}`,
        title: service.vehicle_model || `Vehicle #${service.vehicle_id || index + 1}`,
        message: `${service.service_type || "Service"} updated as ${service.status || "Pending"}.`,
        time: formatNotificationDate(service.service_date || service.created_at),
        tone:
          String(service.status || "").toLowerCase() === "completed" ||
          String(service.status || "").toLowerCase() === "delivered"
            ? "success"
            : "info",
        path: buildFilteredPath("/services", {
          status: service.status || "",
          search: service.vehicle_model || service.vehicle_owner || service.service_type || "",
        }),
      });
    });

    recentJobCards.slice(0, 2).forEach((jobCard, index) => {
      items.push({
        id: `job-note-${jobCard.job_id || index}`,
        title: jobCard.vehicle_model || `Job card #${jobCard.job_id || index + 1}`,
        message: `${jobCard.remarks || "Workshop job card"} is ${jobCard.status || "Pending"}.`,
        time: formatNotificationDate(jobCard.service_date || jobCard.created_at),
        tone: "info",
        path: buildFilteredPath("/job-cards", {
          status: jobCard.status || "",
          search: jobCard.vehicle_model || jobCard.vehicle_owner || jobCard.remarks || "",
        }),
      });
    });

    return items.slice(0, 8);
  }, [
    buildFilteredPath,
    lowBatteryCount,
    lowSparePartsCount,
    pendingJobCards,
    pendingServices,
    recentJobCards,
    recentServices,
  ]);

  useEffect(() => {
    setReadNotifications((current) => {
      const validNotificationIds = new Set(notifications.map((item) => item.id));
      const nextState = Object.fromEntries(
        Object.entries(current).filter(([id]) => validNotificationIds.has(id))
      );

      if (Object.keys(nextState).length === Object.keys(current).length) {
        return current;
      }

      return nextState;
    });
  }, [notifications]);

  useEffect(() => {
    if (loading) return;

    const notificationIds = notifications.map((item) => item.id);

    try {
      const storedSeenIds = JSON.parse(localStorage.getItem("dashboard_seen_notification_ids") || "[]");
      const seenIdSet = new Set(Array.isArray(storedSeenIds) ? storedSeenIds : []);

      if (!hasHydratedNotificationsRef.current) {
        localStorage.setItem("dashboard_seen_notification_ids", JSON.stringify(notificationIds));
        hasHydratedNotificationsRef.current = true;
        return;
      }

      const newItems = notifications.filter((item) => !seenIdSet.has(item.id)).slice(0, 3);

      if (newItems.length) {
        setToastNotifications((current) => {
          const existingIds = new Set(current.map((item) => item.id));
          return [
            ...current,
            ...newItems
              .filter((item) => !existingIds.has(item.id))
              .map((item) => ({ ...item, isClosing: false })),
          ].slice(-4);
        });

        if (newItems.some((item) => item.tone === "warning" || item.tone === "danger")) {
          if (bellPulseTimerRef.current) {
            window.clearTimeout(bellPulseTimerRef.current);
          }
          setBellAlertPulse(true);
          bellPulseTimerRef.current = window.setTimeout(() => {
            setBellAlertPulse(false);
          }, 950);
          playNotificationChime();
        }
      }

      localStorage.setItem("dashboard_seen_notification_ids", JSON.stringify(notificationIds));
    } catch (storageError) {
      if (!hasHydratedNotificationsRef.current) {
        localStorage.setItem("dashboard_seen_notification_ids", JSON.stringify(notificationIds));
        hasHydratedNotificationsRef.current = true;
        return;
      }

      setToastNotifications((current) => {
        const existingIds = new Set(current.map((item) => item.id));
        return [
          ...current,
          ...notifications
            .filter((item) => !existingIds.has(item.id))
            .slice(0, 3)
            .map((item) => ({ ...item, isClosing: false })),
        ].slice(-4);
      });
    }
  }, [loading, notificationSoundEnabled, notifications, playNotificationChime]);

  useEffect(() => {
    return () => {
      if (bellPulseTimerRef.current) {
        window.clearTimeout(bellPulseTimerRef.current);
      }
    };
  }, []);

  const unreadNotifications = notifications.filter((item) => !readNotifications[item.id]).length;

  const notificationToneClass = (tone) => {
    if (tone === "success") {
      return isNight ? "bg-emerald-500/15 text-emerald-300" : "bg-emerald-50 text-emerald-700";
    }
    if (tone === "warning") {
      return isNight ? "bg-amber-500/15 text-amber-300" : "bg-amber-50 text-amber-700";
    }
    if (tone === "danger") {
      return isNight ? "bg-rose-500/15 text-rose-300" : "bg-rose-50 text-rose-700";
    }
    return isNight ? "bg-sky-500/15 text-sky-300" : "bg-sky-50 text-sky-700";
  };

  const notificationIconMap = {
    success: FaCheckCircle,
    warning: FaExclamationTriangle,
    danger: FaExclamationTriangle,
    info: FaInfoCircle,
  };

  const persistSeenNotificationIds = useCallback((ids) => {
    try {
      const storedSeenIds = JSON.parse(localStorage.getItem("dashboard_seen_notification_ids") || "[]");
      const nextSeenIds = Array.from(
        new Set([...(Array.isArray(storedSeenIds) ? storedSeenIds : []), ...ids])
      );
      localStorage.setItem("dashboard_seen_notification_ids", JSON.stringify(nextSeenIds));
    } catch (storageError) {
      localStorage.setItem("dashboard_seen_notification_ids", JSON.stringify(ids));
    }
  }, []);

  const markNotificationsAsRead = useCallback(
    (ids) => {
      if (!ids.length) return;

      setReadNotifications((current) => {
        const nextState = { ...current };
        ids.forEach((id) => {
          nextState[id] = true;
        });
        return nextState;
      });

      persistSeenNotificationIds(ids);
    },
    [persistSeenNotificationIds]
  );

  const handleNotificationClick = (item) => {
    markNotificationsAsRead([item.id]);
    setNotificationsOpen(false);
    if (item.path) {
      handleNavigate(item.path);
    }
  };

  const handleMarkAllRead = () => {
    markNotificationsAsRead(notifications.map((item) => item.id));
  };

  useEffect(() => {
    if (!notificationsOpen) return undefined;

    markNotificationsAsRead(notifications.map((item) => item.id));

    const handleDocumentClick = (event) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setNotificationsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleDocumentClick);
    return () => {
      document.removeEventListener("mousedown", handleDocumentClick);
    };
  }, [markNotificationsAsRead, notifications, notificationsOpen]);

  const dismissToast = (id) => {
    setToastNotifications((current) =>
      current.map((item) => (item.id === id ? { ...item, isClosing: true } : item))
    );

    window.setTimeout(() => {
      setToastNotifications((current) => current.filter((item) => item.id !== id));
    }, 220);
  };

  const sparklineMap = useMemo(
    () => ({
      revenue: monthlyActivity.map((bucket) => Math.max(1, bucket.revenue)),
      vehicles: monthlyActivity.map((bucket) => Math.max(1, bucket.services)),
      services: monthlyActivity.map((bucket) => Math.max(1, bucket.jobCards)),
      workload: monthlyActivity.map((bucket) => Math.max(1, bucket.completed + bucket.jobCards)),
    }),
    [monthlyActivity]
  );

  const buildSparkline = (values) => {
    const maxValue = Math.max(1, ...values);

    return values
      .map((value, index) => {
        const x = (index / Math.max(1, values.length - 1)) * 100;
        const y = 100 - (value / maxValue) * 70 - 15;
        return `${x},${y}`;
      })
      .join(" ");
  };

  const dashboardCards = [
    {
      key: "revenue",
      label: "Total Revenue",
      value: formatCurrency(totalRevenue),
      change: `${completedServices} completed services`,
      icon: FaChartLine,
      iconWrap: isNight ? "bg-[#2f2119] text-[#ffb782]" : "bg-[#f6e8df] text-[#c45c17]",
      line: "#2563eb",
      action: "/services",
    },
    {
      key: "vehicles",
      label: "Active Vehicles",
      value: vehiclesCount.toLocaleString(),
      change: `${servicesCount} services logged`,
      icon: FaCar,
      iconWrap: isNight ? "bg-[#132741] text-[#7dc1ff]" : "bg-[#e8f0fe] text-[#2563eb]",
      line: "#0ea5e9",
      action: "/vehicles",
    },
    {
      key: "services",
      label: "Job Cards",
      value: jobCardsCount.toLocaleString(),
      change: `${pendingJobCards} pending`,
      icon: FaClipboardList,
      iconWrap: isNight ? "bg-[#113135] text-[#67e8f9]" : "bg-[#e8f0f4] text-[#145a7a]",
      line: "#10b981",
      action: "/job-cards",
    },
    {
      key: "workload",
      label: "Open Workload",
      value: activeWorkload.toLocaleString(),
      change: `${pendingServices} services awaiting action`,
      icon: FaWrench,
      iconWrap: isNight ? "bg-[#3a2d0f] text-[#ffd166]" : "bg-[#f8f0d8] text-[#e1a600]",
      line: "#f59e0b",
      action: buildFilteredPath("/services", { status: "Pending" }),
    },
  ];

  const workloadSegments = useMemo(() => {
    return [
      {
        label: "Completed",
        value: completedServices + completedJobCards,
        color: "#2563eb",
        action: buildFilteredPath("/services", { status: "Completed" }),
      },
      {
        label: "Active",
        value: inProgressServices + inProgressJobCards,
        color: "#10b981",
        action: buildFilteredPath("/services", { status: "In Progress" }),
      },
      {
        label: "Pending",
        value: pendingServices + pendingJobCards,
        color: "#f59e0b",
        action: buildFilteredPath("/services", { status: "Pending" }),
      },
    ];
  }, [
    buildFilteredPath,
    completedJobCards,
    completedServices,
    inProgressJobCards,
    inProgressServices,
    pendingJobCards,
    pendingServices,
  ]);

  const totalWorkload = workloadSegments.reduce((sum, item) => sum + item.value, 0);

  const workloadBackground = useMemo(() => {
    if (!totalWorkload) return "conic-gradient(#e5e7eb 0deg 360deg)";

    let currentAngle = 0;
    return `conic-gradient(${workloadSegments
      .map((item) => {
        const startAngle = currentAngle;
        const slice = (item.value / totalWorkload) * 360;
        currentAngle += slice;
        return `${item.color} ${startAngle}deg ${currentAngle}deg`;
      })
      .join(", ")})`;
  }, [totalWorkload, workloadSegments]);

  const filteredRecentServices = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return recentServices;

    return recentServices.filter((service) =>
      [
        service.vehicle_model,
        service.vehicle_owner,
        service.service_type,
        service.status,
        service.service_date,
      ]
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [recentServices, searchQuery]);

  const filteredRecentJobCards = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return recentJobCards;

    return recentJobCards.filter((jobCard) =>
      [
        jobCard.vehicle_model,
        jobCard.vehicle_owner,
        jobCard.status,
        jobCard.service_date,
        jobCard.remarks,
      ]
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [recentJobCards, searchQuery]);

  const activityRows = useMemo(() => {
    const rows = [
      ...filteredRecentServices.map((service) => ({
        id: `service-${service.service_id}`,
        type: "Service",
        primary: service.vehicle_model
          ? `${service.vehicle_model} (${service.vehicle_owner || "Owner"})`
          : `Vehicle #${service.vehicle_id}`,
        secondary: service.service_type || "Service entry",
        status: service.status || "Pending",
        date: service.service_date,
        amount: formatCurrency(service.cost),
      })),
      ...filteredRecentJobCards.map((jobCard) => ({
        id: `job-${jobCard.job_id}`,
        type: "Job Card",
        primary: jobCard.vehicle_model
          ? `${jobCard.vehicle_model} (${jobCard.vehicle_owner || "Owner"})`
          : `Vehicle #${jobCard.vehicle_id}`,
        secondary: jobCard.remarks || "Workshop job card",
        status: jobCard.status || "Pending",
        date: jobCard.service_date,
        amount: formatCurrency(jobCard.estimated_cost),
      })),
    ];

    return rows
      .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
      .slice(0, 8)
      .map((row) => ({
        ...row,
        formattedDate: formatDate(row.date),
      }));
  }, [filteredRecentJobCards, filteredRecentServices]);

  const visibleActivityRows = useMemo(() => {
    if (activityTypeFilter === "all") return activityRows;
    if (activityTypeFilter === "services") {
      return activityRows.filter((row) => row.type === "Service");
    }
    return activityRows.filter((row) => row.type === "Job Card");
  }, [activityRows, activityTypeFilter]);

  const handleNavigate = (path) => {
    navigate(path);
    setSidebarOpen(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_role");
    localStorage.removeItem("auth_user");
    navigate("/login", { replace: true });
  };

  const toggleTheme = () => {
    setThemeMode((current) => (current === "night" ? "day" : "night"));
  };

  const handleExport = () => {
    const rows = visibleActivityRows;
    const header = ["Type", "Vehicle", "Details", "Status", "Date", "Amount"];
    const csvRows = [
      header.join(","),
      ...rows.map((row) =>
        [row.type, row.primary, row.secondary, row.status, row.formattedDate, row.amount]
          .map((value) => `"${String(value || "").replace(/"/g, '""')}"`)
          .join(",")
      ),
    ];

    const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "dashboard-activity.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const getStatusClass = (status) => {
    const value = String(status || "").toLowerCase();
    if (value === "completed" || value === "delivered") {
      return "bg-[#2fa84f] text-white";
    }
    if (value === "in progress" || value === "processing") {
      return "bg-[#111111] text-white";
    }
    if (value === "cancelled") {
      return "bg-[#ef4444] text-white";
    }
    return "bg-[#f3a400] text-black";
  };

  const navGroups = [
    {
      title: "Overview",
      items: [
        { label: "Dashboard", icon: FaHome, path: "/dashboard", active: true, badge: null },
        { label: "Vehicles", icon: FaCar, path: "/vehicles", active: false, badge: vehiclesCount },
        { label: "Services", icon: FaWrench, path: "/services", active: false, badge: servicesCount },
        { label: "Job Cards", icon: FaClipboardList, path: "/job-cards", active: false, badge: jobCardsCount },
      ],
    },
    {
      title: "Management",
      items: [
        { label: "Reports", icon: FaChartLine, path: "/reports", active: false, badge: null },
        { label: "Customers", icon: FaUsers, path: "/customers", active: false, badge: null },
        ...(isAdmin
          ? [{ label: "Admin", icon: FaUserShield, path: "/admin/users", active: false, badge: null }]
          : []),
      ],
    },
  ];

  const surfaceTheme = useMemo(
    () => ({
      shell: isNight ? "bg-[#0b1220] text-[#e5eefb]" : "bg-[#f3f6fb] text-[#111827]",
      sidebar: isNight
        ? "border-[#223047] bg-[linear-gradient(180deg,#0f172a_0%,#121c2f_100%)]"
        : "border-[#dbe3f0] bg-[#f8fbff]",
      sidebarDivider: isNight ? "border-[#223047]" : "border-[#e5e7eb]",
      logoText: isNight ? "text-white" : "text-black",
      subText: isNight ? "text-[#8ea3c0]" : "text-[#6b7280]",
      dimText: isNight ? "text-[#9eb0c9]" : "text-[#94a3b8]",
      navGroupText: isNight ? "text-[#7085a3]" : "text-[#9ca3af]",
      navActive: isNight ? "bg-[#1c2940] text-white" : "bg-[#efefef] text-black",
      navIdle: isNight
        ? "text-[#9eb0c9] hover:bg-[#162235] hover:text-white"
        : "text-[#4b5563] hover:bg-[#f1f1f1] hover:text-black",
      badge: isNight ? "bg-[#1d2a40] text-[#dbe7ff]" : "bg-[#e5e7eb] text-[#111827]",
      panel: isNight
        ? `${basePanelClass} border-[#223047] bg-[#121c2f] shadow-[0_18px_42px_rgba(2,6,23,0.45)]`
        : `${basePanelClass} border-[#dbe3f0] bg-white shadow-[0_10px_28px_rgba(37,99,235,0.06)]`,
      header: isNight
        ? "border-[#223047] bg-[rgba(10,16,29,0.88)] backdrop-blur-xl"
        : "border-[#e5e7eb] bg-[rgba(250,250,250,0.92)] backdrop-blur-xl",
      inputShell: isNight ? "border-[#2a3a54] bg-[#0f172a]" : "border-[#e5e7eb] bg-white",
      inputText: isNight ? "text-[#e5eefb] placeholder:text-[#6f85a4]" : "text-[#111827] placeholder:text-[#9ca3af]",
      keycap: isNight ? "bg-[#1b283c] text-[#90a4c1]" : "bg-[#f3f4f6] text-[#9ca3af]",
      iconButton: isNight
        ? "text-[#93a7c4] hover:bg-[#182438] hover:text-white"
        : "text-[#6b7280] hover:bg-white hover:text-black",
      solidButton: isNight
        ? "bg-[#f8fafc] text-[#0f172a] hover:bg-white"
        : "bg-[#111111] text-white hover:bg-black",
      ghostButton: isNight
        ? "border-[#2a3a54] bg-[#121c2f] text-[#e5eefb]"
        : "border-[#e5e7eb] bg-white text-black",
      title: isNight ? "text-white" : "text-black",
      bodyText: isNight ? "text-[#9eb0c9]" : "text-[#6b7280]",
      chartStage: isNight
        ? "bg-[linear-gradient(180deg,#0e1729_0%,#172338_100%)]"
        : "bg-[linear-gradient(180deg,#ffffff_0%,#fff8f2_100%)]",
      chartGrid: isNight ? "border-[#223047]" : "border-[#ececec]",
      chartLabel: isNight ? "text-[#6f85a4]" : "text-[#9ca3af]",
      tableHead: isNight ? "bg-[#0f172a] text-[#89a0be]" : "bg-[#fcfcfc] text-[#6b7280]",
      tableRow: isNight ? "bg-[#121c2f]" : "bg-white",
      tableDivider: isNight ? "divide-[#223047]" : "divide-[#eceff3]",
      tableBorder: isNight ? "border-[#223047]" : "border-[#e5e7eb]",
      workRingCenter: isNight ? "bg-[#0f172a]" : "bg-white",
      avatar: isNight ? "bg-[#1d2a40] text-[#f8fbff]" : "bg-[#e5e7eb] text-[#111827]",
      largeAvatar: isNight ? "bg-[#1d2a40] text-white" : "bg-[#1f2937] text-white",
      overlay: isNight ? "bg-black/50" : "bg-black/30",
      lineGlow: isNight ? "drop-shadow-[0_0_10px_rgba(96,165,250,0.18)]" : "",
    }),
    [isNight]
  );

  const inventoryCards = [
    {
      label: "Spare Parts",
      value: sparePartsCount,
      helper: `${lowSparePartsCount} low stock items`,
      icon: FaBoxes,
      iconWrap: isNight ? "bg-[#132741] text-[#7dc1ff]" : "bg-[#e8f0fe] text-[#2563eb]",
      action: "/spare-parts",
    },
    {
      label: "Batteries",
      value: batteryCount,
      helper: `${lowBatteryCount} low stock items`,
      icon: FaBolt,
      iconWrap: isNight ? "bg-[#3a2d0f] text-[#ffd166]" : "bg-[#f8f0d8] text-[#e1a600]",
      action: "/batteries",
    },
  ];

  return (
    <div
      className={[
        "min-h-screen transition-colors duration-300",
        surfaceTheme.shell,
      ].join(" ")}
    >
      {toastNotifications.length > 0 && (
        <div className="pointer-events-none fixed right-4 top-24 z-50 flex w-[min(360px,calc(100vw-2rem))] flex-col gap-3">
          {toastNotifications.map((toast) => {
            const ToastIcon = notificationIconMap[toast.tone] || FaInfoCircle;

            return (
              <div
                key={toast.id}
                className={`dashboard-toast pointer-events-auto overflow-hidden rounded-[22px] border shadow-[0_20px_50px_rgba(15,23,42,0.18)] ${
                  toast.isClosing ? "dashboard-toast-exit" : "dashboard-toast-enter"
                } ${
                  isNight ? "border-[#223047] bg-[#121c2f]" : "border-[#dbe3f0] bg-white"
                }`}
              >
                <div className={`dashboard-toast-progress h-1 w-full ${toast.tone === "success" ? "bg-emerald-500" : toast.tone === "warning" ? "bg-amber-500" : toast.tone === "danger" ? "bg-rose-500" : "bg-sky-500"}`} />
                <div className="flex items-start gap-3 p-4">
                  <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${notificationToneClass(toast.tone)}`}>
                    <ToastIcon className="text-base" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className={`text-sm font-semibold ${surfaceTheme.title}`}>{toast.title}</div>
                        <div className={`mt-1 text-sm leading-6 ${surfaceTheme.bodyText}`}>{toast.message}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => dismissToast(toast.id)}
                        className={`rounded-xl px-2 py-1 text-xs font-semibold transition ${surfaceTheme.iconButton}`}
                      >
                        Close
                      </button>
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <span className={`text-xs ${surfaceTheme.chartLabel}`}>{toast.time}</span>
                      <button
                        type="button"
                        onClick={() => handleNotificationClick(toast)}
                        className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${isNight ? "bg-[#0f172a] text-[#9dc5ff]" : "bg-[#eef4ff] text-[#2563eb]"}`}
                      >
                        View
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {sidebarOpen && (
        <button
          type="button"
          className={`fixed inset-0 z-30 lg:hidden ${surfaceTheme.overlay}`}
          onClick={() => setSidebarOpen(false)}
          aria-label="Close sidebar"
        />
      )}

      <div className="flex min-h-screen">
        <aside
          className={[
            "fixed inset-y-0 left-0 z-40 flex w-[288px] flex-col border-r border-[#dbe3f0] bg-[#f8fbff] transition-transform duration-300 lg:static lg:translate-x-0",
            surfaceTheme.sidebar,
            sidebarOpen ? "translate-x-0" : "-translate-x-full",
          ].join(" ")}
        >
          <div className={`flex items-center gap-4 border-b px-5 py-6 ${surfaceTheme.sidebarDivider}`}>
            <img src={logoMark} alt="VehicleOps logo" className="h-11 w-11 rounded-2xl" />
            <div>
              <div className={`text-[28px] font-semibold leading-none tracking-[-0.03em] ${surfaceTheme.logoText}`}>VehicleOps</div>
              <div className={`mt-1 text-xs uppercase tracking-[0.24em] ${surfaceTheme.dimText}`}>React Admin Dashboard</div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-6">
            {navGroups.map((group) => (
              <div key={group.title} className="mb-8">
                <div className={`mb-3 px-3 text-xs font-semibold uppercase tracking-[0.22em] ${surfaceTheme.navGroupText}`}>
                  {group.title}
                </div>
                <div className="space-y-1.5">
                  {group.items.map(({ label, icon: Icon, path, active, badge }) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => handleNavigate(path)}
                      className={[
                        "flex w-full items-center justify-between rounded-[18px] px-4 py-3 text-left transition",
                        active ? surfaceTheme.navActive : surfaceTheme.navIdle,
                      ].join(" ")}
                    >
                      <span className="flex items-center gap-3">
                        <Icon className="text-lg" />
                        <span className="text-[17px] font-medium">{label}</span>
                      </span>
                      {badge ? (
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${surfaceTheme.badge}`}>
                          {badge}
                        </span>
                      ) : null}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            <div className="mb-8">
              <div className={`mb-3 px-3 text-xs font-semibold uppercase tracking-[0.22em] ${surfaceTheme.navGroupText}`}>
                Inventory
              </div>
              <div className="space-y-1.5">
                <button
                  type="button"
                  onClick={() => setInventoryMenuOpen((prev) => !prev)}
                  className={`flex w-full items-center justify-between rounded-[18px] px-4 py-3 text-left transition ${surfaceTheme.navIdle}`}
                >
                  <span className="flex items-center gap-3">
                    <FaBoxes className="text-lg" />
                    <span className="text-[17px] font-medium">Stock Modules</span>
                  </span>
                  <FaChevronDown
                    className={`transition-transform duration-200 ${inventoryMenuOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {inventoryMenuOpen && (
                  <div className="space-y-1 pl-4">
                    {[
                      { label: "Spare Parts", icon: FaBoxes, path: "/spare-parts", badge: sparePartsCount },
                      { label: "Batteries", icon: FaBolt, path: "/batteries", badge: batteryCount },
                    ].map(({ label, icon: Icon, path, badge }) => (
                      <button
                        key={label}
                        type="button"
                        onClick={() => handleNavigate(path)}
                        className={`flex w-full items-center justify-between rounded-[16px] px-4 py-3 text-left transition ${surfaceTheme.navIdle}`}
                      >
                        <span className="flex items-center gap-3">
                          <Icon className="text-base" />
                          <span className="text-[15px] font-medium">{label}</span>
                        </span>
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${surfaceTheme.badge}`}>
                          {badge}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className={`border-t px-5 py-5 ${surfaceTheme.sidebarDivider}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`flex h-12 w-12 items-center justify-center rounded-full text-sm font-semibold ${surfaceTheme.largeAvatar}`}>
                  {avatarInitials}
                </div>
                <div>
                  <div className={`text-[18px] font-semibold ${surfaceTheme.logoText}`}>{displayName}</div>
                  <div className={`text-sm ${surfaceTheme.subText}`}>{roleLabel}</div>
                </div>
              </div>
              <button
                type="button"
                className={`transition ${surfaceTheme.iconButton}`}
                onClick={handleLogout}
                aria-label="Logout"
              >
                <FaPowerOff />
              </button>
            </div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header
            className={[
              "sticky top-0 z-20 border-b border-[#e5e7eb]",
              surfaceTheme.header,
            ].join(" ")}
          >
            <div className="flex items-center justify-between gap-4 px-4 py-5 sm:px-6 lg:px-9">
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl border lg:hidden ${surfaceTheme.inputShell} ${surfaceTheme.subText}`}
                  onClick={() => setSidebarOpen((prev) => !prev)}
                  aria-label="Open sidebar"
                >
                  <FaBars />
                </button>
                <div className={`hidden items-center gap-3 rounded-[16px] border px-4 py-3 md:flex md:min-w-[360px] ${surfaceTheme.inputShell}`}>
                  <FaSearch className={surfaceTheme.dimText} />
                  <input
                    type="text"
                    className={`w-full border-0 bg-transparent text-base outline-none ${surfaceTheme.inputText}`}
                    placeholder="Search anything..."
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                  />
                  <span className={`rounded-lg px-2 py-1 text-xs ${surfaceTheme.keycap}`}>Ctrl K</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className={`hidden rounded-2xl px-6 py-3 text-sm font-semibold transition sm:inline-flex ${surfaceTheme.solidButton}`}
                  onClick={() => handleNavigate("/services")}
                >
                  + Add Service
                </button>
                <button
                  type="button"
                  className={`inline-flex h-10 w-10 items-center justify-center rounded-full transition ${surfaceTheme.iconButton}`}
                  onClick={toggleTheme}
                  aria-label="Theme"
                  title={themeMode === "night" ? "Switch to day mode" : "Switch to night mode"}
                >
                  <FaMoon />
                </button>
                <div className="relative" ref={notificationsRef}>
                  <button
                    type="button"
                    className={`relative inline-flex h-10 w-10 items-center justify-center rounded-full transition ${surfaceTheme.iconButton} ${bellAlertPulse ? "dashboard-bell-shake" : ""}`}
                    aria-label="Notifications"
                    aria-expanded={notificationsOpen}
                    onClick={() => setNotificationsOpen((current) => !current)}
                  >
                    <FaBell />
                    {unreadNotifications > 0 && (
                      <span className="absolute -right-1 -top-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
                        {unreadNotifications > 9 ? "9+" : unreadNotifications}
                      </span>
                    )}
                  </button>

                  {notificationsOpen && (
                    <div
                      className={`absolute right-0 top-14 z-30 w-[380px] overflow-hidden rounded-[24px] border shadow-[0_24px_60px_rgba(15,23,42,0.22)] ${isNight ? "border-[#223047] bg-[#121c2f]" : "border-[#e5e7eb] bg-white"}`}
                    >
                      <div className={`border-b px-4 py-4 ${isNight ? "border-[#223047] bg-[linear-gradient(180deg,#172338_0%,#121c2f_100%)]" : "border-[#edf1f5] bg-[linear-gradient(180deg,#f8fbff_0%,#ffffff_100%)]"}`}>
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className={`text-sm font-semibold ${surfaceTheme.title}`}>Notifications</div>
                            <div className={`mt-1 text-xs ${surfaceTheme.bodyText}`}>
                              {unreadNotifications > 0
                                ? `${unreadNotifications} unread update${unreadNotifications > 1 ? "s" : ""}`
                                : "Everything is up to date"}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setNotificationSoundEnabled((current) => !current)}
                              className={`rounded-xl border px-3 py-1.5 text-xs font-medium transition ${surfaceTheme.ghostButton}`}
                              title={notificationSoundEnabled ? "Turn notification sound off" : "Turn notification sound on"}
                            >
                              <span className="flex items-center gap-2">
                                {notificationSoundEnabled ? <FaVolumeUp /> : <FaVolumeMute />}
                                {notificationSoundEnabled ? "Sound on" : "Sound off"}
                              </span>
                            </button>
                            <button
                              type="button"
                              onClick={handleMarkAllRead}
                              disabled={!unreadNotifications}
                              className={`rounded-xl border px-3 py-1.5 text-xs font-medium transition ${surfaceTheme.ghostButton} ${!unreadNotifications ? "cursor-not-allowed opacity-50" : ""}`}
                            >
                              Mark all read
                            </button>
                            <button
                              type="button"
                              onClick={() => setNotificationsOpen(false)}
                              className={`rounded-xl border px-3 py-1.5 text-xs font-medium transition ${surfaceTheme.ghostButton}`}
                            >
                              Close
                            </button>
                          </div>
                        </div>

                        <div className="mt-3 flex items-center gap-2">
                          <span className={`rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${isNight ? "bg-[#0f172a] text-[#9eb0c9]" : "border border-[#e5e7eb] bg-white text-[#6b7280]"}`}>
                            Live alerts
                          </span>
                          <span className={`rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${isNight ? "bg-emerald-500/10 text-emerald-300" : "bg-emerald-50 text-emerald-700"}`}>
                            Workshop
                          </span>
                        </div>
                      </div>

                      <div className="max-h-[420px] space-y-2 overflow-y-auto p-3 pr-2">
                        {notifications.length ? (
                          notifications.map((item) => {
                            const NotificationIcon = notificationIconMap[item.tone] || FaInfoCircle;
                            const isUnread = !readNotifications[item.id];

                            return (
                              <button
                                key={item.id}
                                type="button"
                                onClick={() => handleNotificationClick(item)}
                                className={`group relative w-full rounded-[20px] border p-4 text-left transition ${
                                  isNight
                                    ? isUnread
                                      ? "border-[#29405f] bg-[#0f172a] hover:bg-[#152033]"
                                      : "border-[#223047] bg-[#101827] hover:bg-[#152033]"
                                    : isUnread
                                      ? "border-[#d7e4ff] bg-[#f8fbff] hover:bg-[#f1f7ff]"
                                      : "border-[#edf1f5] bg-[#fbfdff] hover:bg-[#f5f9ff]"
                                }`}
                              >
                                {isUnread && (
                                  <span className="absolute right-4 top-4 h-2.5 w-2.5 rounded-full bg-sky-500" />
                                )}

                                <div className="flex items-start gap-3">
                                  <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${notificationToneClass(item.tone)}`}>
                                    <NotificationIcon className="text-base" />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-start justify-between gap-3">
                                      <div className="min-w-0">
                                        <div className={`text-sm font-semibold ${surfaceTheme.title}`}>{item.title}</div>
                                        <div className={`mt-1 text-sm leading-6 ${surfaceTheme.bodyText}`}>{item.message}</div>
                                      </div>
                                      <span className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] ${notificationToneClass(item.tone)}`}>
                                        {item.tone}
                                      </span>
                                    </div>
                                    <div className="mt-3 flex items-center justify-between gap-3">
                                      <div className={`text-xs ${surfaceTheme.chartLabel}`}>{item.time}</div>
                                      <div className={`text-xs font-semibold uppercase tracking-[0.16em] ${isNight ? "text-[#9dc5ff]" : "text-[#2563eb]"}`}>
                                        Open
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </button>
                            );
                          })
                        ) : (
                          <div className={`rounded-[20px] border p-6 text-center ${isNight ? "border-[#223047] bg-[#0f172a]" : "border-[#edf1f5] bg-[#fbfdff]"}`}>
                            <div className={`mx-auto flex h-12 w-12 items-center justify-center rounded-2xl ${isNight ? "bg-[#172338] text-[#9eb0c9]" : "bg-[#eef4ff] text-[#5b6b85]"}`}>
                              <FaBell />
                            </div>
                            <div className={`mt-4 text-sm font-semibold ${surfaceTheme.title}`}>No notifications yet</div>
                            <div className={`mt-1 text-sm ${surfaceTheme.bodyText}`}>
                              New service, stock, and job card updates will appear here.
                            </div>
                          </div>
                        )}
                      </div>

                      <div className={`border-t px-4 py-3 text-xs ${isNight ? "border-[#223047] bg-[#0f172a] text-[#8ea3c0]" : "border-[#edf1f5] bg-[#fbfdff] text-[#6b7280]"}`}>
                        Click any notification to open the related page. High-priority alerts can ring and shake the bell.
                      </div>
                    </div>
                  )}
                </div>
                <div className={`flex h-11 w-11 items-center justify-center rounded-full text-sm font-semibold ${surfaceTheme.avatar}`}>
                  {avatarInitials}
                </div>
              </div>
            </div>

            <div className="px-4 pb-4 sm:px-6 lg:hidden">
              <div className={`flex items-center gap-3 rounded-[16px] border px-4 py-3 ${surfaceTheme.inputShell}`}>
                <FaSearch className={surfaceTheme.dimText} />
                <input
                  type="text"
                  className={`w-full border-0 bg-transparent text-base outline-none ${surfaceTheme.inputText}`}
                  placeholder="Search anything..."
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                />
              </div>
            </div>
          </header>

          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-9">
            <div className="mx-auto max-w-[1500px]">
              <div className="mb-7">
                <h1 className={`text-5xl font-semibold tracking-[-0.04em] ${surfaceTheme.title}`}>Dashboard</h1>
                <p className={`mt-3 text-[18px] ${surfaceTheme.bodyText}`}>
                  Welcome back, {firstName}. Here's what's happening with your workshop today.
                </p>
              </div>

              {error && (
                <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div className="grid gap-6 xl:grid-cols-4">
                {dashboardCards.map(({ key, label, value, change, icon: Icon, iconWrap, line, action }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleNavigate(action)}
                    className={`${surfaceTheme.panel} overflow-hidden p-0 text-left transition hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-sky-400/50`}
                  >
                    <div className="p-7">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className={`text-[15px] font-medium ${surfaceTheme.bodyText}`}>{label}</div>
                          <div className={`mt-3 text-[32px] font-semibold tracking-[-0.03em] ${surfaceTheme.title}`}>
                            {value}
                          </div>
                          <div className={`mt-4 text-sm ${surfaceTheme.bodyText}`}>{change}</div>
                          <div className={`mt-3 text-[11px] font-semibold uppercase tracking-[0.18em] ${isNight ? "text-[#9dc5ff]" : "text-[#2563eb]"}`}>
                            Open details
                          </div>
                        </div>
                        <div className={`flex h-14 w-14 items-center justify-center rounded-3xl text-2xl ${iconWrap}`}>
                          <Icon />
                        </div>
                      </div>
                    </div>
                    <div
                      className={`h-16 border-t px-3 py-2 ${isNight ? "border-[#223047] bg-[#0f172a]" : "border-[#f3f4f6] bg-[#fcfcfc]"}`}
                    >
                      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full">
                        <polyline
                          className={`dashboard-line-animate ${surfaceTheme.lineGlow}`}
                          fill="none"
                          stroke={line}
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          points={buildSparkline(sparklineMap[key])}
                          pathLength="1"
                          style={{ animationDelay: `${dashboardCards.findIndex((card) => card.key === key) * 120}ms` }}
                        />
                      </svg>
                    </div>
                  </button>
                ))}
              </div>

              <div className="mt-6 grid gap-6 xl:grid-cols-3">
                {roleActivityCards.map((item) => (
                  <section key={item.role} className={`${surfaceTheme.panel} p-7`}>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className={`text-[12px] font-semibold uppercase tracking-[0.22em] ${surfaceTheme.chartLabel}`}>
                          {item.role}
                        </div>
                        <h2 className={`mt-3 text-[24px] font-semibold tracking-[-0.03em] ${surfaceTheme.title}`}>
                          {item.users} users
                        </h2>
                      </div>
                      <div className={`flex h-12 w-12 items-center justify-center rounded-3xl ${isNight ? "bg-[#1c2940] text-[#f8d66d]" : "bg-[#eef2ff] text-[#1d4ed8]"}`}>
                        <FaUserShield />
                      </div>
                    </div>

                    <div className="mt-6 grid gap-3 sm:grid-cols-2">
                      <div className={`rounded-[18px] border px-4 py-3 ${surfaceTheme.inputShell}`}>
                        <div className={`flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] ${surfaceTheme.chartLabel}`}>
                          <FaUserCheck />
                          Logins
                        </div>
                        <div className={`mt-2 text-lg font-semibold ${surfaceTheme.title}`}>{item.logins}</div>
                      </div>
                      <div className={`rounded-[18px] border px-4 py-3 ${surfaceTheme.inputShell}`}>
                        <div className={`flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] ${surfaceTheme.chartLabel}`}>
                          <FaDoorOpen />
                          Logouts
                        </div>
                        <div className={`mt-2 text-lg font-semibold ${surfaceTheme.title}`}>{item.logouts}</div>
                      </div>
                    </div>

                    <div className="mt-4 space-y-3">
                      <div className={`rounded-[18px] border px-4 py-3 ${surfaceTheme.inputShell}`}>
                        <div className={`text-[11px] font-semibold uppercase tracking-[0.16em] ${surfaceTheme.chartLabel}`}>Last login</div>
                        <div className={`mt-2 text-sm ${surfaceTheme.bodyText}`}>{formatDateTime(item.lastLogin)}</div>
                      </div>
                      <div className={`rounded-[18px] border px-4 py-3 ${surfaceTheme.inputShell}`}>
                        <div className={`text-[11px] font-semibold uppercase tracking-[0.16em] ${surfaceTheme.chartLabel}`}>Last logout</div>
                        <div className={`mt-2 text-sm ${surfaceTheme.bodyText}`}>{formatDateTime(item.lastLogout)}</div>
                      </div>
                    </div>
                  </section>
                ))}
              </div>

              <div className="mt-6 grid gap-6 2xl:grid-cols-[1.7fr_0.85fr]">
                <section className={`${surfaceTheme.panel} p-7`}>
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h2 className={`text-[22px] font-semibold tracking-[-0.03em] ${surfaceTheme.title}`}>Performance Overview</h2>
                      <p className={`mt-1 text-[15px] ${surfaceTheme.bodyText}`}>
                        {overviewConfig.title} {overviewRangeLabel.toLowerCase()}.
                      </p>
                    </div>
                    <div className="flex flex-col items-start gap-3 sm:items-end">
                      <div className={`inline-flex rounded-2xl p-1 text-sm ${isNight ? "bg-[#0f172a]" : "bg-[#f3f4f6]"}`}>
                        {[
                          { key: "revenue", label: "Revenue" },
                          { key: "orders", label: "Orders" },
                          { key: "profit", label: "Profit" },
                        ].map((tab) => (
                          <button
                            key={tab.key}
                            type="button"
                            onClick={() => setOverviewMetric(tab.key)}
                            className={[
                              "rounded-[14px] px-5 py-2 font-medium transition",
                              overviewMetric === tab.key
                                ? isNight
                                  ? "bg-[#1c2940] text-white shadow-sm"
                                  : "bg-white text-black shadow-sm"
                                : surfaceTheme.bodyText,
                            ].join(" ")}
                          >
                            {tab.label}
                          </button>
                        ))}
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <div className={`inline-flex rounded-2xl p-1 text-sm ${isNight ? "bg-[#0f172a]" : "bg-[#f3f4f6]"}`}>
                          {Object.entries(TIME_RANGE_CONFIG).map(([key, config]) => (
                            <button
                              key={key}
                              type="button"
                              onClick={() => {
                                setOverviewRange(key);
                                setOverviewOffset(0);
                              }}
                              className={[
                                "rounded-[14px] px-4 py-2 font-medium transition",
                                overviewRange === key
                                  ? isNight
                                    ? "bg-[#1c2940] text-white shadow-sm"
                                    : "bg-white text-black shadow-sm"
                                  : surfaceTheme.bodyText,
                              ].join(" ")}
                            >
                              {config.label}
                            </button>
                          ))}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setOverviewOffset((current) => current + 1)}
                            className={`rounded-xl border px-3 py-2 text-sm font-medium transition ${surfaceTheme.ghostButton}`}
                          >
                            Prev
                          </button>
                          <button
                            type="button"
                            onClick={() => setOverviewOffset((current) => Math.max(0, current - 1))}
                            disabled={overviewOffset === 0}
                            className={`rounded-xl border px-3 py-2 text-sm font-medium transition ${surfaceTheme.ghostButton} ${overviewOffset === 0 ? "cursor-not-allowed opacity-50" : ""}`}
                          >
                            Next
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 grid grid-cols-[84px_1fr] gap-4">
                    <div className={`flex flex-col justify-between py-4 text-sm ${surfaceTheme.bodyText}`}>
                      {overviewChart.ticks.map((tick) => (
                        <span key={`${overviewMetric}-${tick.y}`}>{overviewConfig.prefix}{formatOverviewValue(tick.value)}</span>
                      ))}
                    </div>
                    <div className={`relative h-[320px] overflow-hidden rounded-[18px] ${surfaceTheme.chartStage}`}>
                      <div className="absolute inset-x-0 top-0 z-10 flex items-start justify-between px-6 pt-5">
                        <div className={`rounded-2xl border px-4 py-2 backdrop-blur ${isNight ? "border-white/10 bg-white/5" : "border-black/5 bg-white/75"}`}>
                          <div className={`text-[11px] font-semibold uppercase tracking-[0.22em] ${surfaceTheme.chartLabel}`}>{overviewRangeLabel}</div>
                          <div className={`mt-1 text-lg font-semibold ${surfaceTheme.title}`}>
                            {overviewConfig.prefix}{formatOverviewValue(overviewSummary.latest)}
                          </div>
                        </div>
                        <div className={`rounded-2xl border px-4 py-2 text-right backdrop-blur ${isNight ? "border-white/10 bg-white/5" : "border-black/5 bg-white/75"}`}>
                          <div className={`text-[11px] font-semibold uppercase tracking-[0.22em] ${surfaceTheme.chartLabel}`}>Average</div>
                          <div className={`mt-1 text-lg font-semibold ${surfaceTheme.title}`}>
                            {overviewConfig.prefix}{formatOverviewValue(Math.round(overviewSummary.average))}
                          </div>
                          <div className={`mt-1 text-xs font-medium ${overviewSummary.change >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                            {overviewSummary.change >= 0 ? "+" : ""}{overviewSummary.change.toFixed(1)}% vs prev
                          </div>
                        </div>
                      </div>
                      <div className="absolute inset-0">
                        {overviewChart.ticks.map((tick) => (
                          <div
                            key={`${overviewMetric}-grid-${tick.y}`}
                            className={`absolute left-0 right-0 border-t border-dashed ${surfaceTheme.chartGrid}`}
                            style={{ top: `${tick.y}%` }}
                          />
                        ))}
                      </div>
                      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
                        <defs>
                          <linearGradient id={`overview-fill-${overviewMetric}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={overviewConfig.stroke} stopOpacity="0.34" />
                            <stop offset="100%" stopColor={overviewConfig.stroke} stopOpacity="0.02" />
                          </linearGradient>
                          <linearGradient id={`overview-stroke-${overviewMetric}`} x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor={overviewConfig.accent} />
                            <stop offset="100%" stopColor={overviewConfig.stroke} />
                          </linearGradient>
                        </defs>
                        {overviewChart.points.map((point, index) => (
                          <g key={`${point.label}-${index}`}>
                            <line
                              x1={point.x}
                              x2={point.x}
                              y1="86"
                              y2={point.y}
                              stroke={overviewConfig.stroke}
                              strokeOpacity="0.12"
                              strokeDasharray="2 3"
                              className="dashboard-column-rise"
                              style={{ animationDelay: `${80 + index * 70}ms` }}
                            />
                          </g>
                        ))}
                        <path
                          className="dashboard-area-rise"
                          d={overviewChart.areaPath}
                          fill={`url(#overview-fill-${overviewMetric})`}
                          style={{ transformOrigin: "bottom center" }}
                        />
                        <path
                          className={`dashboard-line-animate ${surfaceTheme.lineGlow}`}
                          d={overviewChart.linePath}
                          fill="none"
                          stroke={`url(#overview-stroke-${overviewMetric})`}
                          strokeWidth="1.1"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          pathLength="1"
                          style={{ animationDelay: "140ms" }}
                        />
                        {overviewChart.points.map((point, index) => (
                          <g key={`${point.label}-dot-${index}`}>
                            <circle
                              cx={point.x}
                              cy={point.y}
                              r="2.6"
                              fill={overviewConfig.stroke}
                              className="dashboard-point-enter"
                              style={{ animationDelay: `${160 + index * 90}ms` }}
                            />
                            <circle
                              cx={point.x}
                              cy={point.y}
                              r="5.2"
                              fill={overviewConfig.stroke}
                              opacity="0.16"
                              className="dashboard-point-pulse"
                              style={{ animationDelay: `${420 + index * 120}ms` }}
                            />
                          </g>
                        ))}
                      </svg>
                      <div className={`absolute inset-x-0 bottom-4 flex justify-between px-6 text-xs font-medium uppercase tracking-[0.16em] ${surfaceTheme.chartLabel}`}>
                        {overviewBuckets.map((bucket) => (
                          <span key={bucket.key}>{bucket.label}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </section>

                <section className={`${surfaceTheme.panel} p-7`}>
                  <h2 className={`text-[22px] font-semibold tracking-[-0.03em] ${surfaceTheme.title}`}>Workload Breakdown</h2>
                  <p className={`mt-1 text-[15px] ${surfaceTheme.bodyText}`}>Current distribution of workshop activity.</p>

                  <div className="mt-8 flex flex-col items-center gap-8 xl:flex-row xl:items-start xl:justify-between">
                    <div
                      className="dashboard-ring-animate flex h-48 w-48 items-center justify-center rounded-full"
                      style={{ background: workloadBackground, animationDelay: "120ms" }}
                    >
                      <div className={`dashboard-ring-animate flex h-28 w-28 flex-col items-center justify-center rounded-full ${surfaceTheme.workRingCenter}`}>
                        <div className={`text-[16px] font-semibold ${surfaceTheme.title}`}>{totalWorkload || 0}</div>
                        <div className={`text-sm ${surfaceTheme.bodyText}`}>Tasks</div>
                      </div>
                    </div>

                    <div className="w-full space-y-4">
                      {workloadSegments.map((item) => {
                        const percentage = totalWorkload
                          ? Math.round((item.value / totalWorkload) * 100)
                          : 0;

                        return (
                          <button
                            key={item.label}
                            type="button"
                            onClick={() => handleNavigate(item.action)}
                            className={`flex w-full items-center justify-between rounded-[16px] px-2 py-2 text-[15px] text-left transition ${
                              isNight ? "hover:bg-[#0f172a]" : "hover:bg-[#f8fbff]"
                            }`}
                          >
                            <div className={`flex items-center gap-3 ${isNight ? "text-[#c0d0e5]" : "text-[#4b5563]"}`}>
                              <span
                                className="h-4 w-4 rounded-full"
                                style={{ backgroundColor: item.color }}
                              />
                              <span>{item.label}</span>
                            </div>
                            <span className={`font-semibold ${surfaceTheme.title}`}>{percentage}%</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </section>
              </div>

              <div className="mt-6 grid gap-6 xl:grid-cols-2">
                <section className={`${surfaceTheme.panel} p-7`}>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className={`text-[22px] font-semibold tracking-[-0.03em] ${surfaceTheme.title}`}>Service Flow Graph</h2>
                      <p className={`mt-1 text-[15px] ${surfaceTheme.bodyText}`}>
                        Compare service intake, job cards, and completed work {overviewRangeLabel.toLowerCase()}.
                      </p>
                    </div>
                    <div className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${isNight ? "bg-[#0f172a] text-[#9eb0c9]" : "bg-[#f3f4f6] text-[#6b7280]"}`}>
                      {TIME_RANGE_CONFIG[overviewRange]?.label}
                    </div>
                  </div>

                  <div className="mt-6">
                    <div className="grid grid-cols-[repeat(auto-fit,minmax(40px,1fr))] items-end gap-3">
                      {comparisonChart.map((item, index) => (
                        <div key={item.key} className="flex flex-col items-center gap-3">
                          <div className="flex h-[220px] items-end gap-1">
                            <div
                              className="dashboard-column-rise w-3 rounded-t-full bg-[#60a5fa]"
                              style={{ height: `${item.servicesHeight}%`, animationDelay: `${80 + index * 60}ms` }}
                              title={`Services: ${overviewBuckets[index]?.services || 0}`}
                            />
                            <div
                              className="dashboard-column-rise w-3 rounded-t-full bg-[#34d399]"
                              style={{ height: `${item.jobCardsHeight}%`, animationDelay: `${130 + index * 60}ms` }}
                              title={`Job Cards: ${overviewBuckets[index]?.jobCards || 0}`}
                            />
                            <div
                              className="dashboard-column-rise w-3 rounded-t-full bg-[#fbbf24]"
                              style={{ height: `${item.completedHeight}%`, animationDelay: `${180 + index * 60}ms` }}
                              title={`Completed: ${overviewBuckets[index]?.completed || 0}`}
                            />
                          </div>
                          <span className={`text-[11px] font-semibold uppercase tracking-[0.16em] ${surfaceTheme.chartLabel}`}>{item.label}</span>
                        </div>
                      ))}
                    </div>

                    <div className="mt-5 flex flex-wrap gap-4 text-sm">
                      <span className={`flex items-center gap-2 ${surfaceTheme.bodyText}`}><span className="h-3 w-3 rounded-full bg-[#60a5fa]" />Services</span>
                      <span className={`flex items-center gap-2 ${surfaceTheme.bodyText}`}><span className="h-3 w-3 rounded-full bg-[#34d399]" />Job Cards</span>
                      <span className={`flex items-center gap-2 ${surfaceTheme.bodyText}`}><span className="h-3 w-3 rounded-full bg-[#fbbf24]" />Completed</span>
                    </div>
                  </div>
                </section>

                <section className={`${surfaceTheme.panel} p-7`}>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className={`text-[22px] font-semibold tracking-[-0.03em] ${surfaceTheme.title}`}>Revenue And Pending Graph</h2>
                      <p className={`mt-1 text-[15px] ${surfaceTheme.bodyText}`}>
                        Track earned revenue against pending workload in the selected moving window.
                      </p>
                    </div>
                    <div className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${isNight ? "bg-[#0f172a] text-[#9eb0c9]" : "bg-[#f3f4f6] text-[#6b7280]"}`}>
                      Window {overviewOffset + 1}
                    </div>
                  </div>

                  <div className="mt-6 space-y-4">
                    {revenueMix.map((item, index) => (
                      <div key={item.key}>
                        <div className="mb-2 flex items-center justify-between">
                          <span className={`text-[12px] font-semibold uppercase tracking-[0.16em] ${surfaceTheme.chartLabel}`}>{item.label}</span>
                          <span className={`text-sm ${surfaceTheme.bodyText}`}>
                            {formatCurrency(item.revenueValue)} / {item.pendingValue} pending
                          </span>
                        </div>
                        <div className={`grid h-4 grid-cols-[minmax(0,1fr)_120px] gap-3 rounded-full ${isNight ? "bg-[#0f172a]" : "bg-[#f5f7fb]"}`}>
                          <div className="overflow-hidden rounded-full">
                            <div
                              className="dashboard-area-rise h-full rounded-full bg-[linear-gradient(90deg,#2563eb,#60a5fa)]"
                              style={{ width: `${item.revenueHeight}%`, animationDelay: `${100 + index * 70}ms` }}
                            />
                          </div>
                          <div className="overflow-hidden rounded-full">
                            <div
                              className="dashboard-area-rise h-full rounded-full bg-[linear-gradient(90deg,#f59e0b,#fbbf24)]"
                              style={{ width: `${item.pendingHeight}%`, animationDelay: `${160 + index * 70}ms` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-5 flex flex-wrap gap-4 text-sm">
                    <span className={`flex items-center gap-2 ${surfaceTheme.bodyText}`}><span className="h-3 w-3 rounded-full bg-[#2563eb]" />Revenue</span>
                    <span className={`flex items-center gap-2 ${surfaceTheme.bodyText}`}><span className="h-3 w-3 rounded-full bg-[#f59e0b]" />Pending</span>
                  </div>
                </section>
              </div>

              <div className="mt-6 grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
                <section className={`${surfaceTheme.panel} p-7`}>
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h2 className={`text-[22px] font-semibold tracking-[-0.03em] ${surfaceTheme.title}`}>Inventory Overview</h2>
                      <p className={`mt-1 text-[15px] ${surfaceTheme.bodyText}`}>
                        Monitor stock modules available in the workshop system.
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    {inventoryCards.map(({ label, value, helper, icon: Icon, iconWrap, action }) => (
                      <button
                        key={label}
                        type="button"
                        onClick={() => handleNavigate(action)}
                        className={`rounded-[24px] border p-5 text-left transition hover:-translate-y-0.5 ${isNight ? "border-[#223047] bg-[#0f172a]" : "border-[#e5e7eb] bg-[#f8fbff]"}`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className={`text-sm font-medium ${surfaceTheme.bodyText}`}>{label}</div>
                            <div className={`mt-3 text-4xl font-semibold tracking-[-0.04em] ${surfaceTheme.title}`}>
                              {value}
                            </div>
                            <div className={`mt-3 text-sm ${surfaceTheme.bodyText}`}>{helper}</div>
                          </div>
                          <div className={`flex h-12 w-12 items-center justify-center rounded-2xl text-xl ${iconWrap}`}>
                            <Icon />
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </section>

                <section className={`${surfaceTheme.panel} p-7`}>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h2 className={`text-[22px] font-semibold tracking-[-0.03em] ${surfaceTheme.title}`}>Recent Inventory</h2>
                      <p className={`mt-1 text-[15px] ${surfaceTheme.bodyText}`}>
                        Recently tracked spare parts and batteries.
                      </p>
                    </div>
                    <div className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${isNight ? "bg-[#0f172a] text-[#9eb0c9]" : "bg-[#f3f4f6] text-[#6b7280]"}`}>
                      Stock Watch
                    </div>
                  </div>

                  <div className="mt-6 grid gap-4 md:grid-cols-2">
                    <div className={`rounded-[24px] border p-4 ${isNight ? "border-[#223047] bg-[#0f172a]" : "border-[#e5e7eb] bg-[#fafafa]"}`}>
                      <div className={`mb-4 text-sm font-semibold uppercase tracking-[0.16em] ${surfaceTheme.bodyText}`}>Spare Parts</div>
                      <div className="space-y-3">
                        {recentSpareParts.length > 0 ? recentSpareParts.map((part) => (
                          <div key={part.part_id} className="flex items-center justify-between gap-3">
                            <div>
                              <div className={`font-medium ${surfaceTheme.title}`}>{part.part_name}</div>
                              <div className={`text-xs ${surfaceTheme.bodyText}`}>{part.part_number}</div>
                            </div>
                            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${Number(part.stock_qty || 0) <= 5 ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"}`}>
                              {part.stock_qty} in stock
                            </span>
                          </div>
                        )) : (
                          <div className={surfaceTheme.bodyText}>No spare parts available.</div>
                        )}
                      </div>
                    </div>

                    <div className={`rounded-[24px] border p-4 ${isNight ? "border-[#223047] bg-[#0f172a]" : "border-[#e5e7eb] bg-[#fafafa]"}`}>
                      <div className={`mb-4 text-sm font-semibold uppercase tracking-[0.16em] ${surfaceTheme.bodyText}`}>Batteries</div>
                      <div className="space-y-3">
                        {recentBatteries.length > 0 ? recentBatteries.map((battery) => (
                          <div key={battery.battery_id} className="flex items-center justify-between gap-3">
                            <div>
                              <div className={`font-medium ${surfaceTheme.title}`}>{battery.battery_name}</div>
                              <div className={`text-xs ${surfaceTheme.bodyText}`}>{battery.battery_code}</div>
                            </div>
                            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${Number(battery.stock_qty || 0) <= 5 ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"}`}>
                              {battery.stock_qty} in stock
                            </span>
                          </div>
                        )) : (
                          <div className={surfaceTheme.bodyText}>No batteries available.</div>
                        )}
                      </div>
                    </div>
                  </div>
                </section>
              </div>

              <section className={`${surfaceTheme.panel} mt-6 overflow-hidden`}>
                <div className={`flex flex-col gap-4 border-b px-6 py-6 md:flex-row md:items-center md:justify-between ${surfaceTheme.tableBorder}`}>
                  <div>
                    <h2 className={`text-[22px] font-semibold tracking-[-0.03em] ${surfaceTheme.title}`}>Recent Activity</h2>
                    <p className={`mt-1 text-[15px] ${surfaceTheme.bodyText}`}>
                      Recent service and job card activity in one admin view.
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      className={`rounded-2xl border px-4 py-2.5 text-sm font-medium ${surfaceTheme.ghostButton}`}
                      onClick={() =>
                        setActivityTypeFilter((current) =>
                          current === "all" ? "services" : current === "services" ? "jobs" : "all"
                        )
                      }
                    >
                      {activityTypeFilter === "all"
                        ? "Filters: All"
                        : activityTypeFilter === "services"
                          ? "Filters: Services"
                          : "Filters: Job Cards"}
                    </button>
                    <button
                      type="button"
                      className={`rounded-2xl border px-4 py-2.5 text-sm font-medium ${surfaceTheme.ghostButton}`}
                      onClick={handleExport}
                    >
                      Export
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full text-left">
                    <thead className={`${surfaceTheme.tableHead} text-sm`}>
                      <tr>
                        <th className="px-6 py-4 font-medium">Type</th>
                        <th className="px-6 py-4 font-medium">Vehicle</th>
                        <th className="px-6 py-4 font-medium">Details</th>
                        <th className="px-6 py-4 font-medium">Status</th>
                        <th className="px-6 py-4 font-medium">Date</th>
                        <th className="px-6 py-4 font-medium">Amount</th>
                      </tr>
                    </thead>
                    <tbody className={`${surfaceTheme.tableDivider} divide-y text-[15px]`}>
                      {loading ? (
                        <tr>
                          <td colSpan="6" className={`px-6 py-12 text-center ${surfaceTheme.bodyText}`}>
                            Loading dashboard activity...
                          </td>
                        </tr>
                      ) : visibleActivityRows.length > 0 ? (
                        visibleActivityRows.map((row) => (
                          <tr key={row.id} className={surfaceTheme.tableRow}>
                            <td className={`px-6 py-5 font-medium ${surfaceTheme.title}`}>{row.type}</td>
                            <td className={`px-6 py-5 font-medium ${surfaceTheme.title}`}>{row.primary}</td>
                            <td className={`px-6 py-5 ${surfaceTheme.bodyText}`}>{row.secondary}</td>
                            <td className="px-6 py-5">
                              <span className={`rounded-xl px-3 py-1.5 text-sm font-semibold ${getStatusClass(row.status)}`}>
                                {row.status}
                              </span>
                            </td>
                            <td className={`px-6 py-5 ${surfaceTheme.title}`}>{row.formattedDate}</td>
                            <td className={`px-6 py-5 font-semibold ${surfaceTheme.title}`}>{row.amount}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="6" className={`px-6 py-12 text-center ${surfaceTheme.bodyText}`}>
                            {searchQuery || activityTypeFilter !== "all"
                              ? "No matching records found."
                              : "No recent activity found."}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;

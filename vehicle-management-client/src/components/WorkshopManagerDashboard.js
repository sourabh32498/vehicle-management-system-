import React from "react";
import RoleOperationsDashboard from "./RoleOperationsDashboard";

function WorkshopManagerDashboard() {
  return (
    <RoleOperationsDashboard
      roleLabel="Workshop Manager"
      badgeLabel="Workshop Manager Console"
      headline="Welcome, {firstName}. Keep the workshop team aligned."
      description="This page is tailored for workshop supervision, balancing vehicle flow, service execution, and job-card visibility across daily operations."
      accent="amber"
      focusAreas={[
        "Oversee vehicle intake and workshop throughput.",
        "Track service progress and remove delivery bottlenecks.",
        "Review job cards and inventory readiness before delays build up.",
      ]}
      quickActions={[
        {
          title: "Open Vehicles",
          description: "Review incoming vehicles and current workshop records.",
          to: "/vehicles",
        },
        {
          title: "Open Services",
          description: "Monitor ongoing work and update service status.",
          to: "/services",
        },
        {
          title: "Open Job Cards",
          description: "Check active job cards and technician remarks.",
          to: "/job-cards",
        },
        {
          title: "Open Inventory",
          description: "Review spare parts and batteries before scheduling work.",
          to: "/spare-parts",
        },
      ]}
    />
  );
}

export default WorkshopManagerDashboard;

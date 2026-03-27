import React from "react";
import RoleOperationsDashboard from "./RoleOperationsDashboard";

function OperationsLeadDashboard() {
  return (
    <RoleOperationsDashboard
      roleLabel="Operations Lead"
      badgeLabel="Operations Lead Hub"
      headline="Welcome, {firstName}. Drive execution across workshop operations."
      description="This page gives an operations-focused view of active work, inventory support, and the movement of vehicles and job cards through the workshop."
      accent="rose"
      focusAreas={[
        "Watch the live operational queue across services and job cards.",
        "Use inventory counts to reduce delays in execution.",
        "Move between vehicle, service, and parts modules with fewer admin distractions.",
      ]}
      quickActions={[
        {
          title: "Operations Queue",
          description: "Open services and review active operational work.",
          to: "/services",
        },
        {
          title: "Vehicle Flow",
          description: "Inspect vehicle records tied to workshop movement.",
          to: "/vehicles",
        },
        {
          title: "Spare Parts",
          description: "Check parts availability for ongoing work.",
          to: "/spare-parts",
        },
        {
          title: "Job Cards",
          description: "Track work orders and completion progress.",
          to: "/job-cards",
        },
      ]}
    />
  );
}

export default OperationsLeadDashboard;

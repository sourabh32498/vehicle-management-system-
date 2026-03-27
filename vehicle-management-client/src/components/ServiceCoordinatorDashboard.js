import React from "react";
import RoleOperationsDashboard from "./RoleOperationsDashboard";

function ServiceCoordinatorDashboard() {
  return (
    <RoleOperationsDashboard
      roleLabel="Service Coordinator"
      badgeLabel="Service Coordinator Desk"
      headline="Welcome, {firstName}. Coordinate each service touchpoint."
      description="This workspace is focused on scheduling flow, service follow-up, and keeping customer work orders and job cards moving without losing track of pending items."
      accent="emerald"
      focusAreas={[
        "Coordinate service entries and maintain clean status updates.",
        "Follow pending and in-progress work so vehicles do not stall in queue.",
        "Use job cards and inventory views to keep service commitments realistic.",
      ]}
      quickActions={[
        {
          title: "Service Desk",
          description: "Work through service entries and keep statuses current.",
          to: "/services",
        },
        {
          title: "Job Card Board",
          description: "Open job cards and continue service coordination.",
          to: "/job-cards",
        },
        {
          title: "Vehicles",
          description: "Cross-check vehicle details tied to service requests.",
          to: "/vehicles",
        },
        {
          title: "Batteries",
          description: "Review battery stock for service planning.",
          to: "/batteries",
        },
      ]}
    />
  );
}

export default ServiceCoordinatorDashboard;

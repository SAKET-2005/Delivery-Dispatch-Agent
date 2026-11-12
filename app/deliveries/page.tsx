"use client";

import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import DeliveriesTable from "@/components/deliveries/DeliveriesTable";

export default function DeliveriesPage() {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <AppShell title="Deliveries">
      <DeliveriesTable refreshKey={refreshKey} />
    </AppShell>
  );
}

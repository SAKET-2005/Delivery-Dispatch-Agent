"use client";

import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import RidersTable from "@/components/riders/RidersTable";

export default function RidersPage() {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <AppShell title="Riders">
      <RidersTable refreshKey={refreshKey} />
    </AppShell>
  );
}

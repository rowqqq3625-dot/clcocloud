"use client";

import React, { useState, useEffect } from "react";
import StockDashboard from "./StockDashboard";
import InventoryManager from "./InventoryManager";

export default function InventoryTab() {
  const [stats, setStats] = useState<any>({});
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/inventory");
      const data = await res.json();
      if (res.ok && data.success) {
        setStats(data.stats || {});
      }
    } catch (err) {
      console.error("Failed to fetch inventory stats", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div className="space-y-8 font-sans">
      <StockDashboard stats={stats} loading={loading} />
      <InventoryManager onSuccess={fetchStats} />
    </div>
  );
}

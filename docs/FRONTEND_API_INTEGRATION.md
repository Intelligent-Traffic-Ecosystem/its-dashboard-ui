# API Connections to Traffic Dashboard Frontend

**Version:** 1.0.0  
**Status:** Complete  
**Created:** May 7, 2026  
**Updated:** May 7, 2026

---

## 📊 Overview

This document outlines the integration of B3 backend APIs with the **Traffic Dashboard** frontend application, including both existing and newly created endpoints.

---

## 🔗 Connected APIs

### ✅ Recently Connected (High Priority)

#### 1. **Alert History API** — `GET /api/alerts/history`
**Status:** ✅ Connected  
**Component:** [AlertHistory.tsx](../apps/traffic-dashboard/src/components/alerts/AlertHistory.tsx)  
**Frontend Hook:** [useAlertHistory](../apps/traffic-dashboard/src/lib/hooks/useB3Backend.ts)

**Connection Chain:**
```
AlertHistory Component
  ↓ (fetches with)
useAlertHistory() hook
  ↓ (calls)
b3Backend.alerts.getHistory()
  ↓ (HTTP GET)
/api/alerts/history?limit=100&offset=0
  ↓ (backend service)
AlertService.getAlertHistory()
  ↓ (returns in-memory)
Alert history with pagination
```

**Frontend Features:**
- Displays 3 most recent acknowledged alerts
- Shows alert ID, operator name, and acknowledgement time
- Link to "View Full Archive" for complete history
- Loading state and error handling
- SRS Requirement: **REQ-FR-021** (Alert history log viewable by operators)

---

#### 2. **Analytics Trends API** — `GET /api/analytics/trends/{cameraId}`
**Status:** ✅ Connected  
**Component:** [PeakHourChart.tsx](../apps/traffic-dashboard/src/components/analytics/PeakHourChart.tsx)  
**Frontend Hook:** [useAnalyticsTrends](../apps/traffic-dashboard/src/lib/hooks/useB3Backend.ts)  
**Parent Component:** [analytics/page.tsx](../apps/traffic-dashboard/src/app/analytics/page.tsx)

**Connection Chain:**
```
Analytics Page (state: cameraId, dateRange)
  ↓ (passes props)
PeakHourChart Component
  ↓ (fetches with)
useAnalyticsTrends() hook
  ↓ (calls)
b3Backend.analytics.getTrends()
  ↓ (HTTP GET)
/api/analytics/trends/{cameraId}?from=...&to=...
  ↓ (backend service)
AnalyticsService.getTrends()
  ↓ (fetches from)
TrafficService.getMetricHistory()
  ↓ (fetches from B2)
B2 /metrics/history endpoint
  ↓ (returns raw metrics)
B3 transforms to trends
  ↓ (returns)
Trend analysis: peak hour, lowest congestion, trend direction
```

**Frontend Features:**
- Displays hourly congestion distribution as bar chart
- Highlights peak hour in secondary color
- Shows trend direction (increasing/decreasing/stable)
- Shows percentage change between first and second half of period
- Dynamic date range selection (Last 30 Days, Last 7 Days, Quarterly)
- Loading states and error handling
- SRS Requirements:
  - **REQ-FR-004:** Time range switching
  - **REQ-FR-023:** Historical analytics module
  - **REQ-FR-024:** Peak hour distribution display

---

### ✅ Previously Connected

#### 3. **Active Alerts** — `GET /api/alerts/active`
**Status:** ✅ Connected  
**Usage:** Real-time alert display, WebSocket integration

#### 4. **Map Locations** — `GET /api/locations`
**Status:** ✅ Connected  
**Component:** GoogleMap.tsx  
**Usage:** Display camera pins and incident markers

#### 5. **Traffic Cameras** — `GET /api/traffic/cameras`
**Status:** ✅ Connected  
**Usage:** Camera list, analytics camera selection

#### 6. **Current Metrics** — `GET /api/traffic/metrics/current`
**Status:** ✅ Connected  
**Usage:** Live dashboard updates

#### 7. **Metric History** — `GET /api/traffic/metrics/history`
**Status:** ✅ Connected  
**Usage:** Analytics charts and comparisons

#### 8. **Current Congestion** — `GET /api/traffic/congestion/current`
**Status:** ✅ Connected  
**Usage:** Heatmap data, congestion visualization

---

## 📁 Frontend Integration Structure

```
apps/traffic-dashboard/
├── src/
│   ├── lib/
│   │   ├── b2.ts                    # B2 server-side adapter
│   │   ├── b3-backend.ts            # ✅ NEW: B3 backend client
│   │   ├── socket.ts                # WebSocket configuration
│   │   └── hooks/
│   │       └── useB3Backend.ts       # ✅ NEW: React hooks
│   │
│   ├── components/
│   │   ├── analytics/
│   │   │   ├── PeakHourChart.tsx     # ✅ UPDATED: Uses trends API
│   │   │   ├── CongestionIndexChart.tsx
│   │   │   ├── CongestedSegmentsTable.tsx
│   │   │   └── ...
│   │   │
│   │   ├── alerts/
│   │   │   ├── AlertHistory.tsx      # ✅ UPDATED: Uses history API
│   │   │   ├── AlertTable.tsx
│   │   │   ├── AlertDetailPanel.tsx
│   │   │   └── ...
│   │   │
│   │   └── maps/
│   │       └── GoogleMap.tsx         # Uses locations API
│   │
│   └── app/
│       ├── layout.tsx
│       ├── page.tsx                  # Dashboard
│       ├── analytics/
│       │   └── page.tsx              # ✅ UPDATED: Date range & camera state
│       └── alerts/
│           └── page.tsx
```

---

## 🪝 React Hooks Available

### `useAlertHistory(cameraId?, limit?, offset?)`
Fetch paginated alert history

```typescript
const { data, loading, error } = useAlertHistory(
  "CAM-001",  // Optional: filter by camera
  100,        // Optional: items per page
  0           // Optional: page offset
);

if (loading) return <div>Loading...</div>;
if (error) return <div>Error: {error.message}</div>;

data?.items.forEach(item => {
  console.log(item.alertId, item.acknowledgedBy, item.acknowledgedAt);
});
```

### `useAnalyticsTrends(cameraId, from, to)`
Fetch trend analysis for a date range

```typescript
const { data, loading, error } = useAnalyticsTrends(
  "CAM-001",
  "2026-04-07T00:00:00Z",
  "2026-05-07T23:59:59Z"
);

if (data) {
  console.log(data.trend);              // "increasing" | "decreasing" | "stable"
  console.log(data.percentageChange);   // -5 to 100
  console.log(data.peakHour);           // { timestamp, congestionScore, ... }
  console.log(data.series);             // hourly data points
}
```

### `useActiveAlerts()`
Fetch active alerts with auto-refresh every 10 seconds

```typescript
const { data: alerts, loading, error } = useActiveAlerts();

alerts?.forEach(alert => {
  console.log(alert.id, alert.severity, alert.title);
});
```

### `useAcknowledgeAlert()`
Acknowledge an alert

```typescript
const { acknowledge, loading, error } = useAcknowledgeAlert();

const handleAcknowledge = async (alertId: string) => {
  try {
    const result = await acknowledge(alertId);
    console.log("Acknowledged by:", result.acknowledgedBy);
  } catch (err) {
    console.error("Failed to acknowledge");
  }
};
```

---

## 🔧 Environment Configuration

Add to `.env.local` in traffic-dashboard:

```env
# B3 Backend API URL
NEXT_PUBLIC_BACKEND_URL=http://localhost:5000

# Or for production:
# NEXT_PUBLIC_BACKEND_URL=https://api.traffic-system.example.com
```

---

## 📋 SRS Requirements Coverage

| Requirement | Status | Component | API Endpoint |
|-------------|--------|-----------|--------------|
| REQ-FR-004 | ✅ | Analytics Page | GET /api/analytics/trends |
| REQ-FR-021 | ✅ | AlertHistory | GET /api/alerts/history |
| REQ-FR-023 | ✅ | Analytics Page | GET /api/analytics/summary |
| REQ-FR-024 | ✅ | PeakHourChart | GET /api/analytics/trends |
| REQ-FR-015 | ✅ | Real-time alerts | WebSocket + GET /api/alerts/active |
| REQ-FR-018 | ✅ | AlertTable | POST /api/alerts/{id}/acknowledge |

---

## 🚀 Usage Examples

### Example 1: Display Alert History in a Modal
```typescript
import { useAlertHistory } from "@/lib/hooks/useB3Backend";

export function AlertHistoryModal() {
  const [page, setPage] = useState(0);
  const { data, loading } = useAlertHistory(undefined, 50, page * 50);

  return (
    <dialog>
      <h2>Alert History</h2>
      {data?.items.map(item => (
        <div key={item.alertId}>
          <p>{item.alertId}</p>
          <p>Acknowledged by: {item.acknowledgedBy}</p>
          <p>At: {item.acknowledgedAt}</p>
        </div>
      ))}
      {data?.pagination.hasMore && (
        <button onClick={() => setPage(page + 1)}>
          Load More
        </button>
      )}
    </dialog>
  );
}
```

### Example 2: Display Trends for Selected Camera
```typescript
import { useAnalyticsTrends } from "@/lib/hooks/useB3Backend";

export function CameraTrendAnalysis({ cameraId }) {
  const [dateRange, setDateRange] = useState({
    from: "2026-04-07T00:00:00Z",
    to: "2026-05-07T23:59:59Z"
  });

  const { data: trends } = useAnalyticsTrends(
    cameraId,
    dateRange.from,
    dateRange.to
  );

  return (
    <section>
      <h3>{cameraId} - Trend Analysis</h3>
      {trends && (
        <>
          <p>
            Trend: <strong>{trends.trend.toUpperCase()}</strong>
            {trends.percentageChange > 0 ? "📈" : "📉"}
          </p>
          <p>Peak Hour: {trends.peakHour?.timestamp}</p>
          <p>
            Congestion Score: {trends.peakHour?.congestionScore}
          </p>
          <LineChart data={trends.series} />
        </>
      )}
    </section>
  );
}
```

---

## ✅ Testing Checklist

- [ ] AlertHistory component loads and displays real data
- [ ] AlertHistory handles pagination correctly
- [ ] AlertHistory shows loading state while fetching
- [ ] AlertHistory displays error state on API failure
- [ ] PeakHourChart displays hourly bars correctly
- [ ] PeakHourChart highlights peak hour
- [ ] PeakHourChart updates when camera changes
- [ ] PeakHourChart updates when date range changes
- [ ] Analytics page time range buttons toggle correctly
- [ ] Date range calculations are correct (last 30 days, etc.)
- [ ] API calls include proper credentials (httpOnly cookies)
- [ ] Error messages are user-friendly
- [ ] Loading states prevent user interaction

---

## 📞 Related Documentation

- [B3 Backend API Documentation](./README_v1.0.0.md)
- [B2 Alert History Integration TODO](./B2_ALERT_HISTORY_API_TODO.md)
- [SRS - Traffic Dashboard Requirements](../SRS/SRS.md)

---

**Document Version:** 1.0.0  
**Last Updated:** May 7, 2026  
**Status:** Complete - Ready for Testing

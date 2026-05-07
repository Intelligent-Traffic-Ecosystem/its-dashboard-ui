# B2 Alert History API Integration - TODO

**Version:** 1.0.0  
**Status:** Planning  
**Priority:** High  
**Created:** May 7, 2026  

---

## 📋 Overview

Currently, the B3 `/api/alerts/history` endpoint stores acknowledgements in **in-memory only** (max 1000 entries). This document outlines the plan to integrate with a persistent **B2 Alert Storage Service** for:

- Persistent alert history across server restarts
- Long-term alert analytics and trends
- Audit trail for alert acknowledgements
- Scalable storage for high-volume alerts

---

## 🎯 Goals

1. Create B2 Alert History API endpoints (if not already present)
2. Implement B2 HTTP client integration in B3
3. Migrate in-memory alert storage to B2
4. Maintain backward compatibility with current in-memory caching
5. Implement proper error handling and fallback mechanisms

---

## 📝 Implementation Tasks

### Phase 1: B2 Backend Requirements (B2 Team)

#### Task 1.1: Define Alert History Data Model
- [ ] Design alert history schema in B2 database
- [ ] Fields: `alert_id`, `camera_id`, `severity`, `title`, `description`, `created_at`, `acknowledged_by`, `acknowledged_at`, `status`
- [ ] Add indexes: `(camera_id, created_at)`, `(status, created_at)`, `(acknowledged_by, acknowledged_at)`
- [ ] Define retention policy (e.g., 90 days, 1 year)

**Expected Schema:**
```sql
CREATE TABLE alert_history (
  id SERIAL PRIMARY KEY,
  alert_id VARCHAR(255) NOT NULL,
  camera_id VARCHAR(100) NOT NULL,
  severity VARCHAR(50),
  title VARCHAR(255),
  description TEXT,
  status VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  acknowledged_by VARCHAR(255),
  acknowledged_at TIMESTAMP,
  details JSONB,
  created_index ON (camera_id, created_at),
  status_index ON (status, created_at)
);
```

#### Task 1.2: Create B2 Alert History HTTP API
- [ ] Implement `GET /alerts/history` endpoint
  - Query params: `camera_id` (optional), `status` (optional), `limit`, `offset`
  - Response: Paginated alert list with metadata
  
- [ ] Implement `POST /alerts/{id}/acknowledge` endpoint
  - Body: `{ "acknowledged_by": "user_id", "notes": "optional" }`
  - Response: Updated alert record

- [ ] Implement `GET /alerts/{id}` endpoint
  - Response: Single alert details

**Example B2 API Contract:**
```
GET /alerts/history?camera_id=CAM-001&status=acknowledged&limit=100&offset=0
Response: {
  "data": [
    {
      "id": "ALERT-CAM-001-123456",
      "camera_id": "CAM-001",
      "severity": "critical",
      "title": "High congestion at CAM-001",
      "created_at": "2026-05-07T17:30:00Z",
      "acknowledged_by": "john.doe",
      "acknowledged_at": "2026-05-07T17:35:00Z",
      "status": "acknowledged"
    }
  ],
  "pagination": {
    "total": 245,
    "limit": 100,
    "offset": 0,
    "has_more": true
  }
}
```

#### Task 1.3: Implement Alert Persistence in B2
- [ ] When congestion alert is triggered, store in `alert_history` table
- [ ] Generate unique `alert_id` for tracking
- [ ] Store initial creation with `status: "active"`
- [ ] Update `acknowledged_at` and change status when acknowledged

#### Task 1.4: Add WebSocket Event for Alert Storage
- [ ] Emit event when alert is created: `alert:created`
- [ ] Emit event when alert is acknowledged: `alert:acknowledged`
- [ ] Include full alert object in payload

---

### Phase 2: B3 Backend Integration (B3 Team)

#### Task 2.1: Extend B2 HTTP Client
- [ ] Add methods to `B2HttpClient`:
  ```javascript
  getAlertHistory(filters) // GET /alerts/history
  getAlert(alertId)        // GET /alerts/{id}
  acknowledgeAlert(alertId, acknowledgedBy)  // POST /alerts/{id}/acknowledge
  ```

**File:** [b2HttpClient.js](../backend/src/clients/b2HttpClient.js)

#### Task 2.2: Create Alert History Adapter
- [ ] Create `b2AlertHistoryAdapter.js` 
- [ ] Implement B2 alert storage communication
- [ ] Handle errors and timeouts gracefully

**File to Create:** `src/adapters/b2AlertHistoryAdapter.js`

```javascript
class B2AlertHistoryAdapter {
  constructor(httpClient) {
    this.httpClient = httpClient;
  }

  async getHistory(filters) {
    return this.httpClient.get("/alerts/history", filters);
  }

  async acknowledge(alertId, acknowledgedBy) {
    return this.httpClient.post(`/alerts/${alertId}/acknowledge`, {
      acknowledged_by: acknowledgedBy
    });
  }

  async getAlert(alertId) {
    return this.httpClient.get(`/alerts/${alertId}`);
  }
}
```

#### Task 2.3: Update AlertService
- [ ] Modify [alertService.js](../backend/src/services/alertService.js) to use B2 adapter
- [ ] Implement fallback to in-memory when B2 is down
- [ ] Add hybrid mode: cache B2 results in memory (LRU cache)
- [ ] Remove hard limit on history size (now persistent)

**Changes:**
```javascript
class AlertService {
  constructor(trafficService, b2AlertAdapter) {
    this.trafficService = trafficService;
    this.b2AlertAdapter = b2AlertAdapter;
    this.localCache = new Map();  // LRU cache for performance
  }

  async getAlertHistory(options) {
    try {
      // Try B2 first
      return await this.b2AlertAdapter.getHistory(options);
    } catch (error) {
      // Fallback to memory
      console.warn("B2 alert history unavailable, using local cache");
      return this._getLocalHistory(options);
    }
  }

  async acknowledge(alertId, user) {
    try {
      // Persist to B2
      return await this.b2AlertAdapter.acknowledge(
        alertId,
        user?.preferred_username || user?.sub
      );
    } catch (error) {
      // Fallback to local storage
      console.warn("B2 alert acknowledgement failed, using local storage");
      return this._acknowledgeLocal(alertId, user);
    }
  }
}
```

#### Task 2.4: Update Initialization
- [ ] Modify [services/index.js](../backend/src/services/index.js)
- [ ] Create and inject B2AlertHistoryAdapter
- [ ] Pass adapter to AlertService constructor

```javascript
const b2AlertHistoryAdapter = new B2AlertHistoryAdapter(
  b2HttpClient
);
const alertService = new AlertService(
  trafficService,
  b2AlertHistoryAdapter
);
```

#### Task 2.5: Add B2 Alert Event Listener
- [ ] Subscribe to B2 WebSocket alert events
- [ ] Update local cache when alerts are created/acknowledged
- [ ] Emit Socket.IO events to frontend

---

### Phase 3: Frontend Integration (Optional)

#### Task 3.1: Update Admin Dashboard
- [ ] Create alert history view with pagination
- [ ] Add filters: camera, date range, status
- [ ] Display acknowledgement metadata (who, when)

#### Task 3.2: Add Alert Timeline
- [ ] Visualize alert activity over time
- [ ] Show congestion vs alert correlation

---

## 🔄 Integration Points

### Current Flow (In-Memory Only)
```
Active Alert Created
  ↓
AlertService stores in this.history
  ↓
GET /api/alerts/history returns in-memory data
```

### New Flow (With B2)
```
Active Alert Created in B2
  ↓
B2 stores in database
  ↓
B2 emits WebSocket event
  ↓
B3 receives and caches
  ↓
GET /api/alerts/history fetches from B2
  ↓
(with fallback to cache if B2 down)
```

---

## 📊 Data Flow Diagram

```
B2 Backend (Alert Storage)
    ↓
B2 HTTP API (/alerts/history, /alerts/{id}/acknowledge)
    ↓
B3 B2AlertHistoryAdapter
    ↓
B3 AlertService (with fallback logic)
    ↓
B3 AlertsRouter (/api/alerts/history)
    ↓
Frontend Applications
```

---

## ⚙️ Configuration

### Environment Variables to Add

```env
# B2 Alert Service Configuration
B2_ALERT_API_ENABLED=true
B2_ALERT_CACHE_SIZE=500
B2_ALERT_CACHE_TTL_SECONDS=300
B2_ALERT_FETCH_TIMEOUT_MS=5000
```

---

## 🛡️ Error Handling Strategy

| Scenario | Behavior |
|----------|----------|
| B2 unavailable | Return local cache (if available) |
| B2 timeout | Return local cache with warning |
| Network error | Return 503 with retry info |
| Alert creation fails | Log and continue (best effort) |
| Acknowledge fails | Retry with exponential backoff |

---

## 📈 Performance Considerations

- **Pagination:** Fetch only 100 alerts per request (configurable)
- **Caching:** LRU cache (500 entries default) with 5-min TTL
- **Indexing:** B2 must index `(camera_id, created_at)` and `(status, created_at)`
- **Retention:** B2 should implement automatic cleanup (90+ days)
- **Batch Operations:** Support bulk acknowledge if needed

---

## ✅ Testing Checklist

### Unit Tests
- [ ] B2AlertHistoryAdapter with mock B2 responses
- [ ] AlertService fallback to local cache
- [ ] Pagination logic
- [ ] Error handling

### Integration Tests
- [ ] B3 ↔ B2 alert history synchronization
- [ ] WebSocket event propagation
- [ ] Cache invalidation on B2 updates
- [ ] Fallback behavior when B2 is down

### End-to-End Tests
- [ ] Create alert in B2 → appears in B3 history
- [ ] Acknowledge alert → updates in both B2 & B3
- [ ] Pagination works correctly
- [ ] Filters (camera_id, status) work

---

## 📅 Timeline Estimate

| Phase | Task | Duration | Dependencies |
|-------|------|----------|--------------|
| 1 | B2 Database Schema | 1-2 days | - |
| 1 | B2 API Endpoints | 3-4 days | Schema complete |
| 1 | Alert Persistence | 2-3 days | API complete |
| 2 | B3 Adapter & Service | 3-4 days | B2 API ready |
| 2 | Error Handling & Fallback | 2 days | Adapter done |
| 3 | Frontend Integration | 2-3 days | B3 API ready |
| **Total** | | **13-19 days** | Sequential |

---

## 🎯 Success Criteria

- [ ] B3 `/api/alerts/history` fetches from B2 persistent storage
- [ ] Acknowledgements persisted to B2 database
- [ ] Graceful fallback to in-memory cache if B2 unavailable
- [ ] Alert history available across server restarts
- [ ] Pagination and filtering work correctly
- [ ] Response time < 500ms for typical query
- [ ] WebSocket events propagated in real-time
- [ ] Full test coverage (unit + integration)
- [ ] Documentation updated (Swagger/OpenAPI)

---

## 📚 Related Documentation

- [B3 Backend API Documentation](./README_v1.0.0.md)
- [B2 API Specification](../../b2-data/docs/)
- [B3 Services Architecture](./README_v1.0.0.md#architecture)
- [WebSocket Integration](./README_v1.0.0.md#real-time-features)

---

## 👥 Stakeholders

- **B2 Team:** Implement database schema and API endpoints
- **B3 Team:** Integrate B2 adapter and update services
- **Frontend Team:** Add alert history UI and timeline
- **DevOps Team:** Configure environment variables and monitoring

---

**Document Version:** 1.0.0  
**Last Updated:** May 7, 2026  
**Status:** Ready for Planning

/**
 * React hooks for B3 Backend API
 */

import { useEffect, useState, type DependencyList } from "react";
import {
    b3Backend,
    formatAlertTime,
    type AlertHistory,
    type AlertHistoryFilters,
    type AnalyticsComparison,
    type AnalyticsMetrics,
    type AnalyticsSummary,
    type AnalyticsTrend,
    type DashboardEvent,
    type DashboardSummary,
    type HeatmapPoint,
    type HealthStatus,
    type MapIncident,
    type TrafficAlert,
    type TrafficMetric,
} from "../b3-backend";

export { formatAlertTime };

interface UseAsyncState<T> {
    data: T | null;
    loading: boolean;
    error: Error | null;
}

function toError(error: unknown) {
    return error instanceof Error ? error : new Error(String(error));
}

function usePollingResource<T>(
    fetcher: () => Promise<T>,
    deps: DependencyList,
    refreshMs?: number
) {
    const [state, setState] = useState<UseAsyncState<T>>({
        data: null,
        loading: true,
        error: null,
    });

    useEffect(() => {
        let isMounted = true;

        const fetchData = async (showLoading: boolean) => {
            try {
                if (showLoading) {
                    setState((prev) => ({ ...prev, loading: true, error: null }));
                }
                const data = await fetcher();
                if (isMounted) setState({ data, loading: false, error: null });
            } catch (error) {
                if (isMounted) {
                    setState((prev) => ({
                        data: prev.data,
                        loading: false,
                        error: toError(error),
                    }));
                }
            }
        };

        fetchData(true);
        const interval = refreshMs ? setInterval(() => fetchData(false), refreshMs) : null;

        return () => {
            isMounted = false;
            if (interval) clearInterval(interval);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, deps);

    return state;
}

export function useDashboardSummary(refreshMs: number = 10000) {
    return usePollingResource<DashboardSummary>(
        () => b3Backend.dashboard.getSummary(),
        [refreshMs],
        refreshMs
    );
}

export function useDashboardEvents(limit: number = 10, refreshMs: number = 10000) {
    return usePollingResource<DashboardEvent[]>(
        () => b3Backend.dashboard.getEvents(limit),
        [limit, refreshMs],
        refreshMs
    );
}

export function useCurrentCongestion(refreshMs: number = 10000) {
    return usePollingResource<TrafficMetric[]>(
        () => b3Backend.traffic.getCurrentCongestionTyped(),
        [refreshMs],
        refreshMs
    );
}

export function useMapIncidents(refreshMs: number = 10000) {
    return usePollingResource<MapIncident[]>(
        () => b3Backend.map.getIncidents(),
        [refreshMs],
        refreshMs
    );
}

export function useMapHeatmap(refreshMs: number = 10000) {
    return usePollingResource<HeatmapPoint[]>(
        () => b3Backend.map.getHeatmap(),
        [refreshMs],
        refreshMs
    );
}

export function useB3Health(refreshMs: number = 10000) {
    return usePollingResource<HealthStatus>(
        () => b3Backend.health.check(),
        [refreshMs],
        refreshMs
    );
}

/**
 * Hook to fetch alert history
 */
export function useAnalyticsSummary(cameraId: string, from: string, to: string) {
    return usePollingResource<AnalyticsSummary>(
        () => b3Backend.analytics.getSummary(cameraId, from, to),
        [cameraId, from, to],
        15000
    );
}

export function useAnalyticsMetrics(from: string, to: string) {
    return usePollingResource<AnalyticsMetrics>(
        () => b3Backend.analytics.getMetrics(from, to),
        [from, to],
        15000
    );
}

export function useAnalyticsComparison(aFrom: string, aTo: string, bFrom: string, bTo: string) {
    return usePollingResource<AnalyticsComparison>(
        () => b3Backend.analytics.compare(aFrom, aTo, bFrom, bTo),
        [aFrom, aTo, bFrom, bTo],
        30000
    );
}

export function useAlertHistory(filters?: string | AlertHistoryFilters, limit: number = 100, offset: number = 0) {
    const [state, setState] = useState<UseAsyncState<AlertHistory>>({
        data: null,
        loading: true,
        error: null,
    });

    useEffect(() => {
        let isMounted = true;

        const fetchHistory = async () => {
            try {
                setState({ data: null, loading: true, error: null });
                const data = await b3Backend.alerts.getHistory(filters, limit, offset);
                if (isMounted) {
                    setState({ data, loading: false, error: null });
                }
            } catch (error) {
                if (isMounted) {
                    setState({
                        data: null,
                        loading: false,
                        error: toError(error),
                    });
                }
            }
        };

        fetchHistory();

        return () => {
            isMounted = false;
        };
    }, [filters, limit, offset]);

    return state;
}

/**
 * Hook to fetch analytics trends
 */
export function useAnalyticsTrends(cameraId: string, from: string, to: string) {
    const [state, setState] = useState<UseAsyncState<AnalyticsTrend>>({
        data: null,
        loading: true,
        error: null,
    });

    useEffect(() => {
        if (!cameraId || !from || !to) {
            queueMicrotask(() => setState({ data: null, loading: false, error: null }));
            return;
        }

        let isMounted = true;

        const fetchTrends = async () => {
            try {
                setState({ data: null, loading: true, error: null });
                const data = await b3Backend.analytics.getTrends(cameraId, from, to);
                if (isMounted) {
                    setState({ data, loading: false, error: null });
                }
            } catch (error) {
                if (isMounted) {
                    setState({
                        data: null,
                        loading: false,
                        error: toError(error),
                    });
                }
            }
        };

        fetchTrends();

        return () => {
            isMounted = false;
        };
    }, [cameraId, from, to]);

    return state;
}

/**
 * Hook to fetch active alerts
 */
export function useActiveAlerts() {
    const [state, setState] = useState<UseAsyncState<TrafficAlert[]>>({
        data: null,
        loading: true,
        error: null,
    });

    useEffect(() => {
        let isMounted = true;

        const fetchAlerts = async () => {
            try {
                setState({ data: null, loading: true, error: null });
                const data = await b3Backend.alerts.listActive();
                if (isMounted) {
                    setState({ data, loading: false, error: null });
                }
            } catch (error) {
                if (isMounted) {
                    setState({
                        data: null,
                        loading: false,
                        error: toError(error),
                    });
                }
            }
        };

        fetchAlerts();
        // Refresh every 10 seconds
        const interval = setInterval(fetchAlerts, 10000);

        return () => {
            isMounted = false;
            clearInterval(interval);
        };
    }, []);

    return state;
}

/**
 * Hook to acknowledge an alert
 */
export function useAcknowledgeAlert() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const acknowledge = async (alertId: string) => {
        try {
            setLoading(true);
            setError(null);
            const result = await b3Backend.alerts.acknowledge(alertId);
            return result;
        } catch (err) {
            const error = toError(err);
            setError(error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    return { acknowledge, loading, error };
}

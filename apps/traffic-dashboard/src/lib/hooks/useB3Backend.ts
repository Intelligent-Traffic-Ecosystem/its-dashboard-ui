/**
 * React hooks for B3 Backend API
 */

import { useEffect, useState } from "react";
import { b3Backend, type AlertHistory, type AnalyticsTrend, type TrafficAlert } from "../b3-backend";

interface UseAsyncState<T> {
    data: T | null;
    loading: boolean;
    error: Error | null;
}

/**
 * Hook to fetch alert history
 */
export function useAlertHistory(cameraId?: string, limit: number = 100, offset: number = 0) {
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
                const data = await b3Backend.alerts.getHistory(cameraId, limit, offset);
                if (isMounted) {
                    setState({ data, loading: false, error: null });
                }
            } catch (error) {
                if (isMounted) {
                    setState({
                        data: null,
                        loading: false,
                        error: error instanceof Error ? error : new Error(String(error)),
                    });
                }
            }
        };

        fetchHistory();

        return () => {
            isMounted = false;
        };
    }, [cameraId, limit, offset]);

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
            setState({ data: null, loading: false, error: null });
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
                        error: error instanceof Error ? error : new Error(String(error)),
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
                        error: error instanceof Error ? error : new Error(String(error)),
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
            const error = err instanceof Error ? err : new Error(String(err));
            setError(error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    return { acknowledge, loading, error };
}

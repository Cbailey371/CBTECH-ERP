import { useState, useEffect, useCallback } from 'react';
import axios from '../services/api';
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns';

export const useDashboardMetrics = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [metrics, setMetrics] = useState(null);

    // Default to current month
    const [dateRange, setDateRange] = useState({
        startDate: startOfMonth(new Date()),
        endDate: endOfMonth(new Date())
    });

    const [comparisonEnabled, setComparisonEnabled] = useState(true);

    const fetchMetrics = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const params = {
                startDate: format(dateRange.startDate, 'yyyy-MM-dd'),
                endDate: format(dateRange.endDate, 'yyyy-MM-dd')
            };

            if (comparisonEnabled) {
                params.compare = true;
                // Backend calculates previous period automatically based on duration
            }

            const response = await axios.get('/dashboard/metrics', { params });
            setMetrics(response.data.data);
        } catch (err) {
            console.error(err);
            setError('Error al cargar métricas del dashboard');
        } finally {
            setLoading(false);
        }
    }, [dateRange, comparisonEnabled]);

    useEffect(() => {
        fetchMetrics();
    }, [fetchMetrics]);

    const refresh = () => fetchMetrics();

    return {
        loading,
        error,
        metrics,
        dateRange,
        setDateRange,
        comparisonEnabled,
        setComparisonEnabled,
        refresh
    };
};

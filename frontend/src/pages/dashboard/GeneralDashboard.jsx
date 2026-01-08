import React, { useEffect } from 'react';
import { useDashboardMetrics } from '../../hooks/useDashboardMetrics';
import DashboardFilters from '../../components/dashboard/DashboardFilters';
import KPISection from '../../components/dashboard/KPISection';
import RevenueChart from '../../components/dashboard/RevenueChart';
import ActionTables from '../../components/dashboard/ActionTables';
import InsightsPanel from '../../components/dashboard/InsightsPanel';
import TopClientsTable from '../../components/dashboard/TopClientsTable';

const GeneralDashboard = () => {
    const {
        loading,
        metrics,
        dateRange,
        setDateRange,
        refresh,
        comparisonEnabled,
        setComparisonEnabled
    } = useDashboardMetrics();

    // Initial load handled by hook

    return (
        <div className="pb-12 animate-fadeIn">
            {/* Header & Filters */}
            <div className="mb-8">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    Dashboard General
                </h2>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                    Visión estratégica y operativa de la empresa.
                </p>

                <DashboardFilters
                    dateRange={dateRange}
                    setDateRange={setDateRange}
                    onRefresh={refresh}
                    loading={loading}
                    comparisonEnabled={comparisonEnabled}
                    setComparisonEnabled={setComparisonEnabled}
                />
            </div>

            {/* Automated Insights */}
            <InsightsPanel metrics={metrics} loading={loading} />

            {/* KPI Cards */}
            <KPISection metrics={metrics} loading={loading} />

            {/* Main Analysis Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                <div className="lg:col-span-2">
                    <RevenueChart data={metrics?.analytics} loading={loading} />
                </div>
                <div>
                    <TopClientsTable dateRange={dateRange} />
                </div>
            </div>

            {/* Action Tables */}
            <ActionTables />

        </div>
    );
};

export default GeneralDashboard;

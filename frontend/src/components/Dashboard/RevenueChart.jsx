import React, { useState } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    LineChart, Line, AreaChart, Area
} from 'recharts';

const RevenueChart = ({ data, loading }) => {
    const [chartType, setChartType] = useState('bar');

    if (loading || !data) {
        return <div className="h-80 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse"></div>;
    }

    // Format data dates for display
    const formattedData = data.map(item => ({
        ...item,
        displayDate: new Date(item.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
    }));

    const renderChart = () => {
        switch (chartType) {
            case 'line':
                return (
                    <LineChart data={formattedData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                        <XAxis dataKey="displayDate" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} tickFormatter={(value) => `$${value}`} />
                        <Tooltip
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                            formatter={(value) => [`$${value.toLocaleString()}`, undefined]}
                        />
                        <Legend />
                        <Line type="monotone" dataKey="cashIn" name="Cobrado (Cash-In)" stroke="#3B82F6" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="invoicing" name="Facturación" stroke="#10B981" strokeWidth={2} dot={false} />
                    </LineChart>
                );
            case 'area':
                return (
                    <AreaChart data={formattedData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                        <XAxis dataKey="displayDate" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} tickFormatter={(value) => `$${value}`} />
                        <Tooltip
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                            formatter={(value) => [`$${value.toLocaleString()}`, undefined]}
                        />
                        <Legend />
                        <Area type="monotone" dataKey="cashIn" name="Cobrado (Cash-In)" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.1} />
                        <Area type="monotone" dataKey="invoicing" name="Facturación" stroke="#10B981" fill="#10B981" fillOpacity={0.1} />
                    </AreaChart>
                );
            case 'bar':
            default:
                return (
                    <BarChart data={formattedData} barGap={4}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                        <XAxis dataKey="displayDate" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} tickFormatter={(value) => `$${value}`} />
                        <Tooltip
                            cursor={{ fill: 'transparent' }}
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                            formatter={(value) => [`$${value.toLocaleString()}`, undefined]}
                        />
                        <Legend wrapperStyle={{ paddingTop: '20px' }} />
                        <Bar dataKey="cashIn" name="Cobrado (Cash-In)" fill="#3B82F6" radius={[4, 4, 0, 0]} maxBarSize={40} />
                        <Bar dataKey="invoicing" name="Facturación" fill="#10B981" radius={[4, 4, 0, 0]} maxBarSize={40} />
                    </BarChart>
                );
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Tendencia de Ingresos vs Facturación</h3>
                <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1 text-xs font-medium">
                    <button
                        onClick={() => setChartType('bar')}
                        className={`px-3 py-1 rounded-md transition-colors ${chartType === 'bar' ? 'bg-white dark:bg-gray-600 shadow text-gray-900 dark:text-white' : 'text-gray-500 hover:text-gray-900'}`}
                    >
                        Barras
                    </button>
                    <button
                        onClick={() => setChartType('line')}
                        className={`px-3 py-1 rounded-md transition-colors ${chartType === 'line' ? 'bg-white dark:bg-gray-600 shadow text-gray-900 dark:text-white' : 'text-gray-500 hover:text-gray-900'}`}
                    >
                        Líneas
                    </button>
                    <button
                        onClick={() => setChartType('area')}
                        className={`px-3 py-1 rounded-md transition-colors ${chartType === 'area' ? 'bg-white dark:bg-gray-600 shadow text-gray-900 dark:text-white' : 'text-gray-500 hover:text-gray-900'}`}
                    >
                        Área
                    </button>
                </div>
            </div>
            <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    {renderChart()}
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default RevenueChart;

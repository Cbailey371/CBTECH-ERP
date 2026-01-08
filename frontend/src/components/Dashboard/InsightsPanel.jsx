import React from 'react';
import { Lightbulb, TrendingDown, AlertTriangle } from 'lucide-react';

const InsightsPanel = ({ metrics, loading }) => {
    if (loading || !metrics) return null;

    const { variations, receivables, funnel } = metrics;
    const insights = [];

    // 1. Invoicing drop
    if (variations && parseFloat(variations.invoicing) < -10) {
        insights.push({
            type: 'warning',
            icon: <TrendingDown className="w-5 h-5 text-red-500" />,
            text: `La facturación cayó un ${Math.abs(variations.invoicing)}% respecto al período anterior.`,
            color: 'bg-red-50 text-red-700 border-red-200'
        });
    }

    // 2. High Overdue AR
    if (receivables.totalOverdue > 1000) {
        insights.push({
            type: 'danger',
            icon: <AlertTriangle className="w-5 h-5 text-amber-500" />,
            text: `Tienes $${receivables.totalOverdue.toLocaleString()} en cuentas por cobrar vencidas.`,
            color: 'bg-amber-50 text-amber-700 border-amber-200'
        });
    }

    // 3. Positive Growth
    if (variations && parseFloat(variations.invoicing) > 10) {
        insights.push({
            type: 'success',
            icon: <Lightbulb className="w-5 h-5 text-amber-500" />, // Using lightbulb for idea/success
            text: `¡Excelente! La facturación subió un ${variations.invoicing}%.`,
            color: 'bg-indigo-50 text-indigo-700 border-indigo-200'
        });
    }

    if (insights.length === 0) return null;

    return (
        <div className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 p-4 rounded-xl border border-indigo-100 dark:border-indigo-800 mb-8 animate-fadeIn">
            <div className="flex items-center mb-2">
                <Lightbulb className="w-5 h-5 text-indigo-600 dark:text-indigo-400 mr-2" />
                <h3 className="font-bold text-indigo-900 dark:text-indigo-300 text-sm uppercase tracking-wide">Insights del Periodo</h3>
            </div>
            <div className="space-y-2 pl-7">
                {insights.map((insight, idx) => (
                    <div key={idx} className="flex items-start">
                        <span className="mr-2 mt-1.5 w-1.5 h-1.5 bg-indigo-400 rounded-full"></span>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                            {insight.type === 'success' && '🚀 '}
                            {insight.text}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default InsightsPanel;

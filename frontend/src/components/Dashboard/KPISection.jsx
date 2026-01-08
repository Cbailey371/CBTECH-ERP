import React from 'react';
import { DollarSign, FileText, Users, CreditCard, TrendingUp, AlertCircle } from 'lucide-react';

const KPISection = ({ metrics, loading }) => {
    if (loading || !metrics) {
        return <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>)}
        </div>;
    }

    const { cashIn, invoicing, customers, receivables, funnel, variations } = metrics;

    const cards = [
        {
            title: 'Ingresos Cobrados (Cash-In)',
            value: `$${cashIn.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
            trend: variations?.cashIn,
            icon: <DollarSign className="w-5 h-5" />,
            color: 'text-emerald-600',
            bg: 'bg-emerald-100 dark:bg-emerald-900/30'
        },
        {
            title: 'Facturación Emitida',
            value: `$${invoicing.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
            trend: variations?.invoicing,
            icon: <FileText className="w-5 h-5" />,
            color: 'text-blue-600',
            bg: 'bg-blue-100 dark:bg-blue-900/30'
        },
        {
            title: 'Cuentas por Cobrar',
            value: `$${receivables.totalPending.toLocaleString('en-US', { minimumFractionDigits: 0 })}`,
            subtext: `$${receivables.totalOverdue.toLocaleString()} Vencido`,
            subtextColor: receivables.totalOverdue > 0 ? 'text-red-500' : 'text-gray-500',
            icon: <CreditCard className="w-5 h-5" />,
            color: 'text-amber-600',
            bg: 'bg-amber-100 dark:bg-amber-900/30'
        },
        {
            title: 'Embudo (Conversión)',
            value: `${funnel.conversionRate}%`,
            subtext: `${funnel.accepted} Aceptadas / ${funnel.sent + funnel.draft} Activas`,
            trend: null, // Could add if available
            icon: <TrendingUp className="w-5 h-5" />,
            color: 'text-purple-600',
            bg: 'bg-purple-100 dark:bg-purple-900/30'
        }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {cards.map((card, index) => (
                <div key={index} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1">{card.title}</p>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{card.value}</h3>
                        </div>
                        <div className={`p-2 rounded-lg ${card.bg} ${card.color}`}>
                            {card.icon}
                        </div>
                    </div>

                    <div className="flex items-center text-sm">
                        {card.trend && (
                            <span className={`font-medium ${parseFloat(card.trend) >= 0 ? 'text-green-500' : 'text-red-500'} flex items-center`}>
                                {parseFloat(card.trend) >= 0 ? '↗' : '↘'} {Math.abs(card.trend)}%
                            </span>
                        )}
                        {card.subtext && (
                            <span className={`font-medium ${card.subtextColor || 'text-gray-500'} flex items-center`}>
                                {card.subtext}
                            </span>
                        )}
                        {card.trend && <span className="text-gray-400 ml-2">vs periodo anterior</span>}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default KPISection;

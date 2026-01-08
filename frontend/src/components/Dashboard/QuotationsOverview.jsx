import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Target, Clock, CheckCircle, XCircle, ArrowRight, TrendingUp } from 'lucide-react';

const QuotationsOverview = ({ metrics, loading }) => {
    const navigate = useNavigate();

    if (loading || !metrics) {
        return <div className="bg-white dark:bg-gray-800 rounded-xl p-6 h-48 animate-pulse border border-gray-200 dark:border-gray-700"></div>;
    }

    // Extract metrics
    const funnel = metrics.funnel || { draft: 0, sent: 0, accepted: 0, rejected: 0, totalValueInPlay: 0 };
    const quotations = metrics.quotations || { totalValue: 0, count: 0 };
    const variation = metrics.variations?.quotations || 0;

    // Derived values
    const moneyInPlay = funnel.totalValueInPlay || 0; // Draft + Sent
    const totalCount = quotations.count || 0;

    // Status breakdown for visual display
    const statuses = [
        { label: 'Borrador', count: funnel.draft, color: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300', icon: Clock },
        { label: 'Enviadas', count: funnel.sent, color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400', icon: Target },
        { label: 'Aceptadas', count: funnel.accepted, color: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400', icon: CheckCircle },
        { label: 'Rechazadas', count: funnel.rejected, color: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400', icon: XCircle },
    ];

    const hasVariation = variation !== undefined && variation !== null;
    const isPositive = parseFloat(variation) >= 0;

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8 hover:shadow-md transition-shadow">
            <div className="flex flex-col md:flex-row justify-between md:items-center mb-6">
                <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Target className="w-5 h-5 text-primary-600" />
                        Gestión de Cotizaciones
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                        Resumen de actividad comercial del periodo
                    </p>
                </div>
                <button
                    onClick={() => navigate('/sales/quotations')}
                    className="mt-4 md:mt-0 text-sm font-medium text-primary-600 hover:text-primary-700 flex items-center gap-1 group"
                >
                    Ver todas
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Money in Play Section */}
                <div className="lg:col-span-1 bg-gradient-to-br from-primary-50 to-white dark:from-gray-700 dark:to-gray-800 rounded-xl p-5 border border-primary-100 dark:border-gray-600">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Total en Juego (Borrador + Enviado)</p>
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        ${moneyInPlay.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </h2>

                    {hasVariation && (
                        <div className={`flex items-center text-sm font-medium ${isPositive ? 'text-green-600' : 'text-red-500'}`}>
                            {isPositive ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingUp className="w-4 h-4 mr-1 rotate-180" />}
                            {Math.abs(variation)}%
                            <span className="text-gray-400 dark:text-gray-500 font-normal ml-1"> vs periodo anterior</span>
                        </div>
                    )}
                </div>

                {/* Status Breakdown */}
                <div className="lg:col-span-2">
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Estado de Cotizaciones</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {statuses.map((status) => {
                            const Icon = status.icon;
                            return (
                                <div key={status.label} className="flex flex-col items-center justify-center p-4 rounded-lg border border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
                                    <div className={`p-2 rounded-full mb-2 ${status.color}`}>
                                        <Icon className="w-5 h-5" />
                                    </div>
                                    <span className="text-2xl font-bold text-gray-900 dark:text-white">{status.count}</span>
                                    <span className="text-xs text-gray-500">{status.label}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QuotationsOverview;

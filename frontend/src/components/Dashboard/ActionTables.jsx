import React, { useState, useEffect } from 'react';
import axios from '../../services/api';
import { Eye } from 'lucide-react';

const ActionTables = () => {
    const [data, setData] = useState({ recentOrders: [], staleQuotes: [] });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await axios.get('/dashboard/quick-actions');
                setData(res.data.data);
            } catch (error) {
                console.error("Error fetching actions", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) return <div className="h-64 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse mt-8"></div>;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
            {/* Recent Orders */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Órdenes Recientes</h3>
                <div className="space-y-4">
                    {data.recentOrders.length === 0 ? <p className="text-gray-500 text-sm">No hay órdenes recientes.</p> :
                        data.recentOrders.map(order => (
                            <div key={order.id} className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg border border-transparent hover:border-gray-100 transition-colors">
                                <div>
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">Orden #{order.number || '---'}</p>
                                    <p className="text-xs text-gray-500">{order.customer?.name}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-bold text-gray-900 dark:text-white">${parseFloat(order.total).toFixed(2)}</p>
                                    <p className="text-xs text-gray-500">{new Date(order.issueDate).toLocaleDateString()}</p>
                                </div>
                                <button className="p-2 text-gray-400 hover:text-primary-600 transition-colors">
                                    <Eye className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                </div>
            </div>

            {/* Stale Quotes */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Cotizaciones sin Seguimiento (+15 días)</h3>
                <div className="space-y-4">
                    {data.staleQuotes.length === 0 ?
                        <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                            <p className="text-sm">No hay datos recientes</p>
                        </div> :
                        data.staleQuotes.map(quote => (
                            <div key={quote.id} className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg border-l-4 border-l-amber-400 bg-amber-50/50 dark:bg-amber-900/10">
                                <div>
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">#{quote.number}</p>
                                    <p className="text-xs text-gray-500">{quote.customer?.name}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-bold text-gray-900 dark:text-white">${parseFloat(quote.total).toFixed(0)}</p>
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
                                        {quote.status}
                                    </span>
                                </div>
                                <button className="p-2 text-gray-400 hover:text-primary-600 transition-colors">
                                    <Eye className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                </div>
            </div>
        </div>
    );
};

export default ActionTables;

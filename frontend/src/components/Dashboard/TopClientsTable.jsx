import React, { useState, useEffect } from 'react';
import axios from '../../services/api';
import { format } from 'date-fns';

const TopClientsTable = ({ dateRange }) => {
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchClients = async () => {
            setLoading(true);
            try {
                const params = {
                    startDate: format(dateRange.startDate, 'yyyy-MM-dd'),
                    endDate: format(dateRange.endDate, 'yyyy-MM-dd')
                };
                const res = await axios.get('/dashboard/top-clients', { params });
                setClients(res.data.data);
            } catch (error) {
                console.error("Error fetching top clients", error);
            } finally {
                setLoading(false);
            }
        };

        fetchClients();
    }, [dateRange]);

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 h-full">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Top Clientes (Periodo)</h3>

            {loading ? (
                <div className="space-y-4 animate-pulse">
                    {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-10 bg-gray-100 dark:bg-gray-700 rounded"></div>)}
                </div>
            ) : (
                <div className="space-y-4">
                    {clients.length === 0 ? <p className="text-gray-500 text-sm">No hay ventas en este periodo.</p> :
                        clients.map((client, index) => (
                            <div key={client.customerId} className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <span className={`
                                    w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mr-3
                                    ${index === 0 ? 'bg-yellow-100 text-yellow-700' :
                                            index === 1 ? 'bg-gray-100 text-gray-700' :
                                                index === 2 ? 'bg-orange-100 text-orange-700' : 'bg-gray-50 text-gray-500'}
                                `}>
                                        {index + 1}
                                    </span>
                                    <span className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-[150px]">{client.customerName}</span>
                                </div>
                                <span className="text-sm font-bold text-gray-900 dark:text-white">
                                    ${parseFloat(client.totalSales).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </span>
                            </div>
                        ))}
                </div>
            )}
        </div>
    );
};

export default TopClientsTable;

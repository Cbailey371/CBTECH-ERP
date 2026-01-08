import React from 'react';
import { RefreshCw, Filter } from 'lucide-react';
import { format } from 'date-fns';

const DashboardFilters = ({ dateRange, setDateRange, onRefresh, loading, comparisonEnabled, setComparisonEnabled }) => {
    const [showFilters, setShowFilters] = React.useState(false);

    const handleDateChange = (e, type) => {
        const newDate = new Date(e.target.value + 'T00:00:00');
        setDateRange(prev => ({
            ...prev,
            [type]: newDate
        }));
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 mb-6 flex flex-col md:flex-row justify-between items-center gap-4 relative z-20">
            <div className="flex items-center space-x-4">
                <div className="flex items-center bg-gray-50 dark:bg-gray-700 rounded-lg p-1 border border-gray-200 dark:border-gray-600">
                    <input
                        type="date"
                        value={format(dateRange.startDate, 'yyyy-MM-dd')}
                        onChange={(e) => handleDateChange(e, 'startDate')}
                        className="bg-transparent border-none text-sm text-gray-700 dark:text-gray-200 focus:ring-0"
                    />
                    <span className="text-gray-400 mx-2">-</span>
                    <input
                        type="date"
                        value={format(dateRange.endDate, 'yyyy-MM-dd')}
                        onChange={(e) => handleDateChange(e, 'endDate')}
                        className="bg-transparent border-none text-sm text-gray-700 dark:text-gray-200 focus:ring-0"
                    />
                </div>
            </div>

            <div className="flex items-center space-x-2 relative">
                <button
                    onClick={onRefresh}
                    disabled={loading}
                    className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
                >
                    <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Actualizar
                </button>

                <div className="relative">
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`flex items-center px-4 py-2 text-sm font-medium border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${showFilters ? 'bg-gray-100 text-primary-600 border-primary-500 dark:bg-gray-700 dark:text-white' : 'text-gray-700 bg-white border-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600'}`}
                    >
                        <Filter className="w-4 h-4 mr-2" />
                        Filtros
                    </button>

                    {showFilters && (
                        <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 z-50 animate-fadeIn">
                            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Opciones de Visualización</h4>

                            <div className="flex items-center justify-between">
                                <label htmlFor="comparison-toggle" className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer select-none">
                                    Comparar con periodo anterior
                                </label>
                                <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                                    <input
                                        type="checkbox"
                                        name="comparison-toggle"
                                        id="comparison-toggle"
                                        checked={comparisonEnabled}
                                        onChange={(e) => setComparisonEnabled(e.target.checked)}
                                        className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer checked:right-0 checked:border-primary-600 right-5 border-gray-300"
                                    />
                                    <label htmlFor="comparison-toggle" className={`toggle-label block overflow-hidden h-5 rounded-full cursor-pointer ${comparisonEnabled ? 'bg-primary-600' : 'bg-gray-300'}`}></label>
                                </div>
                            </div>

                            {/* Future filters can go here */}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DashboardFilters;

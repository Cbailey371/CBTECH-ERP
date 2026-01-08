
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { FileText, Download, RefreshCw, Plus, Trash2 } from 'lucide-react';
import { getReportPreview, exportReport, getReportSchema } from '../../services/reportService';

export const ReportBuilder = ({ entity }) => {
    const { token, selectedCompany } = useAuth();
    const [loading, setLoading] = useState(false);
    const [previewData, setPreviewData] = useState([]);

    const [schema, setSchema] = useState(null);
    const [selectedFields, setSelectedFields] = useState([]);
    const [filters, setFilters] = useState([]); // [{ field, operator, value }]

    // Fetch Schema on Entity Change
    useEffect(() => {
        const loadSchema = async () => {
            setLoading(true);
            const response = await getReportSchema(token, entity);
            if (response.success) {
                setSchema(response.data);
                // Default: Select first 5 fields
                setSelectedFields(response.data.fields.slice(0, 5).map(f => f.key));
                setFilters([]);
                setPreviewData([]);
            }
            setLoading(false);
        };
        loadSchema();
    }, [entity, token]);

    const handleFieldToggle = (key) => {
        setSelectedFields(prev =>
            prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
        );
    };

    const addFilter = () => {
        if (!schema) return;
        const firstField = schema.fields[0].key;
        setFilters([...filters, { field: firstField, operator: 'eq', value: '' }]);
    };

    const removeFilter = (index) => {
        setFilters(filters.filter((_, i) => i !== index));
    };

    const updateFilter = (index, key, value) => {
        const newFilters = [...filters];
        newFilters[index][key] = value;
        setFilters(newFilters);
    };

    const generatePreview = async () => {
        if (!schema) return;
        setLoading(true);
        const config = {
            entity,
            filters, // Now sending array
            columns: schema.fields.filter(f => selectedFields.includes(f.key)),
            companyId: selectedCompany?.id
        };

        const response = await getReportPreview(token, config);
        if (response.success) {
            setPreviewData(response.data);
        }
        setLoading(false);
    };

    const handleExport = async (format) => {
        if (!schema) return;
        setLoading(true);
        const config = {
            entity,
            filters,
            columns: schema.fields.filter(f => selectedFields.includes(f.key)),
            companyId: selectedCompany?.id
        };
        await exportReport(token, config, format);
        setLoading(false);
    };

    // Helper to get nested value safely
    const getValue = (obj, path) => {
        return path.split('.').reduce((acc, part) => acc && acc[part], obj);
    };

    if (!schema) return <div className="p-8 text-center">Cargando esquema...</div>;

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <span>Configuración: {schema.label}</span>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                        {/* Filters Section */}
                        <div className="md:col-span-3 lg:col-span-1 space-y-4 border-r pr-6">
                            <div className="flex justify-between items-center">
                                <h3 className="text-sm font-medium">Filtros Avanzados</h3>
                                <Button size="sm" variant="ghost" onClick={addFilter}>
                                    <Plus size={16} />
                                </Button>
                            </div>

                            {filters.length === 0 && (
                                <p className="text-xs text-muted-foreground italic">Sin filtros activos.</p>
                            )}

                            {filters.map((filter, index) => (
                                <div key={index} className="flex gap-2 items-center bg-muted/30 p-2 rounded">
                                    <div className="flex-1 space-y-2">
                                        <select
                                            className="w-full text-xs p-1 rounded border bg-background"
                                            value={filter.field}
                                            onChange={(e) => updateFilter(index, 'field', e.target.value)}
                                        >
                                            {schema.fields.map(f => (
                                                <option key={f.key} value={f.key}>{f.label}</option>
                                            ))}
                                        </select>
                                        <div className="flex gap-2">
                                            <select
                                                className="w-1/3 text-xs p-1 rounded border bg-background"
                                                value={filter.operator}
                                                onChange={(e) => updateFilter(index, 'operator', e.target.value)}
                                            >
                                                <option value="eq">Igual</option>
                                                <option value="like">Contiene</option>
                                                <option value="gt">Mayor que</option>
                                                <option value="lt">Menor que</option>
                                            </select>
                                            <Input
                                                className="h-7 text-xs flex-1"
                                                value={filter.value}
                                                onChange={(e) => updateFilter(index, 'value', e.target.value)}
                                                placeholder="Valor..."
                                            />
                                        </div>
                                    </div>
                                    <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive" onClick={() => removeFilter(index)}>
                                        <Trash2 size={14} />
                                    </Button>
                                </div>
                            ))}
                        </div>

                        {/* Columns Section */}
                        <div className="md:col-span-3 lg:col-span-2 space-y-4">
                            <h3 className="text-sm font-medium">Columnas Seleccionadas</h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                                {schema.fields.map(field => (
                                    <label key={field.key} className={`flex items-center space-x-2 text-xs cursor-pointer p-2 border rounded transition-colors select-none ${selectedFields.includes(field.key) ? 'bg-primary/10 border-primary' : 'hover:bg-muted/50'}`}>
                                        <input
                                            type="checkbox"
                                            checked={selectedFields.includes(field.key)}
                                            onChange={() => handleFieldToggle(field.key)}
                                            className="rounded border-gray-300 text-primary focus:ring-primary"
                                        />
                                        <span>{field.label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 flex flex-wrap gap-3 pt-4 border-t">
                        <Button
                            onClick={generatePreview}
                            disabled={loading}
                            variant="outline"
                        >
                            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                            Generar / Actualizar
                        </Button>
                        <div className="flex-1" />
                        <Button
                            onClick={() => handleExport('excel')}
                            disabled={loading}
                            className="bg-green-600 hover:bg-green-700 text-white"
                        >
                            <FileText className="mr-2 h-4 w-4" />
                            Exportar Excel
                        </Button>
                        <Button
                            onClick={() => handleExport('csv')}
                            disabled={loading}
                            variant="secondary"
                        >
                            <Download className="mr-2 h-4 w-4" />
                            Exportar CSV
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Preview Table */}
            {previewData.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm text-muted-foreground">
                            Resultados ({previewData.length} registros)
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="overflow-x-auto">
                        <div className="max-h-[500px] overflow-y-auto border rounded-md">
                            <table className="w-full text-xs text-left relative">
                                <thead className="bg-muted text-muted-foreground sticky top-0 z-10 shadow-sm">
                                    <tr>
                                        {schema.fields
                                            .filter(f => selectedFields.includes(f.key))
                                            .map(f => (
                                                <th key={f.key} className="p-3 font-medium whitespace-nowrap bg-muted">{f.label}</th>
                                            ))
                                        }
                                    </tr>
                                </thead>
                                <tbody className="divide-y bg-card">
                                    {previewData.map((row, i) => (
                                        <tr key={i} className="hover:bg-muted/50 transition-colors">
                                            {schema.fields
                                                .filter(f => selectedFields.includes(f.key))
                                                .map(f => (
                                                    <td key={f.key} className="p-2 sm:p-3 whitespace-nowrap">
                                                        {String(getValue(row, f.key) || '-')}
                                                    </td>
                                                ))
                                            }
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};


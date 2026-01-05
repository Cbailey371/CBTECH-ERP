import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { FileText, ShoppingCart, Truck, Package, Users, BarChart } from 'lucide-react';
import { ReportBuilder } from '../../components/reports/ReportBuilder';

const ReportsPage = () => {
    const [selectedEntity, setSelectedEntity] = useState(null);

    const reportTypes = [
        { id: 'invoices', label: 'Reporte de Facturas', icon: FileText, description: 'Listado detallado de facturas emitidas' },
        { id: 'credit_notes', label: 'Reporte de Notas de Crédito', icon: FileText, description: 'Historial de notas de crédito' },
        { id: 'sales', label: 'Reporte de Cotizaciones', icon: ShoppingCart, description: 'Cotizaciones y órdenes de venta' },
        { id: 'purchases', label: 'Reporte de Compras', icon: Truck, description: 'Órdenes de compra y pagos' },
        { id: 'contracts', label: 'Reporte de Contratos', icon: FileText, description: 'Contratos, vencimientos y estados' },
        { id: 'products', label: 'Inventario / Productos', icon: Package, description: 'Listado de productos y stock' },
        { id: 'customers', label: 'Clientes', icon: Users, description: 'Base de datos de clientes' },
        { id: 'suppliers', label: 'Proveedores', icon: Truck, description: 'Base de datos de proveedores' },
        // { id: 'financial', label: 'Financiero', icon: BarChart, description: 'Ingresos y egresos' }
    ];

    if (selectedEntity) {
        return (
            <div className="p-6">
                <Button variant="outline" onClick={() => setSelectedEntity(null)} className="mb-4">
                    &larr; Volver a Reportes
                </Button>
                <ReportBuilder entity={selectedEntity} />
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Reportes</h1>
                <p className="text-muted-foreground mt-2">
                    Genera y exporta reportes personalizados en Excel o CSV.
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {reportTypes.map((type) => (
                    <Card
                        key={type.id}
                        className="hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-l-primary"
                        onClick={() => setSelectedEntity(type.id)}
                    >
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                {type.label}
                            </CardTitle>
                            <type.icon className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">Crear</div>
                            <p className="text-xs text-muted-foreground">
                                {type.description}
                            </p>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
};

export default ReportsPage;

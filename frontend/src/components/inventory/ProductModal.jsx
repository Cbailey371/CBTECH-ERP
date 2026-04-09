import React, { useState, useEffect } from 'react';
import { X, Save, Calculator } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

export default function ProductModal({ isOpen, onClose, onSubmit, product, loading }) {
    const [formData, setFormData] = useState({
        type: 'product',
        code: '',
        sku: '',
        description: '',
        cost: '',
        margin: '',
        price: '',
        isActive: true,
        isTaxExempt: false
    });

    useEffect(() => {
        if (product) {
            setFormData({
                type: product.type || 'product',
                code: product.code || '',
                sku: product.sku || '',
                description: product.description || '',
                cost: product.cost || '',
                margin: product.margin || '',
                price: product.price || '',
                isActive: product.isActive ?? true,
                isTaxExempt: product.isTaxExempt || false
            });
        } else {
            setFormData({
                type: 'product',
                code: '',
                sku: '',
                description: '',
                cost: '',
                margin: '',
                price: '',
                isActive: true,
                isTaxExempt: false
            });
        }
    }, [product, isOpen]);

    // Calcular precio automáticamente cuando cambian costo o margen
    useEffect(() => {
        const cost = parseFloat(formData.cost);
        const margin = parseFloat(formData.margin);

        if (!isNaN(cost) && !isNaN(margin)) {
            if (margin >= 1) {
                // Evitar división por cero o márgenes >= 100% que darían negativo/infinito con esta fórmula
                // Si el usuario pone 1 (100%), asumimos que quiere decir otra cosa o es un error, pero matemáticamente tiende a infinito.
                // Podríamos mostrar un error, pero por ahora solo no calculamos.
                return;
            }
            // Fórmula: Precio = Costo / (1 - Margen)
            const calculatedPrice = cost / (1 - margin);
            setFormData(prev => ({ ...prev, price: calculatedPrice.toFixed(2) }));
        }
    }, [formData.cost, formData.margin]);

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-background border border-border rounded-lg w-full max-w-2xl shadow-xl animate-in fade-in zoom-in duration-200 text-foreground">
                <div className="flex justify-between items-center p-6 border-b border-border">
                    <h2 className="text-xl font-bold text-foreground">
                        {product ? 'Editar Producto/Servicio' : 'Nuevo Producto/Servicio'}
                    </h2>
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 max-h-[calc(100vh-200px)]">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                        {/* Tipo y Estado */}
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">Tipo</label>
                                <select
                                    className="w-full h-11 px-3 bg-background border border-input rounded-xl text-foreground focus:ring-2 focus:ring-primary outline-none transition-all"
                                    value={formData.type}
                                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                >
                                    <option value="product">📦 Producto</option>
                                    <option value="service">🛠️ Servicio</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">Estado</label>
                                <select
                                    className="w-full h-11 px-3 bg-background border border-input rounded-xl text-foreground focus:ring-2 focus:ring-primary outline-none transition-all"
                                    value={formData.isActive ? 'true' : 'false'}
                                    onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'true' })}
                                >
                                    <option value="true">✅ Activo</option>
                                    <option value="false">❌ Inactivo</option>
                                </select>
                            </div>
                        </div>

                        {/* Código y SKU */}
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">Código Interno</label>
                                <Input
                                    value={formData.code || (formData.type === 'service' ? 'SERV-###' : 'PROD-###')}
                                    readOnly
                                    className="h-11 bg-muted/30 text-muted-foreground cursor-not-allowed border-dashed font-mono"
                                />
                                <p className="text-[10px] text-muted-foreground italic">
                                    Generado automáticamente al guardar
                                </p>
                            </div>

                            {formData.type === 'product' && (
                                <div className="space-y-2">
                                    <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">SKU / Código Barra</label>
                                    <Input
                                        className="h-11 rounded-xl"
                                        value={formData.sku}
                                        onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                                        placeholder="Ej: 74530123"
                                    />
                                </div>
                            )}
                        </div>

                        {/* Descripción (Full width) */}
                        <div className="space-y-2 md:col-span-2">
                            <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">Descripción del Item *</label>
                            <Input
                                className="h-11 rounded-xl"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Nombre comercial o técnico"
                                required
                            />
                        </div>

                        {/* Costos y Márgenes */}
                        <div className="p-4 bg-muted/10 border border-border rounded-2xl space-y-4 md:col-span-2">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">Costo Unitario ($)</label>
                                    <Input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        className="h-11 rounded-xl font-mono text-lg"
                                        value={formData.cost}
                                        onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                                        placeholder="0.00"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">Margen de Ganancia</label>
                                    <div className="relative">
                                        <Input
                                            type="number"
                                            min="0"
                                            max="0.99"
                                            step="0.01"
                                            className="h-11 pr-16 rounded-xl font-mono text-lg"
                                            value={formData.margin}
                                            onChange={(e) => setFormData({ ...formData, margin: e.target.value })}
                                            placeholder="0.30"
                                            required
                                        />
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-bold text-primary">
                                            {formData.margin ? `${(parseFloat(formData.margin) * 100).toFixed(0)}%` : '0%'}
                                        </div>
                                    </div>
                                    <p className="text-[10px] text-muted-foreground">Ej: 0.30 equivale a 30%</p>
                                </div>
                            </div>

                            {/* Resultado Visual */}
                            <div className="mt-2 p-4 bg-primary/5 border border-primary/20 rounded-xl flex flex-col items-center justify-center text-center">
                                <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-primary mb-1">Precio de Venta Sugerido</span>
                                <div className="text-3xl font-black text-primary font-mono tracking-tighter shadow-sm">
                                    ${formData.price || '0.00'}
                                </div>
                                <div className="flex items-center gap-1.5 mt-2 text-[10px] text-muted-foreground">
                                    <Calculator size={10} />
                                    <span>Cálculo: Costo / (1 - Margen)</span>
                                </div>
                            </div>
                        </div>
                        
                        {/* Exención de Impuestos */}
                        <div className="md:col-span-2 p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl">
                            <label className="flex items-center gap-3 cursor-pointer group">
                                <div className="relative">
                                    <input
                                        type="checkbox"
                                        id="isTaxExempt"
                                        checked={formData.isTaxExempt}
                                        onChange={(e) => setFormData(prev => ({ ...prev, isTaxExempt: e.target.checked }))}
                                        className="w-5 h-5 rounded border-input text-emerald-500 focus:ring-emerald-500 transition-all"
                                    />
                                </div>
                                <div className="flex-1">
                                    <span className="text-sm font-bold text-foreground">Exento de ITBMS (7%)</span>
                                    <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">
                                        Este ítem no generará impuestos en las facturas ni cotizaciones automáticamente.
                                    </p>
                                </div>
                            </label>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4 border-t border-border">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={onClose}
                            className="w-full sm:w-auto h-12 order-2 sm:order-1 text-muted-foreground hover:text-foreground hover:bg-muted/50"
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full sm:w-auto h-12 order-1 sm:order-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 font-bold"
                        >
                            <Save size={18} className="mr-2" />
                            {loading ? 'Guardando...' : 'Guardar Item'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}

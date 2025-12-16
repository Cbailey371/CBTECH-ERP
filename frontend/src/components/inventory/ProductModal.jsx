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
        isActive: true
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
                isActive: product.isActive ?? true
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
                isActive: true
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

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Tipo */}
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-muted-foreground">Tipo</label>
                            <select
                                className="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground focus:ring-2 focus:ring-primary outline-none"
                                value={formData.type}
                                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                            >
                                <option value="product">Producto</option>
                                <option value="service">Servicio</option>
                            </select>
                        </div>

                        {/* Estado */}
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-muted-foreground">Estado</label>
                            <select
                                className="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground focus:ring-2 focus:ring-primary outline-none"
                                value={formData.isActive ? 'true' : 'false'}
                                onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'true' })}
                            >
                                <option value="true">Activo</option>
                                <option value="false">Inactivo</option>
                            </select>
                        </div>

                        {/* Código */}
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-muted-foreground">Código Interno</label>
                            <Input
                                value={formData.code || (formData.type === 'service' ? 'SERV-###' : 'PROD-###')}
                                readOnly
                                className="bg-muted/50 text-muted-foreground cursor-not-allowed border-input"
                                placeholder="Se generará automáticamente"
                            />
                            <p className="text-xs text-muted-foreground">
                                Se generará automáticamente al guardar
                            </p>
                        </div>

                        {/* SKU (Solo para productos) */}
                        {formData.type === 'product' && (
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-muted-foreground">SKU</label>
                                <Input
                                    value={formData.sku}
                                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                                    placeholder="Ej: 12345678"
                                />
                            </div>
                        )}

                        {/* Descripción (Full width) */}
                        <div className="space-y-2 md:col-span-2">
                            <label className="block text-sm font-medium text-muted-foreground">Descripción *</label>
                            <Input
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Nombre o descripción del producto"
                                required
                            />
                        </div>

                        {/* Costo */}
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-muted-foreground">Costo Unitario ($)</label>
                            <Input
                                type="number"
                                min="0"
                                step="0.01"
                                value={formData.cost}
                                onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                                placeholder="0.00"
                                required
                            />
                        </div>

                        {/* Margen */}
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-muted-foreground">Margen (Decimal)</label>
                            <div className="relative">
                                <Input
                                    type="number"
                                    min="0"
                                    max="0.99"
                                    step="0.01"
                                    value={formData.margin}
                                    onChange={(e) => setFormData({ ...formData, margin: e.target.value })}
                                    placeholder="Ej: 0.30 para 30%"
                                    required
                                />
                                <div className="absolute right-3 top-2.5 text-xs text-muted-foreground pointer-events-none">
                                    {formData.margin ? `${(parseFloat(formData.margin) * 100).toFixed(0)}%` : ''}
                                </div>
                            </div>
                            <p className="text-xs text-muted-foreground">Ej: 0.30 representa el 30%</p>
                        </div>

                        {/* Precio Calculado */}
                        <div className="space-y-2 md:col-span-2">
                            <label className="block text-sm font-medium text-primary flex items-center gap-2">
                                <Calculator size={16} />
                                Precio de Venta Calculado
                            </label>
                            <Input
                                type="number"
                                value={formData.price}
                                readOnly
                                className="bg-muted/30 border-primary/50 text-primary font-bold text-lg text-center"
                            />
                            <p className="text-xs text-muted-foreground text-center">
                                Calculado como: Costo / (1 - Margen)
                            </p>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={onClose}
                            className="text-muted-foreground hover:text-foreground"
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading}
                            className="bg-primary hover:bg-primary/90 text-primary-foreground"
                        >
                            <Save size={18} className="mr-2" />
                            {loading ? 'Guardando...' : 'Guardar Producto'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}

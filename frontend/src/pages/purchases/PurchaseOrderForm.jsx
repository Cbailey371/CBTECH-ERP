import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Plus, Trash2, Search } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Combobox } from '../../components/ui/Combobox';
import { purchaseOrderService } from '../../services/purchaseOrderService';
import { supplierService } from '../../services/supplierService';
import * as companyService from '../../services/companyService'; // Import companyService
import productService from '../../services/productService';
import { generatePurchaseOrderPDF } from '../../utils/PurchaseOrderPDF';

export default function PurchaseOrderForm() {
    const { token, selectedCompany } = useAuth();
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditMode = !!id;

    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);

    // Master Data
    const [suppliers, setSuppliers] = useState([]);
    const [products, setProducts] = useState([]);

    // Form State
    const [currentCompany, setCurrentCompany] = useState(null);
    const [formData, setFormData] = useState({
        code: '',
        orderNumber: '',
        supplierId: '',
        issueDate: new Date().toISOString().split('T')[0],
        deliveryDate: '',
        paymentTerms: '',
        notes: '',
        items: []
    });

    const [totals, setTotals] = useState({
        subtotal: 0,
        taxTotal: 0,
        total: 0
    });

    // Fetch fresh company data ensuring latest RUC/Phone
    useEffect(() => {
        if (selectedCompany) {
            loadMasterData();
            if (isEditMode) {
                loadPO();
            }

            // Fetch fresh company data
            const fetchCompany = async () => {
                if (token && selectedCompany.id) {
                    try {
                        const response = await companyService.getCompanyById(token, selectedCompany.id);
                        if (response.success) setCurrentCompany(response.data);
                    } catch (err) {
                        console.error("Error fetching company", err);
                        setCurrentCompany(selectedCompany);
                    }
                }
            };
            fetchCompany();
        }
    }, [selectedCompany, id, token]); // Fixed dependency array

    // Recalculate totals whenever items change
    useEffect(() => {
        calculateTotals();
    }, [formData.items]);

    const loadMasterData = async () => {
        try {
            const [suppliersRes, productsRes] = await Promise.all([
                supplierService.getSuppliers(token, selectedCompany.id, { is_active: 'true' }),
                productService.getProducts({ type: 'product', is_active: 'true' }) // Only passing filter object as expected by service
            ]);

            if (suppliersRes.success) setSuppliers(suppliersRes.suppliers || []);
            if (productsRes.success) setProducts(productsRes.data?.products || []);
        } catch (error) {
            console.error('Error loading master data:', error);
        }
    };

    const loadPO = async () => {
        try {
            setLoading(true);
            const response = await purchaseOrderService.getPurchaseOrder(token, selectedCompany.id, id);
            if (response.success) {
                const po = response.data;
                setFormData({
                    code: po.orderNumber, // Keeping code property for compatibility if needed, but primarily populating orderNumber
                    orderNumber: po.orderNumber,
                    supplierId: po.supplierId,
                    issueDate: po.issueDate,
                    deliveryDate: po.deliveryDate || '',
                    paymentTerms: po.paymentTerms || '',
                    notes: po.notes || '',
                    items: po.items.map(i => ({
                        productId: i.productId,
                        description: i.description,
                        quantity: parseFloat(i.quantity),
                        unitPrice: parseFloat(i.unitPrice),
                        taxRate: parseFloat(i.taxRate),
                        subtotal: parseFloat(i.subtotal)
                    }))
                });
            }
        } catch (error) {
            console.error('Error loading PO:', error);
        } finally {
            setLoading(false);
        }
    };

    const calculateTotals = () => {
        let subtotal = 0;
        let taxTotal = 0;

        formData.items.forEach(item => {
            const lineSubtotal = item.quantity * item.unitPrice;
            const lineTax = lineSubtotal * item.taxRate;
            subtotal += lineSubtotal;
            taxTotal += lineTax;
        });

        setTotals({
            subtotal,
            taxTotal,
            total: subtotal + taxTotal
        });
    };

    const handleAddItem = () => {
        setFormData({
            ...formData,
            items: [
                ...formData.items,
                {
                    productId: '',
                    description: '',
                    quantity: 1,
                    unitPrice: 0,
                    taxRate: 0,
                    subtotal: 0
                }
            ]
        });
    };

    const handleRemoveItem = (index) => {
        const newItems = formData.items.filter((_, i) => i !== index);
        setFormData({ ...formData, items: newItems });
    };

    const handleItemChange = (index, field, value) => {
        const newItems = [...formData.items];
        const item = { ...newItems[index] };

        if (field === 'productId') {
            const product = products.find(p => p.id === parseInt(value));
            if (product) {
                item.productId = value;
                item.description = product.description || ''; // Snapshot description
                item.unitPrice = parseFloat(product.cost || 0); // Default to cost
                item.taxRate = 0.07; // Default tax, could come from product settings ideally
            }
        } else {
            item[field] = value;
        }

        newItems[index] = item;
        setFormData({ ...formData, items: newItems });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        console.log('Submitting PO Data:', formData); // Debug log

        if (!formData.supplierId || formData.items.length === 0) {
            alert('Seleccione un proveedor y agregue al menos un producto');
            return;
        }

        // Validate items
        for (const item of formData.items) {
            if (!item.productId || item.quantity <= 0) {
                alert('Todos los items deben tener producto y cantidad válida');
                return;
            }
        }

        setActionLoading(true);
        try {
            if (isEditMode) {
                await purchaseOrderService.updatePurchaseOrder(token, selectedCompany.id, id, formData);
            } else {
                await purchaseOrderService.createPurchaseOrder(token, selectedCompany.id, formData);
            }
            navigate('/purchase-orders');
        } catch (error) {
            console.error('Error saving PO:', error);
            alert(error.response?.data?.message || 'Error al guardar la orden');
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) return <div className="p-8 text-foreground">Cargando...</div>;

    return (
        <div className="space-y-6 animate-fadeIn pb-20">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" onClick={() => navigate('/purchase-orders')} className="text-muted-foreground hover:text-foreground">
                        <ArrowLeft size={20} />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">
                            {isEditMode ? 'Editar Orden de Compra' : 'Nueva Orden de Compra'}
                        </h1>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Header Info */}
                <Card className="bg-card/50 border-border">
                    <CardHeader>
                        <CardTitle className="text-foreground text-lg">Información General</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">Código</label>
                            <Input
                                value={isEditMode && formData.orderNumber ? formData.orderNumber : '(Generado al guardar)'}
                                disabled
                                className="bg-card border-border text-foreground opacity-100 font-medium"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">Proveedor</label>
                            <Combobox
                                options={suppliers.map(s => ({ value: s.id, label: s.name }))}
                                value={formData.supplierId}
                                onChange={(value) => {
                                    const supplier = suppliers.find(s => s.id === parseInt(value));
                                    setFormData({
                                        ...formData,
                                        supplierId: value,
                                        paymentTerms: supplier?.paymentTerms || formData.paymentTerms
                                    });
                                }}
                                placeholder="Seleccionar Proveedor"
                                searchPlaceholder="Buscar proveedor..."
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">Fecha Emisión</label>
                            <Input
                                type="date"
                                value={formData.issueDate}
                                onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                                required
                                className="bg-background border-border text-foreground"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">Fecha Entrega</label>
                            <Input
                                type="date"
                                value={formData.deliveryDate}
                                onChange={(e) => setFormData({ ...formData, deliveryDate: e.target.value })}
                                className="bg-background border-border text-foreground"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">Términos Pago</label>
                            <Input
                                value={formData.paymentTerms}
                                onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
                                placeholder="Ej. Contado, 30 días"
                                className="bg-background border-border"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Items */}
                <Card className="bg-card/50 border-border">
                    <CardHeader className="flex flex-row justify-between items-center">
                        <CardTitle className="text-foreground text-lg">Items</CardTitle>
                        <Button type="button" onClick={handleAddItem} disabled={actionLoading} variant="secondary">
                            <Plus size={16} className="mr-2" /> Agregar Item
                        </Button>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-muted-foreground">
                                <thead className="bg-card text-foreground uppercase font-medium">
                                    <tr>
                                        <th className="px-4 py-3 min-w-[200px]">Producto</th>
                                        <th className="px-4 py-3 w-32">Cantidad</th>
                                        <th className="px-4 py-3 w-32">Costo Unit.</th>
                                        <th className="px-4 py-3 w-24">Impuesto</th>
                                        <th className="px-4 py-3 w-32 text-right">Subtotal</th>
                                        <th className="px-4 py-3 w-16"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {formData.items.map((item, index) => (
                                        <tr key={index} className="hover:bg-accent/30">
                                            <td className="px-4 py-2">
                                                <Combobox
                                                    options={products.map(p => ({
                                                        value: p.id,
                                                        label: `${p.code ? p.code + ' - ' : ''}${p.description}`
                                                    }))}
                                                    value={item.productId}
                                                    onChange={(value) => handleItemChange(index, 'productId', value)}
                                                    placeholder="Buscar Producto..."
                                                    searchPlaceholder="Buscar por nombre o código..."
                                                    className="w-full"
                                                />
                                                {item.productId && (
                                                    <Input
                                                        value={item.description}
                                                        onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                                                        className="mt-1 h-8 text-xs bg-background/50 border-border"
                                                        placeholder="Descripción personalizada"
                                                    />
                                                )}
                                            </td>
                                            <td className="px-4 py-2">
                                                <Input
                                                    type="number"
                                                    min="1"
                                                    step="1"
                                                    value={item.quantity}
                                                    onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                                                    className="bg-background border-border text-right"
                                                />
                                            </td>
                                            <td className="px-4 py-2">
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    value={item.unitPrice}
                                                    onChange={(e) => handleItemChange(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                                                    className="bg-background border-border text-right"
                                                />
                                            </td>
                                            <td className="px-4 py-2">
                                                <select
                                                    className="w-full bg-background border border-border rounded px-2 py-1 text-foreground text-right"
                                                    value={item.taxRate}
                                                    onChange={(e) => handleItemChange(index, 'taxRate', parseFloat(e.target.value))}
                                                >
                                                    <option value="0">0%</option>
                                                    <option value="0.07">7%</option>
                                                    <option value="0.10">10%</option>
                                                </select>
                                            </td>
                                            <td className="px-4 py-2 text-right text-foreground font-medium">
                                                ${(item.quantity * item.unitPrice).toFixed(2)}
                                            </td>
                                            <td className="px-4 py-2 text-center">
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveItem(index)}
                                                    className="text-red-500 hover:text-red-400 p-1 rounded hover:bg-red-500/10"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {formData.items.length === 0 && (
                                <div className="text-center py-8 text-muted-foreground">
                                    No hay items agregados
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Footer Totals & Actions */}
                <div className="flex flex-col md:flex-row gap-6 justify-between items-start">
                    <div className="w-full md:w-1/2">
                        <label className="text-sm font-medium text-muted-foreground block mb-2">Notas</label>
                        <textarea
                            className="w-full h-32 bg-background border border-border rounded-lg p-3 text-foreground resize-none focus:ring-2 focus:ring-primary-500 outline-none"
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            placeholder="Notas internas o instrucciones..."
                        />
                    </div>
                    <div className="w-full md:w-1/3 bg-card/50 border border-border rounded-lg p-4 space-y-3">
                        <div className="flex justify-between text-muted-foreground">
                            <span>Subtotal:</span>
                            <span>${totals.subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-muted-foreground">
                            <span>Impuestos:</span>
                            <span>${totals.taxTotal.toFixed(2)}</span>
                        </div>
                        <div className="border-t border-border pt-3 flex justify-between text-xl font-bold text-foreground">
                            <span>Total:</span>
                            <span>${totals.total.toFixed(2)}</span>
                        </div>
                        {isEditMode && (
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={() => {
                                    const supplier = suppliers.find(s => s.id === parseInt(formData.supplierId));
                                    generatePurchaseOrderPDF({
                                        ...formData,
                                        items: formData.items,
                                        supplier: supplier, // Pass full supplier object
                                        subtotal: totals.subtotal,
                                        taxTotal: totals.taxTotal,
                                        total: totals.total
                                    }, currentCompany || selectedCompany);
                                }}
                                className="w-full mt-4 bg-secondary text-secondary-foreground hover:bg-secondary/90"
                            >
                                <Save size={18} className="mr-2" />
                                Descargar PDF
                            </Button>
                        )}
                        <Button type="submit" disabled={actionLoading} className="w-full mt-4 bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3">
                            <Save size={18} className="mr-2" />
                            {actionLoading ? 'Guardando...' : 'Guardar Orden'}
                        </Button>
                    </div>
                </div>
            </form >
        </div >
    );
}

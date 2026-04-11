import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Package, Tag } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import productService from '../../services/productService';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import ProductModal from '../../components/inventory/ProductModal';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '../../components/ui/Dialog';

export default function ProductsPage() {
    const { token, selectedCompany } = useAuth();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [saving, setSaving] = useState(false);

    // Delete state
    const [productToDelete, setProductToDelete] = useState(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        if (selectedCompany) {
            loadProducts();
        }
    }, [selectedCompany, searchTerm, filterType, filterStatus]);

    const loadProducts = async () => {
        try {
            setLoading(true);
            const params = {
                search: searchTerm
            };
            if (filterType && filterType !== 'all') params.type = filterType;
            if (filterStatus && filterStatus !== 'all') params.is_active = filterStatus === 'active';

            const response = await productService.getProducts(params);
            if (response.success) {
                setProducts(response.data.products);
            }
        } catch (error) {
            console.error('Error loading products:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = () => {
        setEditingProduct(null);
        setIsModalOpen(true);
    };

    const handleEdit = (product) => {
        setEditingProduct(product);
        setIsModalOpen(true);
    };

    const handleDelete = (product) => {
        setProductToDelete(product);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!productToDelete) return;

        setDeleting(true);
        try {
            await productService.deleteProduct(productToDelete.id);
            alert('Producto eliminado exitosamente');
            setIsDeleteModalOpen(false);
            setProductToDelete(null);
            loadProducts();
        } catch (error) {
            console.error('Error deleting product:', error);
            alert('Error al eliminar el producto');
        } finally {
            setDeleting(false);
        }
    };

    const handleStatusChange = async (product, newStatus) => {
        // Optimistic update
        const updatedProducts = products.map(p =>
            p.id === product.id ? { ...p, isActive: newStatus === 'true' } : p
        );
        setProducts(updatedProducts);

        try {
            await productService.updateProduct(product.id, { ...product, isActive: newStatus === 'true' });
            loadProducts();
        } catch (error) {
            console.error('Error updating product status:', error);
            alert('Error al actualizar estado del producto');
            loadProducts(); // Revert on error
        }
    };

    const handleSubmit = async (formData) => {
        try {
            setSaving(true);
            if (editingProduct) {
                await productService.updateProduct(editingProduct.id, formData);
            } else {
                await productService.createProduct(formData);
            }
            setIsModalOpen(false);
            loadProducts();
        } catch (error) {
            console.error('Error saving product:', error);
            alert(error.message || 'Error al guardar el producto');
        } finally {
            setSaving(false);
        }
    };

    return (

        <div className="space-y-6 animate-fadeIn pb-20 md:pb-0">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Productos y Servicios</h1>
                    <p className="text-muted-foreground text-sm">Gestione su catálogo de productos y servicios</p>
                </div>
                <Button
                    onClick={handleCreate}
                    className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20"
                >
                    <Plus size={20} className="mr-2" />
                    Nuevo Producto
                </Button>
            </div>

            <Card className="bg-card/50 border-border backdrop-blur-sm">
                <CardContent className="p-4">
                    <div className="flex flex-col lg:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
                            <Input
                                className="pl-10 bg-background/50 border-input text-foreground w-full"
                                placeholder="Buscar por nombre, código o SKU..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <select
                                className="h-10 rounded-md border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 w-full sm:w-40"
                                value={filterType}
                                onChange={(e) => setFilterType(e.target.value)}
                            >
                                <option value="all">Todos los Tipos</option>
                                <option value="product">Producto</option>
                                <option value="service">Servicio</option>
                            </select>
                            <select
                                className="h-10 rounded-md border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 w-full sm:w-40"
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                            >
                                <option value="all">Todos los Estados</option>
                                <option value="active">Activos</option>
                                <option value="inactive">Inactivos</option>
                            </select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="space-y-4">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 animate-pulse">
                        <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                        <p className="text-muted-foreground">Cargando productos...</p>
                    </div>
                ) : products.length === 0 ? (
                    <div className="text-center py-16 text-muted-foreground bg-muted/20 rounded-xl border border-border border-dashed backdrop-blur-sm">
                        <Package size={48} className="mx-auto mb-4 opacity-20" />
                        <p className="text-lg font-medium">No se encontraron productos</p>
                        <p className="text-sm">Intente ajustar los filtros de búsqueda</p>
                    </div>
                ) : (
                    <>
                        {/* Vista de Tarjetas para Móvil */}
                        <div className="grid grid-cols-1 gap-4 md:hidden">
                            {products.map((product) => (
                                <div 
                                    key={product.id}
                                    className="bg-card/50 border border-border rounded-xl p-4 space-y-4 backdrop-blur-sm active:scale-[0.98] transition-all"
                                >
                                    <div className="flex justify-between items-start">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <Badge variant={product.type === 'service' ? 'outline' : 'default'} className="text-[10px] uppercase font-bold px-1.5 py-0">
                                                    {product.type === 'service' ? 'Servicio' : 'Producto'}
                                                </Badge>
                                                <span className="text-xs font-mono text-muted-foreground leading-none">
                                                    {product.code || '-'}
                                                </span>
                                            </div>
                                            <h3 className="font-bold text-foreground leading-tight">
                                                {product.description}
                                            </h3>
                                            {product.sku && (
                                                <p className="text-xs text-muted-foreground">SKU: {product.sku}</p>
                                            )}
                                        </div>
                                        <div className="relative inline-block" onClick={(e) => e.stopPropagation()}>
                                            <Badge className={product.isActive ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-destructive/10 text-destructive border-destructive/20'}>
                                                {product.isActive ? 'Activo' : 'Inactivo'}
                                            </Badge>
                                            <select
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                value={product.isActive ? "true" : "false"}
                                                onChange={(e) => handleStatusChange(product, e.target.value)}
                                            >
                                                <option value="true">Activo</option>
                                                <option value="false">Inactivo</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border/50">
                                        <div className="space-y-0.5">
                                            <p className="text-[10px] uppercase text-muted-foreground font-semibold">Costo</p>
                                            <p className="font-mono text-sm">${parseFloat(product.cost).toFixed(2)}</p>
                                        </div>
                                        <div className="space-y-0.5 text-right">
                                            <p className="text-[10px] uppercase text-muted-foreground font-semibold">Precio de Venta</p>
                                            <p className="font-bold text-green-400 text-lg leading-none">
                                                ${parseFloat(product.price).toFixed(2)}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex gap-2 pt-2">
                                        <Button
                                            variant="outline"
                                            className="flex-1 bg-muted/30 border-border hover:bg-muted/50"
                                            onClick={() => handleEdit(product)}
                                        >
                                            <Edit size={16} className="mr-2" />
                                            Editar
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className="px-3 bg-destructive/10 border-destructive/20 text-destructive hover:bg-destructive/20"
                                            onClick={() => handleDelete(product)}
                                        >
                                            <Trash2 size={16} />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Vista de Tabla para Escritorio */}
                        <div className="hidden md:block bg-card/30 border border-border rounded-xl overflow-hidden backdrop-blur-sm">
                            <Table>
                                <TableHeader className="bg-muted/50">
                                    <TableRow className="hover:bg-transparent border-border">
                                        <TableHead className="text-muted-foreground font-bold">Código / SKU</TableHead>
                                        <TableHead className="text-muted-foreground font-bold">Descripción</TableHead>
                                        <TableHead className="text-muted-foreground font-bold">Tipo</TableHead>
                                        <TableHead className="text-muted-foreground font-bold">Estado</TableHead>
                                        <TableHead className="text-right text-muted-foreground font-bold">Costo</TableHead>
                                        <TableHead className="text-right text-muted-foreground font-bold">Margen</TableHead>
                                        <TableHead className="text-right text-muted-foreground font-bold">Precio</TableHead>
                                        <TableHead className="text-right text-muted-foreground font-bold">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {products.map((product) => (
                                        <TableRow key={product.id} className="hover:bg-muted/30 border-border transition-colors group">
                                            <TableCell className="font-mono text-sm">
                                                <div className="flex flex-col">
                                                    <span className="text-foreground font-medium">{product.code || '-'}</span>
                                                    {product.sku && (
                                                        <span className="text-[10px] text-muted-foreground uppercase">SKU: {product.sku}</span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-medium text-foreground">{product.description}</TableCell>
                                            <TableCell>
                                                <Badge 
                                                    variant={product.type === 'service' ? 'outline' : 'default'} 
                                                    className="capitalize text-[11px] px-2 py-0"
                                                >
                                                    {product.type === 'service' ? 'Servicio' : 'Producto'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="relative inline-block">
                                                    <Badge className={product.isActive ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-destructive/10 text-destructive border-destructive/20'}>
                                                        {product.isActive ? 'Activo' : 'Inactivo'}
                                                    </Badge>
                                                    <select
                                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                        value={product.isActive ? "true" : "false"}
                                                        onChange={(e) => handleStatusChange(product, e.target.value)}
                                                    >
                                                        <option value="true">Activo</option>
                                                        <option value="false">Inactivo</option>
                                                    </select>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right text-muted-foreground font-mono">
                                                ${parseFloat(product.cost).toFixed(2)}
                                            </TableCell>
                                            <TableCell className="text-right text-muted-foreground font-mono">
                                                {(parseFloat(product.margin) * 100).toFixed(0)}%
                                            </TableCell>
                                            <TableCell className="text-right text-green-400 font-bold font-mono">
                                                ${parseFloat(product.price).toFixed(2)}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleEdit(product)}
                                                        className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-muted"
                                                    >
                                                        <Edit size={16} />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleDelete(product)}
                                                        className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                                    >
                                                        <Trash2 size={16} />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </>
                )}
            </div>

            <ProductModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleSubmit}
                product={editingProduct}
                loading={saving}
            />

            <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
                <DialogContent className="sm:max-w-[425px] bg-background border-border text-slate-200">
                    <DialogHeader>
                        <DialogTitle className="text-foreground">Eliminar Producto</DialogTitle>
                        <DialogDescription className="text-muted-foreground">
                            ¿Está seguro que desea eliminar el producto "{productToDelete?.description}"? Esta acción no se puede deshacer.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsDeleteModalOpen(false)} disabled={deleting} className="text-muted-foreground hover:text-foreground">
                            Cancelar
                        </Button>
                        <Button variant="destructive" onClick={confirmDelete} disabled={deleting} className="bg-red-600 hover:bg-red-700 text-foreground border-0">
                            {deleting ? 'Eliminando...' : 'Eliminar'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

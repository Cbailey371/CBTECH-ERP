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
    }, [selectedCompany, searchTerm]);

    const loadProducts = async () => {
        try {
            setLoading(true);
            const response = await productService.getProducts({
                search: searchTerm
            });
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

        <div className="space-y-6 animate-fadeIn">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Productos y Servicios</h1>
                    <p className="text-muted-foreground">Gestione su catálogo de productos y servicios</p>
                </div>
                <Button
                    onClick={handleCreate}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20"
                >
                    <Plus size={20} className="mr-2" />
                    Nuevo Producto
                </Button>
            </div>

            <Card className="bg-card border-border">
                <CardContent className="p-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={20} />
                        <Input
                            className="pl-10 bg-background border-input text-foreground w-full md:w-96"
                            placeholder="Buscar por nombre, código o SKU..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 gap-4">
                {loading ? (
                    <div className="text-center py-10 text-muted-foreground">Cargando productos...</div>
                ) : products.length === 0 ? (
                    <div className="text-center py-10 text-muted-foreground bg-muted/30 rounded-lg border border-border border-dashed">
                        <Package size={48} className="mx-auto mb-4 opacity-50" />
                        <p>No se encontraron productos</p>
                    </div>
                ) : (
                    <div className="bg-card border border-border rounded-lg overflow-hidden backdrop-blur-sm">
                        <Table>
                            <TableHeader className="bg-muted/50">
                                <TableRow className="hover:bg-muted/50 border-border">
                                    <TableHead className="text-muted-foreground">Código / SKU</TableHead>
                                    <TableHead className="text-muted-foreground">Descripción</TableHead>
                                    <TableHead className="text-muted-foreground">Tipo</TableHead>
                                    <TableHead className="text-muted-foreground">Estado</TableHead>
                                    <TableHead className="text-right text-muted-foreground">Costo</TableHead>
                                    <TableHead className="text-right text-muted-foreground">Margen</TableHead>
                                    <TableHead className="text-right text-muted-foreground">Precio</TableHead>
                                    <TableHead className="text-right text-muted-foreground">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {products.map((product) => (
                                    <TableRow key={product.id} className="hover:bg-muted/50 border-border transition-colors">
                                        <TableCell className="font-mono text-sm">
                                            <div className="flex flex-col">
                                                <span className="text-foreground">{product.code || '-'}</span>
                                                {product.sku && (
                                                    <span className="text-xs text-muted-foreground">SKU: {product.sku}</span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-medium text-foreground">{product.description}</TableCell>
                                        <TableCell>
                                            <Badge variant={product.type === 'service' ? 'secondary' : 'default'} className="capitalize">
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
                                            <div className="flex justify-end gap-2">
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

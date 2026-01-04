import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthProvider';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Label } from '../../components/ui/Label';
import { AlertCircle, CheckCircle, Save } from 'lucide-react';

export default function FepaConfigPage() {
    const { token, selectedCompany } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [config, setConfig] = useState({
        ruc: '',
        dv: '',
        razonSocial: '',
        direccion: '',
        sucursal: '0000',
        puntoDeVenta: '01',
        pacProvider: 'WEBPOS',
        environment: 'TEST',
        authData: {
            license: '',
            apiKey: ''
        },
        isActive: true
    });

    useEffect(() => {
        if (selectedCompany) fetchConfig();
    }, [selectedCompany]);

    const fetchConfig = async () => {
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/fepa/config`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'x-company-id': selectedCompany.id
                }
            });
            const data = await response.json();
            if (response.ok && data.id) {
                // Merge with default structure to avoid undefined errors
                setConfig(prev => ({
                    ...prev,
                    ...data,
                    authData: { ...prev.authData, ...(data.authData || {}) }
                }));
            }
        } catch (error) {
            console.error('Error fetching config:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name.startsWith('authData.')) {
            const field = name.split('.')[1];
            setConfig(prev => ({
                ...prev,
                authData: { ...prev.authData, [field]: value }
            }));
        } else {
            setConfig(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/fepa/config`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'x-company-id': selectedCompany.id
                },
                body: JSON.stringify(config)
            });

            if (response.ok) {
                alert('Configuración guardada exitosamente');
            } else {
                throw new Error('Error al guardar');
            }
        } catch (error) {
            console.error(error);
            alert('Error al guardar la configuración');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div>Cargando...</div>;

    return (
        <div className="space-y-6 animate-fadeIn max-w-4xl mx-auto">
            <div>
                <h1 className="text-3xl font-bold text-foreground tracking-tight">Facturación Electrónica (FEPA)</h1>
                <p className="text-muted-foreground mt-1">Configura tus credenciales del PAC y datos del emisor.</p>
            </div>

            <form onSubmit={handleSubmit}>
                <Card className="bg-card border-border">
                    <CardHeader>
                        <CardTitle>Datos del Emisor</CardTitle>
                        <CardDescription>Información fiscal de la empresa ante la DGI.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="ruc">RUC</Label>
                                <Input id="ruc" name="ruc" value={config.ruc} onChange={handleChange} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="dv">Dígito Verificador (DV)</Label>
                                <Input id="dv" name="dv" value={config.dv} onChange={handleChange} required className="w-24" />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="razonSocial">Razón Social</Label>
                                <Input id="razonSocial" name="razonSocial" value={config.razonSocial} onChange={handleChange} required />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="direccion">Dirección Fiscal</Label>
                                <Input id="direccion" name="direccion" value={config.direccion} onChange={handleChange} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="sucursal">Sucursal</Label>
                                <Input id="sucursal" name="sucursal" value={config.sucursal} onChange={handleChange} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="puntoDeVenta">Punto de Venta</Label>
                                <Input id="puntoDeVenta" name="puntoDeVenta" value={config.puntoDeVenta} onChange={handleChange} required />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-card border-border mt-6">
                    <CardHeader>
                        <CardTitle>Configuración del PAC (WebPOS)</CardTitle>
                        <CardDescription>Credenciales de conexión para firmar documentos.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="environment">Ambiente</Label>
                                <select
                                    id="environment"
                                    name="environment"
                                    value={config.environment}
                                    onChange={handleChange}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <option value="TEST">Pruebas (Sandbox)</option>
                                    <option value="PROD">Producción</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="pacProvider">Proveedor</Label>
                                <Input id="pacProvider" name="pacProvider" value={config.pacProvider} disabled className="bg-muted" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="license">Licencia / Código de Empresa</Label>
                                <Input id="license" name="authData.license" value={config.authData.license} onChange={handleChange} required type="password" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="apiKey">API Key / Token</Label>
                                <Input id="apiKey" name="authData.apiKey" value={config.authData.apiKey} onChange={handleChange} required type="password" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="mt-6 flex justify-end">
                    <Button type="submit" disabled={saving} className="bg-primary hover:bg-primary/90">
                        {saving ? 'Guardando...' : <><Save className="w-4 h-4 mr-2" /> Guardar Configuración</>}
                    </Button>
                </div>
            </form>
        </div>
    );
}

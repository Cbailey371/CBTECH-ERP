import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthProvider';
import * as companyService from '../services/companyService';
import { Button } from '../components/ui/Button';
import { ThemeToggle } from '../components/Layout/ThemeToggle';

export default function CompanySelectionPage() {
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);
    const { token, selectCompany, logout, user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchCompanies = async () => {
            try {
                const response = await companyService.getMyCompanies(token);
                if (response.success) {
                    setCompanies(response.data);
                }
            } catch (error) {
                console.error('Error fetching companies:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchCompanies();
    }, [token]);

    const handleSelectCompany = (companyData) => {
        // La estructura que viene del backend tiene la info de la empresa dentro de la propiedad 'company'
        // pero también necesitamos el rol y permisos de la relación
        const fullCompanyData = {
            ...companyData.company,
            userRole: companyData.role,
            permissions: companyData.permissions
        };

        selectCompany(fullCompanyData);
        navigate('/dashboard');
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background p-8">
            <div className="absolute top-4 right-4 z-20">
                <ThemeToggle />
            </div>
            <div className="max-w-5xl mx-auto">
                <div className="flex justify-between items-center mb-12">
                    <div>
                        <h1 className="text-3xl font-display font-bold text-foreground mb-2">Seleccionar Empresa</h1>
                        <p className="text-muted-foreground">Hola, <span className="text-primary">{user?.firstName || user?.username}</span>. Selecciona una empresa para continuar.</p>
                    </div>
                    <Button variant="outline" onClick={handleLogout} className="border-border text-muted-foreground hover:text-foreground hover:bg-muted">
                        Cerrar Sesión
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {companies.map((item) => (
                        <div
                            key={item.id}
                            onClick={() => handleSelectCompany(item)}
                            className="group cursor-pointer bg-card border border-border rounded-xl p-6 hover:border-primary/50 hover:bg-accent transition-all hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-1"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-primary-600 to-indigo-600 flex items-center justify-center text-white font-bold text-xl">
                                    {item.company.name.substring(0, 2).toUpperCase()}
                                </div>
                                {item.is_default && (
                                    <span className="px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium border border-primary/20">
                                        Por defecto
                                    </span>
                                )}
                            </div>

                            <h3 className="text-xl font-bold text-card-foreground mb-2 group-hover:text-primary transition-colors">
                                {item.company.name}
                            </h3>
                            <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                                {item.company.industry || 'Sin industria definida'} • {item.company.city || 'Sin ubicación'}
                            </p>

                            <div className="pt-4 border-t border-border flex justify-between items-center">
                                <span className="text-xs text-muted-foreground uppercase font-medium tracking-wider">
                                    Rol: {item.role}
                                </span>
                                <span className="text-primary text-sm font-medium group-hover:translate-x-1 transition-transform">
                                    Entrar &rarr;
                                </span>
                            </div>
                        </div>
                    ))}

                    {companies.length === 0 && (
                        <div className="col-span-full text-center py-12 bg-muted/30 rounded-xl border border-dashed border-border">
                            <p className="text-muted-foreground mb-4">No tienes empresas asignadas.</p>
                            <Button variant="secondary">Contactar Administrador</Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

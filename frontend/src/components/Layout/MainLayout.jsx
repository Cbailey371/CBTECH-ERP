import { Outlet } from 'react-router-dom';
import Sidebar from '../Sidebar';

export default function MainLayout() {
    return (
        <div className="flex h-screen bg-background text-foreground">
            <Sidebar />
            <main className="flex-1 md:ml-64 overflow-y-auto p-4 md:p-8">
                <div className="max-w-7xl mx-auto">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}

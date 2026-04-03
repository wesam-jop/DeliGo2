import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../Contexts/AuthContext';

// Smart router: redirects to role-specific dashboard
const Dashboard = () => {
    const { user, loading } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (loading || !user) return;
        
        console.log('Dashboard redirect - User role:', user.role);
        
        // Redirect to role-specific dashboard
        switch (user.role) {
            case 'admin':
                console.log('Redirecting to admin dashboard');
                navigate('/dashboard/admin', { replace: true });
                break;
            case 'store_owner':
                console.log('Redirecting to store dashboard');
                navigate('/dashboard/store', { replace: true });
                break;
            case 'driver':
                console.log('Redirecting to driver dashboard');
                navigate('/dashboard/driver', { replace: true });
                break;
            case 'customer':
                console.log('Redirecting to customer dashboard');
                navigate('/dashboard/customer', { replace: true });
                break;
            default:
                console.log('Unknown role, redirecting to customer dashboard');
                navigate('/dashboard/customer', { replace: true });
                break;
        }
    }, [user, loading, navigate]);

    // Show loading while redirecting
    return (
        <div className="min-h-[60vh] flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 border-4 border-brand border-t-transparent rounded-full animate-spin"></div>
                <p className="text-slate-500 font-medium">جاري التحميل...</p>
            </div>
        </div>
    );
};

export default Dashboard;

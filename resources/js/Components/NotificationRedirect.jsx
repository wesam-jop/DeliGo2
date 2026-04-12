import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../Contexts/AuthContext';
import { orderApi } from '../Services/api';

/**
 * NotificationRedirect Component
 *
 * Handles notification deep links and redirects users to the appropriate page
 * based on their role and the notification type.
 */
const NotificationRedirect = ({ targetType }) => {
    const { orderId, storeId, driverId, conversationId, id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const handleRedirect = async () => {
            if (!user) {
                navigate('/login');
                return;
            }

            try {
                const entityId = orderId || storeId || driverId || conversationId || id;
                
                // Redirect based on target type and user role
                if (targetType === 'order' && entityId) {
                    switch (user.role) {
                        case 'customer':
                            navigate(`/customer/orders/${entityId}/track`);
                            break;
                        case 'driver':
                            navigate(`/driver/orders/${entityId}`);
                            break;
                        case 'store_owner':
                            navigate(`/store/orders/${entityId}`);
                            break;
                        case 'admin':
                        default:
                            navigate(`/orders`);
                            break;
                    }
                } else if (targetType === 'chat' && entityId) {
                    navigate(`/chat`);
                } else if (targetType === 'store' && entityId) {
                    if (user.role === 'admin') {
                        navigate(`/dashboard/stores`);
                    } else {
                        navigate(`/stores/${entityId}`);
                    }
                } else if (targetType === 'driver' && entityId) {
                    if (user.role === 'admin') {
                        navigate(`/dashboard/drivers`);
                    } else {
                        navigate('/dashboard');
                    }
                } else if (targetType === 'orders-available') {
                    if (user.role === 'driver') {
                        navigate('/driver/orders/available');
                    } else {
                        navigate('/dashboard');
                    }
                } else {
                    // Default fallback
                    navigate('/dashboard');
                }
            } catch (error) {
                console.error('Error handling notification redirect:', error);
                navigate('/dashboard');
            } finally {
                setLoading(false);
            }
        };

        handleRedirect();
    }, [orderId, storeId, driverId, conversationId, id, targetType, user, navigate]);

    if (loading) {
        return (
            <div className="h-screen w-screen flex items-center justify-center bg-slate-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-brand border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-slate-500 font-medium">جاري التحويل...</p>
                </div>
            </div>
        );
    }

    return null;
};

export default NotificationRedirect;


import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
    const [cartItems, setCartItems] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const { token } = useAuth();

    // Load cart from localStorage on mount
    useEffect(() => {
        const savedCart = localStorage.getItem('cart');
        if (savedCart) {
            try {
                setCartItems(JSON.parse(savedCart));
            } catch (e) {
                console.error('Error loading cart:', e);
            }
        }
    }, []);

    // Save cart to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem('cart', JSON.stringify(cartItems));
    }, [cartItems]);

    const addToCart = (product, storeId, quantity = 1) => {
        if (!token) {
            // Show login prompt
            if (window.confirm('يجب تسجيل الدخول أولاً لإضافة منتجات للسلة. هل تريد تسجيل الدخول الآن؟')) {
                window.location.href = '/login';
            }
            return false;
        }

        setCartItems(prev => {
            const existingIndex = prev.findIndex(item => item.product.id === product.id);

            if (existingIndex >= 0) {
                // Update quantity if product already exists
                const updated = [...prev];
                updated[existingIndex].quantity += quantity;
                return updated;
            } else {
                // Add new product with full store info
                return [...prev, {
                    product: {
                        ...product,
                        store: {
                            id: storeId,
                            governorate_id: product.store?.governorate_id,
                            governorate: product.store?.governorate
                        }
                    },
                    storeId,
                    quantity,
                    options: []
                }];
            }
        });

        setIsOpen(true);
        return true;
    };

    const removeFromCart = (productId) => {
        setCartItems(prev => prev.filter(item => item.product.id !== productId));
    };

    const updateQuantity = (productId, quantity) => {
        if (quantity <= 0) {
            removeFromCart(productId);
            return;
        }
        
        setCartItems(prev => 
            prev.map(item => 
                item.product.id === productId ? { ...item, quantity } : item
            )
        );
    };

    const clearCart = () => {
        setCartItems([]);
    };

    const getCartTotal = () => {
        return cartItems.reduce((total, item) => {
            return total + (parseFloat(item.product.price) * item.quantity);
        }, 0);
    };

    const getCartCount = () => {
        return cartItems.reduce((count, item) => count + item.quantity, 0);
    };

    const getDeliveryFee = () => {
        if (cartItems.length === 0) return 0;
        
        // Get unique governorates from cart items with their delivery fees
        const governorateFees = new Map();
        
        cartItems.forEach(item => {
            const govId = item.product.store?.governorate_id || item.product.store?.id;
            const govDeliveryFee = item.product.store?.governorate?.delivery_fee;
            
            if (govId && govDeliveryFee !== undefined) {
                // Store the fee for this governorate (use the first one found)
                if (!governorateFees.has(govId)) {
                    governorateFees.set(govId, parseFloat(govDeliveryFee) || 0);
                }
            }
        });
        
        if (governorateFees.size === 0) return 0.5; // Default fee if no governorate info (half dollar as per user)
        
        // Sum all governorate delivery fees
        let totalFee = 0;
        governorateFees.forEach(fee => {
            totalFee += fee;
        });
        
        // Return calculated fee, or fallback to 0.5 if it's 0 (if that's desired)
        return totalFee > 0 ? totalFee : 0.5;
    };

    return (
        <CartContext.Provider value={{
            cartItems,
            isOpen,
            setIsOpen,
            addToCart,
            removeFromCart,
            updateQuantity,
            clearCart,
            getCartTotal,
            getCartCount,
            getDeliveryFee
        }}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
};

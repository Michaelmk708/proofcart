import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { CartItem, Product } from '@/types';
import { toast } from 'sonner';

interface CartContextType {
  items: CartItem[];
  itemCount: number;
  totalPrice: number;
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      try {
        setItems(JSON.parse(savedCart));
      } catch (error) {
        console.error('Failed to load cart:', error);
      }
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(items));
  }, [items]);

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  const addToCart = (product: Product, quantity: number = 1) => {
    console.log('🛒 addToCart called with:', { product, quantity });
    
    // Check if product is verified - handle both snake_case and camelCase
    const verified = product.verified;
    const asRecord = product as unknown as Record<string, unknown>;
    const nftId = (asRecord['nft_id'] as string | undefined) || product.nftId;
    const isVerified = Boolean(verified || nftId);

    console.log('✅ Product verification status:', {
      isVerified,
      verified,
      nftId,
      nft_id: asRecord['nft_id'],
      productKeys: Object.keys(product).slice(0, 15),
    });
    
    if (!isVerified) {
      toast.error('⚠️ Unverified products cannot be purchased through ProofCart');
      return;
    }

    // Check stock availability
    console.log('📦 Stock check:', { stock: product.stock, requestedQuantity: quantity });
    if (product.stock < quantity) {
      toast.error(`Only ${product.stock} units available`);
      return;
    }

    setItems((prev) => {
      const existingItem = prev.find((item) => item.productId === product.id);
      
      if (existingItem) {
        const newQuantity = existingItem.quantity + quantity;
        if (newQuantity > product.stock) {
          toast.error(`Only ${product.stock} units available`);
          return prev;
        }
        toast.success('✅ Updated quantity in cart');
        return prev.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: newQuantity }
            : item
        );
      }
      
      toast.success('✅ Added to cart');
      console.log('📝 Cart updated, new item added');
      return [...prev, { productId: product.id, product, quantity }];
    });
  };

  const removeFromCart = (productId: string) => {
    setItems((prev) => prev.filter((item) => item.productId !== productId));
    toast.success('Removed from cart');
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    
    setItems((prev) =>
      prev.map((item) =>
        item.productId === productId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
    toast.success('Cart cleared');
  };

  return (
    <CartContext.Provider
      value={{
        items,
        itemCount,
        totalPrice,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

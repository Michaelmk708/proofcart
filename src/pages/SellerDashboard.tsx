// First SellerDashboard variant removed. Keeping the newer, more feature-rich implementation below.
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Package, DollarSign, TrendingUp, Plus, Shield, ExternalLink } from 'lucide-react';
import SellerTrustBadge from '@/components/SellerTrustBadge';
import EscrowFlow from '@/components/EscrowFlow';
import type { Product, Order } from '@/types';
import { apiService } from '@/lib/api';
import { plugWallet } from '@/lib/wallet/plug';
import { toast } from 'sonner';

const SellerDashboard = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [showEscrowModal, setShowEscrowModal] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [stats, setStats] = useState({ totalSales: 0, revenue: 0, activeProducts: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    stock: '',
    images: '',
    serialNumber: '',
    manufacturer: '',
  });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (user?.role !== 'seller') {
      navigate('/dashboard');
      return;
    }
    fetchData();
  }, [isAuthenticated, user, navigate]);

  const fetchData = async () => {
    try {
      const [productsData, ordersData, statsData] = await Promise.all([
        apiService.getSellerProducts(),
        apiService.getSellerOrders(),
        apiService.getSellerStats(),
      ]);
      
      setProducts(productsData);
      setOrders(ordersData);
      setStats(statsData);
    } catch (error) {
      console.error('Failed to fetch seller data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const openEscrowModal = (order: Order) => {
    setSelectedOrderId(order.orderId);
    setShowEscrowModal(true);
  };

  const handleAddProduct = async () => {
    setIsAddingProduct(true);
    
    try {
      // First, create the product
      const productData = {
        name: newProduct.name,
        description: newProduct.description,
        price: parseFloat(newProduct.price),
        category: newProduct.category,
        stock: parseInt(newProduct.stock),
        images: newProduct.images.split(',').map(img => img.trim()),
      };
      
      const product = await apiService.createProduct(productData);
      
      // Connect to Plug wallet and mint NFT
      if (!plugWallet.isConnected()) {
        await plugWallet.connect();
      }
      
      toast.info('Minting NFT on Internet Computer...');
      
      const nftId = await plugWallet.mintProductNFT(
        newProduct.serialNumber,
        newProduct.manufacturer,
        `ipfs://metadata-${product.id}`,
        newProduct.name,
        parseInt(product.id)
      );
      
      // Update product with NFT information
      await apiService.mintNFT({
        productId: product.id,
        serialNumber: newProduct.serialNumber,
        manufacturer: newProduct.manufacturer,
        metadataUri: `ipfs://metadata-${product.id}`,
      });
      
      toast.success('Product added and NFT minted successfully!');
      
      // Reset form
      setNewProduct({
        name: '',
        description: '',
        price: '',
        category: '',
        stock: '',
        images: '',
        serialNumber: '',
        manufacturer: '',
      });
      
      fetchData();
    } catch (error) {
      let msg = 'Failed to add product';
      if (typeof error === 'object' && error !== null) {
        const e = error as { message?: string };
        msg = e.message || msg;
      }
      toast.error(msg);
    } finally {
      setIsAddingProduct(false);
    }
  };

  const handleMarkAsShipped = async (orderId: string) => {
    const trackingNumber = prompt('Enter tracking number:');
    if (!trackingNumber) return;

    try {
      await apiService.updateOrderStatus(orderId, 'shipped');
      toast.success('Order marked as shipped');
      fetchData();
    } catch (error) {
      toast.error('Failed to update order status');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container px-4 py-8">
          <div className="text-center">Loading...</div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 container px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Seller Dashboard</h1>
            <p className="text-muted-foreground">
              Manage your products and orders
            </p>
          </div>
          {user?.id && (
            <div className="ml-4">
              <SellerTrustBadge sellerId={user.id} size="sm" />
            </div>
          )}
          <Dialog>
            <DialogTrigger asChild>
              <Button size="lg">
                <Plus className="h-5 w-5 mr-2" />
                Add Product
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Product</DialogTitle>
                <DialogDescription>
                  Create a new product and mint its NFT proof on the blockchain
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Product Name *</Label>
                  <Input
                    id="name"
                    placeholder="Premium Wireless Headphones"
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    placeholder="Detailed product description..."
                    rows={4}
                    value={newProduct.description}
                    onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">Price ($) *</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      placeholder="299.99"
                      value={newProduct.price}
                      onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="stock">Stock Quantity *</Label>
                    <Input
                      id="stock"
                      type="number"
                      placeholder="50"
                      value={newProduct.stock}
                      onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Input
                    id="category"
                    placeholder="Electronics"
                    value={newProduct.category}
                    onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="images">Image URLs (comma-separated) *</Label>
                  <Textarea
                    id="images"
                    placeholder="https://example.com/image1.jpg, https://example.com/image2.jpg"
                    rows={3}
                    value={newProduct.images}
                    onChange={(e) => setNewProduct({ ...newProduct, images: e.target.value })}
                  />
                </div>
                
                <div className="border-t pt-4 mt-4">
                  <h4 className="font-semibold mb-4 flex items-center">
                    <Shield className="h-5 w-5 mr-2 text-secondary" />
                    Blockchain Verification
                  </h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="serialNumber">Serial Number *</Label>
                      <Input
                        id="serialNumber"
                        placeholder="SN-2024-ABC123"
                        value={newProduct.serialNumber}
                        onChange={(e) => setNewProduct({ ...newProduct, serialNumber: e.target.value })}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="manufacturer">Manufacturer *</Label>
                      <Input
                        id="manufacturer"
                        placeholder="AudioTech Pro"
                        value={newProduct.manufacturer}
                        onChange={(e) => setNewProduct({ ...newProduct, manufacturer: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              <DialogFooter>
                <Button
                  onClick={handleAddProduct}
                  disabled={isAddingProduct || !newProduct.name || !newProduct.price}
                >
                  {isAddingProduct ? 'Minting NFT...' : 'Add Product & Mint NFT'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Overview */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Products</CardDescription>
              <CardTitle className="text-3xl">{products.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Active Products</CardDescription>
              <CardTitle className="text-3xl">{stats.activeProducts}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Sales</CardDescription>
              <CardTitle className="text-3xl">{stats.totalSales}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Revenue</CardDescription>
              <CardTitle className="text-3xl">${stats.revenue.toFixed(2)}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        <Tabs defaultValue="products">
          <TabsList>
            <TabsTrigger value="products">My Products</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
          </TabsList>
          
          <TabsContent value="products" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>My Products</CardTitle>
                <CardDescription>Manage your product listings</CardDescription>
              </CardHeader>
              <CardContent>
                {products.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No products yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {products.map((product) => (
                      <Card key={product.id}>
                        <CardContent className="p-4 flex gap-4">
                          <img
                            src={product.images[0]}
                            alt={product.name}
                            className="w-20 h-20 object-cover rounded"
                          />
                          <div className="flex-1">
                            <div className="flex items-start justify-between">
                              <div>
                                <h3 className="font-semibold">{product.name}</h3>
                                <p className="text-sm text-muted-foreground">
                                  {product.category}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-lg">${product.price}</p>
                                <Badge variant="outline">Stock: {product.stock}</Badge>
                              </div>
                            </div>
                            {product.verified && (
                              <Badge className="mt-2 bg-secondary/10 text-secondary border-secondary/20">
                                ✓ NFT Verified
                              </Badge>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="orders" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Customer Orders</CardTitle>
                <CardDescription>Manage incoming orders</CardDescription>
              </CardHeader>
              <CardContent>
                {orders.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No orders yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <Card key={order.id}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <h3 className="font-semibold">{order.productName}</h3>
                              <p className="text-sm text-muted-foreground">
                                Order #{order.orderId}
                              </p>
                            </div>
                            <Badge>{order.status}</Badge>
                          </div>
                          <div className="text-sm text-muted-foreground mb-2">
                            Quantity: {order.quantity} • Total: ${order.totalPrice}
                          </div>
                          {order.status === 'paid' && (
                            <Button size="sm" onClick={() => handleMarkAsShipped(order.orderId)}>
                              Mark as Shipped
                            </Button>
                          )}
                          {order.escrowId && (
                            <div className="mt-2">
                              <Button size="sm" variant="outline" onClick={() => openEscrowModal(order)}>
                                View Escrow
                              </Button>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
      {showEscrowModal && selectedOrderId && (
        <EscrowFlow orderId={selectedOrderId} onClose={() => setShowEscrowModal(false)} />
      )}

      <Footer />
    </div>
  );
};

export default SellerDashboard;

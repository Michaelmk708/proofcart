import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import VerifiedBadge from "@/components/VerifiedBadge";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Star, Shield, Package, Truck, RotateCcw, ExternalLink, Minus, Plus, QrCode } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { apiService } from "@/lib/api";
import { toast } from "sonner";
import type { Product } from "@/types";
import { envConfig } from "@/lib/envConfig";

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentImage, setCurrentImage] = useState(0);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) {
        navigate('/marketplace');
        return;
      }

      try {
        setIsLoading(true);
        const productData = await apiService.getProduct(id);
        setProduct(productData);
        
        // Generate QR code URL using backend
        // Handle both snake_case and camelCase
        const serialNum = (productData as any).serial_number || productData.serialNumber;
        console.log('🔖 Product serial number for QR:', serialNum);
        console.log('📦 Full product data:', productData);
        
        if (!serialNum) {
          console.error('❌ No serial number found in product data!');
          toast.error('Product serial number missing');
          return;
        }
        
        const verificationUrl = `${envConfig.baseUrl}/verify/${serialNum}`;
        console.log('🔗 Generated verification URL:', verificationUrl);
        
        setQrCodeUrl(`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(verificationUrl)}`);
      } catch (error) {
        console.error('Error fetching product:', error);
        toast.error('Failed to load product');
        navigate('/marketplace');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProduct();
  }, [id, navigate]);

  if (isLoading) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading product...</p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  if (!product) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <p className="text-xl text-muted-foreground">Product not found</p>
            <Button onClick={() => navigate('/marketplace')} className="mt-4">
              Back to Marketplace
            </Button>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  const handleAddToCart = () => {
    if (!product) {
      toast.error('Product not loaded');
      return;
    }
    
    addToCart(product as any, quantity);
    toast.success(`Added ${quantity} ${quantity > 1 ? 'items' : 'item'} to cart`);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 container px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-12">
          {/* Product Images */}
          <div className="space-y-4">
            <div className="aspect-square rounded-lg overflow-hidden bg-muted relative">
              <img
                src={product.images[currentImage]}
                alt={product.name}
                className="h-full w-full object-cover"
              />
              <div className="absolute top-4 left-4">
                <VerifiedBadge size="lg" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {product.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImage(index)}
                  className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                    currentImage === index
                      ? "border-primary"
                      : "border-transparent hover:border-muted-foreground/20"
                  }`}
                >
                  <img
                    src={image}
                    alt={`${product.name} ${index + 1}`}
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        i < Math.floor(product.rating)
                          ? "fill-accent text-accent"
                          : "text-muted"
                      }`}
                    />
                  ))}
                  <span className="ml-2 text-sm text-muted-foreground">
                    {product.rating} ({product.reviews} reviews)
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-baseline gap-4">
              <span className="text-4xl font-bold text-primary">
                KSh {typeof product.price === 'number' ? product.price.toLocaleString() : parseFloat(product.price).toLocaleString()}
              </span>
            </div>

            {/* Verification Info */}
            <div className="bg-secondary/10 rounded-lg p-4 space-y-2">
              <div className="flex items-start gap-2">
                <Shield className="h-5 w-5 text-secondary mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-secondary mb-1">
                    ✅ Blockchain Verified Authentic
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Minted by {product.manufacturer} on {product.mintDate}
                  </p>
                  <Button variant="link" className="h-auto p-0 text-secondary" size="sm">
                    View NFT on ICP Explorer
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Quantity Selector */}
            <div className="flex items-center gap-4">
              <span className="font-medium">Quantity:</span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-12 text-center font-medium">{quantity}</span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(quantity + 1)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button 
                className="flex-1" 
                size="lg"
                onClick={handleAddToCart}
                disabled={!product}
              >
                Add to Cart
              </Button>
            </div>

            {/* Features */}
            <div className="grid grid-cols-3 gap-4 pt-4 border-t">
              <div className="text-center">
                <Truck className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                <p className="text-xs font-medium">Free Shipping</p>
              </div>
              <div className="text-center">
                <RotateCcw className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                <p className="text-xs font-medium">30-Day Returns</p>
              </div>
              <div className="text-center">
                <Package className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                <p className="text-xs font-medium">Secure Escrow</p>
              </div>
            </div>
          </div>
        </div>

        {/* Product Details Tabs */}
        <div className="mt-16">
          <Tabs defaultValue="description" className="w-full">
            <TabsList className="w-full justify-start">
              <TabsTrigger value="description">Description</TabsTrigger>
              <TabsTrigger value="verification">Verification & QR</TabsTrigger>
              <TabsTrigger value="provenance">Provenance</TabsTrigger>
              <TabsTrigger value="reviews">Reviews</TabsTrigger>
            </TabsList>
            <TabsContent value="description" className="mt-6">
              <div className="prose max-w-none">
                <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {product.description}
                </p>
              </div>
            </TabsContent>
            <TabsContent value="verification" className="mt-6">
              <div className="grid md:grid-cols-2 gap-8">
                {/* QR Code Section */}
                <div className="bg-gradient-to-br from-secondary/5 to-secondary/10 rounded-lg p-8 flex flex-col items-center justify-center">
                  <div className="bg-white p-6 rounded-lg shadow-lg mb-4">
                    {qrCodeUrl ? (
                      <img
                        src={qrCodeUrl}
                        alt="Product Verification QR Code"
                        className="w-64 h-64"
                      />
                    ) : (
                      <div className="w-64 h-64 flex items-center justify-center bg-gray-100 rounded">
                        <p className="text-sm text-gray-500">Loading QR code...</p>
                      </div>
                    )}
                  </div>
                  <div className="text-center">
                    <div className="flex items-center gap-2 justify-center mb-2">
                      <QrCode className="h-5 w-5 text-secondary" />
                      <h3 className="font-semibold text-lg">Scan to Verify</h3>
                    </div>
                    <p className="text-sm text-muted-foreground max-w-sm mb-3">
                      Scan this QR code with your phone to verify product authenticity on the blockchain
                    </p>
                    <div className="flex gap-2 justify-center">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          const serialNum = (product as any).serial_number || product.serialNumber;
                          navigator.clipboard.writeText(`${envConfig.baseUrl}/verify/${serialNum}`);
                          toast.success('Verification link copied!');
                        }}
                      >
                        Copy Link
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          const serialNum = (product as any).serial_number || product.serialNumber;
                          window.open(`/verify/${serialNum}`, '_blank');
                        }}
                      >
                        <Shield className="h-4 w-4 mr-2" />
                        Test Verification
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Verification Details */}
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold text-xl mb-4">Blockchain Certificate</h3>
                    <div className="space-y-4">
                      <div className="flex justify-between items-start pb-3 border-b">
                        <span className="text-sm font-medium text-muted-foreground">Serial Number</span>
                        <span className="text-sm font-mono font-semibold">{product.serialNumber}</span>
                      </div>
                      <div className="flex justify-between items-start pb-3 border-b">
                        <span className="text-sm font-medium text-muted-foreground">NFT ID</span>
                        <span className="text-sm font-mono font-semibold">{product.nftId || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between items-start pb-3 border-b">
                        <span className="text-sm font-medium text-muted-foreground">Manufacturer</span>
                        <span className="text-sm font-semibold">{product.manufacturer}</span>
                      </div>
                      <div className="flex justify-between items-start pb-3 border-b">
                        <span className="text-sm font-medium text-muted-foreground">Blockchain</span>
                        <span className="text-sm font-semibold">Internet Computer (ICP)</span>
                      </div>
                      <div className="flex justify-between items-start pb-3 border-b">
                        <span className="text-sm font-medium text-muted-foreground">Verification Status</span>
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          <Shield className="h-3 w-3 mr-1" />
                          Verified Authentic
                        </Badge>
                      </div>
                      <div className="flex justify-between items-start pb-3 border-b">
                        <span className="text-sm font-medium text-muted-foreground">Metadata URI</span>
                        <a 
                          href={product.metadataUri || (product as any).nft_metadata_uri || '#'} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm text-secondary hover:underline flex items-center gap-1"
                        >
                          View on IPFS
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-4">
                    <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                      <Shield className="h-4 w-4 text-blue-600" />
                      What This Means
                    </h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>✓ Guaranteed authentic product from {product.manufacturer}</li>
                      <li>✓ Permanent blockchain record of ownership</li>
                      <li>✓ Verifiable warranty and purchase history</li>
                      <li>✓ Can be transferred to new owner when resold</li>
                    </ul>
                  </div>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="provenance" className="mt-6">
              <div className="space-y-4">
                <div className="flex items-start gap-4 pb-4 border-b">
                  <div className="h-10 w-10 rounded-full bg-secondary/10 flex items-center justify-center flex-shrink-0">
                    <Shield className="h-5 w-5 text-secondary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">Manufactured & Minted</h3>
                    <p className="text-sm text-muted-foreground">
                      {product.manufacturer} • {product.mintDate}
                    </p>
                    <Badge variant="secondary" className="mt-2">
                      NFT ID: {product.nftId}
                    </Badge>
                  </div>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="reviews" className="mt-6">
              <p className="text-muted-foreground">
                Customer reviews will be displayed here.
              </p>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ProductDetail;

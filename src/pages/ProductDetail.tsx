import { useState } from "react";
import { useParams } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import VerifiedBadge from "@/components/VerifiedBadge";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Star, Shield, Package, Truck, RotateCcw, ExternalLink, Minus, Plus } from "lucide-react";

const ProductDetail = () => {
  const { id } = useParams();
  const [quantity, setQuantity] = useState(1);

  // Mock product data
  const product = {
    id: id || "1",
    name: "Premium Wireless Headphones - Studio Quality Sound",
    price: 299.99,
    images: [
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&h=800&fit=crop",
      "https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800&h=800&fit=crop",
      "https://images.unsplash.com/photo-1487215078519-e21cc028cb29?w=800&h=800&fit=crop",
    ],
    rating: 4.8,
    reviews: 1234,
    verified: true,
    manufacturer: "AudioTech Pro",
    nftId: "ICP-NFT-7892A3F",
    mintDate: "2024-01-15",
    description: "Experience unparalleled audio quality with our Premium Wireless Headphones. Featuring advanced noise cancellation, 40-hour battery life, and studio-grade sound quality verified through blockchain authentication.",
  };

  const [currentImage, setCurrentImage] = useState(0);

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
                ${product.price.toFixed(2)}
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
              <Button className="flex-1" size="lg">
                Buy via Escrow
              </Button>
              <Button variant="outline" size="lg">
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
              <TabsTrigger value="provenance">Provenance</TabsTrigger>
              <TabsTrigger value="reviews">Reviews</TabsTrigger>
            </TabsList>
            <TabsContent value="description" className="mt-6">
              <div className="prose max-w-none">
                <p className="text-muted-foreground leading-relaxed">
                  {product.description}
                </p>
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

import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { Shield, Lock, Zap, ArrowRight } from "lucide-react";
import { apiService } from "@/lib/api";
import { toast } from "sonner";
import type { Product } from "@/types";

const Index = () => {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    // Delay loading products to prioritize initial page render
    const timer = setTimeout(() => {
      if (!hasLoaded) {
        fetchFeaturedProducts();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [hasLoaded]);

  const fetchFeaturedProducts = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.getProducts({ verified: true });
      setFeaturedProducts(response.results.slice(0, 4));
      setHasLoaded(true);
    } catch (error) {
      console.error('Error fetching products:', error);
      // Don't show error toast on home page to avoid disruption
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <Header />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-secondary/10 py-20 lg:py-32">
        <div className="container px-4">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-secondary/10 text-secondary px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Shield className="h-4 w-4" />
              Blockchain-Verified Marketplace
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Buy with Confidence —{" "}
              <span className="bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
                Every Product Verified
              </span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Shop safely with blockchain authentication. Every product comes with verifiable proof
              of authenticity and secure escrow payments.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="text-lg">
                <Link to="/marketplace">
                  Explore Marketplace
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="text-lg">
                <Link to="/verify">
                  <Shield className="mr-2 h-5 w-5" />
                  Verify Product
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-20 left-10 h-72 w-72 bg-primary/20 rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-20 right-10 h-96 w-96 bg-secondary/20 rounded-full blur-3xl -z-10" />
      </section>

      {/* Trust Features */}
      <section className="py-16 border-y bg-muted/30">
        <div className="container px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-lg bg-secondary/10 flex items-center justify-center flex-shrink-0">
                <Shield className="h-6 w-6 text-secondary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Blockchain Verified</h3>
                <p className="text-muted-foreground">
                  Every product authenticated on the Internet Computer blockchain with NFT proof
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Lock className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Secure Escrow</h3>
                <p className="text-muted-foreground">
                  Your payment held safely until you confirm delivery and authenticity
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                <Zap className="h-6 w-6 text-accent" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Instant Verification</h3>
                <p className="text-muted-foreground">
                  Scan QR codes to instantly verify product authenticity on-chain
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16">
        <div className="container px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold mb-2">Featured Products</h2>
              <p className="text-muted-foreground">
                Trending verified products you can trust
              </p>
            </div>
            <Button asChild variant="outline">
              <Link to="/marketplace">
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-muted rounded-lg h-64"></div>
                </div>
              ))
            ) : featuredProducts.length > 0 ? (
              featuredProducts.map((product) => (
                <ProductCard 
                  key={product.id} 
                  {...product} 
                  image={product.images?.[0] || '/placeholder.svg'}
                />
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <p className="text-muted-foreground">No products available yet</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary via-accent to-secondary">
        <div className="container px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-primary-foreground">
              Ready to Start Selling?
            </h2>
            <p className="text-lg mb-8 text-primary-foreground/90">
              Join ProofCart as a verified seller and reach customers who value authenticity
            </p>
            <Button asChild size="lg" variant="secondary" className="text-lg">
              <Link to="/seller">
                Become a Seller
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;

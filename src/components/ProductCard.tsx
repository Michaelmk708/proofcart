import { Link, useNavigate } from "react-router-dom";
import { Star, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import VerifiedBadge from "./VerifiedBadge";
import { useCart } from "@/contexts/CartContext";
import { useAppState } from '@/contexts/AppStateContext';
import type { Product } from "@/types";

interface ProductCardProps {
  id: string;
  name: string;
  price: number | string;
  image: string;
  rating: number;
  reviews: number;
  verified: boolean;
  trending?: boolean;
  // Accept full product data for cart
  [key: string]: unknown;
}

const ProductCard = ({
  id,
  name,
  price,
  image,
  rating,
  reviews,
  verified,
  trending,
  ...restProps
}: ProductCardProps) => {
  const { addToCart } = useCart();
  const rest = restProps as Record<string, unknown>;
  const serial = (typeof rest.serial_number === 'string' && rest.serial_number) || (typeof rest.serialNumber === 'string' && rest.serialNumber) || '';
  const { state } = useAppState();
  const nftVerification = state.nftVerification[serial];
  const navigate = useNavigate();

  const handleVerify = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const serial = (rest.serial_number as string) || (rest.serialNumber as string);
    if (serial) navigate(`/verify/${encodeURIComponent(serial)}`);
    else window.alert('No serial number found for this product');
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigation to product detail
    e.stopPropagation();
    
    // Construct product object from props
    const product: Product = {
      id,
      name,
      price: typeof price === 'number' ? price : parseFloat(price),
      images: [image],
      rating,
      reviews,
      verified,
      ...restProps
    } as Product;
    
    console.log('🛒 ProductCard - Adding to cart:', product);
    addToCart(product, 1);
  };

  return (
    <Card className="group overflow-hidden transition-all hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-1">
      <Link to={`/product/${id}`}>
        <div className="relative aspect-square overflow-hidden bg-muted">
          <img
            src={image}
            alt={name}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
          {verified && (
            <div className="absolute top-2 left-2">
              <VerifiedBadge size="sm" />
            </div>
          )}
          {trending && (
            <div className="absolute top-2 right-2 bg-accent text-accent-foreground px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              Trending
            </div>
          )}
        </div>
        <CardContent className="p-4">
          <h3 className="font-semibold text-sm line-clamp-2 mb-2 group-hover:text-primary transition-colors">
            {name}
          </h3>
          <div className="flex items-center gap-1 mb-2">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-3 w-3 ${
                    i < Math.floor(rating)
                      ? "fill-accent text-accent"
                      : "text-muted"
                  }`}
                />
              ))}
            </div>
            <span className="text-xs text-muted-foreground">
              ({reviews})
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-primary">
              KSh {typeof price === 'number' ? price.toLocaleString() : parseFloat(price).toLocaleString()}
            </span>
          </div>
        </CardContent>
      </Link>
      <CardFooter className="p-4 pt-0 flex gap-2">
        <Button 
          className="w-full" 
          size="sm"
          onClick={handleAddToCart}
        >
          Add to Cart
        </Button>
        <Button variant="outline" size="sm" onClick={handleVerify}>Verify</Button>
      </CardFooter>
    </Card>
  );
};

export default ProductCard;

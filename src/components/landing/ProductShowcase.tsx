import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";

import cabinetWhite from "@/assets/cabinet-white-shaker.jpg";
import cabinetWalnut from "@/assets/cabinet-dark-walnut.jpg";
import cabinetGrey from "@/assets/cabinet-grey-modern.jpg";
import cabinetNavy from "@/assets/cabinet-navy-blue.jpg";
import cabinetCream from "@/assets/cabinet-cream.jpg";

const products = [
  {
    image: cabinetWhite,
    name: "Milano White Shaker",
    brand: "Italian Collection",
    retailPrice: 18500,
    ourPrice: 5900,
    discount: 68,
    tag: "Best Seller",
  },
  {
    image: cabinetWalnut,
    name: "Vienna Dark Walnut",
    brand: "Austrian Heritage",
    retailPrice: 24000,
    ourPrice: 7200,
    discount: 70,
    tag: "Premium",
  },
  {
    image: cabinetGrey,
    name: "Berlin Grey Modern",
    brand: "German Precision",
    retailPrice: 21000,
    ourPrice: 5250,
    discount: 75,
    tag: "New Arrival",
  },
  {
    image: cabinetNavy,
    name: "Oxford Navy Classic",
    brand: "British Elegance",
    retailPrice: 28000,
    ourPrice: 8400,
    discount: 70,
    tag: "Limited",
  },
  {
    image: cabinetCream,
    name: "Provence Cream",
    brand: "French Countryside",
    retailPrice: 22000,
    ourPrice: 6600,
    discount: 70,
    tag: "Popular",
  },
];

const ProductShowcase = () => {
  return (
    <section className="py-20 bg-secondary/50">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-14">
          <Badge variant="outline" className="mb-4 text-sm px-4 py-1">
            Featured Cabinets
          </Badge>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-foreground mb-4">
            Premium Cabinets, Unbeatable Prices
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Browse our curated selection of surplus luxury European cabinetry — all at 50–80% below retail.
          </p>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {products.map((product) => (
            <Card key={product.name} className="group overflow-hidden">
              <div className="relative aspect-square overflow-hidden">
                <img
                  src={product.image}
                  alt={`${product.name} kitchen cabinets`}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                <Badge className="absolute top-3 left-3">{product.tag}</Badge>
                <div className="absolute top-3 right-3 bg-destructive text-destructive-foreground text-sm md:text-base font-extrabold px-3 py-1.5 rounded-full shadow-lg">
                  {product.discount}% OFF
                </div>
              </div>
              <CardContent className="p-5">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                  {product.brand}
                </p>
                <h3 className="text-lg font-serif font-semibold text-foreground mb-3">
                  {product.name}
                </h3>
                <div className="flex items-end gap-3">
                  <span className="text-2xl font-bold text-foreground">
                    ${product.ourPrice.toLocaleString()}
                  </span>
                  <span className="text-sm text-muted-foreground line-through mb-0.5">
                    ${product.retailPrice.toLocaleString()}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center">
          <Button variant="default" size="lg">
            View All Available Cabinets
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </section>
  );
};

export default ProductShowcase;

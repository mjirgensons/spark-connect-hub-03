import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

const products = [
  {
    name: "Milano TV Console",
    brand: "Italian Collection",
    retailPrice: 12000,
    ourPrice: 3600,
    discount: 70,
    tag: "New",
    emoji: "📺",
  },
  {
    name: "Vienna Vanity Cabinet",
    brand: "Austrian Heritage",
    retailPrice: 9500,
    ourPrice: 2850,
    discount: 70,
    tag: "Popular",
    emoji: "🪞",
  },
  {
    name: "Berlin Kitchen Island",
    brand: "German Precision",
    retailPrice: 16000,
    ourPrice: 4800,
    discount: 70,
    tag: "Premium",
    emoji: "🏝️",
  },
  {
    name: "Oxford Walk-In Closet",
    brand: "British Elegance",
    retailPrice: 20000,
    ourPrice: 6000,
    discount: 70,
    tag: "Best Seller",
    emoji: "👔",
  },
  {
    name: "Provence Medicine Cabinet",
    brand: "French Countryside",
    retailPrice: 4500,
    ourPrice: 1350,
    discount: 70,
    tag: "Limited",
    emoji: "💊",
  },
];

const OtherProducts = () => {
  return (
    <section className="py-14 bg-secondary/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <Badge variant="outline" className="mb-4 text-sm px-4 py-1">
            Beyond the Kitchen
          </Badge>
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-serif font-bold text-foreground mb-3">
            More Luxury Cabinetry
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            The same European craftsmanship and unbeatable prices — for every room in your home.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {products.map((product) => (
            <Card key={product.name} className="group overflow-hidden">
              <div className="relative aspect-square overflow-hidden bg-muted flex items-center justify-center">
                <span className="text-5xl">{product.emoji}</span>
                <Badge className="absolute top-2 left-2 text-[10px] px-2 py-0.5">{product.tag}</Badge>
                <div className="absolute top-2 right-2 bg-destructive text-destructive-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {product.discount}% OFF
                </div>
              </div>
              <CardContent className="p-3">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">
                  {product.brand}
                </p>
                <h3 className="text-sm font-serif font-semibold text-foreground mb-2">
                  {product.name}
                </h3>
                <div className="flex items-end gap-2">
                  <span className="text-lg font-bold text-foreground">
                    ${product.ourPrice.toLocaleString()}
                  </span>
                  <span className="text-xs text-muted-foreground line-through">
                    ${product.retailPrice.toLocaleString()}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default OtherProducts;

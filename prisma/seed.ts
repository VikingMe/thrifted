import 'dotenv/config'
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const db = new PrismaClient({ adapter });

const SELLER_PASSWORD = process.env.SELLER_PASSWORD ?? "thrifted-admin-2026";

const PRESET_MAP: Record<string, string> = {
  DRESSES: "midiDress",
  OUTERWEAR: "coat",
  TOPS: "blouse",
  BOTTOMS: "trousers",
  KNITWEAR: "longSleeve",
  ACCESSORIES: "tee",
};

type SeedItem = {
  title: string;
  description: string;
  priceKsh: number;
  category: "TOPS" | "DRESSES" | "BOTTOMS" | "KNITWEAR" | "OUTERWEAR" | "ACCESSORIES";
  era: "FIFTIES" | "SIXTIES" | "SEVENTIES" | "EIGHTIES" | "NINETIES" | "Y2K" | "MODERN";
  condition: "MINT" | "EXCELLENT" | "GOOD" | "FAIR";
  sizeLabel: string;
  stock: number;
  imageUrl: string;
};

const ITEMS: SeedItem[] = [
  { title: "Ivory Silk Slip Dress", description: "Bias-cut ivory silk, delicate straps. Quietly luxurious, perfect over a tee or alone.", priceKsh: 3800, category: "DRESSES", era: "NINETIES", condition: "EXCELLENT", sizeLabel: "S", stock: 1, imageUrl: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&q=80" },
  { title: "Camel Wool Overcoat", description: "Structured shoulders, deep pockets, horn buttons. The coat that carries a whole outfit.", priceKsh: 11500, category: "OUTERWEAR", era: "EIGHTIES", condition: "GOOD", sizeLabel: "M", stock: 1, imageUrl: "https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=800&q=80" },
  { title: "Gold Chain Belt", description: "Slim gold-tone chain, adjustable clasp. Cinches a blazer or a slip dress.", priceKsh: 1400, category: "ACCESSORIES", era: "NINETIES", condition: "EXCELLENT", sizeLabel: "OS", stock: 2, imageUrl: "https://images.unsplash.com/photo-1591561954557-26941169b49e?w=800&q=80" },
  { title: "Charcoal Cashmere Knit", description: "Soft, dense cashmere with a subtle sheen. Timeless crew neck.", priceKsh: 4200, category: "KNITWEAR", era: "MODERN", condition: "MINT", sizeLabel: "M", stock: 1, imageUrl: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800&q=80" },
  { title: "High-Waist Wool Trousers", description: "Pleated front, tapered leg, chocolate wool. Tailored for length.", priceKsh: 3200, category: "BOTTOMS", era: "EIGHTIES", condition: "GOOD", sizeLabel: "W28", stock: 1, imageUrl: "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=800&q=80" },
  { title: "Cream Linen Blouse", description: "Relaxed linen with mother-of-pearl buttons. Breathes in the Nairobi heat.", priceKsh: 2800, category: "TOPS", era: "NINETIES", condition: "EXCELLENT", sizeLabel: "M", stock: 2, imageUrl: "https://images.unsplash.com/photo-1564257631407-4deb1f99d992?w=800&q=80" },
  { title: "Seventies Floral Midi", description: "Rust and ochre florals on cream viscose. Flutter sleeves, cinched waist.", priceKsh: 3600, category: "DRESSES", era: "SEVENTIES", condition: "GOOD", sizeLabel: "M", stock: 1, imageUrl: "https://images.unsplash.com/photo-1596783074918-c84cb06531ca?w=800&q=80" },
  { title: "Leather Crossbody Bag", description: "Tan leather, aged brass hardware. Gives and softens with wear.", priceKsh: 4500, category: "ACCESSORIES", era: "EIGHTIES", condition: "GOOD", sizeLabel: "OS", stock: 1, imageUrl: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&q=80" },
  { title: "Y2K Denim Mini Skirt", description: "Low-rise, dark wash, raw hem. The early-2000s silhouette, revived.", priceKsh: 1900, category: "BOTTOMS", era: "Y2K", condition: "EXCELLENT", sizeLabel: "S", stock: 1, imageUrl: "https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=800&q=80" },
  { title: "Ink Silk Scarf", description: "Hand-rolled edges, abstract ink print. Wear at the neck or tied to a bag.", priceKsh: 950, category: "ACCESSORIES", era: "SIXTIES", condition: "EXCELLENT", sizeLabel: "OS", stock: 3, imageUrl: "https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=800&q=80" },
  { title: "Cream Trench Coat", description: "Belted, storm-flap detail, cotton gabardine. Light enough for rainy-season layering.", priceKsh: 8900, category: "OUTERWEAR", era: "NINETIES", condition: "GOOD", sizeLabel: "M", stock: 1, imageUrl: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800&q=80" },
  { title: "Ribbed Turtleneck", description: "Fine-gauge ribbed knit in warm ivory. Sits close under a blazer.", priceKsh: 2600, category: "KNITWEAR", era: "NINETIES", condition: "EXCELLENT", sizeLabel: "S", stock: 2, imageUrl: "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=800&q=80" },
  { title: "Gold Hoop Earrings", description: "Slim, weighty hoops in gold vermeil. Everyday polish.", priceKsh: 1200, category: "ACCESSORIES", era: "MODERN", condition: "MINT", sizeLabel: "OS", stock: 4, imageUrl: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800&q=80" },
  { title: "Ecru Cotton Shirt", description: "Crisp poplin, oversized cut, French seams. A quiet staple.", priceKsh: 1900, category: "TOPS", era: "MODERN", condition: "MINT", sizeLabel: "L", stock: 2, imageUrl: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800&q=80" },
  { title: "Leather Loafers", description: "Cocoa leather, stacked heel, horsebit detail. Broken in but beautiful.", priceKsh: 5200, category: "ACCESSORIES", era: "EIGHTIES", condition: "GOOD", sizeLabel: "38", stock: 1, imageUrl: "https://images.unsplash.com/photo-1533867617858-e7b97e060509?w=800&q=80" },
  { title: "Satin Bias Skirt", description: "Bronze satin, midi length, side zip. Catches the light as you walk.", priceKsh: 2800, category: "BOTTOMS", era: "Y2K", condition: "EXCELLENT", sizeLabel: "M", stock: 1, imageUrl: "https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=800&q=80" },
  { title: "Alpaca Cardigan", description: "Chunky alpaca in oatmeal, patch pockets, wooden buttons. Warm without weight.", priceKsh: 4600, category: "KNITWEAR", era: "SEVENTIES", condition: "GOOD", sizeLabel: "M", stock: 1, imageUrl: "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=800&q=80" },
  { title: "Black Velvet Top", description: "Deep-V velvet, puff sleeves. Wear to dinner, or to nothing in particular.", priceKsh: 2400, category: "TOPS", era: "NINETIES", condition: "EXCELLENT", sizeLabel: "S", stock: 1, imageUrl: "https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?w=800&q=80" },
  { title: "Tan Trench Vest", description: "Sleeveless, structured, belted. Layers over knits through the cooler months.", priceKsh: 3600, category: "OUTERWEAR", era: "MODERN", condition: "EXCELLENT", sizeLabel: "S", stock: 1, imageUrl: "https://images.unsplash.com/photo-1548126032-079a0fb0099d?w=800&q=80" },
  { title: "Pearl Drop Earrings", description: "Freshwater pearls on gold hooks. Small, luminous, unmistakable.", priceKsh: 1400, category: "ACCESSORIES", era: "MODERN", condition: "MINT", sizeLabel: "OS", stock: 2, imageUrl: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800&q=80" },
];

async function main() {
  const seller = await db.user.upsert({
    where: { email: "seller@thrifted.co.ke" },
    update: {},
    create: { email: "seller@thrifted.co.ke", name: "THRIFTED Atelier", role: "SELLER" },
  });

  console.log("Seller ready:", seller.id);

  for (const item of ITEMS) {
    const { imageUrl, ...rest } = item;
    const created = await db.item.create({
      data: {
        ...rest,
        drapePreset: PRESET_MAP[item.category] ?? "tee",
        sellerId: seller.id,
        images: { create: [{ url: imageUrl, alt: item.title, position: 0 }] },
      },
    });
    console.log("  ·", created.title);
  }

  const count = await db.item.count();
  console.log(`Seeded ${count} items.`);
}

main()
  .then(async () => { await db.$disconnect(); })
  .catch(async (e) => { console.error(e); await db.$disconnect(); process.exit(1); });

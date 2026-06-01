import Navigation from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useState, useMemo } from "react";
import { Search, Info, PlusCircle, DollarSign } from "lucide-react";

interface PriceEntry {
  task: string;
  unit: string;
  low: number;
  mid: number;
  high: number;
  notes?: string;
}

interface Category {
  name: string;
  emoji: string;
  items: PriceEntry[];
}

const PRICE_DATA: Category[] = [
  {
    name: "Plumbing",
    emoji: "🔧",
    items: [
      { task: "Burst pipe repair",         unit: "per job",   low: 800,   mid: 1500,  high: 3000,  notes: "Excludes wall repair" },
      { task: "Tap replacement",           unit: "per tap",   low: 350,   mid: 600,   high: 1200 },
      { task: "Toilet installation",       unit: "per unit",  low: 1200,  mid: 2000,  high: 3500 },
      { task: "Geyser replacement (150L)", unit: "per unit",  low: 4500,  mid: 6500,  high: 9000,  notes: "Labour only, excludes geyser" },
      { task: "Drain unblocking",          unit: "per drain", low: 500,   mid: 900,   high: 2000 },
      { task: "Full bathroom plumbing",    unit: "per room",  low: 8000,  mid: 15000, high: 25000 },
    ],
  },
  {
    name: "Electrical",
    emoji: "⚡",
    items: [
      { task: "DB board replacement",       unit: "per board", low: 3500,  mid: 6000,  high: 10000, notes: "COC included" },
      { task: "Power point installation",   unit: "per point", low: 400,   mid: 700,   high: 1200 },
      { task: "Light fitting installation", unit: "per light", low: 250,   mid: 450,   high: 800 },
      { task: "Solar panel installation",   unit: "per kW",    low: 12000, mid: 18000, high: 28000, notes: "Excludes panels" },
      { task: "Fault finding",              unit: "per hour",  low: 450,   mid: 700,   high: 1200 },
      { task: "Certificate of Compliance",  unit: "per cert",  low: 1200,  mid: 1800,  high: 3000 },
    ],
  },
  {
    name: "Painting",
    emoji: "🎨",
    items: [
      { task: "Interior wall painting",      unit: "per m²",    low: 25,    mid: 45,    high: 80,    notes: "2 coats, excludes paint" },
      { task: "Exterior painting",           unit: "per m²",    low: 35,    mid: 60,    high: 100,   notes: "Includes prep" },
      { task: "Ceiling painting",            unit: "per m²",    low: 30,    mid: 50,    high: 90 },
      { task: "Full house interior (3-bed)", unit: "per house", low: 12000, mid: 22000, high: 40000 },
      { task: "Roof painting",               unit: "per m²",    low: 40,    mid: 70,    high: 120 },
    ],
  },
  {
    name: "Tiling",
    emoji: "🏠",
    items: [
      { task: "Floor tiling",           unit: "per m²", low: 120, mid: 200, high: 350, notes: "Labour only" },
      { task: "Wall tiling (bathroom)", unit: "per m²", low: 150, mid: 250, high: 400 },
      { task: "Tile removal",           unit: "per m²", low: 60,  mid: 100, high: 180 },
      { task: "Waterproofing (shower)", unit: "per m²", low: 200, mid: 350, high: 600 },
    ],
  },
  {
    name: "Roofing",
    emoji: "🏗️",
    items: [
      { task: "Roof leak repair",         unit: "per job",   low: 1500, mid: 4000,  high: 10000, notes: "Depends on extent" },
      { task: "IBR sheet replacement",    unit: "per sheet", low: 400,  mid: 700,   high: 1200 },
      { task: "Full roof replacement",    unit: "per m²",    low: 350,  mid: 600,   high: 1000 },
      { task: "Gutter installation",      unit: "per m",     low: 150,  mid: 250,   high: 450 },
      { task: "Fascia board replacement", unit: "per m",     low: 120,  mid: 200,   high: 380 },
    ],
  },
  {
    name: "Carpentry",
    emoji: "🪚",
    items: [
      { task: "Door installation",    unit: "per door",    low: 800,  mid: 1500, high: 3000 },
      { task: "Built-in cupboards",   unit: "per m",       low: 2500, mid: 4500, high: 8000 },
      { task: "Deck construction",    unit: "per m²",      low: 800,  mid: 1400, high: 2500 },
      { task: "Window frame repair",  unit: "per window",  low: 600,  mid: 1200, high: 2500 },
      { task: "Pergola construction", unit: "per m²",      low: 1200, mid: 2200, high: 4000 },
    ],
  },
  {
    name: "Construction",
    emoji: "🧱",
    items: [
      { task: "Brick wall (single)",   unit: "per m²", low: 350,  mid: 600,  high: 1000 },
      { task: "Concrete slab",         unit: "per m²", low: 500,  mid: 900,  high: 1600 },
      { task: "Room addition (basic)", unit: "per m²", low: 4000, mid: 7000, high: 12000 },
      { task: "Paving (brick)",        unit: "per m²", low: 250,  mid: 450,  high: 800 },
      { task: "Boundary wall",         unit: "per m",  low: 800,  mid: 1400, high: 2500 },
    ],
  },
  {
    name: "Cleaning",
    emoji: "🧹",
    items: [
      { task: "Deep clean (3-bed house)", unit: "per clean",  low: 800,  mid: 1400, high: 2500 },
      { task: "Regular domestic clean",   unit: "per day",    low: 250,  mid: 400,  high: 700 },
      { task: "Post-construction clean",  unit: "per m²",     low: 15,   mid: 30,   high: 60 },
      { task: "Carpet cleaning",          unit: "per m²",     low: 25,   mid: 45,   high: 80 },
      { task: "Window cleaning",          unit: "per window", low: 50,   mid: 90,   high: 180 },
    ],
  },
  {
    name: "Landscaping",
    emoji: "🌿",
    items: [
      { task: "Garden cleanup",       unit: "per day",  low: 500,  mid: 900,  high: 1800 },
      { task: "Lawn installation",    unit: "per m²",   low: 60,   mid: 110,  high: 200 },
      { task: "Tree felling (small)", unit: "per tree", low: 800,  mid: 1500, high: 3500 },
      { task: "Irrigation system",    unit: "per m²",   low: 80,   mid: 150,  high: 300 },
      { task: "Retaining wall",       unit: "per m²",   low: 600,  mid: 1100, high: 2000 },
    ],
  },
];

function fmt(n: number) {
  return `R${n.toLocaleString("en-ZA")}`;
}

function PriceRow({ item }: { item: PriceEntry }) {
  return (
    <tr className="border-b last:border-0 hover:bg-muted/30 transition-colors">
      <td className="py-3 px-4">
        <div className="font-medium text-sm">{item.task}</div>
        {item.notes && (
          <div className="text-xs text-muted-foreground mt-0.5">{item.notes}</div>
        )}
      </td>
      <td className="py-3 px-4 text-xs text-muted-foreground whitespace-nowrap">{item.unit}</td>
      <td className="py-3 px-4 text-sm text-green-700 font-medium whitespace-nowrap">{fmt(item.low)}</td>
      <td className="py-3 px-4 text-sm font-bold whitespace-nowrap">{fmt(item.mid)}</td>
      <td className="py-3 px-4 text-sm text-orange-600 font-medium whitespace-nowrap">{fmt(item.high)}</td>
    </tr>
  );
}

export default function PriceGuide() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return PRICE_DATA
      .filter(cat => !activeCategory || cat.name === activeCategory)
      .map(cat => ({
        ...cat,
        items: cat.items.filter(
          item => !q || item.task.toLowerCase().includes(q) || cat.name.toLowerCase().includes(q)
        ),
      }))
      .filter(cat => cat.items.length > 0);
  }, [search, activeCategory]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navigation />

      {/* Hero */}
      <div className="bg-primary/5 border-b">
        <div className="container py-12 max-w-5xl">
          <div className="flex items-center gap-3 mb-3">
            <DollarSign className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold">SA Trade Price Guide</h1>
          </div>
          <p className="text-muted-foreground text-lg max-w-2xl">
            Typical labour rates for common home improvement and construction tasks in South Africa (2024).
            Prices vary by region, complexity, and contractor.
          </p>
          <div className="flex items-center gap-2 mt-4 text-sm text-muted-foreground bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-2 w-fit">
            <Info className="h-4 w-4 text-yellow-600 shrink-0" />
            <span>These are <strong>labour-only</strong> estimates unless stated. Materials are additional.</span>
          </div>
        </div>
      </div>

      <div className="container py-8 max-w-5xl space-y-6 flex-1">
        {/* Search + CTA */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder='Search tasks, e.g. "geyser" or "painting"…'
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <Link to="/post-job">
            <Button className="gap-2 whitespace-nowrap">
              <PlusCircle className="h-4 w-4" />
              Post a Job
            </Button>
          </Link>
        </div>

        {/* Category filter pills */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveCategory(null)}
            className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
              activeCategory === null
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border hover:border-primary"
            }`}
          >
            All
          </button>
          {PRICE_DATA.map(cat => (
            <button
              key={cat.name}
              onClick={() => setActiveCategory(activeCategory === cat.name ? null : cat.name)}
              className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                activeCategory === cat.name
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border hover:border-primary"
              }`}
            >
              {cat.emoji} {cat.name}
            </button>
          ))}
        </div>

        {/* Price tables */}
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            No results for &ldquo;{search}&rdquo;
          </div>
        ) : (
          filtered.map(cat => (
            <Card key={cat.name}>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <span>{cat.emoji}</span>
                  {cat.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="text-left py-2 px-4 font-medium text-muted-foreground">Task</th>
                        <th className="text-left py-2 px-4 font-medium text-muted-foreground">Unit</th>
                        <th className="text-left py-2 px-4 font-medium text-green-700">Low</th>
                        <th className="text-left py-2 px-4 font-medium">Typical</th>
                        <th className="text-left py-2 px-4 font-medium text-orange-600">High</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cat.items.map((item, i) => (
                        <PriceRow key={i} item={item} />
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          ))
        )}

        {/* CTA card */}
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="py-8 text-center space-y-4">
            <h2 className="text-2xl font-bold">Ready to get quotes?</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Post your job on Khaya and receive competitive bids from verified local tradespeople.
            </p>
            <div className="flex justify-center gap-3 flex-wrap">
              <Link to="/post-job">
                <Button size="lg" className="gap-2">
                  <PlusCircle className="h-5 w-5" />
                  Post a Job
                </Button>
              </Link>
              <Link to="/workers">
                <Button size="lg" variant="outline">Browse Workers</Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <p className="text-xs text-center text-muted-foreground pb-4">
          Indicative estimates for South Africa (2024). Actual costs depend on location, materials, site conditions, and contractor rates.
          Always get at least 3 quotes before proceeding.
        </p>
      </div>

      <Footer />
    </div>
  );
}

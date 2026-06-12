import Link from "next/link";
import { 
  Store, 
  Users, 
  ShoppingCart, 
  FileText, 
  ShieldCheck, 
  CreditCard, 
  ArrowRight, 
  Layers, 
  BarChart3, 
  Bell 
} from "lucide-react";
import { LogoWithText } from "@/components/Logo";
import { ThemeToggle } from "@/context/ThemeContext";

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans antialiased overflow-x-hidden selection:bg-primary selection:text-white transition-colors duration-300">
      {/* Background Gradients */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none animate-float-1" />
      <div className="absolute top-1/3 right-1/4 w-[500px] h-[500px] bg-accent/5 rounded-full blur-3xl pointer-events-none animate-float-2" />
      <div className="absolute bottom-10 left-10 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none animate-float-3" />

      {/* Navigation Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-background/80 border-b border-border px-6 lg:px-16 py-4 flex items-center justify-between transition-colors duration-300">
        <LogoWithText size={38} showTagline={false} />

        <div className="flex items-center gap-4">
          <ThemeToggle />
          <Link
            href="/login"
            className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="relative group overflow-hidden px-5 py-2 text-sm font-semibold rounded-xl bg-primary text-white shadow-md shadow-primary/20 hover:bg-primary-hover active:scale-95 transition-all"
          >
            Get Started
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-24 px-6 lg:px-16 flex flex-col items-center justify-center text-center max-w-5xl mx-auto">
        <span className="px-4 py-1.5 rounded-full text-xs font-semibold tracking-wider uppercase bg-primary/10 text-primary border border-primary/20 mb-8 animate-pulse">
          🚀 Next-Generation Multi-Tenant SaaS
        </span>
        
        <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-tight text-foreground mb-8 max-w-4xl">
          The Intelligent Inventory Management Engine for{" "}
          <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Multi-Branch Scale
          </span>
        </h1>
        
        <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mb-10 leading-relaxed">
          Manage multiple businesses, control branch-level inventory, process high-speed checkouts, customize receipts, and audit platform growth in one consolidated SaaS platform.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 mb-16 w-full sm:w-auto">
          <Link
            href="/register"
            className="flex items-center justify-center gap-2 px-8 py-4 text-base font-bold rounded-2xl bg-primary text-white shadow-lg shadow-primary/35 hover:bg-primary/90 active:scale-95 transition-all"
          >
            Create Your Business <ArrowRight className="w-5 h-5" />
          </Link>
          <Link
            href="/login"
            className="flex items-center justify-center gap-2 px-8 py-4 text-base font-bold rounded-2xl bg-secondary border border-border text-foreground hover:bg-secondary/80 transition-all"
          >
            Access Dashboard
          </Link>
        </div>

        {/* Dashboard Mockup */}
        <div className="w-full rounded-2xl border border-border bg-card/45 p-4 backdrop-blur-sm shadow-2xl relative group">
          <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-primary to-accent opacity-20 blur-xl group-hover:opacity-30 transition duration-700" />
          <div className="w-full aspect-[16/9] rounded-xl bg-background border border-border overflow-hidden flex flex-col relative text-left">
            {/* Mock Header */}
            <div className="border-b border-border px-4 py-3 bg-muted/65 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500/70" />
                <span className="w-3 h-3 rounded-full bg-yellow-500/70" />
                <span className="w-3 h-3 rounded-full bg-green-500/70" />
                <span className="text-xs text-muted-foreground ml-4 font-mono">http://dashboard.vendorainventory.com</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-accent animate-ping" />
                <span className="text-xs font-bold text-accent">🟢 Live Context: Branch A1</span>
              </div>
            </div>

            {/* Mock Body */}
            <div className="flex-1 grid grid-cols-12 p-4 gap-4 overflow-hidden">
              {/* Sidebar */}
              <div className="col-span-3 border-r border-border pr-4 flex flex-col gap-2">
                <div className="h-8 rounded-lg bg-primary/10 border border-primary/30 flex items-center px-3 gap-2">
                  <Store className="w-4 h-4 text-primary" />
                  <span className="text-xs font-semibold text-primary">POS Checkout</span>
                </div>
                <div className="h-8 rounded-lg hover:bg-muted flex items-center px-3 gap-2 text-muted-foreground">
                  <Layers className="w-4 h-4" />
                  <span className="text-xs font-medium">Inventory Catalog</span>
                </div>
                <div className="h-8 rounded-lg hover:bg-muted flex items-center px-3 gap-2 text-muted-foreground">
                  <BarChart3 className="w-4 h-4" />
                  <span className="text-xs font-medium">Sales Reports</span>
                </div>
                <div className="h-8 rounded-lg hover:bg-muted flex items-center px-3 gap-2 text-muted-foreground">
                  <Users className="w-4 h-4" />
                  <span className="text-xs font-medium">Staff Control</span>
                </div>
                <div className="h-8 rounded-lg hover:bg-muted flex items-center px-3 gap-2 text-muted-foreground">
                  <CreditCard className="w-4 h-4" />
                  <span className="text-xs font-medium">Billing Settings</span>
                </div>
              </div>

              {/* Main POS area */}
              <div className="col-span-6 flex flex-col gap-4">
                <div className="h-10 rounded-xl bg-muted border border-border px-3 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Search products by name or scan barcode...</span>
                  <span className="px-2 py-0.5 rounded bg-secondary text-[10px] text-muted-foreground font-mono border border-border">⌘K</span>
                </div>

                <div className="flex-1 grid grid-cols-3 gap-3 overflow-hidden">
                  {[
                    { name: "Organic Espresso Bean", price: "₦24,900", stock: "45 Left" },
                    { name: "Thermal Receipt Paper", price: "₦4,500", stock: "120 Left" },
                    { name: "Branded Ceramic Mug", price: "₦15,000", stock: "18 Left" },
                    { name: "Stainless French Press", price: "₦35,000", stock: "9 Left" },
                    { name: "Double Wall Tumbler", price: "₦22,500", stock: "34 Left" },
                    { name: "Caramel Latte Syrup", price: "₦8,900", stock: "50 Left" }
                  ].map((p, i) => (
                    <div key={i} className="rounded-xl border border-border bg-card p-3 flex flex-col justify-between hover:border-primary/50 transition-colors">
                      <div>
                        <p className="text-[11px] font-semibold text-foreground line-clamp-2 leading-tight">{p.name}</p>
                        <p className="text-[10px] text-muted-foreground mt-1">{p.stock}</p>
                      </div>
                      <p className="text-xs font-bold text-primary mt-2">{p.price}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Checkout Cart area */}
              <div className="col-span-3 bg-card border border-border rounded-xl p-3 flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-bold text-foreground border-b border-border pb-2 mb-2">Selected Cart</h4>
                  <div className="flex flex-col gap-2 max-h-32 overflow-y-auto">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-muted-foreground">1x Espresso Bean</span>
                      <span className="text-foreground font-mono">₦24,900</span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-muted-foreground">2x Thermal Paper</span>
                      <span className="text-foreground font-mono">₦9,000</span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-border pt-3 flex flex-col gap-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="text-foreground font-mono">₦33,900</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-primary font-semibold">Coupon [10%]</span>
                    <span className="text-primary font-mono font-bold">-₦3,390</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold border-t border-border pt-2 text-foreground mt-1">
                    <span>Total Due</span>
                    <span className="text-primary font-mono font-black">₦30,510</span>
                  </div>
                  <button className="w-full py-2 bg-primary hover:bg-primary/95 rounded-lg text-xs font-bold text-center text-primary-foreground mt-2 shadow-md shadow-primary/10 cursor-pointer">
                    Process Checkout
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Showcase Grid */}
      <section className="bg-secondary/20 border-y border-border py-24 px-6 lg:px-16">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-4">
              Designed for Hierarchical Control
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Whether you are running a single storefront or managing hundreds of retail businesses with multiple regional branches.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Card 1 */}
            <div className="rounded-2xl border border-border bg-card p-8 hover:border-primary/50 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-6">
                <Store className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">Multi-Branch Inventory</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Choose between consolidated shared stock or independent stock per branch. Route stock transfers with reservation locks and approvals.
              </p>
            </div>

            {/* Card 2 */}
            <div className="rounded-2xl border border-border bg-card p-8 hover:border-primary/50 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-accent/10 text-accent flex items-center justify-center mb-6">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">Role-Based Gateways</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Strict context-scoping policies: Cashiers only access their assigned register branch, managers govern their store metrics, and owners view the entire operation.
              </p>
            </div>

            {/* Card 3 */}
            <div className="rounded-2xl border border-border bg-card p-8 hover:border-primary/50 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-6">
                <ShoppingCart className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">Robust POS Workflows</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Cashier checkout pipelines validate promotion limits, apply coupons, auto-deduct stock levels, and support offline receipt local-caching queues.
              </p>
            </div>

            {/* Card 4 */}
            <div className="rounded-2xl border border-border bg-card p-8 hover:border-primary/50 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-6">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">Customizable Receipt Engine</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Upload business logos, set footer and header notes, print customizable thermal receipts, and verify transactions via public unauthenticated QR pages.
              </p>
            </div>

            {/* Card 5 */}
            <div className="rounded-2xl border border-border bg-card p-8 hover:border-primary/50 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-accent/10 text-accent flex items-center justify-center mb-6">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">Secure Auditing Logs</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Platform-wide chronological audit logs capture sales checkouts, login details, deactivations, stock adjustments, and subscription changes.
              </p>
            </div>

            {/* Card 6 */}
            <div className="rounded-2xl border border-border bg-card p-8 hover:border-primary/50 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-accent/10 text-accent flex items-center justify-center mb-6">
                <CreditCard className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">Delinquency Lock Gating</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Stripe integrated billing locks dashboard operations when plans are past due, blocking cashier checkouts while allowing owner access to resolve billing.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Subscription Pricing Section */}
      <section className="py-24 px-6 lg:px-16 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-4">
            Flexible Production Subscriptions
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Choose a plan that fits your business scale. Setup takes less than 5 minutes.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {/* Plan 1 */}
          <div className="rounded-2xl border border-border bg-card p-8 flex flex-col justify-between shadow-sm">
            <div>
              <span className="text-xs font-bold uppercase text-primary">Starter</span>
              <p className="text-3xl font-black text-foreground mt-4">₦15,000 <span className="text-sm font-normal text-muted-foreground">/mo</span></p>
              <p className="text-xs text-muted-foreground mt-1">Billed annually (₦180,000 total)</p>
              <div className="border-t border-border my-6" />
              <ul className="flex flex-col gap-3 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">✓ 1 Business Account</li>
                <li className="flex items-center gap-2">✓ Up to 2 Branches</li>
                <li className="flex items-center gap-2">✓ Basic Cashier Dashboards</li>
                <li className="flex items-center gap-2">✓ Independent Stock Control</li>
              </ul>
            </div>
            <Link
              href="/register"
              className="w-full text-center py-3 rounded-xl bg-secondary hover:bg-secondary/85 text-sm font-semibold text-foreground mt-8 transition-colors border border-border cursor-pointer"
            >
              Get Started
            </Link>
          </div>

          {/* Plan 2 */}
          <div className="rounded-2xl border-2 border-accent bg-card p-8 flex flex-col justify-between relative shadow-xl">
            <span className="absolute -top-3 right-6 px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-accent text-accent-foreground">
              POPULAR
            </span>
            <div>
              <span className="text-xs font-bold uppercase text-primary">Professional</span>
              <p className="text-3xl font-black text-foreground mt-4">₦50,000 <span className="text-sm font-normal text-muted-foreground">/mo</span></p>
              <p className="text-xs text-muted-foreground mt-1">Billed annually (₦600,000 total)</p>
              <div className="border-t border-border my-6" />
              <ul className="flex flex-col gap-3 text-sm text-muted-foreground">
                <li className="flex items-center gap-2 text-primary font-bold">✓ Multiple Businesses Allowed</li>
                <li className="flex items-center gap-2">✓ Up to 10 Branches</li>
                <li className="flex items-center gap-2">✓ Shared & Independent Inventory</li>
                <li className="flex items-center gap-2">✓ Stock Transfers with Auditing</li>
                <li className="flex items-center gap-2">✓ Branded Custom Receipts</li>
              </ul>
            </div>
            <Link
              href="/register"
              className="w-full text-center py-3 rounded-xl bg-primary hover:bg-primary/95 text-sm font-semibold text-primary-foreground mt-8 shadow-md shadow-primary/20 transition-colors cursor-pointer"
            >
              Choose Professional
            </Link>
          </div>

          {/* Plan 3 */}
          <div className="rounded-2xl border border-border bg-card p-8 flex flex-col justify-between shadow-sm">
            <div>
              <span className="text-xs font-bold uppercase text-primary">Enterprise</span>
              <p className="text-3xl font-black text-foreground mt-4">₦150,000 <span className="text-sm font-normal text-muted-foreground">/mo</span></p>
              <p className="text-xs text-muted-foreground mt-1">Billed annually (₦1,800,000 total)</p>
              <div className="border-t border-border my-6" />
              <ul className="flex flex-col gap-3 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">✓ Unlimited Businesses & Branches</li>
                <li className="flex items-center gap-2">✓ Advanced Analytics & CSV Exports</li>
                <li className="flex items-center gap-2">✓ Platform-wide Audit Timeline Logs</li>
                <li className="flex items-center gap-2">✓ Priority SLA 24/7 Support</li>
              </ul>
            </div>
            <Link
              href="/register"
              className="w-full text-center py-3 rounded-xl bg-secondary hover:bg-secondary/85 text-sm font-semibold text-foreground mt-8 transition-colors border border-border cursor-pointer"
            >
              Contact Sales
            </Link>
          </div>
        </div>
      </section>

      {/* Footer Section */}
      <footer className="border-t border-border bg-card px-6 lg:px-16 py-12 flex flex-col sm:flex-row items-center justify-between gap-6 transition-colors duration-300">
        <span className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} Vendora Inventory Management System. All rights reserved.
        </span>
        <div className="flex gap-6 text-sm text-muted-foreground">
          <a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-foreground transition-colors">Terms of Service</a>
          <a href="#" className="hover:text-foreground transition-colors">Support Desk</a>
        </div>
      </footer>
    </div>
  );
}

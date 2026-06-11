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

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased overflow-x-hidden selection:bg-indigo-500 selection:text-white">
      {/* Background Gradients */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Navigation Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-slate-950/80 border-b border-slate-900 px-6 lg:px-16 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-600/30">
            V
          </div>
          <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
            Vendora <span className="text-indigo-500">POS Pro</span>
          </span>
        </div>

        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="relative group overflow-hidden px-5 py-2 text-sm font-semibold rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-500 active:scale-95 transition-all"
          >
            Get Started
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-24 px-6 lg:px-16 flex flex-col items-center justify-center text-center max-w-5xl mx-auto">
        <span className="px-4 py-1.5 rounded-full text-xs font-semibold tracking-wider uppercase bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mb-8 animate-pulse">
          🚀 Next-Generation Multi-Tenant SaaS
        </span>
        
        <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-tight text-white mb-8 max-w-4xl">
          The Intelligent POS & Inventory Engine for{" "}
          <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-500 bg-clip-text text-transparent">
            Multi-Branch Scale
          </span>
        </h1>
        
        <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mb-10 leading-relaxed">
          Manage multiple businesses, control branch-level inventory, process high-speed checkouts, customize receipts, and audit platform growth in one consolidated SaaS platform.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 mb-16 w-full sm:w-auto">
          <Link
            href="/register"
            className="flex items-center justify-center gap-2 px-8 py-4 text-base font-semibold rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/35 hover:bg-indigo-500 active:scale-95 transition-all"
          >
            Create Your Business <ArrowRight className="w-5 h-5" />
          </Link>
          <Link
            href="/login"
            className="flex items-center justify-center gap-2 px-8 py-4 text-base font-semibold rounded-2xl bg-slate-900 border border-slate-800 text-slate-200 hover:bg-slate-800 hover:text-white transition-all"
          >
            Access Dashboard
          </Link>
        </div>

        {/* Dashboard Mockup */}
        <div className="w-full rounded-2xl border border-slate-900 bg-slate-900/40 p-4 backdrop-blur-sm shadow-2xl shadow-indigo-950/20 relative group">
          <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-500 opacity-20 blur-xl group-hover:opacity-30 transition duration-700" />
          <div className="w-full aspect-[16/9] rounded-xl bg-slate-950/90 border border-slate-900 overflow-hidden flex flex-col relative text-left">
            {/* Mock Header */}
            <div className="border-b border-slate-900 px-4 py-3 bg-slate-900/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500/70" />
                <span className="w-3 h-3 rounded-full bg-yellow-500/70" />
                <span className="w-3 h-3 rounded-full bg-green-500/70" />
                <span className="text-xs text-slate-500 ml-4 font-mono">http://dashboard.vendorapos.pro</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span className="text-xs font-semibold text-emerald-400">🟢 Live Context: Branch A1</span>
              </div>
            </div>

            {/* Mock Body */}
            <div className="flex-1 grid grid-cols-12 p-4 gap-4 overflow-hidden">
              {/* Sidebar */}
              <div className="col-span-3 border-r border-slate-900/60 pr-4 flex flex-col gap-2">
                <div className="h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center px-3 gap-2">
                  <Store className="w-4 h-4 text-indigo-400" />
                  <span className="text-xs font-semibold text-indigo-300">POS Checkout</span>
                </div>
                <div className="h-8 rounded-lg hover:bg-slate-900/50 flex items-center px-3 gap-2 text-slate-400">
                  <Layers className="w-4 h-4" />
                  <span className="text-xs font-medium">Inventory Catalog</span>
                </div>
                <div className="h-8 rounded-lg hover:bg-slate-900/50 flex items-center px-3 gap-2 text-slate-400">
                  <BarChart3 className="w-4 h-4" />
                  <span className="text-xs font-medium">Sales Reports</span>
                </div>
                <div className="h-8 rounded-lg hover:bg-slate-900/50 flex items-center px-3 gap-2 text-slate-400">
                  <Users className="w-4 h-4" />
                  <span className="text-xs font-medium">Staff Control</span>
                </div>
                <div className="h-8 rounded-lg hover:bg-slate-900/50 flex items-center px-3 gap-2 text-slate-400">
                  <CreditCard className="w-4 h-4" />
                  <span className="text-xs font-medium">Billing Settings</span>
                </div>
              </div>

              {/* Main POS area */}
              <div className="col-span-6 flex flex-col gap-4">
                <div className="h-10 rounded-xl bg-slate-900 border border-slate-800/80 px-3 flex items-center justify-between">
                  <span className="text-xs text-slate-400">Search products by name or scan barcode...</span>
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-slate-400 font-mono">⌘K</span>
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
                    <div key={i} className="rounded-xl border border-slate-900 bg-slate-900/20 p-3 flex flex-col justify-between hover:border-slate-800/80 transition-colors">
                      <div>
                        <p className="text-[11px] font-semibold text-slate-200 line-clamp-2 leading-tight">{p.name}</p>
                        <p className="text-[10px] text-slate-500 mt-1">{p.stock}</p>
                      </div>
                      <p className="text-xs font-bold text-indigo-400 mt-2">{p.price}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Checkout Cart area */}
              <div className="col-span-3 bg-slate-950 border border-slate-900 rounded-xl p-3 flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-300 border-b border-slate-900 pb-2 mb-2">Selected Cart</h4>
                  <div className="flex flex-col gap-2 max-h-32 overflow-y-auto">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-400">1x Espresso Bean</span>
                      <span className="text-slate-200 font-mono">₦24,900</span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-400">2x Thermal Paper</span>
                      <span className="text-slate-200 font-mono">₦9,000</span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-900 pt-3 flex flex-col gap-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Subtotal</span>
                    <span className="text-slate-200 font-mono">₦33,900</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-indigo-400">Coupon [10%]</span>
                    <span className="text-indigo-400 font-mono">-₦3,390</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold border-t border-slate-900 pt-2 text-white mt-1">
                    <span>Total Due</span>
                    <span className="text-indigo-400 font-mono">₦30,510</span>
                  </div>
                  <button className="w-full py-2 bg-indigo-600 rounded-lg text-xs font-bold text-center text-white mt-2 hover:bg-indigo-500 shadow-md shadow-indigo-600/10">
                    Process Checkout
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Showcase Grid */}
      <section className="bg-slate-900/30 border-y border-slate-900 py-24 px-6 lg:px-16">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-4">
              Designed for Hierarchical Control
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              Whether you are running a single storefront or managing hundreds of retail businesses with multiple regional branches.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Card 1 */}
            <div className="rounded-2xl border border-slate-900 bg-slate-950 p-8 hover:border-slate-800 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-6">
                <Store className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-100 mb-3">Multi-Branch Inventory</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Choose between consolidated shared stock or independent stock per branch. Route stock transfers with reservation locks and approvals.
              </p>
            </div>

            {/* Card 2 */}
            <div className="rounded-2xl border border-slate-900 bg-slate-950 p-8 hover:border-slate-800 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-6">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-100 mb-3">Role-Based Gateways</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Strict context-scoping policies: Cashiers only access their assigned register branch, managers govern their store metrics, and owners view the entire operation.
              </p>
            </div>

            {/* Card 3 */}
            <div className="rounded-2xl border border-slate-900 bg-slate-950 p-8 hover:border-slate-800 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-violet-500/10 text-violet-400 flex items-center justify-center mb-6">
                <ShoppingCart className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-100 mb-3">Robust POS Workflows</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Cashier checkout pipelines validate promotion limits, apply coupons, auto-deduct stock levels, and support offline receipt local-caching queues.
              </p>
            </div>

            {/* Card 4 */}
            <div className="rounded-2xl border border-slate-900 bg-slate-950 p-8 hover:border-slate-800 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-6">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-100 mb-3">Customizable Receipt Engine</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Upload business logos, set footer and header notes, print customizable thermal receipts, and verify transactions via public unauthenticated QR pages.
              </p>
            </div>

            {/* Card 5 */}
            <div className="rounded-2xl border border-slate-900 bg-slate-950 p-8 hover:border-slate-800 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-6">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-100 mb-3">Secure Auditing Logs</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Platform-wide chronological audit logs capture sales checkouts, login details, deactivations, stock adjustments, and subscription changes.
              </p>
            </div>

            {/* Card 6 */}
            <div className="rounded-2xl border border-slate-900 bg-slate-950 p-8 hover:border-slate-800 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-pink-500/10 text-pink-400 flex items-center justify-center mb-6">
                <CreditCard className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-100 mb-3">Delinquency Lock Gating</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Stripe integrated billing locks dashboard operations when plans are past due, blocking cashier checkouts while allowing owner access to resolve billing.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Subscription Pricing Section */}
      <section className="py-24 px-6 lg:px-16 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-4">
            Flexible Production Subscriptions
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto">
            Choose a plan that fits your business scale. Setup takes less than 5 minutes.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {/* Plan 1 */}
          <div className="rounded-2xl border border-slate-900 bg-slate-950/50 p-8 flex flex-col justify-between">
            <div>
              <span className="text-xs font-semibold uppercase text-indigo-400">Starter</span>
              <p className="text-3xl font-black text-white mt-4">₦15,000 <span className="text-sm font-normal text-slate-500">/mo</span></p>
              <p className="text-xs text-slate-500 mt-1">Billed annually (₦180,000 total)</p>
              <div className="border-t border-slate-900 my-6" />
              <ul className="flex flex-col gap-3 text-sm text-slate-400">
                <li className="flex items-center gap-2">✓ 1 Business Account</li>
                <li className="flex items-center gap-2">✓ Up to 2 Branches</li>
                <li className="flex items-center gap-2">✓ Basic Cashier Dashboards</li>
                <li className="flex items-center gap-2">✓ Independent Stock Control</li>
              </ul>
            </div>
            <Link
              href="/register"
              className="w-full text-center py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-sm font-semibold text-slate-200 mt-8 transition-colors"
            >
              Get Started
            </Link>
          </div>

          {/* Plan 2 */}
          <div className="rounded-2xl border-2 border-indigo-600 bg-slate-950 p-8 flex flex-col justify-between relative shadow-xl shadow-indigo-950/20">
            <span className="absolute -top-3 right-6 px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-indigo-600 text-white">
              POPULAR
            </span>
            <div>
              <span className="text-xs font-semibold uppercase text-indigo-400">Professional</span>
              <p className="text-3xl font-black text-white mt-4">₦50,000 <span className="text-sm font-normal text-slate-500">/mo</span></p>
              <p className="text-xs text-slate-500 mt-1">Billed annually (₦600,000 total)</p>
              <div className="border-t border-slate-900 my-6" />
              <ul className="flex flex-col gap-3 text-sm text-slate-300">
                <li className="flex items-center gap-2 text-indigo-400 font-semibold">✓ Multiple Businesses Allowed</li>
                <li className="flex items-center gap-2">✓ Up to 10 Branches</li>
                <li className="flex items-center gap-2">✓ Shared & Independent Inventory</li>
                <li className="flex items-center gap-2">✓ Stock Transfers with Auditing</li>
                <li className="flex items-center gap-2">✓ Branded Custom Receipts</li>
              </ul>
            </div>
            <Link
              href="/register"
              className="w-full text-center py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-sm font-semibold text-white mt-8 shadow-md shadow-indigo-600/20 transition-colors"
            >
              Choose Professional
            </Link>
          </div>

          {/* Plan 3 */}
          <div className="rounded-2xl border border-slate-900 bg-slate-950/50 p-8 flex flex-col justify-between">
            <div>
              <span className="text-xs font-semibold uppercase text-indigo-400">Enterprise</span>
              <p className="text-3xl font-black text-white mt-4">₦150,000 <span className="text-sm font-normal text-slate-500">/mo</span></p>
              <p className="text-xs text-slate-500 mt-1">Billed annually (₦1,800,000 total)</p>
              <div className="border-t border-slate-900 my-6" />
              <ul className="flex flex-col gap-3 text-sm text-slate-400">
                <li className="flex items-center gap-2">✓ Unlimited Businesses & Branches</li>
                <li className="flex items-center gap-2">✓ Advanced Analytics & CSV Exports</li>
                <li className="flex items-center gap-2">✓ Platform-wide Audit Timeline Logs</li>
                <li className="flex items-center gap-2">✓ Priority SLA 24/7 Support</li>
              </ul>
            </div>
            <Link
              href="/register"
              className="w-full text-center py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-sm font-semibold text-slate-200 mt-8 transition-colors"
            >
              Contact Sales
            </Link>
          </div>
        </div>
      </section>

      {/* Footer Section */}
      <footer className="border-t border-slate-900 bg-slate-950 px-6 lg:px-16 py-12 flex flex-col sm:flex-row items-center justify-between gap-6">
        <span className="text-sm text-slate-500">
          © {new Date().getFullYear()} Vendora POS Pro. All rights reserved.
        </span>
        <div className="flex gap-6 text-sm text-slate-500">
          <a href="#" className="hover:text-slate-300">Privacy Policy</a>
          <a href="#" className="hover:text-slate-300">Terms of Service</a>
          <a href="#" className="hover:text-slate-300">Support Desk</a>
        </div>
      </footer>
    </div>
  );
}

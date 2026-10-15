import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  Boxes,
  Check,
  ChevronDown,
  CircleAlert,
  Clock3,
  LoaderCircle,
  LogOut,
  Minus,
  PackagePlus,
  Plus,
  Search,
  ShoppingBag,
  ShoppingCart,
  Store,
  TrendingUp,
  Wallet,
} from "lucide-react";
import type { User } from "@supabase/supabase-js";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { lovable } from "@/integrations/lovable";
import { supabase } from "@/integrations/supabase/client";
import { getAuthUser, setAuthUser, subscribeToAuthUser } from "@/lib/auth-session";
import { quantityAfterSale } from "@/lib/shop-rules";

type Product = {
  id: string;
  name: string;
  category: string;
  price: number;
  quantity: number;
  low_stock_at: number;
};

type Sale = {
  id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  payment_method: string;
  created_at: string;
};

type Profile = { display_name: string; shop_name: string };
type ShopSection = "sell" | "stock" | "activity";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Ọjà — Sales and stock for your shop" },
      { name: "description", content: "Record quick sales, track stock, and keep your Ibadan shop in order with Ọjà." },
      { property: "og:title", content: "Ọjà — Sales and stock for your shop" },
      { property: "og:description", content: "Record quick sales and keep your shop stock up to date." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Home,
});

const naira = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  maximumFractionDigits: 0,
});

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-NG", { hour: "numeric", minute: "2-digit" }).format(new Date(value));
}

function isToday(value: string) {
  const date = new Date(value);
  const now = new Date();
  return date.getDate() === now.getDate() && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
}

function Home() {
  const user = useSyncExternalStore(subscribeToAuthUser, getAuthUser, () => null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    let active = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setAuthUser(data.session?.user ?? null);
      setAuthReady(true);
    });
    return () => { active = false; };
  }, []);

  if (!authReady) return <LoadingScreen />;
  if (!user) return <AuthScreen />;
  return <ShopApp user={user} />;
}

function LoadingScreen() {
  return (
    <main className="auth-shell flex min-h-svh items-center justify-center px-5">
      <div className="flex items-center gap-3 text-sm text-muted-foreground"><LoaderCircle className="size-5 animate-spin" />Opening your shop…</div>
    </main>
  );
}

function Brand({ small = false }: { small?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground"><Store className="size-5" strokeWidth={2.2} /></span>
      <span className="leading-tight"><span className="block text-lg font-bold">Ọjà</span>{!small && <span className="text-xs text-muted-foreground">Your shop, in order.</span>}</span>
    </div>
  );
}

function AuthScreen() {
  const [mode, setMode] = useState<"signup" | "login">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [shopName, setShopName] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");
    setBusy(true);
    try {
      if (mode === "signup") {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { display_name: displayName.trim(), shop_name: shopName.trim() || "My shop" },
          },
        });
        if (signUpError) throw signUpError;
        if (data.session) setAuthUser(data.user);
        else setNotice("Check your email to confirm your account, then sign in to open your shop.");
      } else {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
        setAuthUser(data.user);
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "We couldn’t complete that. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function signInWithGoogle() {
    setBusy(true);
    setError("");
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (result.error) {
      setError(result.error.message);
      setBusy(false);
    }
  }

  return (
    <main className="auth-shell min-h-svh overflow-hidden">
      <div className="mx-auto grid min-h-svh max-w-6xl lg:grid-cols-[1.02fr_0.98fr]">
        <section className="relative hidden flex-col justify-between overflow-hidden bg-night px-12 py-10 text-sidebar-foreground lg:flex">
          <div className="soft-grid pointer-events-none absolute inset-0 opacity-20" />
          <div className="relative"><Brand /></div>
          <div className="relative max-w-lg pb-8">
            <p className="mb-5 flex items-center gap-2 text-sm font-medium text-sidebar-primary"><span className="size-2 rounded-full bg-sidebar-primary" />Built for the everyday shop</p>
            <h1 className="text-5xl font-semibold leading-[1.08]">Every sale counted.<br />Every item in view.</h1>
            <p className="mt-6 max-w-md text-base leading-7 text-sidebar-foreground/70">Keep your stock tidy and ring up a customer in a few taps. A calmer way to run your shop, right from your phone.</p>
            <div className="mt-12 grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-sidebar-border bg-sidebar-accent/50 p-4"><ShoppingCart className="mb-5 size-5 text-sidebar-primary" /><p className="text-sm font-medium">Quick sales</p><p className="mt-1 text-xs text-sidebar-foreground/65">Record a sale as it happens.</p></div>
              <div className="rounded-lg border border-sidebar-border bg-sidebar-accent/50 p-4"><Boxes className="mb-5 size-5 text-sidebar-primary" /><p className="text-sm font-medium">Live stock count</p><p className="mt-1 text-xs text-sidebar-foreground/65">Stock adjusts with every sale.</p></div>
            </div>
          </div>
          <p className="relative text-xs text-sidebar-foreground/50">Made for independent shops in Ibadan.</p>
        </section>

        <section className="flex min-h-svh items-center justify-center px-5 py-10 sm:px-10">
          <div className="w-full max-w-md">
            <div className="mb-9 lg:hidden"><Brand /></div>
            <div className="mb-8">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-primary">{mode === "signup" ? "A fresh start" : "Welcome back"}</p>
              <h2 className="text-3xl font-semibold">{mode === "signup" ? "Set up your shop" : "Sign in to Ọjà"}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{mode === "signup" ? "Create your account and keep your shop’s sales and stock together." : "Your shop records are ready when you are."}</p>
            </div>
            <div className="mb-6 grid grid-cols-2 border-b border-border">
              <button type="button" onClick={() => { setMode("signup"); setError(""); setNotice(""); }} className={`border-b-2 py-3 text-sm font-medium transition-colors ${mode === "signup" ? "border-primary text-foreground" : "border-transparent text-muted-foreground"}`}>Create account</button>
              <button type="button" onClick={() => { setMode("login"); setError(""); setNotice(""); }} className={`border-b-2 py-3 text-sm font-medium transition-colors ${mode === "login" ? "border-primary text-foreground" : "border-transparent text-muted-foreground"}`}>Sign in</button>
            </div>
            <form onSubmit={submit} className="space-y-4">
              {mode === "signup" && <>
                <div className="space-y-2"><Label htmlFor="display-name">Your name</Label><Input id="display-name" autoComplete="name" value={displayName} onChange={(event) => setDisplayName(event.target.value)} required placeholder="e.g. Amina Bello" className="h-12 rounded-lg bg-card" /></div>
                <div className="space-y-2"><Label htmlFor="shop-name">Shop name</Label><Input id="shop-name" value={shopName} onChange={(event) => setShopName(event.target.value)} placeholder="e.g. Amina’s Store" className="h-12 rounded-lg bg-card" /></div>
              </>}
              <div className="space-y-2"><Label htmlFor="email">Email address</Label><Input id="email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required placeholder="you@example.com" className="h-12 rounded-lg bg-card" /></div>
              <div className="space-y-2"><Label htmlFor="password">Password</Label><Input id="password" type="password" autoComplete={mode === "signup" ? "new-password" : "current-password"} minLength={6} value={password} onChange={(event) => setPassword(event.target.value)} required placeholder="At least 6 characters" className="h-12 rounded-lg bg-card" /></div>
              {error && <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
              {notice && <p role="status" className="rounded-md bg-positive-soft px-3 py-2 text-sm text-positive">{notice}</p>}
              <Button className="h-12 w-full rounded-lg text-sm" disabled={busy}>{busy && <LoaderCircle className="size-4 animate-spin" />}{mode === "signup" ? "Create my shop" : "Sign in"}<ArrowUpRight className="size-4" /></Button>
            </form>
            <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" /><span>or continue with</span><span className="h-px flex-1 bg-border" /></div>
            <Button variant="outline" className="h-12 w-full rounded-lg bg-card" disabled={busy} onClick={() => void signInWithGoogle()}><GoogleMark />Continue with Google</Button>
            <p className="mt-7 text-center text-xs leading-5 text-muted-foreground">Your shop records are private to your account.</p>
          </div>
        </section>
      </div>
    </main>
  );
}

function GoogleMark() {
  return <svg viewBox="0 0 48 48" aria-hidden="true" className="size-4"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5Z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.91c-.58 2.96-2.25 5.48-4.73 7.18l7.62 5.91c4.45-4.11 7.18-10.16 7.18-17.56Z"/><path fill="#FBBC05" d="M10.53 28.59a14.4 14.4 0 0 1 0-9.18l-7.98-6.19a23.98 23.98 0 0 0 0 21.56l7.98-6.19Z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.9-5.8l-7.62-5.91c-2.12 1.42-4.83 2.26-8.28 2.26-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48Z"/></svg>;
}

function ShopApp({ user }: { user: User }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [profile, setProfile] = useState<Profile>({ display_name: "", shop_name: "My shop" });
  const [section, setSection] = useState<ShopSection>("sell");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [saleQuantity, setSaleQuantity] = useState(1);
  const [payment, setPayment] = useState("Cash");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [showAddProduct, setShowAddProduct] = useState(false);

  async function refreshShop() {
    const [profileResult, productsResult, salesResult] = await Promise.all([
      supabase.from("profiles").select("display_name, shop_name").eq("user_id", user.id).maybeSingle(),
      supabase.from("products").select("id, name, category, price, quantity, low_stock_at").order("created_at", { ascending: false }),
      supabase.from("sales").select("id, product_id, product_name, quantity, unit_price, payment_method, created_at").order("created_at", { ascending: false }).limit(30),
    ]);
    if (productsResult.error) throw productsResult.error;
    if (salesResult.error) throw salesResult.error;
    if (profileResult.data) setProfile(profileResult.data);
    setProducts(productsResult.data ?? []);
    setSales(salesResult.data ?? []);
  }

  useEffect(() => {
    let active = true;
    void refreshShop().catch((cause) => {
      if (active) setError(cause instanceof Error ? cause.message : "Couldn’t load your shop records.");
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [user.id]);

  const selectedProduct = products.find((product) => product.id === selectedProductId) ?? null;
  const todaySales = sales.filter((sale) => isToday(sale.created_at));
  const todayRevenue = todaySales.reduce((total, sale) => total + sale.unit_price * sale.quantity, 0);
  const totalStock = products.reduce((total, product) => total + product.quantity, 0);
  const lowStock = products.filter((product) => product.quantity <= product.low_stock_at);
  const filteredProducts = useMemo(() => products.filter((product) => `${product.name} ${product.category}`.toLowerCase().includes(search.toLowerCase())), [products, search]);

  async function recordSale() {
    if (!selectedProduct) return;
    if (quantityAfterSale(selectedProduct.quantity, saleQuantity) === null) {
      setError("There isn’t enough stock for that quantity.");
      return;
    }
    setBusy(true);
    setError("");
    setNotice("");
    const { error: saleError } = await supabase.from("sales").insert({
      owner_id: user.id,
      product_id: selectedProduct.id,
      product_name: selectedProduct.name,
      quantity: saleQuantity,
      unit_price: selectedProduct.price,
      payment_method: payment,
    });
    if (saleError) {
      setError(saleError.message.includes("Sale could not be completed") ? "That item’s stock changed. Check the latest count and try again." : saleError.message);
    } else {
      setNotice(`${selectedProduct.name} sale recorded. Stock updated.`);
      setSaleQuantity(1);
      await refreshShop();
    }
    setBusy(false);
  }

  async function addProduct(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") ?? "").trim();
    const category = String(form.get("category") ?? "General").trim() || "General";
    const price = Number(form.get("price"));
    const quantity = Number(form.get("quantity"));
    if (!name || !Number.isFinite(price) || price < 0 || !Number.isInteger(quantity) || quantity < 0) {
      setError("Add an item name, a valid price, and a whole-number stock count.");
      return;
    }
    setBusy(true);
    setError("");
    const { error: productError } = await supabase.from("products").insert({ owner_id: user.id, name, category, price, quantity });
    if (productError) setError(productError.message);
    else {
      setNotice(`${name} added to your stock.`);
      event.currentTarget.reset();
      setShowAddProduct(false);
      await refreshShop();
    }
    setBusy(false);
  }

  async function updateStock(product: Product, change: number) {
    const quantity = product.quantity + change;
    if (quantity < 0) return;
    setBusy(true);
    setError("");
    const { error: updateError } = await supabase.from("products").update({ quantity }).eq("id", product.id).eq("owner_id", user.id);
    if (updateError) setError(updateError.message);
    else await refreshShop();
    setBusy(false);
  }

  async function saveShopName(value: string) {
    const shopName = value.trim();
    if (!shopName) return;
    const { error: updateError } = await supabase.from("profiles").update({ shop_name: shopName }).eq("user_id", user.id);
    if (updateError) setError(updateError.message);
    else setProfile((current) => ({ ...current, shop_name: shopName }));
  }

  async function signOut() {
    setBusy(true);
    await supabase.auth.signOut();
    setAuthUser(null);
    setBusy(false);
  }

  return (
    <div className="shop-shell bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur">
        <div className="mx-auto flex h-[4.25rem] max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3"><Brand small /><span className="hidden h-7 w-px bg-border sm:block" /><ShopNameEditor name={profile.shop_name} onSave={saveShopName} /></div>
          <div className="flex items-center gap-2">
            <span className="hidden max-w-32 truncate text-xs text-muted-foreground sm:block">{profile.display_name || user.email}</span>
            <Button variant="ghost" size="icon" aria-label="Sign out" title="Sign out" onClick={() => void signOut()} disabled={busy}><LogOut className="size-4" /></Button>
          </div>
        </div>
      </header>

      <main className="shop-main">
        <div className="mb-7 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div><p className="text-sm text-muted-foreground">{new Intl.DateTimeFormat("en-NG", { weekday: "long", day: "numeric", month: "long" }).format(new Date())}</p><h1 className="mt-1 text-2xl font-semibold">{section === "sell" ? "Good day" : section === "stock" ? "Your stock" : "Recent sales"}<span className="text-primary">.</span></h1></div>
          <Button variant="outline" className="h-10 rounded-lg bg-card" onClick={() => { setSection("stock"); setShowAddProduct(true); }}><PackagePlus className="size-4" />Add item</Button>
        </div>

        <section aria-label="Shop summary" className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <SummaryTile icon={<TrendingUp className="size-4" />} label="Sales today" value={naira.format(todayRevenue)} detail={`${todaySales.length} ${todaySales.length === 1 ? "sale" : "sales"}`} positive />
          <SummaryTile icon={<Boxes className="size-4" />} label="Items in stock" value={totalStock.toLocaleString("en-NG")} detail={`${products.length} products`} />
          <SummaryTile icon={<CircleAlert className="size-4" />} label="Running low" value={lowStock.length.toString()} detail={lowStock.length ? "Worth a top-up" : "All looking good"} warning={lowStock.length > 0} />
          <SummaryTile icon={<Wallet className="size-4" />} label="Average sale" value={todaySales.length ? naira.format(Math.round(todayRevenue / todaySales.length)) : naira.format(0)} detail="Today" />
        </section>

        <div className="mb-5 flex border-b border-border md:hidden" role="tablist" aria-label="Shop pages">
          <NavTab active={section === "sell"} onClick={() => setSection("sell")} icon={<ShoppingCart className="size-4" />} label="Sell" />
          <NavTab active={section === "stock"} onClick={() => setSection("stock")} icon={<Boxes className="size-4" />} label="Stock" />
          <NavTab active={section === "activity"} onClick={() => setSection("activity")} icon={<Clock3 className="size-4" />} label="Sales" />
        </div>

        {error && <p role="alert" className="mb-4 rounded-md border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>}
        {notice && <p role="status" className="mb-4 flex items-center gap-2 rounded-md border border-positive/20 bg-positive-soft px-4 py-3 text-sm text-positive"><Check className="size-4 shrink-0" />{notice}</p>}

        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(21rem,0.85fr)]">
          <section className={`${section === "sell" ? "block" : "hidden"} md:block`}>
            <div className="mb-4 flex items-center justify-between"><div><h2 className="text-base font-semibold">Quick sale</h2><p className="mt-1 text-xs text-muted-foreground">Add the sale and the stock count updates automatically.</p></div><span className="rounded-sm bg-positive-soft px-2.5 py-1 text-[11px] font-medium text-positive">Ready to sell</span></div>
            <div className="surface-line rounded-lg p-4 sm:p-5">
              {loading ? <InlineLoading /> : products.length === 0 ? <EmptyProducts onAdd={() => { setSection("stock"); setShowAddProduct(true); }} /> : <>
                <div className="mb-5 space-y-2"><Label htmlFor="sale-product">What are you selling?</Label><div className="relative"><select id="sale-product" value={selectedProductId} onChange={(event) => { setSelectedProductId(event.target.value); setSaleQuantity(1); }} className="h-12 w-full appearance-none rounded-md border border-input bg-background px-3 pr-10 text-sm outline-none focus:ring-2 focus:ring-ring"><option value="">Choose an item…</option>{products.map((product) => <option key={product.id} value={product.id} disabled={product.quantity === 0}>{product.name} · {naira.format(product.price)} · {product.quantity} left</option>)}</select><ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /></div></div>
                {selectedProduct && <>
                  <div className="mb-5 flex items-center justify-between rounded-md bg-muted/60 px-3 py-3"><div><p className="text-sm font-medium">{selectedProduct.name}</p><p className="mt-1 text-xs text-muted-foreground">{selectedProduct.quantity} available · {selectedProduct.category}</p></div><p className="text-base font-semibold">{naira.format(selectedProduct.price)}</p></div>
                  <div className="mb-5 grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>Quantity</Label><div className="flex h-11 items-center justify-between rounded-md border border-input bg-background"><Button variant="ghost" size="icon" aria-label="Decrease quantity" onClick={() => setSaleQuantity((value) => Math.max(1, value - 1))}><Minus className="size-4" /></Button><span className="min-w-8 text-center text-sm font-semibold">{saleQuantity}</span><Button variant="ghost" size="icon" aria-label="Increase quantity" onClick={() => setSaleQuantity((value) => Math.min(selectedProduct.quantity, value + 1))} disabled={saleQuantity >= selectedProduct.quantity}><Plus className="size-4" /></Button></div></div>
                    <div className="space-y-2"><Label htmlFor="payment-method">Paid by</Label><select id="payment-method" value={payment} onChange={(event) => setPayment(event.target.value)} className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"><option>Cash</option><option>Transfer</option><option>POS</option></select></div>
                  </div>
                  <div className="mb-4 flex items-center justify-between border-t border-border pt-4"><span className="text-sm text-muted-foreground">Sale total</span><span className="text-xl font-semibold">{naira.format(selectedProduct.price * saleQuantity)}</span></div>
                  <Button onClick={() => void recordSale()} disabled={busy || !selectedProduct || selectedProduct.quantity < 1} className="h-12 w-full rounded-lg"><ShoppingCart className="size-4" />{busy ? "Recording…" : "Record sale"}<ArrowUpRight className="ml-auto size-4" /></Button>
                </>}
              </>}
            </div>
          </section>

          <section className={`${section === "stock" ? "block" : "hidden"} md:block`}>
            <div className="mb-4 flex items-center justify-between"><div><h2 className="text-base font-semibold">Stock on hand</h2><p className="mt-1 text-xs text-muted-foreground">Update counts when new goods arrive.</p></div><Button variant="ghost" size="sm" className="text-primary" onClick={() => setShowAddProduct((value) => !value)}><Plus className="size-4" />Add</Button></div>
            {showAddProduct && <form onSubmit={(event) => void addProduct(event)} className="surface-line mb-4 space-y-3 rounded-lg p-4">
              <h3 className="text-sm font-semibold">New item</h3>
              <div className="space-y-1.5"><Label htmlFor="new-product-name">Item name</Label><Input id="new-product-name" name="name" required maxLength={80} placeholder="e.g. Palm oil, 1 litre" className="h-10 bg-background" /></div>
              <div className="grid grid-cols-2 gap-3"><div className="space-y-1.5"><Label htmlFor="new-product-price">Price (₦)</Label><Input id="new-product-price" name="price" type="number" min="0" step="1" required placeholder="2500" className="h-10 bg-background" /></div><div className="space-y-1.5"><Label htmlFor="new-product-qty">Starting stock</Label><Input id="new-product-qty" name="quantity" type="number" min="0" step="1" required placeholder="12" className="h-10 bg-background" /></div></div>
              <div className="space-y-1.5"><Label htmlFor="new-product-category">Category</Label><Input id="new-product-category" name="category" maxLength={40} placeholder="General" className="h-10 bg-background" /></div>
              <Button className="h-10 w-full" disabled={busy}>{busy ? "Adding…" : "Add to stock"}</Button>
            </form>}
            <div className="surface-line overflow-hidden rounded-lg">
              <div className="border-b border-border p-3"><div className="relative"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input aria-label="Search stock" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Find an item…" className="h-10 border-0 bg-muted/60 pl-9 shadow-none focus-visible:ring-1" /></div></div>
              {loading ? <InlineLoading /> : filteredProducts.length === 0 ? <div className="px-4 py-9 text-center text-sm text-muted-foreground">{products.length ? "No items match that search." : "Add your first item to get started."}</div> : <ul className="divide-y divide-border">{filteredProducts.slice(0, 8).map((product) => <ProductRow key={product.id} product={product} busy={busy} onAdjust={(change) => void updateStock(product, change)} />)}</ul>}
              {filteredProducts.length > 8 && <p className="border-t border-border px-4 py-3 text-center text-xs text-muted-foreground">Showing 8 of {filteredProducts.length} items</p>}
            </div>
          </section>
        </div>

        <section className={`${section === "activity" ? "block" : "hidden"} mt-7 md:block`}>
          <div className="mb-4 flex items-end justify-between"><div><h2 className="text-base font-semibold">Latest sales</h2><p className="mt-1 text-xs text-muted-foreground">Your most recent transactions.</p></div><span className="text-xs text-muted-foreground">Today: {todaySales.length}</span></div>
          <div className="surface-line overflow-hidden rounded-lg">
            {loading ? <InlineLoading /> : sales.length === 0 ? <div className="px-4 py-9 text-center text-sm text-muted-foreground">Your recorded sales will show up here.</div> : <ul className="divide-y divide-border">{sales.slice(0, 6).map((sale) => <SaleRow key={sale.id} sale={sale} />)}</ul>}
          </div>
        </section>

        {lowStock.length > 0 && <section className="mt-7"><div className="mb-3 flex items-center gap-2 text-sm font-semibold"><CircleAlert className="size-4 text-warning" />Needs a top-up</div><div className="flex flex-wrap gap-2">{lowStock.slice(0, 4).map((product) => <span key={product.id} className="rounded-sm border border-warning/30 bg-warning-soft px-3 py-2 text-xs text-ink-soft">{product.name} · {product.quantity} left</span>)}</div></section>}
        <p className="mt-10 text-center text-[11px] text-muted-foreground">Ọjà · Simple records for independent shops</p>
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-3 border-t border-border bg-card px-3 pb-[env(safe-area-inset-bottom)] md:hidden" aria-label="Main navigation">
        <NavTab active={section === "sell"} onClick={() => setSection("sell")} icon={<ShoppingCart className="size-5" />} label="Sell" compact />
        <NavTab active={section === "stock"} onClick={() => setSection("stock")} icon={<Boxes className="size-5" />} label="Stock" compact />
        <NavTab active={section === "activity"} onClick={() => setSection("activity")} icon={<Clock3 className="size-5" />} label="Sales" compact />
      </nav>
    </div>
  );
}

function ShopNameEditor({ name, onSave }: { name: string; onSave: (value: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(name);
  useEffect(() => setValue(name), [name]);
  if (editing) return <form className="flex min-w-0 items-center gap-1" onSubmit={(event) => { event.preventDefault(); onSave(value); setEditing(false); }}><Input aria-label="Shop name" value={value} onChange={(event) => setValue(event.target.value)} maxLength={80} className="h-8 w-36 px-2 text-xs sm:w-48" autoFocus /><Button type="submit" size="icon" variant="ghost" aria-label="Save shop name" className="size-8"><Check className="size-4" /></Button></form>;
  return <button type="button" onClick={() => setEditing(true)} className="flex min-w-0 items-center gap-1.5 text-left text-sm font-medium"><span className="max-w-36 truncate sm:max-w-56">{name || "My shop"}</span><ChevronDown className="size-3.5 shrink-0 text-muted-foreground" /></button>;
}

function SummaryTile({ icon, label, value, detail, positive = false, warning = false }: { icon: React.ReactNode; label: string; value: string; detail: string; positive?: boolean; warning?: boolean }) {
  return <div className="surface-line min-w-0 rounded-lg p-3.5 sm:p-4"><div className={`mb-3 flex size-8 items-center justify-center rounded-md ${warning ? "bg-warning-soft text-warning" : positive ? "bg-positive-soft text-positive" : "bg-muted text-muted-foreground"}`}>{icon}</div><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 truncate text-xl font-semibold sm:text-2xl">{value}</p><p className={`mt-1 truncate text-[11px] ${warning ? "text-warning" : "text-muted-foreground"}`}>{detail}</p></div>;
}

function NavTab({ active, onClick, icon, label, compact = false }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string; compact?: boolean }) {
  return <button type="button" role="tab" aria-selected={active} onClick={onClick} className={`flex min-h-14 flex-1 items-center justify-center gap-2 border-b-2 px-2 text-xs font-medium transition-colors ${compact ? "flex-col gap-1 py-2" : ""} ${active ? "border-primary text-primary" : "border-transparent text-muted-foreground"}`}>{icon}<span>{label}</span></button>;
}

function ProductRow({ product, busy, onAdjust }: { product: Product; busy: boolean; onAdjust: (change: number) => void }) {
  const low = product.quantity <= product.low_stock_at;
  return <li className="flex min-w-0 items-center gap-3 px-3 py-3.5 sm:px-4"><span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted text-ink-soft"><ShoppingBag className="size-4" /></span><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{product.name}</p><p className="mt-0.5 text-xs text-muted-foreground">{naira.format(product.price)} · {product.category}</p></div><span className={`min-w-12 text-right text-xs font-semibold ${low ? "text-warning" : "text-foreground"}`}>{product.quantity} left</span><div className="flex items-center gap-0.5"><Button variant="ghost" size="icon" aria-label={`Remove one ${product.name} from stock`} className="size-8" disabled={busy || product.quantity === 0} onClick={() => onAdjust(-1)}><Minus className="size-3.5" /></Button><Button variant="ghost" size="icon" aria-label={`Add one ${product.name} to stock`} className="size-8" disabled={busy} onClick={() => onAdjust(1)}><Plus className="size-3.5" /></Button></div></li>;
}

function SaleRow({ sale }: { sale: Sale }) {
  return <li className="flex items-center gap-3 px-4 py-3.5"><span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-positive-soft text-positive"><ArrowDownRight className="size-4" /></span><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{sale.product_name}</p><p className="mt-0.5 text-xs text-muted-foreground">{sale.quantity} × {naira.format(sale.unit_price)} · {sale.payment_method} · {formatDate(sale.created_at)}</p></div><p className="shrink-0 text-sm font-semibold">{naira.format(sale.unit_price * sale.quantity)}</p></li>;
}

function EmptyProducts({ onAdd }: { onAdd: () => void }) {
  return <div className="py-7 text-center"><span className="mx-auto mb-3 flex size-11 items-center justify-center rounded-full bg-muted text-muted-foreground"><PackagePlus className="size-5" /></span><p className="text-sm font-medium">Start with your first item</p><p className="mx-auto mt-1 max-w-xs text-xs leading-5 text-muted-foreground">Add a product and its current stock to make it available for quick sales.</p><Button onClick={onAdd} className="mt-4 h-10 rounded-lg"><Plus className="size-4" />Add an item</Button></div>;
}

function InlineLoading() {
  return <div className="flex items-center justify-center gap-2 px-4 py-8 text-xs text-muted-foreground"><LoaderCircle className="size-4 animate-spin" />Loading your shop…</div>;
}
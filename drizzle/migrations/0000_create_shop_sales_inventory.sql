CREATE TABLE public.profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text NOT NULL DEFAULT '',
  shop_name text NOT NULL DEFAULT 'My shop',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can create their own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  name text NOT NULL,
  category text NOT NULL DEFAULT 'General',
  price numeric(12,2) NOT NULL DEFAULT 0 CHECK (price >= 0),
  quantity integer NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  low_stock_at integer NOT NULL DEFAULT 5 CHECK (low_stock_at >= 0),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own products" ON public.products FOR SELECT TO authenticated USING (owner_id = auth.uid());
CREATE POLICY "Users can add their own products" ON public.products FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Users can update their own products" ON public.products FOR UPDATE TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

CREATE TABLE public.sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  product_id uuid NOT NULL REFERENCES public.products(id),
  product_name text NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  unit_price numeric(12,2) NOT NULL CHECK (unit_price >= 0),
  payment_method text NOT NULL DEFAULT 'Cash' CHECK (payment_method IN ('Cash', 'Transfer', 'POS')),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.sales TO authenticated;
GRANT ALL ON public.sales TO service_role;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own sales" ON public.sales FOR SELECT TO authenticated USING (owner_id = auth.uid());
CREATE POLICY "Users can record sales for their products" ON public.sales FOR INSERT TO authenticated WITH CHECK (
  owner_id = auth.uid() AND EXISTS (
    SELECT 1 FROM public.products WHERE products.id = sales.product_id AND products.owner_id = auth.uid()
  )
);

CREATE OR REPLACE FUNCTION public.create_profile_for_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, shop_name)
  VALUES (
    NEW.id,
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'display_name', ''), NULLIF(NEW.raw_user_meta_data->>'full_name', ''), split_part(COALESCE(NEW.email, 'shop owner'), '@', 1)),
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'shop_name', ''), 'My shop')
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created_make_profile
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.create_profile_for_new_user();

CREATE OR REPLACE FUNCTION public.apply_sale_to_inventory()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  UPDATE public.products
  SET quantity = quantity - NEW.quantity
  WHERE id = NEW.product_id
    AND owner_id = NEW.owner_id
    AND price = NEW.unit_price
    AND quantity >= NEW.quantity;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Sale could not be completed: check the price and available stock';
  END IF;

  RETURN NEW;
END;
$$;
CREATE TRIGGER after_sale_reduce_product_stock
AFTER INSERT ON public.sales
FOR EACH ROW EXECUTE FUNCTION public.apply_sale_to_inventory();

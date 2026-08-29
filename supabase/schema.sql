-- ==============================================================================
-- Shree Hari Keerai - Supabase Database Schema
-- Single Source of Truth for Storefront, Admin Panel & Future Android App
-- ==============================================================================

-- 1. Create Categories Table
CREATE TABLE IF NOT EXISTS public.categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    emoji TEXT NOT NULL DEFAULT '🌿',
    description TEXT DEFAULT '',
    color TEXT NOT NULL DEFAULT '#EAF8F0',
    sort_order INTEGER DEFAULT 0,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Create Products Table
CREATE TABLE IF NOT EXISTS public.products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    name_tamil TEXT DEFAULT '',
    tamil_name TEXT DEFAULT '',
    price NUMERIC NOT NULL DEFAULT 0,
    mrp NUMERIC NOT NULL DEFAULT 0,
    unit TEXT NOT NULL DEFAULT '1 Pack',
    quantity TEXT DEFAULT '1 Pack',
    category TEXT NOT NULL REFERENCES public.categories(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    image TEXT DEFAULT '',
    image_url TEXT DEFAULT '',
    description TEXT DEFAULT '',
    short_description TEXT DEFAULT '',
    note TEXT DEFAULT '',
    in_stock BOOLEAN NOT NULL DEFAULT true,
    stock_quantity INTEGER,
    featured BOOLEAN NOT NULL DEFAULT false,
    active BOOLEAN NOT NULL DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    variant_type TEXT,
    variants JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2.1 Ensure new columns exist on existing databases (Idempotent updates)
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS mrp NUMERIC DEFAULT 0;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS stock_quantity INTEGER;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS name_tamil TEXT DEFAULT '';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS tamil_name TEXT DEFAULT '';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS variant_type TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS variants JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS short_description TEXT DEFAULT '';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS image_url TEXT DEFAULT '';

-- 3. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_in_stock ON public.products(in_stock);
CREATE INDEX IF NOT EXISTS idx_products_active ON public.products(active);
CREATE INDEX IF NOT EXISTS idx_products_featured ON public.products(featured);
CREATE INDEX IF NOT EXISTS idx_products_sort_order ON public.products(sort_order);
CREATE INDEX IF NOT EXISTS idx_categories_active ON public.categories(active);
CREATE INDEX IF NOT EXISTS idx_categories_sort_order ON public.categories(sort_order);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- 5. Define RLS Policies for Categories
-- Public (anonymous) can view active categories
DROP POLICY IF EXISTS "Public can view active categories" ON public.categories;
CREATE POLICY "Public can view active categories"
ON public.categories FOR SELECT
USING (true);

-- Authenticated / Service Role can insert/update/delete categories
DROP POLICY IF EXISTS "Admin full access on categories" ON public.categories;
CREATE POLICY "Admin full access on categories"
ON public.categories FOR ALL
USING (auth.role() = 'authenticated' OR auth.role() = 'service_role')
WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'service_role');

-- 6. Define RLS Policies for Products
-- Public (anonymous) can view active products
DROP POLICY IF EXISTS "Public can view active products" ON public.products;
CREATE POLICY "Public can view active products"
ON public.products FOR SELECT
USING (true);

-- Authenticated / Service Role can insert/update/delete products
DROP POLICY IF EXISTS "Admin full access on products" ON public.products;
CREATE POLICY "Admin full access on products"
ON public.products FOR ALL
USING (auth.role() = 'authenticated' OR auth.role() = 'service_role')
WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'service_role');

-- 7. Enable Supabase Realtime for instant multi-client push (Idempotent)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
          AND schemaname = 'public' 
          AND tablename = 'categories'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.categories;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
          AND schemaname = 'public' 
          AND tablename = 'products'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
    END IF;
END $$;

-- 8. Auto-update `updated_at` timestamp trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_categories_updated_at ON public.categories;
CREATE TRIGGER set_categories_updated_at
BEFORE UPDATE ON public.categories
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_products_updated_at ON public.products;
CREATE TRIGGER set_products_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 9. Atomic Stock Deduction Stored Procedure (RPC)
CREATE OR REPLACE FUNCTION public.deduct_product_stock(
    p_items JSONB -- e.g. [{"id": "prod_1", "quantity": 2}, ...]
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_item RECORD;
    v_current_stock INT;
    v_new_stock INT;
    v_results JSONB := '[]'::jsonb;
BEGIN
    FOR v_item IN SELECT * FROM jsonb_to_recordset(p_items) AS x(id TEXT, quantity INT)
    LOOP
        -- Check current stock with row-level locking to prevent concurrency race conditions
        SELECT stock_quantity INTO v_current_stock 
        FROM public.products 
        WHERE id = v_item.id 
        FOR UPDATE;
        
        IF FOUND AND v_current_stock IS NOT NULL THEN
            v_new_stock := GREATEST(0, v_current_stock - COALESCE(v_item.quantity, 1));
            
            UPDATE public.products
            SET 
                stock_quantity = v_new_stock,
                in_stock = (v_new_stock > 0),
                updated_at = timezone('utc'::text, now())
            WHERE id = v_item.id;
            
            v_results := v_results || jsonb_build_object(
                'id', v_item.id,
                'previousStock', v_current_stock,
                'newStock', v_new_stock,
                'inStock', (v_new_stock > 0)
            );
        END IF;
    END LOOP;
    
    RETURN jsonb_build_object('success', true, 'updated', v_results);
END;
$$;


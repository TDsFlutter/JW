import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyAdminRequest } from '@/lib/auth';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

// GET products (with filters, search, sorting)
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const status = searchParams.get('status') || 'Active'; // Active by default for storefront
    const metalType = searchParams.get('metal_type') || '';
    const stoneType = searchParams.get('stone_type') || '';
    const collection = searchParams.get('collection') || '';
    const gender = searchParams.get('gender') || '';
    const sortBy = searchParams.get('sort_by') || 'display_order'; // default display_order

    let sql = `
      SELECT p.*, c.name as category_name, c.sku_prefix
      FROM products p
      JOIN categories c ON p.category_id = c.id
      WHERE 1=1
    `;
    const params = [];

    // Filter by status (unless 'all' is passed and it's authenticated - we can check query param)
    if (status && status !== 'all') {
      sql += ' AND p.status = ?';
      params.push(status);
    }

    // Search by name or SKU
    if (search) {
      sql += ' AND (p.name LIKE ? OR p.sku LIKE ? OR p.description LIKE ?)';
      const term = `%${search}%`;
      params.push(term, term, term);
    }

    // Filter by category (ID or Name)
    if (category) {
      if (isNaN(category)) {
        sql += ' AND c.name = ?';
        params.push(category);
      } else {
        sql += ' AND p.category_id = ?';
        params.push(parseInt(category, 10));
      }
    }

    // Other filters
    if (metalType) {
      sql += ' AND p.metal_type = ?';
      params.push(metalType);
    }
    if (stoneType) {
      sql += ' AND p.stone_type = ?';
      params.push(stoneType);
    }
    if (collection) {
      sql += ' AND p.collection = ?';
      params.push(collection);
    }
    if (gender) {
      sql += ' AND p.gender = ?';
      params.push(gender);
    }

    // Sorting
    if (sortBy === 'newest') {
      sql += ' ORDER BY p.created_at DESC';
    } else if (sortBy === 'oldest') {
      sql += ' ORDER BY p.created_at ASC';
    } else if (sortBy === 'price-low') {
      sql += ' ORDER BY p.base_price ASC';
    } else if (sortBy === 'price-high') {
      sql += ' ORDER BY p.base_price DESC';
    } else if (sortBy === 'alphabetical-asc') {
      sql += ' ORDER BY p.name ASC';
    } else if (sortBy === 'alphabetical-desc') {
      sql += ' ORDER BY p.name DESC';
    } else {
      sql += ' ORDER BY p.display_order ASC, p.id DESC';
    }

    // Execute query
    const products = await query(sql, params);

    // Fetch images and specifications for each product
    const enrichedProducts = [];
    for (const p of products) {
      const images = await query(
        'SELECT image_url, display_order FROM product_images WHERE product_id = ? ORDER BY display_order ASC',
        [p.id]
      );
      
      const specifications = await query(
        'SELECT name, value FROM product_specifications WHERE product_id = ?',
        [p.id]
      );

      enrichedProducts.push({
        ...p,
        price: p.base_price, // map base_price to price for frontend compatibility
        originalPrice: p.sale_price, // map sale_price to originalPrice
        images: images.map(img => img.image_url),
        specs: specifications.map(spec => ({ label: spec.name, value: spec.value })),
        category: p.category_name, // compat check
      });
    }

    return NextResponse.json(enrichedProducts, { headers: corsHeaders });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
}

// POST product (Admin Auth)
export async function POST(req) {
  try {
    const admin = await verifyAdminRequest(req);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
    }

    const data = await req.json();
    const {
      name,
      slug,
      short_description,
      description,
      category_id,
      subcategory,
      metal_type,
      metal_color,
      purity,
      stone_type,
      stone_shape,
      cut_grade,
      style,
      collection,
      base_price,
      sale_price,
      status,
      display_order,
      gender,
      availability,
      video_url,
      images, // array of strings
      specs   // array of { name, value }
    } = data;

    if (!name || !category_id || !base_price) {
      return NextResponse.json({ error: 'Name, Category, and Base Price are required' }, { status: 400, headers: corsHeaders });
    }

    // Get category info (for prefix)
    const categoryInfo = await query('SELECT sku_prefix FROM categories WHERE id = ?', [category_id]);
    if (categoryInfo.length === 0) {
      return NextResponse.json({ error: 'Invalid category selection' }, { status: 400, headers: corsHeaders });
    }
    const prefix = categoryInfo[0].sku_prefix;

    // ── SKU Generation (Sequence based on category) ─────────────────────────
    // Get the maximum sequential number currently in the database for this prefix
    const rows = await query(
      "SELECT sku FROM products WHERE sku LIKE ? ORDER BY sku DESC LIMIT 1",
      [`${prefix}-%`]
    );
    let nextNum = 1;
    if (rows && rows.length > 0) {
      const lastSku = rows[0].sku;
      const parts = lastSku.split('-');
      const num = parseInt(parts[1], 10);
      if (!isNaN(num)) {
        nextNum = num + 1;
      }
    }
    const sku = `${prefix}-${String(nextNum).padStart(4, '0')}`;

    // Auto-generate slug if not provided or empty
    const cleanSlug = (slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')) + '-' + Date.now().toString(36).substr(-4);

    // Insert Product into MySQL
    const result = await query(
      `INSERT INTO products (
        name, sku, slug, short_description, description, category_id, subcategory,
        metal_type, metal_color, purity, stone_type, stone_shape, cut_grade,
        style, collection, base_price, sale_price, status, display_order, gender, availability, video_url
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name.trim(),
        sku,
        cleanSlug,
        short_description || '',
        description || '',
        parseInt(category_id, 10),
        subcategory || '',
        metal_type || '',
        metal_color || '',
        purity || '',
        stone_type || '',
        stone_shape || '',
        cut_grade || '',
        style || '',
        collection || '',
        parseFloat(base_price),
        sale_price ? parseFloat(sale_price) : null,
        status || 'Draft',
        parseInt(display_order || 0, 10),
        gender || 'Unisex',
        availability || 'Made To Order',
        video_url || null
      ]
    );

    const productId = result.insertId;

    // Insert Images
    if (Array.isArray(images) && images.length > 0) {
      for (let i = 0; i < images.length; i++) {
        if (images[i] && images[i].trim()) {
          await query(
            'INSERT INTO product_images (product_id, image_url, display_order) VALUES (?, ?, ?)',
            [productId, images[i].trim(), i + 1]
          );
        }
      }
    }

    // Insert Specifications
    const defaultSpecs = [
      { name: 'Metal Type', value: metal_type || '' },
      { name: 'Metal Color', value: metal_color || '' },
      { name: 'Purity', value: purity || '' },
      { name: 'Stone Type', value: stone_type || '' },
      { name: 'Stone Shape', value: stone_shape || '' },
      { name: 'Cut Grade', value: cut_grade || '' }
    ];

    const allSpecs = [...defaultSpecs];
    if (Array.isArray(specs)) {
      specs.forEach(s => {
        if (s.name && s.value) {
          allSpecs.push({ name: s.name.trim(), value: s.value.trim() });
        }
      });
    }

    for (const spec of allSpecs) {
      if (spec.name && spec.value) {
        try {
          await query(
            'INSERT INTO product_specifications (product_id, name, value) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE value = ?',
            [productId, spec.name, spec.value, spec.value]
          );
        } catch (_) {
          // ignore duplicate spec insertion errors
        }
      }
    }

    return NextResponse.json({
      success: true,
      productId,
      sku,
      slug: cleanSlug
    }, { headers: corsHeaders });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
}

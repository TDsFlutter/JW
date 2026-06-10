import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyAdminRequest } from '@/lib/auth';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

// GET single product by slug
export async function GET(req, { params }) {
  try {
    const { slug } = await params;

    // Fetch product info
    const products = await query(
      `SELECT p.*, c.name as category_name, c.sku_prefix
       FROM products p
       JOIN categories c ON p.category_id = c.id
       WHERE p.slug = ? OR p.sku = ? OR p.id = ?`,
      [slug, slug, isNaN(slug) ? -1 : parseInt(slug, 10)]
    );

    if (products.length === 0) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404, headers: corsHeaders });
    }

    const p = products[0];

    // Fetch images
    const images = await query(
      'SELECT image_url, display_order FROM product_images WHERE product_id = ? ORDER BY display_order ASC',
      [p.id]
    );

    // Fetch specs
    const specifications = await query(
      'SELECT name, value FROM product_specifications WHERE product_id = ?',
      [p.id]
    );

    const enrichedProduct = {
      ...p,
      price: p.base_price,
      originalPrice: p.sale_price,
      images: images.map(img => img.image_url),
      specs: specifications.map(spec => ({ label: spec.name, value: spec.value })),
      category: p.category_name
    };

    return NextResponse.json(enrichedProduct, { headers: corsHeaders });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
}

// PUT (update) product (Admin Auth)
export async function PUT(req, { params }) {
  try {
    const admin = await verifyAdminRequest(req);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
    }

    const { slug: urlSlug } = await params;
    const data = await req.json();

    const {
      name,
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

    // Find the product first
    const products = await query('SELECT id FROM products WHERE slug = ? OR id = ?', [urlSlug, isNaN(urlSlug) ? -1 : parseInt(urlSlug, 10)]);
    if (products.length === 0) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404, headers: corsHeaders });
    }
    const productId = products[0].id;

    if (!name || !category_id || !base_price) {
      return NextResponse.json({ error: 'Name, Category, and Base Price are required' }, { status: 400, headers: corsHeaders });
    }

    // Update basic product details
    await query(
      `UPDATE products SET 
        name = ?, short_description = ?, description = ?, category_id = ?, subcategory = ?,
        metal_type = ?, metal_color = ?, purity = ?, stone_type = ?, stone_shape = ?, cut_grade = ?,
        style = ?, collection = ?, base_price = ?, sale_price = ?, status = ?, display_order = ?,
        gender = ?, availability = ?, video_url = ?
      WHERE id = ?`,
      [
        name.trim(),
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
        video_url || null,
        productId
      ]
    );

    // Update images (delete old and insert new)
    await query('DELETE FROM product_images WHERE product_id = ?', [productId]);
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

    // Update specifications (delete old and insert new)
    await query('DELETE FROM product_specifications WHERE product_id = ?', [productId]);
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
            'INSERT INTO product_specifications (product_id, name, value) VALUES (?, ?, ?)',
            [productId, spec.name, spec.value]
          );
        } catch (_) {
          // ignore duplicate spec insertion errors
        }
      }
    }

    return NextResponse.json({ success: true }, { headers: corsHeaders });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
}

// DELETE product (Admin Auth)
export async function DELETE(req, { params }) {
  try {
    const admin = await verifyAdminRequest(req);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
    }

    const { slug } = await params;

    // Delete product from database (cascade deletes images and specifications)
    const result = await query('DELETE FROM products WHERE slug = ? OR id = ?', [slug, isNaN(slug) ? -1 : parseInt(slug, 10)]);

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404, headers: corsHeaders });
    }

    return NextResponse.json({ success: true }, { headers: corsHeaders });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
}

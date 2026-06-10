import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import fs from 'fs';
import path from 'path';
import { products as initialProducts } from '@/data/products';
import { blogPosts as initialBlogs } from '@/data/blog';

// Enable CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST() {
  try {
    // 1. Read and parse schema.sql
    const schemaPath = path.join(process.cwd(), 'db', 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    // Split SQL by semicolon but ignore semicolons inside comments or values
    // A simple split by semicolon is fine if schema.sql statements are separated by semicolons
    const statements = schemaSql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);

    console.log(`Executing ${statements.length} schema creation statements...`);
    for (const stmt of statements) {
      await query(stmt);
    }

    // 2. Check if categories table is empty, if so, seed categories
    const categoriesCount = await query('SELECT COUNT(*) as count FROM categories');
    if (categoriesCount[0].count === 0) {
      const defaultCategories = [
        { name: 'Rings', prefix: 'RNG', order: 1 },
        { name: 'Earrings', prefix: 'ERG', order: 2 },
        { name: 'Necklaces', prefix: 'NCK', order: 3 },
        { name: 'Pendants', prefix: 'PND', order: 4 },
        { name: 'Bracelets', prefix: 'BRC', order: 5 },
        { name: 'Bangles', prefix: 'BGL', order: 6 },
        { name: 'Wedding Bands', prefix: 'WDB', order: 7 },
        { name: 'Engagement Rings', prefix: 'EGR', order: 8 },
        { name: 'Gemstone Jewelry', prefix: 'GSJ', order: 9 },
        { name: 'Custom Jewelry', prefix: 'CST', order: 10 },
      ];

      for (const cat of defaultCategories) {
        await query(
          'INSERT INTO categories (name, sku_prefix, display_order) VALUES (?, ?, ?)',
          [cat.name, cat.prefix, cat.order]
        );
      }
      console.log('Categories seeded.');
    }

    // 3. Check if specification fields are empty, if so seed default specs
    const specsCount = await query('SELECT COUNT(*) as count FROM specification_fields');
    if (specsCount[0].count === 0) {
      const defaultSpecs = [
        'Metal Type',
        'Metal Color',
        'Purity',
        'Stone Type',
        'Stone Shape',
        'Cut Grade',
        'Clarity',
        'Carat Weight',
        'Setting Type',
        'Style',
        'Collection',
        'Certificate'
      ];
      for (let i = 0; i < defaultSpecs.length; i++) {
        await query(
          'INSERT INTO specification_fields (name, display_order) VALUES (?, ?)',
          [defaultSpecs[i], i + 1]
        );
      }
      console.log('Specification fields seeded.');
    }

    // 4. Seed products if empty
    const productsCount = await query('SELECT COUNT(*) as count FROM products');
    if (productsCount[0].count === 0 && initialProducts && initialProducts.length > 0) {
      // Get categories map
      const dbCats = await query('SELECT * FROM categories');
      const catMap = {};
      dbCats.forEach(c => {
        catMap[c.name.toLowerCase()] = c.id;
      });

      const ringsId = catMap['rings'] || dbCats[0]?.id;

      for (let i = 0; i < initialProducts.length; i++) {
        const p = initialProducts[i];
        const catName = p.category ? p.category.toLowerCase() : 'rings';
        const catId = catMap[catName] || ringsId;

        // Auto SKU logic helper (e.g. RNG-0001)
        const prefix = dbCats.find(c => c.id === catId)?.sku_prefix || 'RNG';
        const skuNum = String(i + 1).padStart(4, '0');
        const sku = `${prefix}-${skuNum}`;
        const slug = p.id || `product-${i + 1}`;

        // Insert product
        const result = await query(
          `INSERT INTO products (
            name, sku, slug, short_description, description, category_id, subcategory,
            metal_type, metal_color, purity, stone_type, stone_shape, cut_grade,
            style, collection, base_price, sale_price, status, display_order, gender, availability
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            p.name,
            sku,
            slug,
            p.shortDescription || p.description || '',
            p.description || '',
            catId,
            p.subcategory || '',
            p.metalType || 'Gold',
            p.metalColor || 'Yellow',
            p.purity || '18K',
            p.stoneType || 'Moissanite',
            p.stoneShape || 'Round',
            p.cutGrade || 'Excellent',
            p.style || '',
            p.collection || 'Luxury',
            p.price || 9999.00,
            p.originalPrice || null,
            'Active',
            i + 1,
            p.gender || 'Women',
            p.availability || 'Made To Order'
          ]
        );

        const productId = result.insertId;

        // Insert images
        const images = Array.isArray(p.images) ? p.images : [p.image].filter(Boolean);
        for (let j = 0; j < images.length; j++) {
          await query(
            'INSERT INTO product_images (product_id, image_url, display_order) VALUES (?, ?, ?)',
            [productId, images[j], j + 1]
          );
        }

        // Insert specifications (e.g., Clarity, Weight, Setting Type)
        const specs = [
          { name: 'Metal Type', value: p.metalType || 'Gold' },
          { name: 'Metal Color', value: p.metalColor || 'Yellow' },
          { name: 'Purity', value: p.purity || '18K' },
          { name: 'Stone Type', value: p.stoneType || 'Moissanite' },
          { name: 'Stone Shape', value: p.stoneShape || 'Round' },
          { name: 'Cut Grade', value: p.cutGrade || 'Excellent' }
        ];

        // Add additional specs from static product detail if existing
        if (p.specs && Array.isArray(p.specs)) {
          p.specs.forEach(s => {
            specs.push({ name: s.label || s.name, value: s.value });
          });
        }

        for (const spec of specs) {
          try {
            await query(
              'INSERT INTO product_specifications (product_id, name, value) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE value = ?',
              [productId, spec.name, spec.value, spec.value]
            );
          } catch (err) {
            // Ignore duplicate specification inserts
          }
        }
      }
      console.log('Sample products seeded.');
    }

    // 5. Seed blogs if empty
    const blogsCount = await query('SELECT COUNT(*) as count FROM blogs');
    if (blogsCount[0].count === 0 && initialBlogs && initialBlogs.length > 0) {
      for (const b of initialBlogs) {
        await query(
          'INSERT INTO blogs (title, slug, content, excerpt, cover_image, status) VALUES (?, ?, ?, ?, ?, ?)',
          [b.title, b.slug, b.content, b.excerpt || '', b.coverImage || b.image || '', 'Active']
        );
      }
      console.log('Sample blogs seeded.');
    }

    // 6. Seed FAQs if empty
    const faqsCount = await query('SELECT COUNT(*) as count FROM faqs');
    if (faqsCount[0].count === 0) {
      const defaultFaqs = [
        { q: "What is moissanite?", a: "Moissanite is a lab-created gemstone that rivals the brilliance and fire of natural diamonds. It ranks 9.25 on the Mohs hardness scale.", o: 1 },
        { q: "Is your jewelry made of real sterling silver?", a: "Yes! All our jewelry is crafted from premium 92.5% purity solid sterling silver (925 silver).", o: 2 },
        { q: "Will the silver tarnish over time?", a: "Sterling silver can naturally tarnish, but we apply thick Platinum or Gold plating to resist it.", o: 3 }
      ];
      for (const f of defaultFaqs) {
        await query(
          'INSERT INTO faqs (question, answer, display_order) VALUES (?, ?, ?)',
          [f.q, f.a, f.o]
        );
      }
      console.log('FAQs seeded.');
    }

    // 7. Seed initial admin user if not exists
    const usersCount = await query('SELECT COUNT(*) as count FROM users');
    if (usersCount[0].count === 0) {
      await query(
        'INSERT INTO users (uid, email, display_name, role) VALUES (?, ?, ?, ?)',
        ['mock-admin-uid', 'admin@ella-jewelry.com', 'Admin User', 'admin']
      );
      console.log('Sample admin user seeded.');
    }

    return NextResponse.json({
      success: true,
      message: 'Database initialized and seeded successfully.',
    }, { headers: corsHeaders });

  } catch (error) {
    console.error('Database Initialization Failed:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: 500, headers: corsHeaders });
  }
}

import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { products as initialProducts } from '@/data/products';
import { blogPosts as initialBlogs } from '@/data/blog';

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
    const db = await getDb();

    // 1. Indexes (idempotent)
    await db.collection('categories').createIndex({ sku_prefix: 1 }, { unique: true });
    await db.collection('categories').createIndex({ id: 1 }, { unique: true });
    await db.collection('products').createIndex({ sku: 1 }, { unique: true });
    await db.collection('products').createIndex({ slug: 1 }, { unique: true });
    await db.collection('products').createIndex({ id: 1 }, { unique: true });
    await db.collection('specification_fields').createIndex({ name: 1 }, { unique: true });
    await db.collection('specification_fields').createIndex({ id: 1 }, { unique: true });
    await db.collection('blogs').createIndex({ slug: 1 }, { unique: true });
    await db.collection('blogs').createIndex({ id: 1 }, { unique: true });
    await db.collection('faqs').createIndex({ id: 1 }, { unique: true });
    await db.collection('orders').createIndex({ order_number: 1 }, { unique: true });
    await db.collection('orders').createIndex({ id: 1 }, { unique: true });
    await db.collection('contact_inquiries').createIndex({ id: 1 }, { unique: true });

    const now = () => new Date().toISOString();
    const setCounter = (name, seq) =>
      db.collection('counters').updateOne(
        { _id: name },
        { $set: { seq } },
        { upsert: true }
      );

    // 2. Seed categories if empty
    if ((await db.collection('categories').countDocuments()) === 0) {
      const defaultCategories = [
        { name: 'Rings', prefix: 'RNG', order: 1, genders: ['Men', 'Women'] },
        { name: 'Bracelets', prefix: 'BRC', order: 2, genders: ['Men', 'Women'] },
        { name: 'Cuban', prefix: 'CBN', order: 3, genders: ['Men'] },
        { name: 'Pendants', prefix: 'PND', order: 4, genders: ['Men', 'Women'] },
        { name: 'Studs', prefix: 'STD', order: 5, genders: ['Men'] },
        { name: 'Tennis Bracelets', prefix: 'TNB', order: 6, genders: ['Men', 'Women'] },
        { name: 'Earrings', prefix: 'ERG', order: 7, genders: ['Women'] },
        { name: 'Necklaces', prefix: 'NCK', order: 8, genders: ['Women'] },
      ];
      const docs = defaultCategories.map((cat, i) => ({
        id: i + 1,
        name: cat.name,
        sku_prefix: cat.prefix,
        display_order: cat.order,
        genders: cat.genders,
        created_at: now(),
        updated_at: now(),
      }));
      await db.collection('categories').insertMany(docs);
      await setCounter('categories', docs.length);
    }

    // 3. Seed specification fields if empty
    if ((await db.collection('specification_fields').countDocuments()) === 0) {
      const defaultSpecs = [
        'Metal Type', 'Metal Color', 'Purity', 'Stone Type', 'Stone Shape',
        'Cut Grade', 'Clarity', 'Carat Weight', 'Setting Type', 'Style',
        'Collection', 'Certificate',
      ];
      const docs = defaultSpecs.map((name, i) => ({
        id: i + 1,
        name,
        display_order: i + 1,
      }));
      await db.collection('specification_fields').insertMany(docs);
      await setCounter('specification_fields', docs.length);
    }

    // 4. Seed products if empty
    if (
      (await db.collection('products').countDocuments()) === 0 &&
      Array.isArray(initialProducts) &&
      initialProducts.length > 0
    ) {
      const dbCats = await db.collection('categories').find({}).toArray();
      const catByName = {};
      dbCats.forEach((c) => { catByName[c.name.toLowerCase()] = c; });
      const ringsCat = catByName['rings'] || dbCats[0];

      const productDocs = [];
      for (let i = 0; i < initialProducts.length; i++) {
        const p = initialProducts[i];
        const catName = p.category ? p.category.toLowerCase() : 'rings';
        const cat = catByName[catName] || ringsCat;
        const prefix = cat?.sku_prefix || 'RNG';
        const sku = `${prefix}-${String(i + 1).padStart(4, '0')}`;
        const slug = p.id || `product-${i + 1}`;

        const images = Array.isArray(p.images) ? p.images : [p.image].filter(Boolean);

        const specs = [
          { name: 'Metal Type', value: p.metalType || 'Gold' },
          { name: 'Metal Color', value: p.metalColor || 'Yellow' },
          { name: 'Purity', value: p.purity || '18K' },
          { name: 'Stone Type', value: p.stoneType || 'Moissanite' },
          { name: 'Stone Shape', value: p.stoneShape || 'Round' },
          { name: 'Cut Grade', value: p.cutGrade || 'Excellent' },
        ];
        if (Array.isArray(p.specs)) {
          p.specs.forEach((s) => {
            const name = s.label || s.name;
            if (name && !specs.find((x) => x.name === name)) {
              specs.push({ name, value: s.value });
            }
          });
        }

        productDocs.push({
          id: i + 1,
          name: p.name,
          sku,
          slug,
          short_description: p.shortDescription || p.description || '',
          description: p.description || '',
          category_id: cat?.id || ringsCat?.id,
          subcategory: p.subcategory || '',
          metal_type: p.metalType || 'Gold',
          metal_color: p.metalColor || 'Yellow',
          purity: p.purity || '18K',
          stone_type: p.stoneType || 'Moissanite',
          stone_shape: p.stoneShape || 'Round',
          cut_grade: p.cutGrade || 'Excellent',
          style: p.style || '',
          collection: p.collection || 'Luxury',
          base_price: p.price || 9999.0,
          sale_price: p.originalPrice || null,
          status: 'Active',
          display_order: i + 1,
          gender: p.gender || 'Women',
          availability: p.availability || 'Made To Order',
          video_url: null,
          images,
          specs,
          created_at: now(),
          updated_at: now(),
        });
      }
      await db.collection('products').insertMany(productDocs);
      await setCounter('products', productDocs.length);
    }

    // 5. Seed blogs if empty
    if (
      (await db.collection('blogs').countDocuments()) === 0 &&
      Array.isArray(initialBlogs) &&
      initialBlogs.length > 0
    ) {
      const docs = initialBlogs.map((b, i) => ({
        id: i + 1,
        title: b.title,
        slug: b.slug,
        content: b.content,
        excerpt: b.excerpt || '',
        cover_image: b.coverImage || b.image || '',
        status: 'Active',
        created_at: now(),
        updated_at: now(),
      }));
      await db.collection('blogs').insertMany(docs);
      await setCounter('blogs', docs.length);
    }

    // 6. Seed FAQs if empty
    if ((await db.collection('faqs').countDocuments()) === 0) {
      const defaultFaqs = [
        { q: 'What is moissanite?', a: 'Moissanite is a lab-created gemstone that rivals the brilliance and fire of natural diamonds. It ranks 9.25 on the Mohs hardness scale.', o: 1 },
        { q: 'Is your jewelry made of real sterling silver?', a: 'Yes! All our jewelry is crafted from premium 92.5% purity solid sterling silver (925 silver).', o: 2 },
        { q: 'Will the silver tarnish over time?', a: 'Sterling silver can naturally tarnish, but we apply thick Platinum or Gold plating to resist it.', o: 3 },
      ];
      const docs = defaultFaqs.map((f, i) => ({
        id: i + 1,
        question: f.q,
        answer: f.a,
        display_order: f.o,
        created_at: now(),
        updated_at: now(),
      }));
      await db.collection('faqs').insertMany(docs);
      await setCounter('faqs', docs.length);
    }

    // 7. Seed initial admin user if none exist
    if ((await db.collection('users').countDocuments()) === 0) {
      await db.collection('users').insertOne({
        _id: 'mock-admin-uid',
        uid: 'mock-admin-uid',
        email: 'admin@ella-jewelry.com',
        display_name: 'Admin User',
        role: 'admin',
        address: '',
        phone: '',
        wishlist: '[]',
        created_at: now(),
        updated_at: now(),
      });
    }

    return NextResponse.json({
      success: true,
      message: 'MongoDB initialized and seeded successfully.',
    }, { headers: corsHeaders });

  } catch (error) {
    console.error('Database Initialization Failed:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: 500, headers: corsHeaders });
  }
}

"use client";

import Hero from "@/components/Hero";
import TopProducts from "@/components/TopProducts";
import NewArrivals from "@/components/NewArrivals";
import Collections from "@/components/Collections";
import FeaturedProducts from "@/components/FeaturedProducts";
import MustHave from "@/components/MustHave";
import Services from "@/components/Services";
import ImageGallery from "@/components/ImageGallery";
import Newsletter from "@/components/Newsletter";

export default function Home() {
  return (
    <main>
      <Hero />
      <TopProducts />
      <NewArrivals />
      <Collections />
      <FeaturedProducts />
      <MustHave />
      <Services />
      <ImageGallery />
      <Newsletter />
    </main>
  );
}

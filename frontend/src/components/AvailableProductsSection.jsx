import React, { useState, useMemo } from 'react';
import { 
  Search, 
  ArrowUpDown, 
  Package, 
  CheckCircle2, 
  ArrowRight,
  Tag
} from 'lucide-react';

export function AvailableProductsSection({ 
  products = [], 
  isLoading = false,
  onViewProductPlans 
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('featured');

  const categories = [
    { id: 'all', label: 'All Products' },
    { id: 'Software', label: 'Software' },
    { id: 'Add-on', label: 'Add-ons' },
    { id: 'Service', label: 'Services' },
  ];

  // Filtering & Sorting
  const filteredProducts = useMemo(() => {
    let result = products.filter(p => p.is_active !== false && p.is_available !== false);

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(p => 
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.description && p.description.toLowerCase().includes(q)) ||
        (p.type && p.type.toLowerCase().includes(q))
      );
    }

    // Category filter
    if (selectedCategory !== 'all') {
      result = result.filter(p => p.type?.toLowerCase() === selectedCategory.toLowerCase());
    }

    // Sorting
    if (sortBy === 'price_asc') {
      result.sort((a, b) => Number(a.starting_price || a.sales_price || 0) - Number(b.starting_price || b.sales_price || 0));
    } else if (sortBy === 'price_desc') {
      result.sort((a, b) => Number(b.starting_price || b.sales_price || 0) - Number(a.starting_price || a.sales_price || 0));
    } else if (sortBy === 'name_asc') {
      result.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    } else if (sortBy === 'name_desc') {
      result.sort((a, b) => (b.name || '').localeCompare(a.name || ''));
    }

    return result;
  }, [products, searchQuery, selectedCategory, sortBy]);

  return (
    <section aria-label="Available Applications and Products" className="mb-14">
      {/* Section Header & Subtitle */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[#25232A]">
            Available Applications & Services
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Browse our verified software catalog, select subscription plans, and enable instant web and desktop deployment.
          </p>
        </div>

        <div className="text-xs text-gray-500 font-medium">
          Showing <span className="text-[#25232A] font-semibold">{filteredProducts.length}</span> of {products.length} products
        </div>
      </div>

      {/* Filter, Search & Sort Bar */}
      <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-xs mb-8 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" aria-hidden="true" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search products by name, feature, or keyword…"
            className="w-full pl-10 pr-4 py-2 bg-gray-50/70 border border-gray-200 rounded-xl text-sm text-[#25232A] placeholder-gray-400 focus:outline-hidden focus:ring-2 focus:ring-[#714B67] focus:bg-white transition-all"
          />
        </div>

        {/* Category Pills & Sort dropdown */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-gray-100 rounded-xl">
            {categories.map(cat => {
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    isSelected 
                      ? 'bg-white text-[#714B67] font-semibold shadow-xs' 
                      : 'text-gray-600 hover:text-[#25232A]'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-1.5 pl-2 border-l border-gray-200">
            <ArrowUpDown className="w-3.5 h-3.5 text-gray-400" aria-hidden="true" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              aria-label="Sort products by"
              className="text-xs font-medium bg-transparent text-[#25232A] border-none focus:outline-hidden cursor-pointer"
            >
              <option value="featured">Sort: Featured</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="name_asc">Name: A to Z</option>
              <option value="name_desc">Name: Z to A</option>
            </select>
          </div>

        </div>
      </div>

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(n => (
            <div key={n} className="bg-white rounded-2xl p-6 border border-gray-200 animate-pulse space-y-4">
              <div className="w-12 h-12 bg-gray-200 rounded-xl" />
              <div className="h-4 bg-gray-200 rounded-sm w-3/4" />
              <div className="h-3 bg-gray-200 rounded-sm w-1/2" />
              <div className="h-10 bg-gray-200 rounded-xl mt-4" />
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredProducts.length === 0 && (
        <div className="text-center py-16 px-4 bg-white rounded-2xl border border-dashed border-gray-300">
          <div className="w-12 h-12 rounded-full bg-gray-100 text-gray-400 mx-auto flex items-center justify-center mb-3">
            <Package className="w-6 h-6" aria-hidden="true" />
          </div>
          <h3 className="text-base font-semibold text-[#25232A]">No products found</h3>
          <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
            We couldn't find any software or add-ons matching "{searchQuery}". Try adjusting your search keywords or category filters.
          </p>
          {(searchQuery || selectedCategory !== 'all') && (
            <button
              type="button"
              onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }}
              className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-[#714B67] hover:underline"
            >
              Reset all filters
            </button>
          )}
        </div>
      )}

      {/* Product Cards Grid */}
      {!isLoading && filteredProducts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => {
            const iconUrl = product.icon_url || 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=128&q=80';
            const startingPrice = product.starting_price || product.sales_price || '0.00';
            const startingFormatted = Number(startingPrice).toLocaleString('en-IN', {
              minimumFractionDigits: 0,
              maximumFractionDigits: 2
            });
            const planCount = product.plans_count ?? (product.plans?.length || 1);

            return (
              <div
                key={product.id}
                className="bg-white rounded-2xl border border-gray-200/90 hover:border-[#714B67]/40 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between p-6 relative group"
              >
                <div>
                  {/* Header: Logo, Type & Status */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <img
                      src={iconUrl}
                      alt=""
                      className="w-12 h-12 rounded-xl object-cover border border-gray-100 shadow-xs flex-shrink-0"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                    <div className="flex flex-col items-end gap-1.5">
                      <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                        product.type === 'Software' ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                        product.type === 'Add-on' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                        'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {product.type || 'Software'}
                      </span>

                      {/* Already Subscribed Badge */}
                      {product.already_subscribed && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" aria-hidden="true" />
                          <span>Subscribed</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Product Title */}
                  <h3 className="text-lg font-bold text-[#25232A] group-hover:text-[#714B67] transition-colors mb-2">
                    {product.name}
                  </h3>

                  {/* Short description */}
                  <p className="text-xs text-gray-600 leading-relaxed line-clamp-3 mb-6">
                    {product.description || product.notes || 'Enterprise software suite with seamless recurring billing.'}
                  </p>
                </div>

                {/* Footer with Starting Price, Plan count & CTA */}
                <div className="pt-4 border-t border-gray-100">
                  <div className="flex items-baseline justify-between mb-4">
                    <div>
                      <span className="text-[11px] text-gray-500 uppercase tracking-wider block font-semibold">
                        Starting from
                      </span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-xs font-semibold text-gray-500">₹</span>
                        <span className="text-xl font-extrabold text-[#25232A] tabular-nums">
                          {startingFormatted}
                        </span>
                        <span className="text-[11px] text-gray-400">/ mo</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="inline-flex items-center gap-1 text-xs text-gray-600 bg-gray-50 px-2.5 py-1 rounded-md border border-gray-100">
                        <Tag className="w-3 h-3 text-gray-400" aria-hidden="true" />
                        <span>{planCount} {planCount === 1 ? 'plan' : 'plans'}</span>
                      </span>
                    </div>
                  </div>

                  {/* View Plans Button */}
                  <button
                    type="button"
                    onClick={() => onViewProductPlans && onViewProductPlans(product)}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-[#714B67] bg-[#714B67]/10 hover:bg-[#714B67] hover:text-white transition-all duration-200 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#714B67]"
                  >
                    <span>View Plans</span>
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

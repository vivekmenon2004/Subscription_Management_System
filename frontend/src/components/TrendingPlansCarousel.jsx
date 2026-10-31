import React, { useState, useEffect, useRef } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Sparkles, 
  Check, 
  ArrowRight
} from 'lucide-react';

export function TrendingPlansCarousel({ plans = [], onSelectPlan }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const autoSlideRef = useRef(null);

  const displayPlans = plans.filter(p => p.is_trending || p.is_publicly_available !== false);
  const total = displayPlans.length;

  // Responsive slide size: how many visible at once
  // Mobile: 1, Tablet: 2, Desktop: 3
  const [cardsPerView, setCardsPerView] = useState(() => {
    if (typeof window === 'undefined') return 3;
    if (window.innerWidth < 640) return 1;
    if (window.innerWidth < 1024) return 2;
    return 3;
  });

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640) setCardsPerView(1);
      else if (window.innerWidth < 1024) setCardsPerView(2);
      else setCardsPerView(3);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const maxIndex = Math.max(0, total - cardsPerView);

  // Auto-slide effect (5 seconds), pauses on user interaction
  useEffect(() => {
    if (isPaused || total <= cardsPerView) return;

    autoSlideRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
    }, 4500);

    return () => {
      if (autoSlideRef.current) clearInterval(autoSlideRef.current);
    };
  }, [isPaused, total, cardsPerView, maxIndex]);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev <= 0 ? maxIndex : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
  };

  if (!displayPlans.length) {
    return (
      <section 
        aria-label="Trending Subscription Plans"
        className="relative mb-12"
      >
        <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center text-xs text-gray-500">
          <Sparkles className="w-6 h-6 text-[#714B67] mx-auto mb-2 opacity-50" aria-hidden="true" />
          <p className="font-semibold text-[#25232A]">Loading curated subscription plans…</p>
        </div>
      </section>
    );
  }

  return (
    <section 
      aria-label="Trending Subscription Plans"
      className="relative mb-12"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
    >
      {/* Section Header with badge and controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-[#714B67]/10 to-[#A64D87]/15 text-[#714B67] border border-[#714B67]/20 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-[#A64D87]" aria-hidden="true" />
            <span>Admin Curated • Trending Now</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-[#25232A]">
            Trending Subscription Plans
          </h2>
          <p className="text-sm text-gray-600 mt-0.5">
            Most popular software suites and recurring service tiers for high-growth operations.
          </p>
        </div>

        {/* Carousel Prev/Next Buttons */}
        <div className="flex items-center gap-2 self-end sm:self-center">
          <button
            type="button"
            onClick={handlePrev}
            aria-label="Previous trending plans"
            className="w-9 h-9 rounded-full flex items-center justify-center bg-white border border-gray-200 text-gray-700 hover:text-[#714B67] hover:border-[#714B67]/40 shadow-xs hover:shadow-sm transition-all focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#714B67]"
          >
            <ChevronLeft className="w-5 h-5" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={handleNext}
            aria-label="Next trending plans"
            className="w-9 h-9 rounded-full flex items-center justify-center bg-white border border-gray-200 text-gray-700 hover:text-[#714B67] hover:border-[#714B67]/40 shadow-xs hover:shadow-sm transition-all focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#714B67]"
          >
            <ChevronRight className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Overflow wrapper */}
      <div className="overflow-hidden px-1 py-2 -mx-1">
        <div
          className="flex transition-transform duration-500 ease-out"
          style={{
            transform: `translateX(-${currentIndex * (100 / cardsPerView)}%)`
          }}
        >
          {displayPlans.map((plan, idx) => {
            const prod = plan.product || {};
            const iconUrl = prod.icon_url || 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=128&q=80';
            const priceFormatted = Number(plan.price).toLocaleString('en-IN', {
              minimumFractionDigits: 0,
              maximumFractionDigits: 2
            });

            const features = Array.isArray(plan.features) && plan.features.length > 0 
              ? plan.features 
              : (plan.entitlements?.features || ['Full Feature Access', 'Automated Billing', 'Standard Support']);

            return (
              <div
                key={plan.id || idx}
                className="flex-shrink-0 px-2.5"
                style={{ width: `${100 / cardsPerView}%` }}
              >
                <div className="h-full flex flex-col justify-between bg-white rounded-2xl border border-gray-200/90 hover:border-[#714B67]/40 shadow-sm hover:shadow-md transition-all duration-300 p-6 relative overflow-hidden group">
                  
                  {/* Decorative background accent */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#714B67]/8 to-[#A64D87]/4 rounded-bl-full pointer-events-none transition-transform duration-300 group-hover:scale-110" />

                  <div>
                    {/* Top row: Product info & Trending badge */}
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={iconUrl}
                          alt=""
                          className="w-11 h-11 rounded-xl object-cover border border-gray-100 shadow-xs flex-shrink-0"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                        <div>
                          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
                            {prod.name || 'Brightloop'}
                          </span>
                          <h3 className="text-lg font-bold text-[#25232A] group-hover:text-[#714B67] transition-colors line-clamp-1">
                            {plan.name}
                          </h3>
                        </div>
                      </div>

                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gradient-to-r from-amber-500 to-rose-500 text-white shadow-xs flex-shrink-0">
                        <Sparkles className="w-3 h-3" aria-hidden="true" />
                        {plan.trending_badge || 'Trending'}
                      </span>
                    </div>

                    {/* Price and billing period */}
                    <div className="mb-4 pb-4 border-b border-gray-100">
                      <div className="flex items-baseline gap-1">
                        <span className="text-sm font-semibold text-gray-500">₹</span>
                        <span className="text-3xl font-extrabold text-[#25232A] tabular-nums tracking-tight">
                          {priceFormatted}
                        </span>
                        <span className="text-xs font-medium text-gray-500 capitalize">
                          / {plan.billing_period || 'month'}
                        </span>
                      </div>
                      {plan.already_subscribed && (
                        <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <Check className="w-3 h-3 text-emerald-600" aria-hidden="true" />
                          <span>Already Subscribed</span>
                        </div>
                      )}
                    </div>

                    {/* Short description */}
                    <p className="text-xs text-gray-600 line-clamp-2 mb-4 leading-relaxed">
                      {plan.description || prod.description || 'Enterprise software plan with premium capability.'}
                    </p>

                    {/* Important included features */}
                    <div className="space-y-2 mb-6">
                      <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                        Included Features:
                      </p>
                      {features.slice(0, 3).map((feat, fIdx) => (
                        <div key={fIdx} className="flex items-center gap-2 text-xs text-[#25232A]">
                          <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0">
                            <Check className="w-2.5 h-2.5" aria-hidden="true" />
                          </div>
                          <span className="line-clamp-1">{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Explore Plan Button */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => onSelectPlan && onSelectPlan(plan, prod)}
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm text-white bg-gradient-to-r from-[#714B67] to-[#8C3A73] hover:from-[#5C3D54] hover:to-[#74305F] shadow-sm hover:shadow transition-all duration-200 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#714B67] focus-visible:ring-offset-2"
                    >
                      <span>Explore Plan</span>
                      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                    </button>
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Carousel dot indicators */}
      {maxIndex > 0 && (
        <div className="flex items-center justify-center gap-1.5 mt-4">
          {Array.from({ length: maxIndex + 1 }).map((_, dotIdx) => (
            <button
              key={dotIdx}
              type="button"
              onClick={() => setCurrentIndex(dotIdx)}
              aria-label={`Go to slide ${dotIdx + 1}`}
              className={`h-2 rounded-full transition-all duration-300 ${
                currentIndex === dotIdx 
                  ? 'w-6 bg-[#714B67]' 
                  : 'w-2 bg-gray-300 hover:bg-gray-400'
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
}

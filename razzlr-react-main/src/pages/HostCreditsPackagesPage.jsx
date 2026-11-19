// ...existing code...
import { useDispatch, useSelector } from 'react-redux';
import HostCreditsLayout from "../layouts/HostCreditsLayout";
import { useState, useEffect } from "react";
import { fetchCreditPackages, purchaseCredits } from "../services/creditsService";

const HostCreditsPackagesPage = () => {
  const [buyingId, setBuyingId] = useState(null);
  const handleBuy = async (packageId) => {
    setBuyingId(packageId);
    try {
      const response = await purchaseCredits(packageId);
      if (response && response.checkout_url) {
        window.location.href = response.checkout_url;
      }
    } catch (err) {
      alert('Failed to start checkout.');
      setBuyingId(null);
    }
  };
  const [creditPackages, setCreditPackages] = useState([]);
  useEffect(() => {
    fetchCreditPackages().then((response) => {
      // response is the full API response, get credit_packages from response.data
      setCreditPackages(response?.credit_packages || []);
    });
  }, []);

  return (
    <HostCreditsLayout>
      <main className="px-[15px] md:px-6 py-6 space-y-6 mt-[73px]">
        <div className="bg-white py-6 px-[15px] md:px-6 rounded-lg">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Packages to buy credits</h2>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-10">
            <h3 className="text-gray-900 font-medium mb-2">NOTE</h3>
            <div className="text-sm text-gray-700 space-y-1">
              <p>1 credit = 10 cents.</p>
              <p>Credits Utilization = 1 credit/spot.</p>
              <p>So a raffle with 20 spots would be 20 credits.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {creditPackages.map(pkg => {
              const basePriceCents = pkg.credits * 10;
              const hasDiscount = pkg.price_cents < basePriceCents;
              let discountPercent = 0;
              if (hasDiscount) {
                discountPercent = Math.round(100 - (pkg.price_cents / basePriceCents) * 100);
              }
              return (
                <div
                  key={pkg.id}
                  data-slot="card"
                  className="text-card-foreground flex flex-col gap-6 rounded-xl shadow-sm relative bg-white border border-gray-200 hover:shadow-lg transition-shadow duration-200 w-full"
                >
                  <div data-slot="card-content" className="p-6 text-center flex flex-col flex-1">
                    {/* Discount Tag */}
                    {hasDiscount && (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-100 text-blue-600 text-xs font-medium px-2 py-0.5 rounded-full shadow-sm">
                        {discountPercent}% off
                      </span>
                    )}

                    {/* Card Name */}
                    <h3 className="text-lg font-semibold mb-1">{pkg.name}</h3>

                    {/* Card Type */}
                    <p className="text-sm text-gray-400 mb-2">{pkg.type}</p>

                    {/* Price */}
                    <p className="text-2xl font-bold text-blue-600 mb-2">
                      {pkg.currency} {(pkg.price_cents / 100).toFixed(2)}
                    </p>

                    {/* Credits */}
                    <p className="text-gray-500 mb-4">{pkg.credits} credits</p>

                    {/* Buy Button - sticks to bottom */}
                    <div className="mt-auto">
                      <button
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition duration-150 ease-in-out cursor-pointer w-full"
                        onClick={() => handleBuy(pkg.id)}
                        disabled={buyingId === pkg.id}
                      >
                        {buyingId === pkg.id ? 'Processing...' : 'Buy Now'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

      </div>
      </main>
    </HostCreditsLayout>
  );
};

export default HostCreditsPackagesPage;

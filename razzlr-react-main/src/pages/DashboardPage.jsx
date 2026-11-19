import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getRafflesList } from '../store/raffle/thunks';
import RazzlesGrid from '../components/RazzlesGrid';
import DashboardLayout from '../layouts/DashboardLayout';

const DashboardPage = () => {
  const dispatch = useDispatch();
  const { accessToken } = useSelector((state) => state.auth);
  const { loading, error } = useSelector((state) => state.raffles);

  // Removed duplicate getRafflesList dispatch. RazzlesGrid handles fetching.

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <main className="px-[15px] md:px-6 py-6 space-y-6 mt-[73px]">
        {/* Open Raffles Carousel */}
        <RazzlesGrid />
      </main>
    </DashboardLayout>
  );
};

export default DashboardPage;

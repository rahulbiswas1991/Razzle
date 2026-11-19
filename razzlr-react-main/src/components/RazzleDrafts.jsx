import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { getRafflesList } from "../store/raffle/thunks";
import { Calendar, Hash, Ticket } from "lucide-react";
import { fetchUserProfile } from "../store/user/thunks";
import { createRaffle, payForRaffle } from "../services/raffleService";

const RazzleDrafts = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { openRaffles, loading, pagination } = useSelector((state) => state.raffles);
  const [perPage, setPerPage] = useState(10);
  const [page, setPage] = useState(1);
  const [apiCalled, setApiCalled] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedRaffle, setSelectedRaffle] = useState(null);
  const [userCredits, setUserCredits] = useState(null);
  const [loadingCredits, setLoadingCredits] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [creditError, setCreditError] = useState(null);

  // Fetch only draft raffles with pagination
  useEffect(() => {
    if (!apiCalled) {
      dispatch(getRafflesList({ per_page: perPage, page, status: "draft" }));
      setApiCalled(true);
    }
  }, [dispatch, apiCalled, perPage, page]);

  if (loading) {
    return <LoadingSkeleton />;
  }

  const draftRaffles = openRaffles || [];

  if (draftRaffles.length === 0) {
    return (
      <div className="bg-white py-6 px-[15px] md:px-6 rounded-lg text-center">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Draft Razzles</h2>
        <p className="text-gray-500 mb-6">
          No Draft Razzles yet. Create a new one to get started!
        </p>
        <button onClick={() => navigate("/razzle/new")}>Create New Razzle</button>
      </div>
    );
  }

  const handlePreviewRazzle = async (raffle) => {
    setSelectedRaffle(raffle);
    setLoadingCredits(true);
    setCreditError(null);
    try {
      const userProfile = await dispatch(fetchUserProfile()).unwrap();
      const credits = userProfile?.user?.credits_balance || 0;
      setUserCredits(credits);
      if (credits < raffle.spots_count) {
        setCreditError({
          message: 'Insufficient credits to launch this razzle.',
          balance: credits,
          requiredBalance: raffle.spots_count,
        });
      }
      setShowModal(true);
    } catch (error) {
      setCreditError({ message: 'Failed to fetch user credits.' });
    } finally {
      setLoadingCredits(false);
    }
  };

  const handleCreateRaffle = async (forceDraft = false) => {
    if (!selectedRaffle) return;
    setIsSubmitting(true);
    setCreditError(null);
    try {
      const apiData = {
        ...selectedRaffle,
        auto_delete_days: "30",
        force_draft: forceDraft,
      };
      const response = await createRaffle(apiData);
      setShowModal(false);
      if (forceDraft || response.data?.raffle?.status === "draft") {
        navigate(`/razzle/drafts`);
      } else {
        navigate(`/razzle-details/${response.data.raffle.slug}`);
      }
    } catch (error) {
      setCreditError({ message: 'Failed to create razzle.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLaunchRazzle = async () => {
    if (!selectedRaffle) return;
    setIsSubmitting(true);
    try {
      const response = await payForRaffle(selectedRaffle.slug);
      setShowModal(false);
      const raffle = response.raffle;
      if (raffle?.status === "published") {
        navigate(`/razzle/${raffle.slug}`);
      } else {
        navigate(`/razzle/drafts`);
      }
    } catch (error) {
      setCreditError({ message: 'Failed to launch razzle.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white py-6 px-[15px] md:px-6 rounded-lg">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Draft Razzles</h2>
        <div className="flex items-center gap-2 mt-4">
          <label className="text-sm font-medium text-gray-700">Rows per page:</label>
          <select
            value={perPage}
            onChange={(e) => {
              setPerPage(Number(e.target.value));
              setPage(1);
              setApiCalled(false);
            }}
            className="border border-gray-300 rounded-md px-3 py-1.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {[5, 10, 25, 50, 100].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {draftRaffles.map((raffle) => (
          <div
            key={raffle.slug}
            className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-200 cursor-default"
          >
            {/* Image */}
            {raffle.raffle_image && (
              <div className="w-full aspect-video overflow-hidden relative">
                <img
                  src={raffle.raffle_image}
                  alt={raffle.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Card content */}
            <div className="flex-1 flex flex-col justify-between p-4">
              {/* Title */}
              <h3 className="text-base font-semibold text-gray-900 mb-2 line-clamp-2">
                {raffle.title}
              </h3>

              {/* Type & spots */}
              <div className="flex items-center gap-2 mb-3">
                <span className="flex items-center gap-1 px-2 py-1 rounded-md border border-blue-200 bg-blue-50 text-xs font-medium text-blue-700">
                  <Ticket size={14} className="text-blue-500" /> {raffle.type}
                </span>
                <span className="flex items-center gap-1 px-2 py-1 rounded-md border border-gray-200 bg-gray-50 text-xs text-gray-700">
                  <Hash size={14} className="text-gray-500" /> {raffle.spots_count} spots
                </span>
              </div>

              {/* Starts at */}
              <div className="flex items-center text-xs text-gray-600 mb-4">
                <Calendar size={14} className="mr-2 text-blue-500" />
                Starts at:
                <span className="ml-1 font-medium text-gray-800">
                  {new Date(raffle.starts_at).toLocaleDateString()}
                </span>
              </div>

              {/* Preview button */}
              <button
                className="mt-auto inline-flex items-center justify-center px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg shadow hover:bg-blue-700 transition-colors duration-200 cursor-pointer"
                onClick={() => handlePreviewRazzle(raffle)}
              >
                Launch Razzle
              </button>
            </div>
          </div>
        ))}
      </div>
      {/* Pagination controls */}
      <div className="flex justify-center items-center gap-4 mt-6">
        {/* Prev button */}
        <button
          disabled={page <= 1}
          onClick={() => {
            setPage(page - 1);
            setApiCalled(false);
          }}
          className={`px-4 py-1.5 rounded-md text-sm font-medium shadow-sm transition-colors duration-200 
            ${page <= 1 
              ? "bg-gray-200 text-gray-400 cursor-not-allowed" 
              : "bg-blue-600 text-white hover:bg-blue-700"}`}
        >
          Prev
        </button>

        {/* Page indicator */}
        <span className="text-sm font-medium text-gray-700">
          Page <span className="font-semibold">{pagination?.current_page || page}</span> 
          of <span className="font-semibold">{pagination?.last_page || 1}</span>
        </span>

        {/* Next button */}
        <button
          disabled={page >= (pagination?.last_page || 1)}
          onClick={() => {
            setPage(page + 1);
            setApiCalled(false);
          }}
          className={`px-4 py-1.5 rounded-md text-sm font-medium shadow-sm transition-colors duration-200 
            ${page >= (pagination?.last_page || 1) 
              ? "bg-gray-200 text-gray-400 cursor-not-allowed" 
              : "bg-blue-600 text-white hover:bg-blue-700"}`}
        >
          Next
        </button>
      </div>

      {/* Modal for previewing razzle */}
      {showModal && selectedRaffle && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl h-auto max-h-[90vh] p-6 relative overflow-y-auto mx-4">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 cursor-pointer z-10"
            >
              ✕
            </button>
            <h2 className="text-2xl font-bold mb-6">Razzle Preview</h2>
            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <h3 className="font-semibold text-gray-900 mb-3">Razzle Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-600">Title:</span><span className="font-medium">{selectedRaffle.title}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Total Spots:</span><span className="font-medium">{selectedRaffle.spots_count} spots</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Type:</span><span className="font-medium">{selectedRaffle.type}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Privacy:</span><span className="font-medium">{selectedRaffle.scope || (selectedRaffle.is_private ? 'Private' : 'Public')}</span></div>
                {selectedRaffle.starts_at && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Draw Date:</span>
                    <span className="font-medium">{new Date(selectedRaffle.starts_at).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </div>
            {/* Credit Info */}
            {!creditError && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 mb-6">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-sm font-bold">💳</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-blue-900 mb-2">Credit Deduction</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between items-center"><span className="text-blue-700">Credits Required:</span><span className="font-bold text-blue-900">{selectedRaffle.spots_count} credits</span></div>
                      <div className="flex justify-between items-center"><span className="text-blue-700">Your Current Balance:</span><span className="font-bold text-blue-900">{userCredits} credits</span></div>
                      <div className="flex justify-between items-center pt-2 border-t border-blue-200"><span className="text-blue-700">Balance After Launch:</span><span className="font-bold text-blue-900">{userCredits - selectedRaffle.spots_count} credits</span></div>
                    </div>
                    <p className="text-xs text-blue-600 mt-3 bg-blue-100 px-3 py-2 rounded-lg">💡 <strong>1 spot = 1 credit</strong> - Credits are deducted when you launch your razzle</p>
                  </div>
                </div>
              </div>
            )}
            {creditError && (
              <div className="bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 rounded-xl p-4 mb-6">
                <h3 className="font-semibold text-red-900 mb-2">Insufficient Balance</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center"><span className="text-red-700">Credits Required:</span><span className="font-bold text-red-900">{creditError.requiredBalance} credits</span></div>
                  <div className="flex justify-between items-center"><span className="text-red-700">Your Current Balance:</span><span className="font-bold text-red-900">{creditError.balance} credits</span></div>
                  <div className="flex justify-between items-center pt-2 border-t border-red-200"><span className="text-red-700">Shortfall:</span><span className="font-bold text-red-900">{creditError.requiredBalance - creditError.balance} credits</span></div>
                </div>
                <p className="text-xs text-red-600 mt-3 bg-red-100 px-3 py-2 rounded-lg">You do not have enough credits to launch this razzle.</p>
                <div className="mt-4 flex justify-end">
                  <button
                    type="button"
                    className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition cursor-pointer font-semibold flex items-center gap-2"
                    onClick={() => navigate('/host-credits/buy')}
                  >
                    💳 Buy Credits
                  </button>
                </div>
              </div>
            )}
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                disabled={isSubmitting}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition cursor-pointer disabled:opacity-50 font-medium"
              >
                Cancel
              </button>
              {!creditError && (
                <button
                  onClick={handleLaunchRazzle}
                  disabled={isSubmitting}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition cursor-pointer disabled:opacity-50 font-semibold flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                      Launching...
                    </>
                  ) : (
                    <>
                      🚀 Launch Razzle ({selectedRaffle.spots_count} credits)
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

function LoadingSkeleton() {
  return (
    <div className="bg-white py-6 px-[15px] md:px-6 rounded-lg">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Draft Raffles</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg border border-blue-200 flex flex-col overflow-hidden animate-pulse"
          >
            <div className="w-full h-32 bg-blue-100" />
            <div className="flex-1 flex flex-col justify-between p-3">
              <div className="w-3/4 h-4 bg-blue-100 rounded mb-2" />
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-12 h-4 bg-blue-100 rounded" />
                <div className="w-10 h-4 bg-blue-100 rounded" />
              </div>
              <div>
                <div className="w-16 h-3 bg-blue-100 rounded mb-1" />
                <div className="w-20 h-4 bg-blue-100 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default RazzleDrafts;

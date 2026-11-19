import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { getRafflesList } from '../store/raffle/thunks';
import { Award, Calendar, Hash, Ticket, Sparkles, ChevronLeft, ChevronRight, Inbox } from "lucide-react";

const RazzlesGrid = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { openRaffles, completedRaffles, loading, pagination } = useSelector(
    (state) => state.raffles
  );

  const [activeTab, setActiveTab] = useState('self_hosted');
  const [perPage, setPerPage] = useState(10);
  const [page, setPage] = useState(1);
  const [apiCalled, setApiCalled] = useState(false);

  // Fetch raffles when page/perPage changes
  useEffect(() => {
    if (!apiCalled) {
      dispatch(getRafflesList({ per_page: perPage, page }));
      setApiCalled(true);
    }
  }, [dispatch, apiCalled, perPage, page]);

  // Segregate raffles
  const selfHostedRaffles = openRaffles.filter(
    (r) => r.self_hosted && r.status !== 'completed'
  );
  const joinedRaffles = openRaffles.filter(
    (r) => !r.self_hosted && r.status !== 'completed'
  );

  const handleTabSwitch = (tab) => {
    setActiveTab(tab);
  };

  // ✅ Show loader if fetching
  if (loading) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="bg-white py-6 px-[15px] md:px-6 rounded-lg">
      <div className="flex items-center justify-between mb-6">
        {/* <h2 className="text-xl font-semibold text-gray-900">Razzles</h2> */}

        {/* Rows per page */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">
            Rows per page:
          </label>
          <select
            value={perPage}
            onChange={(e) => {
              setPerPage(Number(e.target.value));
              setPage(1);
              setApiCalled(false);
            }}
            className="px-3 py-1 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {[5, 10, 25, 50, 100].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-col sm:flex-row mb-6 gap-4">
      {/* Self Hosted */}
      <button
        className={`flex-1 flex items-center justify-between px-4 py-3 rounded-lg shadow-sm transition-colors duration-200 cursor-pointer ${
          activeTab === "self_hosted"
            ? "bg-gradient-to-r from-blue-50 to-blue-100 text-blue-600"
            : "bg-gray-50 text-gray-600 hover:from-blue-50 hover:to-blue-100"
        }`}
        onClick={() => handleTabSwitch("self_hosted")}
      >
        <span className="font-medium">Self Hosted Razzles</span>
        <span className="flex items-center justify-center w-7 h-7 text-sm font-semibold rounded-full bg-blue-600 text-white">
          {selfHostedRaffles.length}
        </span>
      </button>

      {/* Joined */}
      <button
        className={`flex-1 flex items-center justify-between px-4 py-3 rounded-lg shadow-sm transition-colors duration-200 cursor-pointer ${
          activeTab === "joined"
            ? "bg-gradient-to-r from-blue-50 to-blue-100 text-blue-600"
            : "bg-gray-50 text-gray-600 hover:from-blue-50 hover:to-blue-100"
        }`}
        onClick={() => handleTabSwitch("joined")}
      >
        <span className="font-medium">Joined Razzles</span>
        <span className="flex items-center justify-center w-7 h-7 text-sm font-semibold rounded-full bg-blue-600 text-white">
          {joinedRaffles.length}
        </span>
      </button>

      {/* Completed */}
      <button
        className={`flex-1 flex items-center justify-between px-4 py-3 rounded-lg shadow-sm transition-colors duration-200 cursor-pointer ${
          activeTab === "completed"
            ? "bg-gradient-to-r from-blue-50 to-blue-100 text-blue-600"
            : "bg-gray-50 text-gray-600 hover:from-blue-50 hover:to-blue-100"
        }`}
        onClick={() => handleTabSwitch("completed")}
      >
        <span className="font-medium">Completed Razzles</span>
        <span className="flex items-center justify-center w-7 h-7 text-sm font-semibold rounded-full bg-blue-600 text-white">
          {completedRaffles.length}
        </span>
      </button>
    </div>


      {/* Cards */}
      <div
  className={`grid gap-4 ${
    (activeTab === "completed"
      ? completedRaffles
      : activeTab === "joined"
      ? joinedRaffles
      : selfHostedRaffles
    ).length > 0
      ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      : "grid-cols-1"
  }`}
>
        {(activeTab === 'completed'
          ? completedRaffles
          : activeTab === 'joined'
          ? joinedRaffles
          : selfHostedRaffles
        ).length > 0 ? (
          (activeTab === 'completed'
            ? completedRaffles
            : activeTab === 'joined'
            ? joinedRaffles
            : selfHostedRaffles
          ).map((raffle) => (
            

            <div
  key={raffle.slug}
  className="bg-white rounded-sm border border-gray-200 shadow-sm flex flex-col overflow-hidden cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all duration-200 p-2"
  onClick={() => navigate(`/razzle/${raffle.slug}`)}
>
  {/* Image with overlay */}
  {raffle.raffle_image && (
    <div className="w-full rounded-sm aspect-[16/10] relative overflow-hidden">
      <img
        src={raffle.raffle_image}
        alt={raffle.title}
        className="w-full h-full object-cover"
      />

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>

      {/* Title inside overlay */}
      <div className="absolute bottom-3 left-3 right-3 bg-white/25 rounded-sm border border-white/20 px-4 py-2 flex items-center gap-2 text-white text-sm font-medium">
        <Sparkles size={16} className="text-blue-400 shrink-0" />
        <span className="truncate">{raffle.title}</span>
      </div>

      {/* Drawn number badge (only for completed raffles) */}
      {activeTab === "completed" && raffle.drawn_number && (
        <div className="absolute top-3 right-3 bg-white shadow-md rounded-lg px-3 py-1 flex items-center gap-1 text-xs font-semibold text-gray-800">
          <Hash size={14} className="text-green-500" />
          {raffle.drawn_number}
        </div>
      )}
    </div>
  )}

  {/* Content */}
  <div className="flex-1 flex flex-col justify-between pt-4 pb-2">
    {/* Type & spots */}
    <div className="flex flex-wrap items-center gap-3 mb-4">
      <span className="flex items-center gap-1.5 px-3 py-1 rounded-sm text-xs font-medium bg-blue-600 text-white capitalize shadow-sm">
        <Ticket size={14} className="text-white" /> {raffle.type}
      </span>
      <span className="flex items-center gap-1.5 px-3 py-1 rounded-sm text-xs font-medium bg-blue-600 text-white shadow-sm">
        <Hash size={14} className="text-white" /> {raffle.spots_count} spots
      </span>
      {raffle.ends_enabled && (
        <span className="flex items-center gap-1.5 px-3 py-1 rounded-sm text-xs font-medium bg-blue-600 text-white shadow-sm">
          <Award size={14} className="text-white" /> Ends
        </span>
      )}
    </div>

    {/* Info section */}
    {activeTab === "completed" ? (
      <div className="space-y-2">
        <div className="flex items-center text-xs text-gray-600">
          <Calendar size={14} className="mr-2 text-blue-500" />
          <span className="text-blue-600 font-medium">Drawn at :</span>
          <span className="ml-1 font-medium text-gray-900">
            {raffle.drawn_at
              ? new Date(raffle.drawn_at).toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                })
              : "N/A"}
          </span>
        </div>
      </div>
    ) : (
      <div className="flex items-center text-xs border border-blue-200 bg-blue-50 px-3 py-2 rounded-sm">
        <Calendar size={14} className="mr-2 text-blue-500" />
        <span className="text-blue-600 font-medium">Start at :</span>
        <span className="ml-1 font-medium text-gray-900">
          {new Date(raffle.starts_at).toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
          })}
        </span>
      </div>
    )}
  </div>
</div>






          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-10 text-blue-500">
            <Inbox size={32} className="mb-3 text-blue-500" />
            <p className="text-lg font-medium">No raffles available</p>
          </div>
        )}
      </div>

{/* Pagination */}
<div className="flex items-center justify-center gap-4 mt-6">
  {/* Prev button */}
  <button
    disabled={page <= 1}
    onClick={() => {
      setPage(page - 1);
      setApiCalled(false);
    }}
    className="p-2 rounded-sm bg-gray-100 text-blue-600 cursor-pointer 
              disabled:opacity-50 disabled:cursor-not-allowed 
              hover:bg-gray-200 transition"
  >
    <ChevronLeft size={18} />
  </button>

  {/* Page info */}
  <span className="text-sm font-medium text-blue-600">
    Page {pagination?.current_page || page} of {pagination?.last_page || 1}
  </span>

  {/* Next button */}
  <button
    disabled={page >= (pagination?.last_page || 1)}
    onClick={() => {
      setPage(page + 1);
      setApiCalled(false);
    }}
    className="p-2 rounded-sm bg-gray-100 text-blue-600 cursor-pointer
              disabled:opacity-50 disabled:cursor-not-allowed 
              hover:bg-gray-200 transition"
  >
    <ChevronRight size={18} />
  </button>
</div>



    </div>
  );
};

// Skeleton Loader
function LoadingSkeleton() {
  return (
    <div className="bg-white py-6 px-[15px] md:px-6 rounded-lg">
      {/* <h2 className="text-xl font-semibold text-gray-900 mb-6">Razzles</h2> */}
      {/* Tabs Skeleton */}
      <div className="flex flex-col sm:flex-row mb-6 gap-4">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="flex-1 flex items-center justify-between px-4 py-3 rounded-lg shadow-sm transition-colors duration-200 cursor-pointer bg-gray-50 text-gray-600 hover:from-blue-50 hover:to-blue-100 animate-pulse"
          >
            <span className="w-28 h-4 bg-blue-100 mr-2" />
            <span className="flex items-center justify-center w-7 h-7 text-sm font-semibold rounded-full bg-blue-600 text-white" />
          </div>
        ))}
      </div>
      {/* Cards Skeleton */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          
          <div
            key={i}
            className="bg-white rounded-sm border border-gray-200 shadow-sm flex flex-col overflow-hidden p-2 animate-pulse">
      {/* Image Placeholder */}
      <div className="w-full rounded-sm aspect-[16/10] relative overflow-hidden bg-gray-200">
        {/* Gradient Overlay Simulation */}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-300/50 to-transparent"></div>

        {/* Title Placeholder */}
        <div className="absolute bottom-3 left-3 right-3 h-8 bg-gray-300/60 rounded-sm"></div>

        {/* Badge Placeholder */}
        <div className="absolute top-3 right-3 h-6 w-14 bg-gray-300 rounded-md"></div>
      </div>

      {/* Content Placeholder */}
      <div className="flex-1 flex flex-col justify-between pt-4 pb-2">
        {/* Tag Row */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="h-5 w-16 bg-gray-300 rounded-sm"></div>
          <div className="h-5 w-20 bg-gray-300 rounded-sm"></div>
          <div className="h-5 w-14 bg-gray-300 rounded-sm"></div>
        </div>

        {/* Info Section */}
        <div className="flex items-center border border-gray-200 bg-gray-100 px-3 py-2 rounded-sm">
          <div className="h-4 w-4 bg-gray-300 rounded-full mr-2"></div>
          <div className="h-3 w-16 bg-gray-300 rounded"></div>
          <div className="h-3 w-20 bg-gray-300 rounded ml-2"></div>
        </div>
      </div>
    </div>
        ))}
      </div>

    </div>
  );
}

export default RazzlesGrid;

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Lock, Unlock, Shield } from 'lucide-react';
import RazzleWidget from '../components/RazzleWidget';
import CompletedRazzleWidget from '../components/CompletedRazzleWidget';
import {
  getRaffleDetails,
  getRaffleReservationStatus,
  toggleRaffleLockStatus,
} from '../store/raffle/thunks';
import { fetchUserProfile } from '../store/user/thunks';
import { getCookie } from '../utils/cookieUtils';
import RazzleDetailsLayout from '../layouts/RazzleDetailsLayout';

const RazzleDetailsPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { accessToken } = useSelector((state) => state.auth);
  const raffleDetails = useSelector((state) => state.raffles.raffleDetails);
  const raffleReservationStatus = useSelector((state) => state.raffles.raffleReservationStatus);
  const isGloballyLocked = useSelector((state) => state.raffles.isLocked);
  const currentUser = useSelector((state) => state.user.user);

  const [localRazzle, setLocalRazzle] = useState(null);
  const [localReservationStatus, setLocalReservationStatus] = useState(null);
  const [localLoading, setLocalLoading] = useState(true);
  const [localError, setLocalError] = useState(null);
  const [isTogglingLock, setIsTogglingLock] = useState(false);
  const [lockStatusMessage, setLockStatusMessage] = useState('');

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      setLocalLoading(true);
      setLocalError(null);
      try {
        const [details, reservation] = await Promise.all([
          dispatch(getRaffleDetails(slug)).unwrap(),
          dispatch(getRaffleReservationStatus(slug)).unwrap(),
        ]);
        if (isMounted) {
          setLocalRazzle(details);
          setLocalReservationStatus(reservation);
        }
      } catch (err) {
        if (isMounted) setLocalError(err.message || 'Failed to load razzle details');
      } finally {
        if (isMounted) setLocalLoading(false);
      }
    };
    if (slug) fetchData();
    return () => {
      isMounted = false;
    };
  }, [slug, dispatch]);

  useEffect(() => {
    if (raffleDetails) setLocalRazzle(raffleDetails);
  }, [raffleDetails]);

  useEffect(() => {
    if (raffleReservationStatus) setLocalReservationStatus(raffleReservationStatus);
  }, [raffleReservationStatus]);

  useEffect(() => {
    if (!currentUser) {
      dispatch(fetchUserProfile());
    }
  }, [currentUser, dispatch]);

  const isRaffleCompleted =
    localRazzle && (localRazzle.drawn_number !== null || localRazzle.drawn_at !== null);

  const isHost =
    currentUser &&
    localRazzle &&
    (currentUser.slug === localRazzle.host_slug || currentUser.user_slug === localRazzle.host_slug);

  const handleToggleLock = async () => {
    if (!isHost || isTogglingLock) return;

    setIsTogglingLock(true);
    try {
      const result = await dispatch(toggleRaffleLockStatus(slug)).unwrap();
      const message = result.is_locked
        ? 'Razzle locked successfully!'
        : 'Razzle unlocked successfully!';
      setLockStatusMessage(message);
      setTimeout(() => setLockStatusMessage(''), 3000);
    } catch (error) {
      console.error('Failed to toggle lock:', error);
      setLockStatusMessage('Failed to update lock status');
      setTimeout(() => setLockStatusMessage(''), 3000);
    } finally {
      setIsTogglingLock(false);
    }
  };

  return (
    <RazzleDetailsLayout isCompleted={isRaffleCompleted}>
      <div className="flex flex-1 min-h-screen overflow-x-auto mt-[73px]">
        <div className="flex flex-col w-full min-w-0">
          {/* Global Lock Status Banner */}
          {(isGloballyLocked || (localRazzle && localRazzle.is_locked)) && !isRaffleCompleted && (
            <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white w-full rounded-lg shadow-md">
              <div className="px-4 md:px-6 py-3">
                <div className="flex items-center justify-center gap-3 text-sm font-medium text-center">
                  <div className="bg-white/20 rounded-full p-1.5">
                    <Shield className="w-5 h-5" />
                  </div>
                  <span className="truncate">
                    🔒 This Razzle is{' '}
                    <span className="font-semibold">Currently Locked</span> – Entries/Exits are
                    unavailable until unlocked
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Lock Status Message */}
          {lockStatusMessage && (
            <div className="fixed top-20 right-4 z-50 transform transition-all duration-300 ease-in-out w-full max-w-xs sm:max-w-sm">
              <div className="bg-white border border-gray-200 rounded-lg shadow-lg px-4 py-3 flex items-center gap-3 w-full">
                <div
                  className={`w-2 h-2 rounded-full ${
                    lockStatusMessage.includes('successfully') ? 'bg-green-500' : 'bg-red-500'
                  }`}
                ></div>
                <span className="text-sm font-medium text-gray-800 truncate">
                  {lockStatusMessage}
                </span>
              </div>
            </div>
          )}

          {/* Main Render Logic */}
          {localLoading ? (
            isRaffleCompleted ? <LoadingSkeletonCompleted /> : <LoadingSkeletonActive />
          ) : localError ? (
            <div className="flex flex-1 items-center justify-center min-w-0">
              <div className="text-center w-full">
                <div className="text-6xl mb-4">😞</div>
                <h2 className="text-2xl font-bold text-red-600 mb-4">
                  Oops! Something went wrong
                </h2>
                <p className="text-gray-600 mb-6">{localError}</p>
                <button
                  onClick={() => navigate('/dashboard')}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Back to Dashboard
                </button>
              </div>
            </div>
          ) : !localRazzle ? (
            <div className="flex flex-1 items-center justify-center min-w-0">
              <div className="text-center w-full">
                <div className="text-6xl mb-4">🔍</div>
                <h2 className="text-2xl font-bold text-gray-600 mb-4">Razzle Not Found</h2>
                <p className="text-gray-600 mb-6">
                  The razzle you're looking for doesn't exist or has been removed.
                </p>
                <button
                  onClick={() => navigate('/dashboard')}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Back to Dashboard
                </button>
              </div>
            </div>
          ) : isRaffleCompleted ? (
            <CompletedRazzleWidget
              slug={slug}
              initialRazzle={localRazzle}
              initialReservationStatus={localReservationStatus}
              token={accessToken || getCookie('access_token')}
            />
          ) : (
            <RazzleWidget
              slug={slug}
              initialRazzle={localRazzle}
              initialReservationStatus={localReservationStatus}
              token={accessToken || getCookie('access_token')}
            />
          )}
        </div>
      </div>
    </RazzleDetailsLayout>
  );
};

//
// 🟢 Skeleton for Active Razzle
//
function LoadingSkeletonActive() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="px-[15px] md:px-6 py-4 animate-pulse">
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Left Column Skeleton */}
            <div className="space-y-6">
              <div className="relative w-full h-[480px] rounded-sm bg-gray-200 overflow-hidden">
                {/* Image placeholder */}
                <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-[shimmer_2s_infinite]" />
                {/* Winner badge placeholder */}
                <div className="absolute top-6 left-6 w-32 h-8 bg-gray-300 rounded-full" />
                {/* Type badge placeholder */}
                <div className="absolute top-6 right-6 w-24 h-8 bg-gray-300 rounded-full" />
                {/* Title + Status Centered */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 space-y-4">
                  <div className="h-6 w-40 bg-gray-300 rounded-md" />
                  <div className="h-5 w-24 bg-gray-300 rounded-full" />
                  <div className="h-5 w-32 bg-gray-300 rounded-full" />
                </div>
              </div>
            </div>

            {/* Right Column Skeleton */}
            <div className="space-y-6">
              {/* Title */}
              <div className="h-6 w-48 bg-gray-300 rounded-md mb-6" />

              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex flex-col items-center text-center p-4 rounded-sm bg-gray-100 border border-gray-200"
                  >
                    <div className="p-4 rounded-full bg-gray-300 mb-2 w-12 h-12" />
                    <div className="h-4 w-24 bg-gray-300 rounded-md" />
                  </div>
                ))}
              </div>

              {/* Description */}
              <div className="mt-4 p-4 rounded-sm bg-gray-200 h-20" />

              {/* Progress Bar Skeleton */}
              <div className="mt-6 flex items-center gap-4 p-4 rounded-sm bg-white border border-gray-100 shadow-sm">
                <div className="flex-shrink-0 p-3 rounded-full bg-gray-300 w-12 h-12" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-24 bg-gray-300 rounded-md" />
                  <div className="h-3 w-full bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-3 w-1/2 bg-gray-300 rounded-full" />
                  </div>
                </div>
              </div>
            </div>
            
          </div>

          
        </div>

        <div className="px-[15px] md:px-6 py-4 animate-pulse">
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Left Column - Spots Grid Skeleton */}
            <div className="space-y-6">
              <div className="relative rounded-sm overflow-hidden">
                {/* Top Bar Skeleton */}
                <div className="flex flex-col bg-[#DBEAFE] p-4 sm:flex-row sm:items-center sm:justify-between mb-6 w-full rounded-sm">
                  <div className="h-6 w-40 bg-blue-200 rounded-md" />
                  <div className="flex items-center gap-3 mt-3 sm:mt-0">
                    <div className="h-8 w-20 bg-blue-200 rounded-md" />
                    <div className="h-8 w-24 bg-blue-200 rounded-md" />
                  </div>
                </div>

                {/* Lock warning skeleton (when loading state placeholder) */}
                <div className="mb-6 rounded-sm border border-blue-100 bg-gradient-to-r from-blue-50 to-orange-50 p-5">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-blue-200" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-40 bg-blue-200 rounded-md" />
                      <div className="h-3 w-60 bg-blue-100 rounded-md" />
                    </div>
                  </div>
                </div>

                {/* Spot Grid Skeleton */}
                <div className="w-full flex justify-center relative">
                  <div className="grid grid-cols-3 md:grid-cols-6 gap-4 px-[15px] py-4 bg-white/80 rounded-sm border border-blue-200 w-full">
                    {Array.from({ length: 18 }).map((_, i) => (
                      <div
                        key={i}
                        className="w-12 h-12 bg-blue-100 rounded-full border border-blue-200"
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Players Module Skeleton */}
            <div className="space-y-6">
              {/* Header */}
              <div className="flex flex-col bg-[#DBEAFE] p-4 sm:flex-row sm:items-center sm:justify-between mb-6 w-full rounded-sm">
                <div className="flex items-center gap-3">
                  <div className="h-6 w-32 bg-blue-200 rounded-md" />
                  <div className="h-6 w-10 bg-blue-300 rounded-full" />
                </div>
                <div className="h-8 w-28 bg-blue-200 rounded-md" />
              </div>

              {/* Players List Skeleton */}
              <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
                {Array.from({ length: 1 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex flex-col md:flex-row items-center justify-between gap-3 p-4 bg-white border border-blue-200 rounded-sm"
                  >
                    <div className="flex items-center gap-4 flex-shrink-0 min-w-0 md:max-w-xs w-full">
                      <div className="w-14 h-14 rounded-full bg-blue-200" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 w-40 bg-blue-200 rounded-md" />
                        <div className="h-3 w-28 bg-blue-100 rounded-md" />
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-3 justify-end items-center">
                      {Array.from({ length: 4 }).map((_, j) => (
                        <div
                          key={j}
                          className="w-10 h-10 rounded-full bg-blue-100 border border-blue-200"
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Stats Cards Skeleton */}
              <div className="mt-6 grid grid-cols-2 gap-4 text-center w-full">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="bg-blue-100 rounded-sm p-3 flex flex-col items-center gap-3 border border-blue-200"
                  >
                    <div className="w-16 h-16 bg-white border border-blue-300 rounded-full" />
                    <div className="h-3 w-20 bg-blue-200 rounded-md" />
                    <div className="h-5 w-10 bg-blue-300 rounded-md" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>


    </div>
  );
}

//
// 🟣 Skeleton for Completed Razzle
//
function LoadingSkeletonCompleted() {
  const [showSkeleton, setShowSkeleton] = React.useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setShowSkeleton(true);
    }, 400); // 👈 1 second delay before skeleton appears
    return () => clearTimeout(timer);
  }, []);

  if (!showSkeleton) {
    // Optional: return a transparent placeholder or nothing
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 px-[15px] md:px-6 py-4 animate-pulse">
        {/* LEFT COLUMN */}
        <div className="space-y-8">
          <div className="relative w-full h-[480px] rounded-sm bg-gray-200 overflow-hidden">
            {/* Image shimmer */}
            <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-[shimmer_2s_infinite]" />

            {/* Title + Status Center */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 space-y-4">
              <div className="h-8 w-48 bg-gray-300 rounded-md" />
              <div className="h-6 w-32 bg-gray-300 rounded-full" />
              {/* Winner Box Skeleton */}
              <div className="mt-4 w-full max-w-md bg-gradient-to-r from-yellow-100 to-yellow-200 p-6 rounded-2xl shadow-md space-y-4">
                <div className="h-10 w-10 bg-yellow-300 rounded-full mx-auto" />
                <div className="h-5 w-32 bg-yellow-300 rounded-md mx-auto" />
                <div className="h-6 w-24 bg-yellow-400 rounded-md mx-auto" />
                <div className="h-4 w-40 bg-yellow-200 rounded-md mx-auto mt-2" />
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-8">
          {/* Raffle Info Skeleton */}
          <div className="bg-white p-6 rounded-sm shadow-sm border border-gray-100">
            <div className="h-6 w-40 bg-blue-200 rounded-md mb-6" />

            {/* 4-column info grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, idx) => (
                <div
                  key={idx}
                  className="relative flex flex-col items-center text-center p-6 rounded-sm bg-[#F1F7FF] border border-blue-100"
                >
                  <div className="p-4 rounded-full bg-blue-100 border border-blue-200 mb-2 w-16 h-16" />
                  <div className="h-4 w-24 bg-blue-200 rounded-md" />
                  <div className="h-3 w-20 bg-blue-100 rounded-md mt-2" />
                </div>
              ))}
            </div>

            {/* Description Skeleton */}
            <div className="mt-6 p-6 rounded-sm bg-blue-200 border border-blue-300">
              <div className="h-4 w-full bg-blue-300 rounded-md mb-2" />
              <div className="h-4 w-3/4 bg-blue-300 rounded-md mb-2" />
              <div className="h-4 w-2/3 bg-blue-300 rounded-md" />
            </div>
          </div>
        </div>
      </div>


      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 px-[15px] md:px-6 py-4 animate-pulse">
      {/* LEFT COLUMN */}
      <div className="space-y-8">
        {/* SIGNATURE SECTION (skeleton) */}
        <div className="bg-white rounded-sm p-4">
          <div className="flex flex-col bg-[#DBEAFE] p-4 sm:flex-row sm:items-center sm:justify-between mb-6 w-full rounded-sm">
            <div className="h-6 w-48 bg-blue-200 rounded"></div>
          </div>
          <div className="mt-4 space-y-3">
            <div className="bg-blue-200 h-20 rounded-sm"></div>
            <div className="h-3 w-3/4 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN */}
      <div className="space-y-8">
        {/* FINAL RESULTS (skeleton) */}
        <div className="bg-white rounded-sm p-4">
          <div className="flex flex-col bg-[#DBEAFE] p-4 sm:flex-row sm:items-center sm:justify-between mb-6 w-full rounded-sm">
            <div className="h-6 w-40 bg-blue-200 rounded"></div>
          </div>

          <div className="space-y-3">
            {/* Total Spots Sold */}
            <div className="flex items-center gap-3 p-3 bg-white rounded-sm border border-blue-100">
              <div className="w-8 h-8 bg-blue-200 rounded-full"></div>
              <div className="flex flex-col w-full gap-2">
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                <div className="h-3 bg-gray-300 rounded w-1/3"></div>
              </div>
            </div>

            {/* Participation Rate */}
            <div className="flex items-center gap-3 p-3 bg-white rounded-sm border border-blue-100">
              <div className="w-8 h-8 bg-blue-200 rounded-full"></div>
              <div className="flex flex-col w-full gap-2">
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                <div className="h-3 bg-gray-300 rounded w-1/3"></div>
              </div>
            </div>

            {/* User Numbers */}
            <div className="flex items-center gap-3 p-3 bg-white rounded-sm border border-blue-100">
              <div className="w-8 h-8 bg-blue-200 rounded-full"></div>
              <div className="flex flex-col w-full gap-2">
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                <div className="h-3 bg-gray-300 rounded w-1/4"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    </div>
    );
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 px-[15px] md:px-6 py-4 animate-pulse">
        {/* LEFT COLUMN */}
        <div className="space-y-8">
          <div className="relative w-full h-[480px] rounded-sm bg-gray-200 overflow-hidden">
            {/* Image shimmer */}
            <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-[shimmer_2s_infinite]" />

            {/* Title + Status Center */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 space-y-4">
              <div className="h-8 w-48 bg-gray-300 rounded-md" />
              <div className="h-6 w-32 bg-gray-300 rounded-full" />
              {/* Winner Box Skeleton */}
              <div className="mt-4 w-full max-w-md bg-gradient-to-r from-yellow-100 to-yellow-200 p-6 rounded-2xl shadow-md space-y-4">
                <div className="h-10 w-10 bg-yellow-300 rounded-full mx-auto" />
                <div className="h-5 w-32 bg-yellow-300 rounded-md mx-auto" />
                <div className="h-6 w-24 bg-yellow-400 rounded-md mx-auto" />
                <div className="h-4 w-40 bg-yellow-200 rounded-md mx-auto mt-2" />
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-8">
          {/* Raffle Info Skeleton */}
          <div className="bg-white p-6 rounded-sm shadow-sm border border-gray-100">
            <div className="h-6 w-40 bg-blue-200 rounded-md mb-6" />

            {/* 4-column info grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, idx) => (
                <div
                  key={idx}
                  className="relative flex flex-col items-center text-center p-6 rounded-sm bg-[#F1F7FF] border border-blue-100"
                >
                  <div className="p-4 rounded-full bg-blue-100 border border-blue-200 mb-2 w-16 h-16" />
                  <div className="h-4 w-24 bg-blue-200 rounded-md" />
                  <div className="h-3 w-20 bg-blue-100 rounded-md mt-2" />
                </div>
              ))}
            </div>

            {/* Description Skeleton */}
            <div className="mt-6 p-6 rounded-sm bg-blue-200 border border-blue-300">
              <div className="h-4 w-full bg-blue-300 rounded-md mb-2" />
              <div className="h-4 w-3/4 bg-blue-300 rounded-md mb-2" />
              <div className="h-4 w-2/3 bg-blue-300 rounded-md" />
            </div>
          </div>
        </div>
      </div>


      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 px-[15px] md:px-6 py-4 animate-pulse">
      {/* LEFT COLUMN */}
      <div className="space-y-8">
        {/* SIGNATURE SECTION (skeleton) */}
        <div className="bg-white rounded-sm p-4">
          <div className="flex flex-col bg-[#DBEAFE] p-4 sm:flex-row sm:items-center sm:justify-between mb-6 w-full rounded-sm">
            <div className="h-6 w-48 bg-blue-200 rounded"></div>
          </div>
          <div className="mt-4 space-y-3">
            <div className="bg-blue-200 h-20 rounded-sm"></div>
            <div className="h-3 w-3/4 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN */}
      <div className="space-y-8">
        {/* FINAL RESULTS (skeleton) */}
        <div className="bg-white rounded-sm p-4">
          <div className="flex flex-col bg-[#DBEAFE] p-4 sm:flex-row sm:items-center sm:justify-between mb-6 w-full rounded-sm">
            <div className="h-6 w-40 bg-blue-200 rounded"></div>
          </div>

          <div className="space-y-3">
            {/* Total Spots Sold */}
            <div className="flex items-center gap-3 p-3 bg-white rounded-sm border border-blue-100">
              <div className="w-8 h-8 bg-blue-200 rounded-full"></div>
              <div className="flex flex-col w-full gap-2">
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                <div className="h-3 bg-gray-300 rounded w-1/3"></div>
              </div>
            </div>

            {/* Participation Rate */}
            <div className="flex items-center gap-3 p-3 bg-white rounded-sm border border-blue-100">
              <div className="w-8 h-8 bg-blue-200 rounded-full"></div>
              <div className="flex flex-col w-full gap-2">
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                <div className="h-3 bg-gray-300 rounded w-1/3"></div>
              </div>
            </div>

            {/* User Numbers */}
            <div className="flex items-center gap-3 p-3 bg-white rounded-sm border border-blue-100">
              <div className="w-8 h-8 bg-blue-200 rounded-full"></div>
              <div className="flex flex-col w-full gap-2">
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                <div className="h-3 bg-gray-300 rounded w-1/4"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    </div>
  );
}

export default RazzleDetailsPage;

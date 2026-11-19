import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Clock, Users, MapPin, Calendar, Trophy, Star, ArrowLeft, Home, Lock, User, Crown, Shield, AlertTriangle, CheckCircle, Info, Play, CirclePlus } from 'lucide-react';
import { joinRazzleSpot, exitRazzleSpot, getRaffleReservationStatus, lockRaffleReservationsThunk, toggleRaffleLockStatus } from '../store/raffle/thunks';
import { setIsLocked, updateBookedNumbers, releaseBookedNumbers } from '../store/raffle/slice';
import { fetchUserProfile } from '../store/user/thunks';
import { startRaffleDraw } from '../services/raffleService';
import Pusher from 'pusher-js';
import { getCookie } from '../utils/cookieUtils';

const RazzleWidget = ({ slug, initialRazzle, initialReservationStatus, token }) => {
  const navigate = useNavigate();
  const [razzle, setRazzle] = useState(initialRazzle);

  // Keep local razzle state in sync with prop changes (especially lock state)
  useEffect(() => {
    setRazzle(initialRazzle);
  }, [initialRazzle]);
  const dispatch = useDispatch();
  // Always use Redux state for reservationStatus to ensure UI updates when state changes
  const reservationStatus = useSelector(state => state.raffles.raffleReservationStatus);
  const isGloballyLocked = useSelector(state => state.raffles.isLocked);
  const [timeLeft, setTimeLeft] = useState(initialRazzle.timeLeft);
  const [selectedSpots, setSelectedSpots] = useState([]);
  // Use real user from Redux
  const currentUser = useSelector(state => state.user.user);
  
  // Pusher integration
  useEffect(() => {
    const token = getCookie('access_token');
    if (!token || !slug) return;

    // Initialize Pusher with error handling
    const pusher = new Pusher('25ab9fa93f482c55e10b', {
      cluster: 'ap2',
      authEndpoint: 'https://anushaweb.com/razzlr/public/broadcasting/auth',
      auth: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      },
      enabledTransports: ['ws', 'wss'],
      disabledTransports: []
    });

    // Add connection event handlers
    pusher.connection.bind('connecting', () => {
      console.log('Pusher: Connecting...');
    });

    pusher.connection.bind('connected', () => {
      console.log('Pusher: Connected successfully');
    });

    pusher.connection.bind('disconnected', () => {
      console.log('Pusher: Disconnected');
    });

    pusher.connection.bind('failed', () => {
      console.error('Pusher: Connection failed');
    });

    pusher.connection.bind('error', (error) => {
      console.error('Pusher connection error:', error);
    });

    // Subscribe to private channel with error handling
    const channel = pusher.subscribe(`private-raffle.${slug}`);

    channel.bind('pusher:subscription_succeeded', () => {
      console.log('Successfully subscribed to channel:', `private-raffle.${slug}`);
    });

    channel.bind('pusher:subscription_error', (error) => {
      console.error('Subscription error:', error);
    });

    // Event listeners
    channel.bind('reservation.updated', (data) => {
      console.log('Reservation updated:', data);
      
      // Update Redux store with new reservation data
      if (data && data.reserved && Array.isArray(data.reserved)) {
        console.log('Updating booked_numbers with:', data.reserved);
        
        // Dispatch action to update the reservation status in store
        dispatch(updateBookedNumbers(data.reserved));
      }
    });

    channel.bind('reservation.released', (data) => {
      console.log('Reservation released:', data);
      
      if (data && data.raffle_slug && data.released_numbers) {
        // Dispatch action to release booked numbers and update vacant numbers
        dispatch(releaseBookedNumbers({
          raffle_slug: data.raffle_slug,
          released_numbers: data.released_numbers
        }));
      }
    });

    channel.bind('raffle.locktoggled', (data) => {
      console.log('Raffle lock toggled:', data);
    });

    channel.bind('draw.started', (data) => {
      console.log('Draw started:', data);
    });

    channel.bind('draw.ended', (data) => {
      console.log('Draw ended:', data);
    });

    channel.bind('reservation.lockstatus', (data) => {
      console.log('Reservation lock status:', data);
    });

    // Cleanup on unmount
    return () => {
      channel.unbind_all();
      pusher.unsubscribe(`private-raffle.${slug}`);
      pusher.disconnect();
    };
  }, [slug]);

  // Fetch user profile if not loaded
  useEffect(() => {
    if (!currentUser) {
      dispatch(fetchUserProfile());
    }
  }, [currentUser, dispatch]);

  // Check for locked state from multiple sources
  useEffect(() => {
    // Check if razzle or reservationStatus contains is_locked property
    const raffleIsLocked = razzle?.is_locked || initialRazzle?.is_locked;
    const currentReservationStatus = reservationStatus || initialReservationStatus;
    const reservationIsLocked = currentReservationStatus?.is_locked;
    
    if (raffleIsLocked || reservationIsLocked) {
      dispatch(setIsLocked(true));
    } else {
      dispatch(setIsLocked(false));
    }
  }, [razzle, reservationStatus, initialRazzle, initialReservationStatus, dispatch]);
  const [pendingSpots, setPendingSpots] = useState(new Set()); // Track spots being processed
  const [lockingSpots, setLockingSpots] = useState(new Set()); // Track spots being locked/unlocked
  const [isLockingAll, setIsLockingAll] = useState(false); // Track bulk lock/unlock operation
  const [isTogglingLock, setIsTogglingLock] = useState(false); // Track global lock/unlock
  const [isStartingDraw, setIsStartingDraw] = useState(false); // Track draw start
  const [lockStatusMessage, setLockStatusMessage] = useState('');

  // Check if current user is host
  const isHost = currentUser && razzle && (
    currentUser.user_slug === razzle.host.host_slug
  );

  // Handle global lock/unlock razzle
  const handleToggleLock = async () => {
    if (!isHost || isTogglingLock) return;
    setIsTogglingLock(true);
    try {
      const result = await dispatch(toggleRaffleLockStatus(razzle.slug)).unwrap();
      const message = result.is_locked ? 'Razzle locked successfully!' : 'Razzle unlocked successfully!';
      setLockStatusMessage(message);
      setTimeout(() => setLockStatusMessage(''), 3000);
    } catch (error) {
      setLockStatusMessage('Failed to update lock status');
      setTimeout(() => setLockStatusMessage(''), 3000);
    } finally {
      setIsTogglingLock(false);
    }
  };

  // Handle start draw
  const handleStartDraw = async () => {
    if (!isHost || isStartingDraw) return;
    setIsStartingDraw(true);
    try {
      const result = await startRaffleDraw(razzle.slug);
      setLockStatusMessage('Draw started successfully!');
      setTimeout(() => setLockStatusMessage(''), 3000);
      console.log('Start draw result:', result);
    } catch (error) {
      setLockStatusMessage('Failed to start draw');
      setTimeout(() => setLockStatusMessage(''), 3000);
      console.error('Error starting draw:', error);
    } finally {
      setIsStartingDraw(false);
    }
  };

  // Handle individual spot lock/unlock
  const handleSpotLock = async (spotNumber) => {
    if (!isHost || lockingSpots.has(spotNumber)) return;
    
    // Use Redux state if available, otherwise fall back to initial data
    const currentReservationStatus = reservationStatus || initialReservationStatus;
    
    const isCurrentlyLocked = currentReservationStatus && Array.isArray(currentReservationStatus.locked_numbers) && 
                             currentReservationStatus.locked_numbers.includes(spotNumber);
    
    setLockingSpots(prev => new Set([...prev, spotNumber]));
    
    try {
      await dispatch(lockRaffleReservationsThunk({
        slug: razzle.slug,
        spots: [spotNumber],
        lock: !isCurrentlyLocked
      })).unwrap();
    } catch (error) {
      console.error('Failed to lock/unlock spot:', error);
    } finally {
      setLockingSpots(prev => {
        const newSet = new Set(prev);
        newSet.delete(spotNumber);
        return newSet;
      });
    }
  };

  // Handle player lock/unlock (all spots of a player)
  const handlePlayerLock = async (playerSpots) => {
    if (!isHost || playerSpots.length === 0) return;
    
    // Use Redux state if available, otherwise fall back to initial data
    const currentReservationStatus = reservationStatus || initialReservationStatus;
    
    const allLocked = playerSpots.every(spot => 
      currentReservationStatus && Array.isArray(currentReservationStatus.locked_numbers) && 
      currentReservationStatus.locked_numbers.includes(spot)
    );
    
    // Set all player spots as pending
    setLockingSpots(prev => new Set([...prev, ...playerSpots]));
    
    try {
      await dispatch(lockRaffleReservationsThunk({
        slug: razzle.slug,
        spots: playerSpots,
        lock: !allLocked
      })).unwrap();
    } catch (error) {
      console.error('Failed to lock/unlock player spots:', error);
    } finally {
      setLockingSpots(prev => {
        const newSet = new Set(prev);
        playerSpots.forEach(spot => newSet.delete(spot));
        return newSet;
      });
    }
  };

  // Handle bulk lock/unlock all booked spots
  const handleBulkLock = async () => {
    if (!isHost || isLockingAll) return;
    
    // Use Redux state if available, otherwise fall back to initial data
    const currentReservationStatus = reservationStatus || initialReservationStatus;
    
    const bookedSpots = currentReservationStatus && Array.isArray(currentReservationStatus.booked_numbers) 
      ? currentReservationStatus.booked_numbers.map(b => b.spot_number) 
      : [];
    
    if (bookedSpots.length === 0) return;
    
    const allLocked = bookedSpots.every(spot => 
      currentReservationStatus && Array.isArray(currentReservationStatus.locked_numbers) && 
      currentReservationStatus.locked_numbers.includes(spot)
    );
    
    setIsLockingAll(true);
    setLockingSpots(prev => new Set([...prev, ...bookedSpots]));
    
    try {
      await dispatch(lockRaffleReservationsThunk({
        slug: razzle.slug,
        spots: bookedSpots,
        lock: !allLocked
      })).unwrap();
    } catch (error) {
      console.error('Failed to bulk lock/unlock spots:', error);
    } finally {
      setIsLockingAll(false);
      setLockingSpots(prev => {
        const newSet = new Set(prev);
        bookedSpots.forEach(spot => newSet.delete(spot));
        return newSet;
      });
    }
  };

  // Calculate time left
  const calculateTimeLeft = (startsAt) => {
    const now = new Date();
    const startDate = new Date(startsAt);
    const timeDiff = startDate.getTime() - now.getTime();

    if (timeDiff <= 0) {
      return { timeLeft: '0H 0M', minutesLeft: '0M', secondsLeft: '0S' };
    }

    const daysLeft = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    const hoursLeft = Math.floor(
      (timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
    );
    const minutesLeft = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
    const secondsLeft = Math.floor((timeDiff % (1000 * 60)) / 1000);

    const timeLeftStr = daysLeft > 0
      ? `${daysLeft}D ${hoursLeft}H`
      : `${hoursLeft}H ${minutesLeft}M`;

    return {
      timeLeft: timeLeftStr,
      minutesLeft: `${minutesLeft}M`,
      secondsLeft: `${secondsLeft}S`,
    };
  };

  // Update timer every second
  useEffect(() => {
    const timer = setInterval(() => {
      const newTime = calculateTimeLeft(razzle.starts_at);
      setTimeLeft(newTime.timeLeft);
    }, 1000);
    return () => clearInterval(timer);
  }, [razzle.starts_at]);


  // No need for useEffect: currentUser comes from Redux

  const handleSpotSelection = async (spotNumber) => {
    // If globally locked, prevent any spot interaction
    if (isGloballyLocked) return;
    
    // Use Redux state if available, otherwise fall back to initial data
    const currentReservationStatus = reservationStatus || initialReservationStatus;
    
    // Build booked map for quick lookup from current state
    const bookedMap = new Map();
    if (currentReservationStatus && Array.isArray(currentReservationStatus.booked_numbers)) {
      currentReservationStatus.booked_numbers.forEach(b => bookedMap.set(b.spot_number, b));
    }
    const bookedInfo = bookedMap.get(spotNumber);
    const userSlug = currentUser?.slug || currentUser?.user_slug;
    const isBooked = bookedMap.has(spotNumber);
    const bookedUserSlug = bookedInfo?.user_slug;
    const isBookedByCurrentUser = isBooked && bookedUserSlug && userSlug && String(bookedUserSlug) === String(userSlug);
    const isLocked = currentReservationStatus && Array.isArray(currentReservationStatus.locked_numbers) && currentReservationStatus.locked_numbers.includes(spotNumber);
    const isPending = pendingSpots.has(spotNumber);
    if (isLocked || razzle.drawn_number || isPending) return;

    // If spot is booked by current user, allow release
    if (isBookedByCurrentUser) {
      setPendingSpots(prev => new Set([...prev, spotNumber]));
      try {
        await dispatch(exitRazzleSpot({ slug: razzle.slug, spotNumber }));
      } finally {
        setPendingSpots(prev => {
          const newSet = new Set(prev);
          newSet.delete(spotNumber);
          return newSet;
        });
      }
      return;
    }
    // If spot is booked by someone else, do nothing
    if (isBooked) return;
    // Otherwise, try to book
    setPendingSpots(prev => new Set([...prev, spotNumber]));
    try {
      await dispatch(joinRazzleSpot({ slug: razzle.slug, spotNumber, user: currentUser }));
    } finally {
      setPendingSpots(prev => {
        const newSet = new Set(prev);
        newSet.delete(spotNumber);
        return newSet;
      });
    }
  };



  const renderSpotGrid = () => {
    // Use Redux state if available, otherwise fall back to initial data
    const currentReservationStatus = reservationStatus || initialReservationStatus;
    
    // Defensive: fallback to razzle.spots_count if reservationStatus.data.total_spots is missing
    let totalSpots = razzle && razzle.spots_count;
    if (currentReservationStatus && currentReservationStatus.data && currentReservationStatus.data.total_spots) {
      totalSpots = currentReservationStatus.data.total_spots;
    }
    if (!totalSpots) return null;

  const booked_numbers = currentReservationStatus && Array.isArray(currentReservationStatus.booked_numbers) ? currentReservationStatus.booked_numbers : [];
  const vacant_numbers = currentReservationStatus && Array.isArray(currentReservationStatus.vacant_numbers) ? currentReservationStatus.vacant_numbers : [];
  // locked_numbers is now a simple array of numbers: [1,2,3]
  const locked_numbers = currentReservationStatus && Array.isArray(currentReservationStatus.locked_numbers) ? currentReservationStatus.locked_numbers : [];

  // Build lookup maps for booked spots only
  const bookedMap = new Map();
  booked_numbers.forEach(b => bookedMap.set(b.spot_number, b));
  const vacantSet = new Set(vacant_numbers);

    const spots = [];

    for (let i = 1; i <= totalSpots; i++) {
  const isBooked = bookedMap.has(i);
  const isVacant = vacantSet.has(i);
  // locked_numbers is now a simple array of numbers
  const isLocked = locked_numbers.includes(i);
      const isSelected = selectedSpots.includes(i);
      const isWinning = razzle.drawn_number === i;
      const bookedInfo = bookedMap.get(i);
      // Fix: define isBookedByCurrentUser for each spot
      // Use user_slug from user slice for robust comparison (handle refresh)
      const userSlug = currentUser?.slug || currentUser?.user_slug;
      const isBookedByCurrentUser = bookedInfo && userSlug && bookedInfo.user_slug === userSlug;
      // No special logic for house spot
      const isHouseSpot = false;
      const isPending = pendingSpots.has(i);

      // Determine spot styling based on state
      let spotStyles = {
        border: '',
        background: '',
        icon: null,
        content: i,
        tooltip: ''
      };

      if (isWinning) {
        spotStyles.border = 'border-1 border-yellow-400 ring-4 ring-yellow-200 animate-pulse';
        spotStyles.background = 'bg-gradient-to-br from-yellow-300 to-yellow-500';
        spotStyles.icon = <Crown className="w-5 h-5 text-yellow-800" />;
        spotStyles.tooltip = 'Winner!';
      } else if (isPending) {
        spotStyles.border = 'border-1 border-orange-400 ring-2 ring-orange-200';
        spotStyles.background = 'bg-gradient-to-br from-orange-100 to-orange-200';
        spotStyles.content = (
          <div className="animate-spin">
            <div className="w-4 h-4 border-2 border-orange-600 border-t-transparent rounded-full"></div>
          </div>
        );
        spotStyles.tooltip = 'Processing...';
      } else if (isBooked && bookedInfo && bookedInfo.user_avatar) {
        spotStyles.border = 'border-1 border-blue-500 ring-2 ring-blue-100';
        spotStyles.background = '';
        spotStyles.content = (
          <img
            src={bookedInfo.user_avatar}
            alt={bookedInfo.user_name || 'Booked'}
            className="w-full h-full rounded-full object-cover"
          />
        );
        spotStyles.tooltip = bookedInfo.user_name || 'Booked';
      } else if (isBooked) {
        spotStyles.border = 'border-1 border-blue-500 ring-2 ring-blue-100';
        spotStyles.background = 'bg-gradient-to-br from-blue-50 to-blue-100';
        spotStyles.icon = <User className="w-4 h-4 text-blue-600" />;
        spotStyles.tooltip = bookedInfo?.user_name || 'Booked';
      } else if (isSelected) {
        spotStyles.border = 'border-1 border-purple-500 ring-4 ring-purple-200';
        spotStyles.background = 'bg-gradient-to-br from-purple-500 to-purple-600 text-white';
        spotStyles.tooltip = 'Selected';
      } else if (isLocked) {
        spotStyles.border = 'border-1 border-gray-400';
        spotStyles.background = 'bg-gradient-to-br from-gray-100 to-gray-200';
        spotStyles.tooltip = 'Locked';
      } else {
        // Available spot
        spotStyles.border = 'border-1 border-blue-400 hover:border-blue-600 hover:ring-2 hover:ring-blue-100';
        spotStyles.background = 'bg-gradient-to-br from-white to-gray-50 hover:from-blue-50 hover:to-blue-100';
        spotStyles.tooltip = 'Available';
      }

      spots.push(
        <div key={i} className="relative group">
          <button
            onClick={() => handleSpotSelection(i)}
            // Only disable if booked by someone else, locked, drawn, pending, or globally locked
            disabled={(
              (isBooked && !isBookedByCurrentUser) ||
              isLocked ||
              razzle.drawn_number ||
              isPending ||
              isGloballyLocked
            )}
            className={`
              relative w-20 h-20 rounded-full font-bold text-lg 
              transition-all duration-300 ease-in-out
              flex items-center justify-center group
              transform hover:scale-105 active:scale-95
              shadow-lg hover:shadow-xl
              ${spotStyles.border}
              ${spotStyles.background}
              ${(isBooked && !isBookedByCurrentUser) || isLocked || razzle.drawn_number || isPending || isGloballyLocked ? 'cursor-not-allowed' : 'cursor-pointer'}
              ${isWinning ? 'scale-110 z-10' : ''}
              ${isGloballyLocked ? 'opacity-60' : ''}
            `}
          >
            {/* Main content */}
            <div className="flex flex-col items-center justify-center relative z-10">
              {spotStyles.icon && (
                <div className="absolute -top-1 -right-1 bg-white rounded-full p-1 shadow-sm">
                  {spotStyles.icon}
                </div>
              )}
              {typeof spotStyles.content === 'number' ? (
                <span className="font-normal text-lg text-blue-600">{spotStyles.content}</span>
              ) : (
                spotStyles.content
              )}
            </div>

            {/* Booked overlay */}
            {isBooked && !isWinning && !isHouseSpot && (
              <div className="absolute inset-0 rounded-full z-20 pointer-events-none" style={{ background: 'rgba(0,0,0,0.2)' }}></div>
            )}

            {/* Locked overlay */}
            {isLocked && (
              <>
                {/* Overlay on top of image/content */}
                <div className="absolute inset-0 bg-blue-600 rounded-full z-30" style={{ opacity: 0.4 }}></div>
                {/* Lock icon centered above overlay */}
                <div className="absolute inset-0 flex items-center justify-center z-40 pointer-events-none">
                  <Lock className="w-4.5 h-4.5 text-white drop-shadow-lg" />
                </div>
              </>
            )}

            {/* Hover effect for available spots */}
            {!isBooked && !isLocked && !razzle.drawn_number && !isPending && !isGloballyLocked && (
              <div className="absolute inset-0 rounded-full bg-green-400 opacity-0 group-hover:opacity-10 transition-opacity duration-200"></div>
            )}

            {/* Global locked overlay */}
            {isGloballyLocked && (
              <div className="absolute inset-0 bg-gradient-to-br from-red-500/20 to-red-600/30 rounded-full flex items-center justify-center z-40">
                <Shield className="w-4 h-4 text-red-600" />
              </div>
            )}
          </button>

          {/* Enhanced tooltip */}
          <div className="absolute z-30 left-1/2 transform -translate-x-1/2 -top-12 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
            <div className="bg-blue-600 text-white text-xs rounded-sm px-3 py-2 shadow-lg whitespace-nowrap">
              <div className="font-medium">
                {isWinning ? '🏆 Winner!' : 
                 isPending ? '⏳ Processing...' :
                 isGloballyLocked ? '🔒 Razzle Locked' :
                 isHouseSpot ? '🏠 House Spot' :
                 spotStyles.tooltip}
              </div>
              <div className="text-gray-300 text-xs">
                Spot #{i}
                {isGloballyLocked && (
                  <div className="text-red-300 text-xs mt-1">
                    Temporarily unavailable
                  </div>
                )}
              </div>
              {/* Tooltip arrow */}
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-blue-600"></div>
            </div>
          </div>
        </div>
      );
    }
    return spots;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
    <div className="px-[15px] md:px-6 py-4">
        <div className="grid lg:grid-cols-2 gap-8">
            {/* Left Column - Razzle Image & Info */}
            <div className="space-y-6">
                <div className="relative w-full h-[480px] rounded-sm bg-gradient-to-r from-green-500 to-green-700 text-white shadow-lg overflow-hidden">
                    {razzle.imageUrl || razzle.raffle_image ? (
                    <img
                    src={razzle.imageUrl || razzle.raffle_image}
                    alt={razzle.title}
                    className="absolute inset-0 w-full h-full object-cover"
                    />
                    ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-green-100 to-green-200">
                        <div className="text-center">
                            <div className="text-6xl mb-4">🎁</div>
                            <p className="text-gray-700 font-medium">No Image Available</p>
                        </div>
                    </div>
                    )}
                    {/* Dark overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent"></div>
                    {/* Winner badge (top-left) */}
                    {razzle.drawn_number && (
                    <div className="absolute top-6 left-6">
                        <div className="bg-yellow-400 text-black px-4 py-2 rounded-full font-bold shadow-lg">
                            🏆 Winner: #{razzle.drawn_number}
                        </div>
                    </div>
                    )}
                    {/* Type badge (top-right) */}
                    <div className="absolute top-6 right-6">
                        <span
                        className={`px-4 py-2 rounded-sm text-sm font-semibold shadow-lg ${
                        razzle.type === "fixed"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-blue-100 text-blue-700"
                        }`}
                        >
                        {razzle.type === "fixed" ? "Fixed Razzle" : "Open Razzle"}
                        </span>
                    </div>
                    {/* Title + Status Centered */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 space-y-6">
                        <h1 className="text-3xl md:text-4xl font-extrabold drop-shadow-lg">
                            {razzle.title}
                        </h1>
                        {razzle.status && (
                        <div className="bg-white/20 px-6 py-2 rounded-full font-medium flex items-center gap-2 text-base">
                            <CheckCircle className="w-4 h-4" />
                            {razzle.status.charAt(0).toUpperCase() + razzle.status.slice(1)}
                        </div>
                        )}
                        {razzle.host_name && (
                        <p className="mt-2 bg-white/20 px-6 py-2 rounded-full font-medium flex items-center gap-2 text-base">
                            <User className="w-4 h-4" />
                            Hosted by {razzle.host_name}
                        </p>
                        )}
                    </div>
                </div>
            </div>
            {/* Right Column - Razzle Details */}
            <div className="space-y-6">
                {/* Basic Info */}
                <div className="">
                    {/* Title */}
                    <h1 className="text-xl font-semibold text-blue-600 mb-6 flex items-center gap-2">
                        <Info className="w-5 h-5 text-blue-600" />
                        {razzle.title}
                    </h1>
                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                        {[
                        {
                        icon: CheckCircle,
                        label: "Status",
                        value: razzle.status || "Completed",
                        color: "text-blue-600",
                        bg: "bg-blue-100",
                        },
                        {
                        icon: Users,
                        label: "Participants",
                        value: `${(() => {
                          const currentReservationStatus = reservationStatus || initialReservationStatus;
                          return (currentReservationStatus?.booked_numbers || []).length;
                        })()} / ${razzle.spots_count}`,
                        color: "text-blue-600",
                        bg: "bg-blue-100",
                        },
                        {
                        icon: Calendar,
                        label: "Draw Date",
                        value: razzle.starts_at ? new Date(razzle.starts_at).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: true
                        }) : razzle.startDate || "TBA",
                        color: "text-blue-600",
                        bg: "bg-blue-100",
                        },
                        {
                        icon: Star,
                        label: "Host",
                        value: razzle.host_name || razzle.host?.name || razzle.host?.host_name || "Unknown Host",
                        color: "text-blue-600",
                        bg: "bg-blue-100",
                        },
                        ].map(({ icon: Icon, label, value, color, bg }, idx) => (
                        <div
                            key={idx}
                            className="relative group flex flex-col items-center text-center p-4 rounded-sm bg-[#F1F7FF] border border-blue-100 hover:shadow-md transition-shadow duration-200"
                            >
                            {/* Icon wrapper */}
                            <div className={`p-4 rounded-full border border-blue-100 ${bg}`}>
                            <Icon className={`h-10 w-10 ${color}`} />
                        </div>
                        {/* Tooltip */}
                        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 hidden group-hover:flex flex-col items-center">
                            <div className="px-4 py-2 rounded-sm bg-blue-600 text-white text-xs shadow-lg whitespace-nowrap">
                                <p className="capitalize">{label}</p>
                                <p className="font-bold capitalize">{value}</p>
                            </div>
                            {/* Tooltip Arrow */}
                            <div className="w-4 h-4 bg-blue-600 rotate-45 -mt-2"></div>
                        </div>
                    </div>
                    ))}
                </div>
                {/* Description */}
                <div className="mt-4 flex items-center gap-4 p-4 rounded-sm bg-blue-600 text-white border border-gray-100 shadow-sm hover:shadow-lg transition-shadow duration-300">
                    <p className="text-white leading-relaxed">{razzle.description}</p>
                </div>
            </div>
            {/* Progress Bar above Choose Your Spots */}
            {(() => {
            // Use Redux state if available, otherwise fall back to initial data
            const currentReservationStatus = reservationStatus || initialReservationStatus;
            let totalSpots = razzle?.spots_count;
            if (currentReservationStatus?.data?.total_spots) {
            totalSpots = currentReservationStatus.data.total_spots;
            }
            const booked_numbers = Array.isArray(currentReservationStatus?.booked_numbers)
            ? currentReservationStatus.booked_numbers
            : [];
            const filledCount = booked_numbers.length;
            const percent =
            totalSpots && totalSpots > 0
            ? Math.round((filledCount / totalSpots) * 100)
            : 0;
            return (
            <div className="flex items-center gap-4 p-4 rounded-sm bg-white border border-gray-100 shadow-sm hover:shadow-lg transition-shadow duration-300">
                {/* Icon Circle */}
                <div className="flex-shrink-0 p-3 rounded-full bg-black/10 hover:bg-black/20 transition-colors duration-300 flex items-center justify-center relative z-10">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6 text-blue-600"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        >
                        <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-10.293a1 1 0 00-1.414-1.414L9 9.586 
                            7.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                            />
                    </svg>
                    {/* Glow effect */}
                    <span className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 opacity-10 blur-xl animate-pulse"></span>
                </div>
                {/* Progress Details */}
                <div className="flex-1">
                    <p className="text-sm text-gray-600 font-medium mb-1">Progress</p>
                    <div className="flex justify-between text-sm mb-2 font-semibold">
                        <span className="text-gray-700">{filledCount} / {totalSpots}</span>
                        <span className="text-blue-600">{percent}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                        <div
                        className="bg-blue-600 h-3 rounded-full transition-all duration-700 ease-in-out"
                        style={{ width: `${percent}%` }}
                        />
                    </div>
                </div>
            </div>
            );
            })()}
        </div>
    </div>
</div>
<div className="px-[15px] md:px-6 py-4">
    <div className="grid lg:grid-cols-2 gap-8">
        {/* Left Column - Razzle Image & Info */}
        <div className="space-y-6">
            {/* Spots Grid */}
            <div className="relative rounded-sm overflow-hidden">
                {/* Top bar with Lock/Unlock Razzle button and title */}
                <div className="flex flex-col bg-[#DBEAFE] p-4 sm:flex-row sm:items-center sm:justify-between mb-6 w-full rounded-sm">
                    {/* Title */}
                    <h3 className="text-lg font-semibold text-blue-600 flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-blue-600" />
                        Choose Your Spots
                    </h3>
                    {/* Right side controls */}
                    <div className="flex items-center gap-3 mt-3 sm:mt-0">
                        {/* Selected Spots pill */}
                        {selectedSpots.length > 0 && !isGloballyLocked && (
                        <span className="px-3 py-1 rounded-sm text-sm font-medium bg-blue-50 text-blue-700 border border-blue-200 shadow-sm">
                        {selectedSpots.length} selected
                        </span>
                        )}
                        {/* Host Lock/Unlock Button */}
                        {isHost && (
                        <button
                        onClick={handleToggleLock}
                        disabled={isTogglingLock}
                        className={`
                        inline-flex items-center gap-2 px-4 py-2 rounded-sm font-medium text-sm transition-all duration-200
                        border shadow-sm
                        ${isGloballyLocked
                        ? "bg-green-50 hover:bg-green-100 text-green-700 border-green-300"
                        : "bg-red-50 hover:bg-red-100 text-red-700 border-red-300"}
                        ${isTogglingLock ? "opacity-50 cursor-not-allowed" : "hover:shadow-md"}
                        focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500
                        `}
                        title={isGloballyLocked ? "Unlock Razzle" : "Lock Razzle"}
                        >
                        {isTogglingLock ? (
                        <>
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            <span>Processing...</span>
                            </>
                            ) : isGloballyLocked ? (
                            <>
                            <Shield className="w-4 h-4" />
                            <span>Unlock</span>
                            </>
                            ) : (
                            <>
                            <Lock className="w-4 h-4" />
                            <span>Lock</span>
                            </>
                            )}
                            </button>
                            )}
                            {/* Host Start Draw Button */}
                            {isHost && (
                            <button
                            onClick={handleStartDraw}
                            disabled={isStartingDraw}
                            className={`
                            inline-flex items-center gap-2 px-4 py-2 rounded-sm font-medium text-sm transition-all duration-200
                            border shadow-sm bg-blue-50 hover:bg-blue-100 text-blue-600 border-blue-300
                            ${isStartingDraw ? "opacity-50 cursor-not-allowed" : "hover:shadow-md"}
                            focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500
                            `}
                            title="Start Draw"
                            >
                            {isStartingDraw ? (
                            <>
                            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                <span>Starting...</span>
                                </>
                                ) : (
                                <>
                                <Play className="w-4 h-4" />
                                <span>Start Draw</span>
                                </>
                                )}
                                </button>
                                )}
                            </div>
                            {/* Lock Status Toast */}
                            {lockStatusMessage && (
                            <div className="fixed top-20 right-4 z-50 w-full max-w-xs sm:max-w-sm animate-fade-in">
                                <div className="flex items-center gap-3 px-4 py-3 bg-white border border-gray-200 rounded-sm shadow-lg">
                                    <div
                                    className={`w-2.5 h-2.5 rounded-full ${
                                    lockStatusMessage.includes("successfully") ? "bg-green-500" : "bg-red-500"
                                    }`}
                                    />
                                    <span className="text-sm font-medium text-gray-800 truncate">
                                    {lockStatusMessage}
                                    </span>
                                </div>
                            </div>
                            )}
                        </div>
                        {/* Global Lock Warning */}
                        {isGloballyLocked && (
                        <div className="mb-6 rounded-sm border border-red-200 bg-gradient-to-r from-red-50 to-orange-50 shadow-sm p-5">
                            <div className="flex items-start gap-4">
                                {/* Icon */}
                                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-red-100 shadow-inner">
                                    <AlertTriangle className="w-5 h-5 text-red-600" />
                                </div>
                                {/* Text */}
                                <div className="flex-1">
                                    <h4 className="text-red-800 font-semibold text-base mb-1">
                                        Razzle is Locked
                                    </h4>
                                    <p className="text-red-700 text-sm leading-relaxed">
                                        Spot selection is currently disabled by the host.  
                                        Please check back later or contact support for more details.
                                    </p>
                                </div>
                            </div>
                        </div>
                        )}
                        <div className="w-full flex justify-center relative">
                            <div
                            className={`grid grid-cols-3 md:grid-cols-6 gap-4 px-[15px] py-4 bg-white/80 rounded-sm border border-blue-600 w-full max-w-full transition-all duration-300 
                            ${isGloballyLocked ? 'filter grayscale contrast-75' : ''} place-items-center`}
                            >
                            {renderSpotGrid()}
                        </div>
                        {/* Global Lock Overlay */}
                        {isGloballyLocked && (
                        <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-red-600/20 rounded-sm flex items-center justify-center z-30 backdrop-blur-[1px]">
                            <div className="bg-white/90 backdrop-blur-sm rounded-sm p-4 shadow-sm border border-red-200 max-w-sm mx-4">
                                <div className="text-center">
                                    <div className="bg-red-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                                        <Shield className="w-8 h-8 text-red-600" />
                                    </div>
                                    <h3 className="text-lg font-bold text-red-800 mb-2">
                                        Spots Locked
                                    </h3>
                                    <p className="text-red-600 text-sm">
                                        This razzle is temporarily unavailable for new entries
                                    </p>
                                </div>
                            </div>
                        </div>
                        )}
                    </div>
                </div>
            </div>
            {/* Right Column - Spot Selection */}
            <div className="space-y-6">
                {/* Players Module */}
                {(() => {
                // Use Redux state if available, otherwise fall back to initial data
                const currentReservationStatus = reservationStatus || initialReservationStatus;
                // Build players data from booked spots
                const booked_numbers = currentReservationStatus && Array.isArray(currentReservationStatus.booked_numbers) ? currentReservationStatus.booked_numbers : [];
                const playersMap = new Map();
                booked_numbers.forEach(booking => {
                const key = booking.user_slug;
                if (!playersMap.has(key)) {
                playersMap.set(key, {
                user_slug: booking.user_slug,
                user_name: booking.user_name,
                user_avatar: booking.user_avatar,
                spots: []
                });
                }
                playersMap.get(key).spots.push(booking.spot_number);
                });
                const players = Array.from(playersMap.values()).sort((a, b) => a.user_name?.localeCompare(b.user_name) || 0);
                if (players.length === 0) return null;
                return (
                <div className="rounded-sm">
                    {/* Header */}
                    <div className="flex flex-col bg-[#DBEAFE] p-4 sm:flex-row sm:items-center sm:justify-between mb-6 w-full rounded-sm">
                        <div className="flex items-center gap-3">
                            <h3 className="text-lg font-semibold text-blue-600 flex items-center gap-2">
                                <Users className="w-5 h-5 text-blue-600" />
                                Players
                            </h3>
                            <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium shadow-sm">
                            {players.length}
                            </span>
                        </div>
                        <div className="flex items-center gap-3">
                            {/* Bulk Lock/Unlock Button - Only for hosts */}
                            {isHost && booked_numbers.length > 0 && (
                            <button
                            onClick={handleBulkLock}
                            disabled={isLockingAll}
                            className={`
                            inline-flex items-center gap-2 px-4 py-2 rounded-sm font-medium text-sm transition-all duration-200 border shadow-sm
                            ${(() => {
                            const allLocked = booked_numbers.every(booking =>
                            currentReservationStatus &&
                            Array.isArray(currentReservationStatus.locked_numbers) &&
                            currentReservationStatus.locked_numbers.includes(booking.spot_number)
                            );
                            return allLocked
                            ? 'bg-green-600 hover:bg-green-700 text-white'
                            : 'bg-red-50 hover:bg-red-100 text-red-700 border-red-300';
                            })()}
                            ${isLockingAll ? 'cursor-not-allowed' : 'hover:scale-100'}
                            `}
                            >
                            {isLockingAll ? (
                            <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                <span>Processing...</span>
                                </>
                                ) : (() => {
                                const allLocked = booked_numbers.every(booking =>
                                currentReservationStatus &&
                                Array.isArray(currentReservationStatus.locked_numbers) &&
                                currentReservationStatus.locked_numbers.includes(booking.spot_number)
                                );
                                return allLocked ? (
                                <>
                                <Shield className="w-4 h-4" />
                                <span>Unlock All</span>
                                </>
                                ) : (
                                <>
                                <Lock className="w-4 h-4" />
                                <span>Lock All</span>
                                </>
                                );
                                })()}
                                </button>
                                )}
                            </div>
                        </div>
                        {/* Players List */}
                        <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
                            {players.map((player) => {
                            const playerAllLocked = player.spots.every(spot =>
                            currentReservationStatus &&
                            Array.isArray(currentReservationStatus.locked_numbers) &&
                            currentReservationStatus.locked_numbers.includes(spot)
                            );
                            const playerAnyLocking = player.spots.some(spot => lockingSpots.has(spot));
                            return (
                            <div
                                key={player.user_slug}
                                className="flex flex-col md:flex-row items-center md:items-stretch justify-between gap-3 p-4 bg-white border border-blue-600 rounded-sm duration-300"
                                >
                                {/* Player Info */}
                                <div className="flex items-center gap-4 flex-shrink-0 min-w-0 md:max-w-xs w-full">
                                    <div className="relative">
                                        {player.user_avatar ? (
                                        <img
                                        src={player.user_avatar}
                                        alt={player.user_name || 'Player'}
                                        className="w-14 h-14 rounded-full object-cover border-1 border-blue-600"
                                        />
                                        ) : (
                                        <div className="w-14 h-14 rounded-full bg-blue-600 border-1 border-blue-600 flex items-center justify-center shadow-sm">
                                            <User className="w-7 h-7 text-blue-600" />
                                        </div>
                                        )}
                                        {/* Lock/Unlock Player Button */}
                                        <div className="absolute -bottom-1 -right-1">
                                            {isHost ? (
                                            <button
                                                onClick={() =>
                                                handlePlayerLock(player.spots)}
                                                disabled={playerAnyLocking}
                                                className={`
                                                w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 border-white text-blue-600
                                                transition-all duration-200 shadow-sm
                                                ${playerAnyLocking ? 'bg-yellow-500 cursor-not-allowed animate-pulse' :
                                                playerAllLocked ? 'bg-blue-600 text-white hover:bg-gray-700' :
                                                'bg-[#DBEAFE] text-blue-600 hover:bg-blue-600'}
                                                `}
                                                title={playerAnyLocking ? 'Processing...' : playerAllLocked ? 'Unlock all spots' : 'Lock all spots'}
                                                >
                                                {playerAnyLocking ? (
                                                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                ) : (
                                                player.spots.length
                                                )}
                                            </button>
                                            ) : (
                                            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shadow-sm text-white ${playerAllLocked ? 'bg-gray-600' : 'bg-green-600'}`}>
                                            {player.spots.length}
                                        </div>
                                        )}
                                    </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-semibold text-blue-600 truncate text-base md:text-lg">
                                        {player.user_name || 'Anonymous Player'}
                                    </h4>
                                    <p className="text-sm text-gray-500 truncate">
                                        {player.spots.length} spot{player.spots.length !== 1 ? 's' : ''} selected
                                        {playerAllLocked && <span className="text-gray-400 ml-1">(Locked)</span>}
                                    </p>
                                </div>
                            </div>
                            {/* Spots */}
                            <div className="flex flex-wrap gap-2 mt-3 md:mt-0 md:ml-4 justify-end items-center w-full md:w-auto">
                                {player.spots.sort((a, b) => a - b).map(spotNumber => {
                                const isSpotLocked = currentReservationStatus &&
                                Array.isArray(currentReservationStatus.locked_numbers) &&
                                currentReservationStatus.locked_numbers.includes(spotNumber);
                                const isSpotLocking = lockingSpots.has(spotNumber);
                                return (
                                <button
                                    key={spotNumber}
                                    onClick={() =>
                                    isHost ? handleSpotLock(spotNumber) : null}
                                    disabled={!isHost || isSpotLocking}
                                    className={`
                                    w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold shadow-sm transition-all duration-200 relative text-white
                                    ${isSpotLocking ? 'bg-yellow-500 cursor-not-allowed animate-pulse' :
                                    isSpotLocked ? 'bg-blue-200 hover:bg-gray-700' :
                                    'bg-blue-600 hover:bg-blue-500 hover:scale-110'}
                                    ${!isHost && 'cursor-default'}
                                    `}
                                    title={!isHost ? `Spot ${spotNumber}` :
                                    isSpotLocking ? 'Processing...' :
                                    isSpotLocked ? `Unlock spot ${spotNumber}` :
                                    `Lock spot ${spotNumber}`}
                                    >
                                    {isSpotLocking ? (
                                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    ) : (
                                    spotNumber
                                    )}
                                    {isSpotLocked && !isSpotLocking && (
                                    <div className="absolute inset-0 bg-blue-300 rounded-full flex items-center justify-center">
                                        <Lock className="w-3 h-3 text-blue-600" />
                                    </div>
                                    )}
                                </button>
                                );
                                })}
                            </div>
                        </div>
                        );
                        })}
                    </div>
                    {/* Stats Section */}
                    <div className="mt-6">
                        <div className="grid grid-cols-2 gap-4 text-center w-full">
                            {/* Players Card */}
                            <div className="relative group bg-blue-100 rounded-sm p-3 flex flex-col items-center gap-2 border border-blue-100">
                                <div className="bg-white text-blue-600 border border-blue-600 rounded-full w-16 h-16 flex items-center justify-center">
                                    <Users className="w-8 h-8" />
                                </div>
                                <div className="text-sm text-black-600">{players.length === 1 ? "Player" : "Players"}</div>
                                <div className="text-xl font-bold text-blue-600">{players.length}</div>
                            </div>
                            {/* Spots Taken Card */}
                            <div className="relative group bg-blue-100 rounded-sm p-3 flex flex-col items-center gap-2 border border-blue-100">
                                <div className="bg-white text-blue-600 border border-blue-600 rounded-full w-16 h-16 flex items-center justify-center">
                                    <CheckCircle className="w-8 h-8" />
                                </div>
                                <div className="text-sm text-black-600">Spots Taken</div>
                                <div className="text-xl font-bold text-blue-600">{booked_numbers.length}</div>
                            </div>
                            {/* Locked Card */}
                            <div className="relative group bg-blue-100 rounded-sm p-3 flex flex-col items-center gap-2 border border-blue-100">
                                <div className="bg-white text-blue-600 border border-blue-600 rounded-full w-16 h-16 flex items-center justify-center">
                                    <Lock className="w-8 h-8" />
                                </div>
                                <div className="text-sm text-black-600">Locked</div>
                                <div className="text-xl font-bold text-blue-600"> {currentReservationStatus?.locked_numbers?.length || 0}</div>
                            </div>
                            {/* Available Card */}
                            <div className="relative group bg-blue-100 rounded-sm p-3 flex flex-col items-center gap-2 border border-blue-100">
                                <div className="bg-white text-blue-600 border border-blue-600 rounded-full w-16 h-16 flex items-center justify-center">
                                    <CirclePlus className="w-8 h-8" />
                                </div>
                                <div className="text-sm text-black-600">Available</div>
                                <div className="text-xl font-bold text-blue-600">{razzle.spots_count - booked_numbers.length}</div>
                            </div>
                        </div>
                    </div>
                </div>
                );
                })()}
            </div>
        </div>
    </div>
    <div className="px-[15px] md:px-6 py-4">
        {/* Locked State Message */}
        {!razzle.drawn_number && isGloballyLocked && (
        <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-sm p-4 text-white shadow-lg border border-red-400">
            <div className="text-center py-8">
                <div className="bg-white/20 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                    <Shield className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-4">Razzle Temporarily Locked</h3>
                <p className="text-red-100 mb-4 leading-relaxed">
                    This razzle has been temporarily locked by the host. New entries are currently not being accepted.
                </p>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                    <p className="text-white/90 text-sm font-medium">
                        🔔 You will be notified when the razzle becomes available again
                    </p>
                </div>
            </div>
        </div>
        )}
        {/* Winner Announcement */}
        {razzle.drawn_number && (
        <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-2xl p-4 text-white shadow-lg">
            <div className="text-center">
                <div className="text-6xl mb-4">🏆</div>
                <h3 className="text-2xl font-bold mb-2">We Have a Winner!</h3>
                <p className="text-xl mb-4">Congratulations to spot #{razzle.drawn_number}</p>
                <div className="bg-white/20 rounded-lg p-4">
                    <p className="text-lg">This razzle has ended</p>
                </div>
            </div>
        </div>
        )}
    </div>
</div>
  );
};

export default RazzleWidget;
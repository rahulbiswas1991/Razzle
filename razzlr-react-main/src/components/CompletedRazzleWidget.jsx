import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Clock, Users, Calendar, Star, Trophy, Gift, CheckCircle, Crown, Shield, Percent, Hash } from 'lucide-react';
import { fetchUserProfile } from '../store/user/thunks';

const CompletedRazzleWidget = ({ slug, initialRazzle, initialReservationStatus, token }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [razzle, setRazzle] = useState(initialRazzle);
  
  useEffect(() => {
    setRazzle(initialRazzle);
  }, [initialRazzle]);

  const reservationStatus = useSelector(state => state.raffles.raffleReservationStatus);
  const currentUser = useSelector(state => state.user.user);

  useEffect(() => {
    if (!currentUser) {
      dispatch(fetchUserProfile());
    }
  }, [currentUser, dispatch]);

  const isHost = currentUser && razzle && (
    currentUser.slug === razzle.host_slug || 
    currentUser.user_slug === razzle.host_slug
  );

  const currentReservationStatus = reservationStatus || initialReservationStatus;
  const userBookedNumbers = currentReservationStatus?.booked_numbers || [];
  const isWinner = razzle.drawn_number && userBookedNumbers.some(booking => 
    booking.spot_number === razzle.drawn_number
  );

  return (
<div className="min-h-screen bg-white">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 px-[15px] md:px-6 py-4">
        {/* LEFT COLUMN */}
        <div className="space-y-8">
            <div className="relative w-full h-[480px] rounded-sm bg-gradient-to-r from-green-500 to-green-700 text-white shadow-lg overflow-hidden">
                {razzle.imageUrl || razzle.raffle_image ? (
                <img
                src={razzle.imageUrl || razzle.raffle_image}
                alt={razzle.title}
                className="absolute inset-0 w-full h-full object-cover opacity-40"
                />
                ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-green-600/40">
                    <span className="text-7xl">🎁</span>
                </div>
                )}
                {/* Foreground content */}
                <div className="relative z-10 py-10 px-4 text-center space-y-6">
                    <h1 className="text-3xl md:text-4xl font-extrabold drop-shadow-lg">
                        {razzle.title}
                    </h1>
                    {/* Status + Winner */}
                    <div className="flex flex-col items-center gap-4">
                        <span className="bg-white/20 px-6 py-2 rounded-full font-medium flex items-center gap-2 text-base">
                            <CheckCircle className="w-5 h-5" />
                            Completed
                        </span>
                        {razzle.drawn_number && (
                        <div className="bg-gradient-to-r from-yellow-300 to-yellow-500 text-yellow-900 rounded-2xl p-6 shadow-lg w-full max-w-md">
                            <span className="text-5xl block mb-2">🏆</span>
                            <h3 className="text-xl font-bold flex items-center justify-center gap-2">
                                <Trophy className="w-6 h-6 text-yellow-700" />
                                Winning Number
                            </h3>
                            <p className="text-3xl font-extrabold mt-2">
                                #{razzle.drawn_number}
                            </p>
                            {isWinner && (
                            <div className="bg-white/30 rounded-xl p-4 font-semibold text-base mt-4">
                                🎉 YOU WON! 🎉
                                <p className="text-sm font-normal mt-1">
                                    Contact the host to claim your prize.
                                </p>
                            </div>
                            )}
                            {razzle.drawn_at && (
                            <div className="bg-white/20 rounded-xl p-3 text-xs opacity-90 mt-4">
                                Drawn on: {new Date(razzle.drawn_at).toLocaleString()}
                            </div>
                            )}
                        </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
        {/* RIGHT COLUMN */}
        <div className="space-y-8">
            {/* RAFFLE INFO */}
            <div className="bg-white">
                <h1 className="text-xl font-semibold text-blue-600 mb-6 flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-600" />
                    Raffle Information
                </h1>
                {/* 4-Column Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                    {
                    icon: Users,
                    label: "Participants",
                    value: `${(currentReservationStatus?.booked_numbers || []).length} / ${razzle.spots_count}`,
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
                    value: razzle.host_name || razzle.host?.name || "Unknown Host",
                    color: "text-blue-600",
                    bg: "bg-blue-100",
                    },
                    {
                    icon: Trophy,
                    label: "Winning Number",
                    value: razzle.drawn_number || "TBA",
                    color: "text-green-600",
                    bg: "bg-green-100",
                    },
                    ].map(({ icon: Icon, label, value, color, bg }, idx) => (                    
                <div
                            key={idx}
                            className="relative group flex flex-col items-center text-center p-6 rounded-sm bg-[#F1F7FF] border border-blue-100 hover:shadow-md transition-shadow duration-200"
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
        </div>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 px-[15px] md:px-6 py-4">
        {/* LEFT COLUMN */}
        <div className="space-y-8">
            {/* SIGNATURE SECTION */}
            {razzle.random_signature && (
            <div className="bg-white">
                <div className="flex flex-col bg-[#DBEAFE] p-4 sm:flex-row sm:items-center sm:justify-between mb-6 w-full rounded-sm">
                  <h2 className="text-xl font-bold flex items-center gap-2 text-blue-600">
                      <Shield className="w-6 h-6 text-blue-600" />
                      Random Signature
                  </h2>
                </div>
                <div className="mt-4 space-y-3">
                    <div className="bg-blue-600 border border-blue-600 rounded-sm p-3 text-xs font-mono leading-relaxed text-white break-all whitespace-pre-wrap">
                        {razzle.random_signature}
                    </div>
                    <p className="text-xs text-gray-500">
                        This verifiable random signature ensures the draw was fair and tamper-proof.
                    </p>
                </div>
            </div>
            )}
        </div>
        {/* RIGHT COLUMN */}
        <div className="space-y-8">
            {/* FINAL RESULTS */}
            <div className="bg-white">
                <div className="flex flex-col bg-[#DBEAFE] p-4 sm:flex-row sm:items-center sm:justify-between mb-6 w-full rounded-sm">
                <h2 className="text-xl font-bold flex items-center gap-2 text-blue-600">
                    <Trophy className="w-6 h-6 text-blue-600" />
                    Final Results
                </h2>
                </div>
                {/* Results List */}
                <div className="space-y-3">
                    {/* Total Spots Sold */}
                    <div className="flex items-center gap-3 p-3 bg-white rounded-sm border border-blue-600">
                        <div className="p-2 rounded-full bg-blue-100 text-blue-600">
                            <Users className="w-5 h-5" />
                        </div>
                        <div className="flex flex-col w-full text-blue-600">
                            <div className="flex justify-between w-full">
                                <span>Total Spots Sold</span>
                                <span className="font-bold">{(currentReservationStatus?.booked_numbers || []).length}/{razzle.spots_count}</span>
                            </div>                           
                        </div>
                    </div>
                    {/* Participation Rate */}
                    <div className="flex items-center gap-3 p-3 bg-white rounded-sm border border-blue-600">
                        <div className="p-2 rounded-full bg-blue-100 text-blue-600">
                            <Percent className="w-5 h-5" />
                        </div>
                        <div className="flex justify-between w-full text-blue-600">
                            <span>Participation Rate</span>
                            <span className="font-bold">
                            {(() => {
                                const soldSpots = (currentReservationStatus?.booked_numbers || []).length;
                                const totalSpots = razzle.spots_count || 0;
                                return totalSpots > 0 ? Math.round((soldSpots / totalSpots) * 100) : 0;
                            })()}%
                            </span>
                        </div>
                    </div>
                    {/* User Numbers (if any) */}
                    {userBookedNumbers.length > 0 && (
                    <div className="flex items-center gap-3 p-3 bg-white rounded-sm border border-blue-600">
                        <div className="p-2 rounded-full bg-blue-100 text-blue-600">
                            <Hash className="w-5 h-5" />
                        </div>
                        <div className="flex justify-between w-full text-blue-600">
                            <span>Your Numbers</span>
                            <span className="font-bold text-blue-600">
                            {userBookedNumbers.map((b) => `#${b.spot_number}`).join(", ")}
                            </span>
                        </div>
                    </div>
                    )}
                </div>
            </div>
        </div>
    </div>
</div>

    


  );
};

export default CompletedRazzleWidget;

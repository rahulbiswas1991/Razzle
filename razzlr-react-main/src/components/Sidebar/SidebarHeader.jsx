import { Wallet, Settings, Bell } from 'lucide-react';

const SidebarHeader = ({ user, loading, isCollapsed }) => {
  const renderLoadingState = () => {
    if (!isCollapsed) {
      return (
        <div className="flex flex-col items-center space-y-3 relative px-2 py-6">
          <div className="animate-pulse rounded-full bg-gray-400 w-[64px] h-[64px] border-2 border-white"></div>
          <div className="text-center space-y-2">
            <div className="animate-pulse bg-gray-400 h-6 w-32 rounded-md"></div>
            <div className="animate-pulse bg-gray-400 h-4 w-40 rounded-md"></div>
          </div>
        </div>
      );
    } else {
      return (
        <div className="flex flex-col items-center space-y-3 relative px-2 py-6">
          <div className="animate-pulse rounded-full bg-gray-400 w-[64px] h-[64px] border-2 border-white"></div>
          <div className="text-center">
            <div className="animate-pulse bg-gray-400 h-6 w-32 rounded-md"></div>
            <div className="animate-pulse bg-gray-400 h-4 w-40 rounded-md"></div>
          </div>
        </div>
      );
    }
  };

  const renderUserProfile = () => {
    const avatar = user?.avatar || '/profile-img.png';
    const name = user?.name || 'User';
    const email = user?.email || '';
    const credits = user?.credits_balance || 0;

    if (!isCollapsed) {
      return (
        <div className="flex flex-col items-center space-y-3 relative px-2 py-6">
          <img
            src={avatar}
            alt={name}
            className="rounded-full border-2 border-white w-[64px] h-[64px] object-cover"
          />
          <div className="text-center">
            <h3 className="font-medium text-blue-600">{name}</h3>
            {email && <p className="text-sm text-blue-600">{email}</p>}
          </div>
          
          
        </div>
      );
    } else {
      return (
        <div className="flex flex-col items-center space-y-2 relative px-2 py-6">
          <img
            src={avatar}
            alt={name}
            className="rounded-full border-2 border-white w-[64px] h-[64px] object-cover"
          />
        </div>
      );
    }
  };

  return (
    <div className="sidebar-profile">

      {/* User Profile Content */}
      {loading ? renderLoadingState() : renderUserProfile()}
    </div>
  );
};

export default SidebarHeader;
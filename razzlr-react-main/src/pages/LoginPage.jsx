import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchFacebookAppId } from '../store/auth/thunks';
import { initializeFacebookSDK } from '../utils/facebookUtils';
import FacebookLoginButton from '../components/FacebookLoginButton';

export default function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { 
    facebookAppId, 
    facebookAppIdLoading, 
    facebookAppIdError, 
    facebookAppIdErrorDetails,
    isAuthenticated 
  } = useSelector((state) => state.auth);
  
  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  // Fetch Facebook App ID on component mount
  useEffect(() => {
    dispatch(fetchFacebookAppId());
  }, [dispatch]);

  // Handle Facebook App ID response
  useEffect(() => {
    if (facebookAppIdError) {
      // Handle error (e.g., show message to user)
    } else if (facebookAppId) {
      // Initialize Facebook SDK
      initializeFacebookSDK(facebookAppId)
        .then(() => {
          // SDK initialized, you can now use Facebook Login
        })
        .catch(() => {
          // Handle SDK initialization error
        });
    }
  }, [facebookAppId, facebookAppIdError]);

  return (
    <div className="min-h-screen h-full overflow-auto">
      {/* Main content area */}
      <div className="flex-1 flex min-h-screen h-full relative">
        {/* Left side - Blue section with circular design */}
        <div className="w-1/2 bg-gradient-to-b from-[#4884ee] to-[#03bfff] relative flex items-center justify-center bg-fixed">
          {/* Large background circle */}
          <div className="absolute inset-0 flex items-center justify-center pt-16 pl-16 pb-16">
            <div className="bg-[url('/round-bg.png')] bg-no-repeat bg-custom-size ml-[64px] brightness-300 opacity-60 absolute w-full h-full bg-fixed"></div>
            <div className="bg-[url('/blue-gradient-overlay.png')] bg-no-repeat bg-cover bg-center w-full h-full  rounded-[20px_0_0_20px]"></div>
          </div>
          {/* Text content */}
          <div className="text-center z-10 px-8 relative">
            <h1 className="text-white text-[55px] font-bold leading-[1.1]">
              Join Our Razzlr
              <br />
              Community
            </h1>
          </div>
        </div>

        {/* Right side - Login section */}
        <div className="w-1/2 bg-[#EEF3FF] flex items-center relative justify-center px-12 bg-fixed">
          <div className="absolute inset-0 flex items-center justify-center pt-16 pr-16 pb-16">
            <div className="bg-white w-full h-full rounded-[0_20px_20px_0]"></div>
          </div>
          <div className="w-full max-w-md relative">
            {/* Razzlr title */}
            <div className="text-center relative z-10 mb-8">
              <h2 className="text-[77px] font-bold text-[#4884EE] mb-3 leading-[1.15]">
                Razzlr
              </h2>
              <p className="text-[#131313] text-[25px] font-semibold">
                Sign in to Continue
              </p>
            </div>
            {/* Facebook login button */}
            <FacebookLoginButton />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-[#4e4e4e] text-white text-center py-6 relative z-20">
        <p className="text-[20px]">
          © 2023 Razzlr Razzles All rights reserved.
        </p>
      </div>
    </div>
  );
}

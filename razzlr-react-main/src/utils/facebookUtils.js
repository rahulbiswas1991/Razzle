// Facebook SDK utilities
export const initializeFacebookSDK = (appId) => {
  return new Promise((resolve) => {
    // Load Facebook SDK
    if (!window.FB) {
      window.fbAsyncInit = function() {
        window.FB.init({
          appId: appId,
          cookie: true,
          xfbml: true,
          version: 'v18.0'
        });
        resolve();
      };

      // Load the SDK asynchronously
      const script = document.createElement('script');
      script.id = 'facebook-jssdk';
      script.src = 'https://connect.facebook.net/en_US/sdk.js';
      document.head.appendChild(script);
    } else {
      resolve();
    }
  });
};

export const facebookLogin = () => {
  return new Promise((resolve, reject) => {
    window.FB.login((response) => {
      if (response.authResponse) {
        resolve(response.authResponse.accessToken);
      } else {
        reject(new Error('Facebook login cancelled or failed'));
      }
    }, { scope: 'email,public_profile' });
  });
};

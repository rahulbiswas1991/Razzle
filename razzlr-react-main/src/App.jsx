import RazzleDraftsPage from './pages/RazzleDraftsPage';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import CreateRafflePage from './pages/CreateRafflePage';
import RazzleDetailsPage from './pages/RazzleDetailsPage';
import PrivateRoute from './components/PrivateRoute';
import HostCreditsPackagesPage from './pages/HostCreditsPackagesPage';
import HostCreditTransactionsPage from './pages/HostCreditTransactionsPage';

function App() {
  return (
    <Provider store={store}>
      <Router>
        <div className="App min-h-screen">
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route 
              path="/dashboard" 
              element={
                <PrivateRoute>
                  <DashboardPage />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/razzle/new" 
              element={
                <PrivateRoute>
                  <CreateRafflePage />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/razzle/drafts" 
              element={
                <PrivateRoute>
                  <RazzleDraftsPage />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/razzle/:slug" 
              element={
                <PrivateRoute>
                  <RazzleDetailsPage />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/host-credits/buy" 
              element={
                <PrivateRoute>
                  <HostCreditsPackagesPage />
                </PrivateRoute>
              }
            />
            <Route 
              path="/host-credits/history" 
              element={
                <PrivateRoute>
                  <HostCreditTransactionsPage />
                </PrivateRoute>
              }
            />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </Router>
    </Provider>
  );
}

export default App;

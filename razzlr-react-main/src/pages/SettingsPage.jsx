import DashboardLayout from '../layouts/DashboardLayout';

const SettingsPage = () => {
  return (
    <DashboardLayout>
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">Settings</h1>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Settings</h2>
          <p className="text-gray-600">This is the settings page. The sidebar is automatically included via the DashboardLayout.</p>
        </div>
      </main>
    </DashboardLayout>
  );
};

export default SettingsPage;

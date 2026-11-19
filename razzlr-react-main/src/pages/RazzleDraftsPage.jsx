import RazzleDrafts from '../components/RazzleDrafts';
import DashboardLayout from '../layouts/DashboardLayout';

const RazzleDraftsPage = () => {
  return (
    <DashboardLayout>
      <main className="px-[15px] md:px-6 py-6 space-y-6 mt-[73px]">
        <RazzleDrafts />
      </main>
    </DashboardLayout>
  );
};

export default RazzleDraftsPage;

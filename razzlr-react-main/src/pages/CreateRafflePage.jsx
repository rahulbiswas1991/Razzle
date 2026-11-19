import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import DashboardLayout from '../layouts/DashboardLayout';
import CreateRaffleForm from '../components/CreateRaffleForm';

const CreateRafflePage = () => {
  const dispatch = useDispatch();
  const { accessToken } = useSelector((state) => state.auth);
  const { loading, error } = useSelector((state) => state.raffles);


  return (
    <DashboardLayout>
      <main className="px-[15px] md:px-6 py-6 space-y-6 mt-[73px]">
        <CreateRaffleForm />
      </main>
    </DashboardLayout>
  );
};

export default CreateRafflePage;

import { useState, useEffect } from 'react';
import HostCreditsLayout from "../layouts/HostCreditsLayout";
import { fetchCreditTransactions } from "../services/creditsService";

const HostCreditTransactionsPage = () => {
  const [transactions, setTransactions] = useState([]);
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, per_page: 15, total: 0 });
  const [perPage, setPerPage] = useState(15);
  const [page, setPage] = useState(1);
  const [type, setType] = useState('all');
  useEffect(() => {
    fetchCreditTransactions(
      perPage,
      page,
      type === 'all' ? undefined : type,
      'paid'
    ).then((response) => {
      setTransactions(response?.transactions?.data || []);
      setPagination(response?.transactions?.pagination || { current_page: 1, last_page: 1, per_page: 15, total: 0 });
    });
  }, [perPage, page, type]);

  return (
    <HostCreditsLayout>
      <main className="px-[15px] md:px-6 py-6 space-y-6 mt-[73px]">
        <div className="bg-white py-6 px-[15px] md:px-6 rounded-lg">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Transaction History</h2>
            <div className="text-sm text-gray-700 space-y-1">
              <p>Your recent credit transactions</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:justify-end sm:items-center gap-3 w-full mb-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Type:</label>
              <select
                value={type}
                onChange={e => { setType(e.target.value); setPage(1); }}
                className="border border-gray-300 rounded-lg px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All</option>
                <option value="spend">Spend</option>
                <option value="purchase">Purchase</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Per page:</label>
              <select
                value={perPage}
                onChange={e => { setPerPage(Number(e.target.value)); setPage(1); }}
                className="border border-gray-300 rounded-lg px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500"
              >
                {[5, 10, 15, 20, 50, 100].map(n => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
          </div>


          <div className="p-4 bg-gray-50">
            {transactions.map(tx => (
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-white p-4 border-b w-full hover:shadow-sm transition-shadow duration-300" key={tx.id}>
                <div className="flex items-start space-x-4">
                  <div className={`flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full ${tx.payment_status === "paid" ? "bg-green-100" : "bg-red-100"}`}>
                    {tx.payment_status === "paid" ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Raffle entry</p>
                    <p className="text-sm text-gray-500">{new Date(tx.created_at).toLocaleString("en-US", { year: "numeric", month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: true })}</p>
                    <p className="text-xs text-gray-400">Raffle ID: {tx.id}</p>
                  </div>
                </div>
                <div className="text-left sm:text-right mt-2 sm:mt-0">
                  <p className={tx.amount > 0 ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                    {tx.amount > 0 ? `+${tx.credits} credits` : `-${tx.credits} credits`}
                  </p>
                  <p className="text-sm text-gray-500">{tx.currency} {(tx.amount ? tx.amount / 100 : 0).toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-center gap-4 mt-4">
            <button
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="px-3 py-1 rounded-lg border border-gray-300 text-sm bg-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
            >
              Prev
            </button>

            <span className="text-sm text-gray-700">
              Page {pagination.current_page} of {pagination.last_page}
            </span>

            <button
              disabled={page >= pagination.last_page}
              onClick={() => setPage(page + 1)}
              className="px-3 py-1 rounded-lg border border-gray-300 text-sm bg-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
            >
              Next
            </button>
          </div>

        </div>
      </main>
    </HostCreditsLayout>
  );
};

export default HostCreditTransactionsPage;

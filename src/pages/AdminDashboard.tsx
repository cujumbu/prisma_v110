import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { sendStatusUpdateEmail } from '../utils/emailService';
import { X, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface Claim {
  id: string;
  orderNumber: string;
  email: string;
  name: string;
  street?: string;
  postalCode?: string;
  city?: string;
  phoneNumber: string;
  brand: string;
  problemDescription: string;
  status: string;
  submissionDate: string;
}

interface Return {
  id: string;
  orderNumber: string;
  email: string;
  reason: string;
  description: string;
  status: string;
  submissionDate: string;
}

const AdminDashboard: React.FC = () => {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [returns, setReturns] = useState<Return[]>([]);
  const [filteredItems, setFilteredItems] = useState<(Claim | Return)[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedItem, setSelectedItem] = useState<Claim | Return | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'claims' | 'returns'>('claims');
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    if (!user || !user.isAdmin) {
      navigate('/login');
      return;
    }

    const fetchData = async () => {
      try {
        const claimsResponse = await fetch('/api/claims');
        const returnsResponse = await fetch('/api/returns');
        if (!claimsResponse.ok || !returnsResponse.ok) {
          throw new Error('Failed to fetch data');
        }
        const claimsData = await claimsResponse.json();
        const returnsData = await returnsResponse.json();
        setClaims(claimsData);
        setReturns(returnsData);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, [user, navigate]);

  useEffect(() => {
    const items = activeTab === 'claims' ? claims : returns;
    const filtered = items.filter(item => 
      (statusFilter ? item.status === statusFilter : true) &&
      (searchTerm ? item.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) : true)
    );
    setFilteredItems(filtered);
  }, [statusFilter, searchTerm, claims, returns, activeTab]);

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const endpoint = activeTab === 'claims' ? '/api/claims/' : '/api/returns/';
      const response = await fetch(`${endpoint}${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      const updatedItem = await response.json();

      if (activeTab === 'claims') {
        setClaims(prevClaims => prevClaims.map(claim =>
          claim.id === id ? { ...claim, status: newStatus } : claim
        ));
      } else {
        setReturns(prevReturns => prevReturns.map(returnItem =>
          returnItem.id === id ? { ...returnItem, status: newStatus } : returnItem
        ));
      }

      // Send email notification
      await sendStatusUpdateEmail(updatedItem.email, updatedItem.orderNumber, newStatus);
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleViewDetails = async (id: string) => {
    setIsLoading(true);
    try {
      const endpoint = activeTab === 'claims' ? '/api/claims/' : '/api/returns/';
      const response = await fetch(`${endpoint}${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch details');
      }
      const itemDetails = await response.json();
      setSelectedItem(itemDetails);
    } catch (error) {
      console.error('Error fetching details:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const closeModal = () => {
    setSelectedItem(null);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">{t('adminDashboard')}</h1>
      <div className="mb-4">
        <button
          className={`mr-2 px-4 py-2 rounded ${activeTab === 'claims' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          onClick={() => setActiveTab('claims')}
        >
          {t('claims')}
        </button>
        <button
          className={`px-4 py-2 rounded ${activeTab === 'returns' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          onClick={() => setActiveTab('returns')}
        >
          {t('returns')}
        </button>
      </div>
      <div className="mb-4 flex flex-wrap items-center gap-4">
        <div className="flex-grow">
          <label htmlFor="statusFilter" className="mr-2">{t('filterByStatus')}:</label>
          <select
            id="statusFilter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border rounded p-1"
          >
            <option value="">{t('all')}</option>
            <option value="Pending">{t('pending')}</option>
            <option value="In Progress">{t('inProgress')}</option>
            <option value="Resolved">{t('resolved')}</option>
            <option value="Rejected">{t('rejected')}</option>
          </select>
        </div>
        <div className="flex-grow">
          <label htmlFor="searchInput" className="mr-2">{t('searchByOrderNumber')}:</label>
          <div className="relative">
            <input
              id="searchInput"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t('enterOrderNumber')}
              className="border rounded p-1 pl-8 w-full"
            />
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          </div>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white">
          <thead>
            <tr>
              <th className="px-6 py-3 border-b-2 border-gray-300 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                {t('orderNumber')}
              </th>
              <th className="px-6 py-3 border-b-2 border-gray-300 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                {t('email')}
              </th>
              <th className="px-6 py-3 border-b-2 border-gray-300 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                {t('status')}
              </th>
              <th className="px-6 py-3 border-b-2 border-gray-300 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                {t('actions')}
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.map((item) => (
              <tr key={item.id}>
                <td className="px-6 py-4 whitespace-nowrap">{item.orderNumber}</td>
                <td className="px-6 py-4 whitespace-nowrap">{item.email}</td>
                <td className="px-6 py-4 whitespace-nowrap">{item.status}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <select
                    value={item.status}
                    onChange={(e) => handleStatusChange(item.id, e.target.value)}
                    className="mr-2 mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  >
                    <option value="Pending">{t('pending')}</option>
                    <option value="In Progress">{t('inProgress')}</option>
                    <option value="Resolved">{t('resolved')}</option>
                    <option value="Rejected">{t('rejected')}</option>
                  </select>
                  <button
                    onClick={() => handleViewDetails(item.id)}
                    className="mt-2 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                  >
                    {t('viewDetails')}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedItem && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full" id="my-modal">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                {activeTab === 'claims' ? t('claimDetails') : t('returnDetails')}
              </h3>
              {isLoading ? (
                <p>{t('loading')}</p>
              ) : (
                <div className="mt-2 px-7 py-3">
                  <p className="text-sm text-gray-500">
                    <strong>{t('orderNumber')}:</strong> {selectedItem.orderNumber}
                  </p>
                  <p className="text-sm text-gray-500">
                    <strong>{t('email')}:</strong> {selectedItem.email}
                  </p>
                  <p className="text-sm text-gray-500">
                    <strong>{t('status')}:</strong> {selectedItem.status}
                  </p>
                  <p className="text-sm text-gray-500">
                    <strong>{t('submissionDate')}:</strong> {new Date(selectedItem.submissionDate).toLocaleString()}
                  </p>
                  {'name' in selectedItem && (
                    <>
                      <p className="text-sm text-gray-500">
                        <strong>{t('name')}:</strong> {selectedItem.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        <strong>{t('phoneNumber')}:</strong> {selectedItem.phoneNumber}
                      </p>
                      <p className="text-sm text-gray-500">
                        <strong>{t('brand')}:</strong> {selectedItem.brand}
                      </p>
                      <p className="text-sm text-gray-500 mt-2">
                        <strong>{t('problemDescription')}:</strong>
                      </p>
                      <p className="text-sm text-gray-500 mt-1 text-left">
                        {selectedItem.problemDescription}
                      </p>
                    </>
                  )}
                  {'reason' in selectedItem && (
                    <>
                      <p className="text-sm text-gray-500">
                        <strong>{t('returnReason')}:</strong> {t(selectedItem.reason)}
                      </p>
                      <p className="text-sm text-gray-500 mt-2">
                        <strong>{t('returnDescription')}:</strong>
                      </p>
                      <p className="text-sm text-gray-500 mt-1 text-left">
                        {selectedItem.description}
                      </p>
                    </>
                  )}
                </div>
              )}
            </div>
            <div className="items-center px-4 py-3">
              <button
                id="ok-btn"
                className="px-4 py-2 bg-blue-500 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
                onClick={closeModal}
              >
                {t('close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
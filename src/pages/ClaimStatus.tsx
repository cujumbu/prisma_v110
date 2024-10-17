import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

interface Claim {
  id: string;
  orderNumber: string;
  email: string;
  name: string;
  status: string;
  submissionDate: string;
}

const ClaimStatus: React.FC = () => {
  const [claim, setClaim] = useState<Claim | null>(null);
  const [orderNumber, setOrderNumber] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const location = useLocation();
  const { t } = useTranslation();

  useEffect(() => {
    const claimId = location.state?.claimId;
    if (claimId) {
      fetchClaim(claimId);
    }
  }, [location]);

  const fetchClaim = async (id: string) => {
    try {
      const response = await fetch(`/api/claims/${id}`);
      if (!response.ok) {
        throw new Error(t('failedToFetchClaim'));
      }
      const claimData = await response.json();
      setClaim(claimData);
    } catch (error) {
      console.error('Error fetching claim:', error);
      setError(t('errorFetchingClaim'));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    try {
      const response = await fetch(`/api/claims?orderNumber=${orderNumber}&email=${email}`);
      if (!response.ok) {
        throw new Error(t('failedToFetchClaim'));
      }
      const claims = await response.json();
      if (claims.length === 0) {
        setError(t('noClaimFound'));
        setClaim(null);
      } else {
        setClaim(claims[0]);
      }
    } catch (error) {
      console.error('Error fetching claim:', error);
      setError(t('errorFetchingClaim'));
    }
  };

  return (
    <div className="max-w-md mx-auto mt-8 bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">{t('checkClaimStatus')}</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="orderNumber" className="block text-sm font-medium text-gray-700">{t('orderNumber')}</label>
          <input
            type="text"
            id="orderNumber"
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value)}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
          />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">{t('email')}</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
          />
        </div>
        <button
          type="submit"
          className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
        >
          {t('checkStatus')}
        </button>
      </form>

      {error && <p className="text-red-500 mt-4">{error}</p>}

      {claim && (
        <div className="mt-8 bg-gray-50 p-4 rounded-md">
          <h3 className="text-lg font-medium text-gray-900 mb-2">{t('claimStatus')}</h3>
          <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-gray-500">{t('orderNumber')}</dt>
              <dd className="mt-1 text-sm text-gray-900">{claim.orderNumber}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">{t('name')}</dt>
              <dd className="mt-1 text-sm text-gray-900">{claim.name}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">{t('status')}</dt>
              <dd className="mt-1 text-sm text-gray-900">{t(claim.status.toLowerCase())}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">{t('submissionDate')}</dt>
              <dd className="mt-1 text-sm text-gray-900">{new Date(claim.submissionDate).toLocaleString()}</dd>
            </div>
          </dl>
        </div>
      )}
    </div>
  );
};

export default ClaimStatus;
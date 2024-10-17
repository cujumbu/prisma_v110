import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import BrandSelector from '../components/BrandSelector';
import FAQSection from '../components/FAQSection';

interface ClaimFormData {
  orderNumber: string;
  email: string;
  name: string;
  street: string;
  postalCode: string;
  city: string;
  phoneNumber: string;
  brand: string;
  problemDescription: string;
}

const ClaimForm: React.FC = () => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<ClaimFormData>({
    orderNumber: '',
    email: '',
    name: '',
    street: '',
    postalCode: '',
    city: '',
    phoneNumber: '',
    brand: '',
    problemDescription: '',
  });
  const [notificationAcknowledged, setNotificationAcknowledged] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prevData => ({ ...prevData, [name]: value }));
  };

  const handleBrandSelect = (brand: string) => {
    setFormData(prevData => ({ ...prevData, brand }));
  };

  const handleNotificationAcknowledge = (acknowledged: boolean) => {
    setNotificationAcknowledged(acknowledged);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    if (!notificationAcknowledged) {
      setError(t('pleaseAcknowledgeNotification'));
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch('/api/claims', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...formData, notificationAcknowledged }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || data.details || t('failedToSubmitClaim'));
      }
      navigate('/status', { state: { claimId: data.id } });
    } catch (error) {
      console.error('Error submitting claim:', error);
      setError(error.message || t('errorSubmittingClaim'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const warrantyClaims = [
    {
      question: 'warrantyFAQ.eligibilityQuestion',
      answer: 'warrantyFAQ.eligibilityAnswer',
    },
    {
      question: 'warrantyFAQ.processQuestion',
      answer: 'warrantyFAQ.processAnswer',
    },
    {
      question: 'warrantyFAQ.timeframeQuestion',
      answer: 'warrantyFAQ.timeframeAnswer',
    },
  ];

  return (
    <div className="max-w-2xl mx-auto mt-8">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">{t('submitWarrantyCase')}</h2>
      
      <FAQSection faqs={warrantyClaims} />
      
      <div className="bg-white p-6 rounded-lg shadow-md">
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="orderNumber" className="block text-sm font-medium text-gray-700">{t('orderNumber')}</label>
            <input
              type="text"
              id="orderNumber"
              name="orderNumber"
              value={formData.orderNumber}
              onChange={handleChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">{t('email')}</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50"
            />
          </div>
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">{t('name')}</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50"
            />
          </div>
          <div>
            <label htmlFor="street" className="block text-sm font-medium text-gray-700">{t('street')}</label>
            <input
              type="text"
              id="street"
              name="street"
              value={formData.street}
              onChange={handleChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50"
            />
          </div>
          <div>
            <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700">{t('postalCode')}</label>
            <input
              type="text"
              id="postalCode"
              name="postalCode"
              value={formData.postalCode}
              onChange={handleChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50"
            />
          </div>
          <div>
            <label htmlFor="city" className="block text-sm font-medium text-gray-700">{t('city')}</label>
            <input
              type="text"
              id="city"
              name="city"
              value={formData.city}
              onChange={handleChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50"
            />
          </div>
          <div>
            <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">{t('phoneNumber')}</label>
            <input
              type="tel"
              id="phoneNumber"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50"
            />
          </div>
          <BrandSelector onBrandSelect={handleBrandSelect} onNotificationAcknowledge={handleNotificationAcknowledge} />
          <div>
            <label htmlFor="problemDescription" className="block text-sm font-medium text-gray-700">{t('problemDescription')}</label>
            <textarea
              id="problemDescription"
              name="problemDescription"
              value={formData.problemDescription}
              onChange={handleChange}
              required
              rows={4}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50"
            ></textarea>
          </div>
          <button
            type="submit"
            disabled={isSubmitting || !notificationAcknowledged}
            className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
          >
            {isSubmitting ? t('submitting') : t('submit')}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ClaimForm;
import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const { t } = useTranslation();

  return (
    <header className="bg-topnav text-white shadow-md">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link to="/" className="flex items-center space-x-2">
          <ShieldCheck size={24} />
          <span className="text-xl font-bold">{t('supportPortal')}</span>
        </Link>
        <nav>
          <ul className="flex space-x-4">
            <li><Link to="/" className="hover:text-gray-300">{t('home')}</Link></li>
            <li><Link to="/claim" className="hover:text-gray-300">{t('newClaim')}</Link></li>
            <li><Link to="/return" className="hover:text-gray-300">{t('newReturn')}</Link></li>
            <li><Link to="/faq" className="hover:text-gray-300">{t('faq')}</Link></li>
            <li><Link to="/status" className="hover:text-gray-300">{t('checkStatus')}</Link></li>
            {user ? (
              <>
                {user.isAdmin && (
                  <li><Link to="/admin" className="hover:text-gray-300">{t('admin')}</Link></li>
                )}
                <li><button onClick={logout} className="hover:text-gray-300">{t('logout')}</button></li>
              </>
            ) : (
              <li><Link to="/login" className="hover:text-gray-300">{t('login')}</Link></li>
            )}
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header;
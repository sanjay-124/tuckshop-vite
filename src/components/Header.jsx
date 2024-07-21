import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../UserContext';

const Header = () => {
  const navigate = useNavigate();
  const { user, logout } = useUser();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout failed', error);
    }
  };

  return (
    <header className="bg-white text- from-blue-600 to-purple-600">
      <div className="container mx-auto flex justify-between items-center">
        <h1 
          className="text-3xl font-bold cursor-pointer hover:text-yellow-300 transition duration-300"
          onClick={() => navigate('/tuckshop')}
        >
          Tuckshop
        </h1>
        {user && (
          <nav className="flex items-center">
            <ul className="flex space-x-4">
              <li>
                <button
                  className="bg-transparent hover:bg-white text-black hover:text-purple-600 font-semibold py-2 px-4 transition duration-300 ease-in-out transform hover:-translate-y-1 hover:scale-110"
                  onClick={() => navigate('/orders')}
                >
                  Orders
                </button>
              </li>
              <li>
                <button
                  className="bg-transpa hover:bg-white text-black hover:text-red-500 font-semibold py-2 px-4 transition duration-300 ease-in-out transform hover:-translate-y-1 hover:scale-110"
                  onClick={handleLogout}
                >
                  Logout
                </button>
              </li>
            </ul>
          </nav>
        )}
      </div>
    </header>
  );
};

export default Header;
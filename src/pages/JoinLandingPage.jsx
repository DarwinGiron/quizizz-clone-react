import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
// We no longer need to query the database from this page.
// import { rtdb } from '../firebase/config'; 
// import { ref, get, query, orderByChild, equalTo } from 'firebase/database';

const JoinLandingPage = () => {
  const [joinCode, setJoinCode] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // This function is now much simpler and no longer needs to be async.
  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmedCode = joinCode.trim();

    if (!trimmedCode || trimmedCode.length !== 6) {
      setError('El código debe tener 6 dígitos.');
      return;
    }

    // No database query needed. The join code is the session ID.
    // We simply redirect the user to the next step, using the code they entered.
    navigate(`/enter-code/${trimmedCode}`);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4 font-sans" style={{background: 'linear-gradient(135deg, #4a00e0, #8e2de2)'}}>
       <div className="absolute top-5 left-5 text-2xl font-bold">W.</div>
      <div className="w-full max-w-md text-center">
        <h1 className="text-6xl font-bold mb-2">WAYGROUND</h1>
        <p className="text-lg text-gray-300 mb-8">formerly Quizizz</p>

        <form onSubmit={handleSubmit} className="w-full flex flex-col items-center">
          <div className="relative w-full max-w-sm">
            <input
              type="text"
              placeholder="Introducir un código de participación"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.replace(/[^0-9]/g, ''))}
              maxLength={6}
              className="w-full p-4 pr-24 text-center text-lg text-gray-800 rounded-lg shadow-lg focus:outline-none focus:ring-2 focus:ring-purple-400 transition"
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-purple-600 hover:bg-purple-700 text-white font-bold py-2.5 px-6 rounded-lg transition shadow-md disabled:opacity-50"
              disabled={!joinCode.trim()}
            >
              Unir
            </button>
          </div>
          {error && <p className="text-yellow-300 bg-red-800 bg-opacity-50 p-3 rounded-lg mt-6 text-sm">{error}</p>}
        </form>
      </div>
       <div className="absolute bottom-4 text-xs text-gray-400">
         <p>&copy; 2024 cuestionary Inc.</p>
       </div>
    </div>
  );
};

export default JoinLandingPage;

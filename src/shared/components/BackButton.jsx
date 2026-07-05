import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const BackButton = ({ to, label = 'Volver', className = '' }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (to) {
      navigate(to);
    } else {
      navigate(-1); // Ir hacia atrás en el historial
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`flex items-center gap-2 text-gray-600 hover:text-indigo-600 transition-colors duration-200 font-medium ${className}`}
    >
      <ArrowLeft size={20} />
      <span>{label}</span>
    </button>
  );
};

export default BackButton;

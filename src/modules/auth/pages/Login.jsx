import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Bypass temporal del login: redirige automáticamente al dashboard.
const Login = () => {
  const navigate = useNavigate();

  useEffect(() => {
    navigate('/dashboard', { replace: true });
  }, [navigate]);

  return null;
};

export default Login;

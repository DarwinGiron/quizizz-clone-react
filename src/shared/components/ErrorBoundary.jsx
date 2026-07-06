import React from 'react';
import { AlertTriangle } from 'lucide-react';

// Atrapa errores de render en cualquier parte de la app y muestra un
// mensaje amigable en vez de dejar la pantalla en blanco.
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('Error atrapado por ErrorBoundary:', error, info);
  }

  handleReintentar = () => {
    this.setState({ hasError: false });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
          <div className="text-center max-w-md">
            <div className="bg-red-100 p-4 rounded-full w-fit mx-auto mb-4">
              <AlertTriangle className="w-10 h-10 text-red-500" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Uy, algo salió mal
            </h1>
            <p className="text-gray-600 mb-6">
              Ocurrió un error inesperado al mostrar esta página. Intenta
              recargar; si el problema sigue, contacta al administrador.
            </p>
            <button
              onClick={this.handleReintentar}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:shadow-lg transition-shadow"
            >
              Recargar página
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

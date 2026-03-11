// Root component — renders the full-screen map view

import { ErrorBoundary } from 'react-error-boundary';
import MapView from './components/MapView/MapView';
import './App.css';

const ErrorFallback = ({ error, resetErrorBoundary }) => (
  <div className="app-error">
    <span className="app-error__icon">⚠️</span>
    <h2 className="app-error__title">Something went wrong</h2>
    <p className="app-error__message">{error.message}</p>
    <button className="app-error__retry" onClick={resetErrorBoundary}>
      Try again
    </button>
  </div>
);

const App = () => {
  return (
    <div className="app">
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <MapView />
      </ErrorBoundary>
    </div>
  );
};

export default App;

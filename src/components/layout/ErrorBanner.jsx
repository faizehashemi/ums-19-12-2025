import { AlertCircle, X } from 'lucide-react';
import Button from '../ui/Button';

const ErrorBanner = ({ message, onRetry, onDismiss, className = '' }) => {
  return (
    <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />

        <div className="flex-1">
          <h3 className="text-sm font-semibold text-red-800 mb-1">Error</h3>
          <p className="text-sm text-red-700">{message}</p>

          {onRetry && (
            <Button
              variant="secondary"
              size="sm"
              onClick={onRetry}
              className="mt-3"
            >
              Try Again
            </Button>
          )}
        </div>

        {onDismiss && (
          <button
            onClick={onDismiss}
            className="p-1 hover:bg-red-100 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4 text-red-600" />
          </button>
        )}
      </div>
    </div>
  );
};

export default ErrorBanner;

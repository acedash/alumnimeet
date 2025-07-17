import { FiAlertCircle } from 'react-icons/fi';
import './ErrorMessage.css'; // We'll create this CSS file next

const ErrorMessage = ({ 
  message = 'An error occurred', 
  variant = 'error',
  onRetry,
  retryText = 'Try Again'
}) => {
  const variantClasses = {
    error: 'error-message-error',
    warning: 'error-message-warning',
    info: 'error-message-info',
    success: 'error-message-success'
  };

  return (
    <div className={`error-message ${variantClasses[variant]}`}>
      <FiAlertCircle className="error-icon" />
      <div className="error-content">
        <p>{message}</p>
        {onRetry && (
          <button 
            className="retry-button"
            onClick={onRetry}
          >
            {retryText}
          </button>
        )}
      </div>
    </div>
  );
};

export default ErrorMessage;
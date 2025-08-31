"""
EventHive Error Handling
This module provides error handling functionality for the QR scanner application
"""

import logging
import traceback
import sys
from typing import Callable, Optional, Dict, Any, Type


class QRScannerError(Exception):
    """Base exception class for all QR scanner application errors"""
    pass


class DatabaseError(QRScannerError):
    """Exception raised for database-related errors"""
    pass


class ScannerError(QRScannerError):
    """Exception raised for QR scanner-related errors"""
    pass


class ApiError(QRScannerError):
    """Exception raised for API-related errors"""
    pass


class ValidationError(QRScannerError):
    """Exception raised for data validation errors"""
    pass


class ConfigError(QRScannerError):
    """Exception raised for configuration errors"""
    pass


class ErrorHandler:
    """
    Error handling utility for the QR scanner application
    """
    
    def __init__(self):
        """
        Initialize the error handler
        """
        self.error_callbacks: Dict[Type[Exception], Callable] = {}
        self.default_handler: Optional[Callable] = None
    
    def register_handler(self, exception_type: Type[Exception], handler: Callable):
        """
        Register a handler for a specific exception type
        
        Args:
            exception_type: The exception class to handle
            handler: The function to call when this exception occurs
        """
        self.error_callbacks[exception_type] = handler
    
    def set_default_handler(self, handler: Callable):
        """
        Set the default handler for unhandled exceptions
        
        Args:
            handler: The function to call for unhandled exceptions
        """
        self.default_handler = handler
    
    def handle_exception(self, exc: Exception, **kwargs) -> Any:
        """
        Handle an exception using the registered handlers
        
        Args:
            exc: The exception to handle
            **kwargs: Additional parameters to pass to the handler
            
        Returns:
            The result from the handler function
        """
        # Look for a specific handler for this exception type
        handler = None
        for exc_type, exc_handler in self.error_callbacks.items():
            if isinstance(exc, exc_type):
                handler = exc_handler
                break
        
        # If no specific handler found, use the default handler
        if handler is None:
            if self.default_handler is not None:
                handler = self.default_handler
            else:
                # No handler available, log the error and re-raise
                logging.error(f"Unhandled exception: {exc}", exc_info=True)
                raise
        
        # Call the handler
        return handler(exc, **kwargs)


# Create a global error handler
global_error_handler = ErrorHandler()


def handle_errors(func: Callable) -> Callable:
    """
    Decorator to handle exceptions in functions
    
    Args:
        func: The function to wrap with error handling
        
    Returns:
        Wrapped function with error handling
    """
    def wrapper(*args, **kwargs):
        try:
            return func(*args, **kwargs)
        except Exception as e:
            return global_error_handler.handle_exception(e, function=func.__name__, args=args, kwargs=kwargs)
    return wrapper


def log_exception(exc: Exception, **kwargs) -> None:
    """
    Log an exception with detailed information
    
    Args:
        exc: The exception to log
        **kwargs: Additional context information
    """
    context = ', '.join(f"{k}={v}" for k, v in kwargs.items())
    logging.error(f"Error: {exc} [{context}]", exc_info=True)


def setup_exception_hooks() -> None:
    """
    Set up global exception hooks
    """
    def global_exception_handler(exc_type, exc_value, exc_traceback):
        """
        Handle uncaught exceptions globally
        """
        if issubclass(exc_type, KeyboardInterrupt):
            # Don't intercept keyboard interrupt
            sys.__excepthook__(exc_type, exc_value, exc_traceback)
            return
        
        logging.critical("Uncaught exception", exc_info=(exc_type, exc_value, exc_traceback))
    
    # Set the global exception hook
    sys.excepthook = global_exception_handler

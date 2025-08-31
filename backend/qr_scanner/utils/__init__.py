"""
EventHive Utility Module
This module provides utility functions for the QR scanner application
"""

from .helpers import (
    generate_hmac_signature,
    verify_hmac_signature,
    parse_qr_data,
    setup_logging,
    format_timestamp,
    get_camera_devices,
    is_network_available
)

from .error_handler import (
    QRScannerError,
    DatabaseError,
    ScannerError,
    ApiError,
    ValidationError,
    ConfigError,
    ErrorHandler,
    global_error_handler,
    handle_errors,
    log_exception,
    setup_exception_hooks
)

__all__ = [
    # Helpers
    'generate_hmac_signature',
    'verify_hmac_signature',
    'parse_qr_data',
    'setup_logging',
    'format_timestamp',
    'get_camera_devices',
    'is_network_available',
    
    # Error handling
    'QRScannerError',
    'DatabaseError',
    'ScannerError',
    'ApiError',
    'ValidationError',
    'ConfigError',
    'ErrorHandler',
    'global_error_handler',
    'handle_errors',
    'log_exception',
    'setup_exception_hooks'
]

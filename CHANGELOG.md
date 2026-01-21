# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2026-01-21

### Added
- **Configuration Management**: Centralized configuration with environment variable support
- **Structured Logging**: Production-ready JSON logging with levels and context
- **Input Validation**: Comprehensive request validation with sanitization
- **Custom Error Classes**: Standardized error handling with proper HTTP status codes
- **Security Middleware**: Helmet-like security headers (XSS, clickjacking protection)
- **CORS Middleware**: Configurable Cross-Origin Resource Sharing
- **Request Logging**: Request ID tracking and response timing
- **Health Check Endpoints**: `/health`, `/health/ready`, `/health/live`, `/health/detailed`
- **Graceful Shutdown**: Proper signal handling for SIGTERM/SIGINT
- **Clean Router**: Express-like routing with parameter extraction
- **PATCH Endpoint**: Partial update support for products
- **Pagination**: Query-based pagination with metadata
- **Search & Sort**: Filter products by search term and sort by fields
- **Timestamps**: `createdAt` and `updatedAt` fields on all products
- **Test Suite**: Comprehensive tests using Node.js built-in test runner

### Changed
- Refactored project structure for better maintainability
- Improved error responses with consistent format
- Enhanced rate limiter with configurable options
- Updated model layer with proper error handling

### Security
- Added protection against large payloads (DoS)
- Input sanitization to prevent XSS
- Security headers (X-Frame-Options, CSP, etc.)
- Request validation before processing

## [1.0.0] - Initial Release

### Added
- Basic CRUD operations for products
- Rate limiting middleware
- File-based JSON storage

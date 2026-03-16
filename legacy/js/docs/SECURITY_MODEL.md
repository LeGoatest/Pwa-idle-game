# SECURITY MODEL

## 1. Threat Model
- **Local State Tampering**: Since state is stored in IndexedDB, users can modify it. This is accepted for a single-player idle game, but critical logic should be robust.
- **XSS**: Ensure that any user-input (if any) is sanitized before being rendered or used in htmx attributes.

## 2. Trust Boundaries
- **CDN Dependencies**: htmx is loaded from `unpkg.com`. Verify integrity if possible.
- **Service Worker**: The service worker has high authority over network requests. It must be kept secure and updated carefully.

## 3. Data Protection
- **IndexedDB**: Sensitive data should not be stored in plain text if it were a multi-player game, but for this PWA, it's the primary storage.
- **HTTPS**: The application must be served over HTTPS to support PWA features and ensure data integrity in transit.

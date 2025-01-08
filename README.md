## AuthSync - Secure Session Transfer via QR Code
Overview
AuthSync is a secure and efficient session transfer system that allows users to transfer their active sessions across devices using QR codes. This project is designed to provide a seamless experience for users who want to log in to a new device while maintaining high security standards to prevent unauthorized access or replay attacks.

## Key Features

QR Code-Based Session Transfer: Users can scan a dynamically generated QR code to transfer their session securely to another device.

JWT Authentication: Utilizes JSON Web Tokens for secure user authentication and request validation.

Session Token Logic: Implements time-limited, unique session tokens to ensure QR codes cannot be reused or tampered with.

Signature Validation: Data integrity is maintained through cryptographic signing of QR code data.

Expiry Mechanism: QR codes include an expiration time to prevent replay attacks and unauthorized access.

Primary Device Confirmation: Adds an extra layer of security by requiring user confirmation from the primary device before session transfer is completed.


## Tech Stack

Backend: Node.js, Express.js

Authentication: JSON Web Tokens (JWT)

Database: MongoDB

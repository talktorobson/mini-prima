# Certificates Directory - Santander Banking Integration

## Overview
This directory stores the ICP-Brasil compatible certificates required for Santander banking API integration using mTLS (Mutual TLS) authentication.

## Required Certificates

### 1. Client Certificate (`santander-client.crt`)
- **Purpose**: Client authentication with Santander API
- **Format**: X.509 certificate in PEM format
- **Validity**: Must be valid and not expired
- **Source**: Obtained from ICP-Brasil certified authority

### 2. Private Key (`santander-client.key`)
- **Purpose**: Private key corresponding to client certificate
- **Format**: RSA/ECDSA private key in PEM format
- **Security**: Must be encrypted with passphrase
- **Storage**: Never commit to version control

### 3. CA Certificate (`santander-ca.crt`)
- **Purpose**: Santander's Certificate Authority chain
- **Format**: X.509 certificate chain in PEM format
- **Source**: Provided by Santander developer portal
- **Validation**: Used to verify Santander's server certificates

## Certificate Setup Instructions

### Step 1: Obtain ICP-Brasil Certificate
1. Contact an ICP-Brasil certified authority
2. Complete the certificate request process
3. Provide legal entity documentation
4. Pay certificate fees (typically R$ 400-800/year)

### Step 2: Download Santander CA Certificate
1. Login to Santander Developer Portal
2. Navigate to Security section
3. Download the CA certificate chain
4. Save as `santander-ca.crt`

### Step 3: Configure Certificate Files
```bash
# Set proper file permissions
chmod 600 santander-client.key
chmod 644 santander-client.crt
chmod 644 santander-ca.crt
```

### Step 4: Update Environment Variables
```bash
# In .env file
SANTANDER_CERT_PATH=./certs/santander-client.crt
SANTANDER_KEY_PATH=./certs/santander-client.key
SANTANDER_CA_PATH=./certs/santander-ca.crt
SANTANDER_CERT_PASSPHRASE=your-certificate-passphrase
```

## Security Best Practices

### File Permissions
- Private key file should be readable only by application user
- Certificate files can be world-readable
- Never store private keys in version control

### Certificate Rotation
- Monitor certificate expiry dates
- Implement automated renewal alerts
- Test certificate updates in sandbox first
- Maintain backup certificates

### Storage Security
- Use encrypted file system for certificate storage
- Consider using hardware security modules (HSM)
- Implement certificate backup and recovery procedures
- Log certificate access and usage

## Validation Commands

### Verify Certificate Format
```bash
# Check certificate validity
openssl x509 -in santander-client.crt -text -noout

# Verify private key
openssl rsa -in santander-client.key -check

# Check certificate chain
openssl verify -CAfile santander-ca.crt santander-client.crt
```

### Test Certificate Matching
```bash
# Verify certificate and key match
openssl x509 -noout -modulus -in santander-client.crt | openssl md5
openssl rsa -noout -modulus -in santander-client.key | openssl md5
# Both commands should return the same hash
```

## Development vs Production

### Development Environment
- Use Santander sandbox certificates
- Lower security requirements
- Certificate can be self-signed for testing

### Production Environment
- Must use valid ICP-Brasil certificates
- Full certificate chain validation required
- Proper certificate lifecycle management

## Troubleshooting

### Common Issues
1. **Certificate Expired**: Check expiry with `openssl x509 -enddate -noout -in cert.crt`
2. **Wrong Format**: Convert with `openssl x509 -inform DER -outform PEM`
3. **Key Mismatch**: Verify certificate and key correspondence
4. **Passphrase Issues**: Ensure correct passphrase in environment

### Support Contacts
- **Santander Developer Support**: developer-support@santander.com.br
- **ICP-Brasil Authority**: Contact your certificate provider
- **Technical Support**: See Santander Developer Portal documentation

## File Structure
```
certs/
├── README.md                    # This documentation
├── santander-client.crt         # Client certificate (add manually)
├── santander-client.key         # Private key (add manually)
├── santander-ca.crt            # CA certificate (add manually)
└── .gitignore                  # Prevents certificate files from being committed
```

## Important Notes

⚠️ **SECURITY WARNING**: Never commit certificate files to version control
⚠️ **BACKUP**: Always maintain secure backups of certificates
⚠️ **MONITORING**: Set up alerts for certificate expiry
⚠️ **TESTING**: Always test certificates in sandbox before production

For questions about certificate setup, refer to the banking integration documentation or contact the development team.
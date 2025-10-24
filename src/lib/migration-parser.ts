// Migration QR code parser for Google Authenticator export format
// Based on the protobuf structure used by Google Authenticator

interface MigrationAccount {
  secret: string;
  name?: string;
  issuer?: string;
  algorithm?: 'SHA1' | 'SHA256' | 'SHA512';
  type?: 'TOTP' | 'HOTP';
  counter?: number;
  digits?: 6 | 8;
}

interface MigrationPayload {
  accounts: MigrationAccount[];
  version?: number;
  batchId?: number;
  batchIndex?: number;
  batchSize?: number;
}

// Protobuf field types for migration format
const FIELD_TYPES = {
  SECRET: 1,
  NAME: 2,
  ISSUER: 3,
  ALGORITHM: 4,
  DIGITS: 5,
  TYPE: 6,
  COUNTER: 7,
};

const ALGORITHM_MAP: { [key: number]: 'SHA1' | 'SHA256' | 'SHA512' } = {
  0: 'SHA1',  // ALGORITHM_UNSPECIFIED defaults to SHA1
  1: 'SHA1',
  2: 'SHA256',
  3: 'SHA512',
};

const TYPE_MAP: { [key: number]: 'TOTP' | 'HOTP' } = {
  0: 'TOTP',  // OTP_TYPE_UNSPECIFIED defaults to TOTP
  1: 'TOTP',
  2: 'TOTP',
};

const DIGITS_MAP: { [key: number]: 6 | 8 } = {
  0: 6,  // DIGIT_COUNT_UNSPECIFIED defaults to 6
  1: 6,
  2: 8,
};

export function parseMigrationUri(uri: string): MigrationPayload | null {
  try {
    // Check if it's a migration URI
    if (!uri.startsWith('otpauth-migration://offline?')) {
      return null;
    }

    // Extract the data parameter
    const url = new URL(uri);
    const encodedData = url.searchParams.get('data');

    if (!encodedData) {
      return null;
    }

    // Decode from URL-safe base64
    const base64Data = encodedData
      .replace(/-/g, '+')
      .replace(/_/g, '/')
      .replace(/%2F/g, '/')
      .replace(/%2B/g, '+')
      .replace(/%3D/g, '=');

    // Add padding if necessary
    const paddedData = base64Data + '='.repeat((4 - base64Data.length % 4) % 4);

    // Decode base64 to binary
    const binaryString = atob(paddedData);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Parse the protobuf-encoded data
    return parseProtobuf(bytes);
  } catch (error) {
    console.error('Error parsing migration URI:', error);
    return null;
  }
}

function parseProtobuf(bytes: Uint8Array): MigrationPayload {
  const payload: MigrationPayload = {
    accounts: [],
  };

  let position = 0;

  while (position < bytes.length) {
    const { fieldNumber, wireType, value, nextPosition } = readField(bytes, position);
    position = nextPosition;

    if (fieldNumber === 1 && wireType === 2) {
      // This is an account entry
      const account = parseAccount(value as Uint8Array);
      if (account) {
        payload.accounts.push(account);
      }
    } else if (fieldNumber === 2 && wireType === 0) {
      payload.version = value as number;
    } else if (fieldNumber === 3 && wireType === 0) {
      payload.batchId = value as number;
    } else if (fieldNumber === 4 && wireType === 0) {
      payload.batchIndex = value as number;
    } else if (fieldNumber === 5 && wireType === 0) {
      payload.batchSize = value as number;
    }
  }

  return payload;
}

function parseAccount(bytes: Uint8Array): MigrationAccount | null {
  const account: MigrationAccount = {
    secret: '',
    algorithm: 'SHA1',
    type: 'TOTP',
    digits: 6,
  };

  let position = 0;

  while (position < bytes.length) {
    const { fieldNumber, wireType, value, nextPosition } = readField(bytes, position);
    position = nextPosition;

    switch (fieldNumber) {
      case FIELD_TYPES.SECRET:
        if (wireType === 2) {
          // Convert bytes to base32
          account.secret = bytesToBase32(value as Uint8Array);
        }
        break;
      case FIELD_TYPES.NAME:
        if (wireType === 2) {
          account.name = new TextDecoder().decode(value as Uint8Array);
        }
        break;
      case FIELD_TYPES.ISSUER:
        if (wireType === 2) {
          account.issuer = new TextDecoder().decode(value as Uint8Array);
        }
        break;
      case FIELD_TYPES.ALGORITHM:
        if (wireType === 0) {
          account.algorithm = ALGORITHM_MAP[value as number] || 'SHA1';
        }
        break;
      case FIELD_TYPES.DIGITS:
        if (wireType === 0) {
          account.digits = DIGITS_MAP[value as number] || 6;
        }
        break;
      case FIELD_TYPES.TYPE:
        if (wireType === 0) {
          account.type = TYPE_MAP[value as number] || 'TOTP';
        }
        break;
      case FIELD_TYPES.COUNTER:
        if (wireType === 0) {
          account.counter = value as number;
        }
        break;
    }
  }

  return account.secret ? account : null;
}

function readField(bytes: Uint8Array, position: number): {
  fieldNumber: number;
  wireType: number;
  value: number | Uint8Array;
  nextPosition: number;
} {
  // Read the tag (field number and wire type)
  const { value: tag, nextPosition: tagEnd } = readVarint(bytes, position);

  const wireType = tag & 0x7;
  const fieldNumber = tag >>> 3;

  let value: number | Uint8Array;
  let nextPosition = tagEnd;

  switch (wireType) {
    case 0: { // Varint
      const varintResult = readVarint(bytes, tagEnd);
      value = varintResult.value;
      nextPosition = varintResult.nextPosition;
      break;
    }
    case 2: { // Length-delimited
      const lengthResult = readVarint(bytes, tagEnd);
      const length = lengthResult.value;
      value = bytes.slice(lengthResult.nextPosition, lengthResult.nextPosition + length);
      nextPosition = lengthResult.nextPosition + length;
      break;
    }
    default:
      // Skip unknown wire types
      value = 0;
      nextPosition = tagEnd + 1;
  }

  return { fieldNumber, wireType, value, nextPosition };
}

function readVarint(bytes: Uint8Array, position: number): {
  value: number;
  nextPosition: number;
} {
  let value = 0;
  let shift = 0;
  let byte: number;
  let nextPosition = position;

  do {
    if (nextPosition >= bytes.length) {
      throw new Error('Varint extends beyond buffer');
    }
    byte = bytes[nextPosition++];
    value |= (byte & 0x7f) << shift;
    shift += 7;
  } while (byte & 0x80);

  return { value, nextPosition };
}

function bytesToBase32(bytes: Uint8Array): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let result = '';
  let bits = 0;
  let value = 0;

  for (let i = 0; i < bytes.length; i++) {
    value = (value << 8) | bytes[i];
    bits += 8;

    while (bits >= 5) {
      result += alphabet[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    result += alphabet[(value << (5 - bits)) & 31];
  }

  // Add padding to make the length a multiple of 8
  while (result.length % 8 !== 0) {
    result += '=';
  }

  return result;
}

export function convertMigrationToAccounts(payload: MigrationPayload): Array<{
  issuer: string;
  account_name: string;
  secret: string;
  algorithm: 'SHA1' | 'SHA256' | 'SHA512';
  digits: 6 | 8;
  period: number;
}> {
  return payload.accounts
    .filter(account => account.type === 'TOTP')
    .map(account => ({
      issuer: account.issuer || 'Unknown',
      account_name: account.name || 'Unknown Account',
      secret: account.secret,
      algorithm: account.algorithm || 'SHA1',
      digits: account.digits || 6,
      period: 30, // Google Authenticator uses 30 second periods for TOTP
    }));
}
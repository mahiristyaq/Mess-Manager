# Security Specification: Mess Manager Firestore Security

## 1. Data Invariants
1. Every mess document path `/messes_v3/{messKey}/data/main` must have a valid `messKey` string (alphanumeric and base64url characters, max 128 characters).
2. The payload must be a valid object containing `version` (number), `members` (list of member names, size <= 100), and `config` (object containing `messName` and `month`).
3. Transactions must be a bounded list (<= 2000 items) to prevent denial-of-wallet resource exhaustion.
4. Meals mapping must be an object bounded in size.
5. All non-relevant or root paths are denied by default.

## 2. The "Dirty Dozen" Malicious / Invalid Payloads
1. **Oversized Key Injection**: `messKey` with > 128 characters or illegal characters.
2. **Ghost Fields Injection**: Adding forbidden system fields into root.
3. **Negative Version**: `version: -1` or non-numeric types.
4. **Missing Members Array**: Document written without `members`.
5. **Giant Array Denial-of-Wallet**: Array with 10,000 fake transaction elements.
6. **Missing Config**: Missing mess configuration block.
7. **Invalid Month Format**: Injecting script tags or arbitrary strings into `config.month`.
8. **Null Type Poisoning**: Overwriting `meals` with `null` or boolean primitives.
9. **Arbitrary Collection Write**: Attempting write to `/users` or `/system_data`.
10. **Shadow Path Traversal**: Requesting `../../data` across collections.
11. **Excessive Field Payloads**: Attempting to inject 5MB payloads.
12. **Malformed Types**: Setting `config.fixedCost` to an array instead of a numeric value.

## 3. Defense Implementation
- Global default-deny rule on all documents.
- Explicit path rule on `/messes_v3/{messKey}/data/main` validating key format and payload schema.

# Security Specification & Test Matrix: AdEarn Telegram Mini App

## 1. Data Invariants
- **Users**: A user document at `/users/{userId}` can only be created or modified by the owner (`request.auth.uid == userId`) or an admin.
- **Tasks**: Public tasks at `/tasks/{taskId}` can be read by anyone, but created/updated/deleted only by authenticated administrators.
- **Completions**: A completion record at `/completions/{completionId}` can only be created by the authenticated user if `request.resource.data.userId == request.auth.uid`.
- **Withdrawals**: A withdrawal request at `/withdrawals/{withdrawalId}` can only be created by the authenticated user (`request.resource.data.userId == request.auth.uid`). Once created, only admins can alter status to 'approved' or 'rejected'.

## 2. The Dirty Dozen Payloads (Targeting Rejection)
1. User profile creation with spoofed UID: `userId` does not match `request.auth.uid`.
2. User profile modification to grant arbitrary `balance` without bounds or modifying `userId`.
3. Anonymous / Unauthenticated write to `/tasks/task123`.
4. Normal user attempting to create or delete tasks in `/tasks/{taskId}`.
5. Task completion submission with spoofed `userId` of another user.
6. Withdrawal creation with negative amount or non-existent method.
7. User attempting to approve their own withdrawal request by updating status from `pending` to `approved`.
8. Giant string injection (buffer/wallet exhaust attack) > 10KB into task description or user display name.
9. Malformed document ID with special characters or path traversal.
10. Unauthenticated read of sensitive user private withdrawal account numbers.
11. Arbitrary root collection write (e.g. `/system_secrets/config`).
12. Attempt to update immutable fields like `createdAt` or initial `userId`.

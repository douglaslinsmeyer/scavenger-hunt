
# Backend API TDD Test Suite

## Overview
This document outlines the comprehensive Test-Driven Development (TDD) test suite for the Scavenger Hunt Backend API. Tests are organized by feature modules following the modular monolith architecture.

## Test Framework & Tools
- **Framework**: Jest with TypeScript
- **API Testing**: Supertest
- **Database**: Test database with Prisma migrations
- **Mocking**: Jest mocks for external services
- **Coverage Target**: Minimum 80%

## 1. Authentication Module Tests

### 1.1 Social Authentication (OAuth)
```typescript
describe('Social Authentication', () => {
  describe('POST /api/auth/social', () => {
    it('should create new user on first Google login', async () => {
      // Given: Valid Google OAuth token
      // When: POST to /api/auth/social with provider=google
      // Then: User created with google ID, JWT cookie set
    });

    it('should login existing user with Facebook OAuth', async () => {
      // Given: Existing user with Facebook ID
      // When: POST to /api/auth/social with provider=facebook
      // Then: JWT cookie set, user data returned
    });

    it('should sync profile data from OAuth provider', async () => {
      // Given: OAuth token with updated profile
      // When: User logs in
      // Then: Name, email, avatar updated in database
    });

    it('should reject invalid OAuth tokens', async () => {
      // Given: Invalid/expired OAuth token
      // When: POST to /api/auth/social
      // Then: 401 Unauthorized
    });

    it('should handle OAuth provider failures gracefully', async () => {
      // Given: OAuth provider returns error
      // When: Attempting login
      // Then: 503 Service Unavailable with user-friendly message
    });

    it('should assign organizer role by default', async () => {
      // Given: New user via OAuth
      // When: Account created
      // Then: User has 'organizer' role
    });
  });
});
```

### 1.2 Player Authentication
```typescript
describe('Player Authentication', () => {
  describe('POST /api/auth/player', () => {
    it('should authenticate player with correct PIN', async () => {
      // Given: Valid hunt code, username, and PIN
      // When: POST to /api/auth/player
      // Then: JWT token with hunt-specific claims returned
    });

    it('should reject incorrect PIN with rate limiting', async () => {
      // Given: Valid username but wrong PIN
      // When: Multiple failed attempts
      // Then: 429 Too Many Requests after 5 attempts
    });

    it('should enforce username uniqueness per hunt', async () => {
      // Given: Existing username in hunt
      // When: Attempt to use same username
      // Then: 409 Conflict
    });

    it('should allow same username across different hunts', async () => {
      // Given: Username exists in hunt A
      // When: Same username used for hunt B
      // Then: Authentication succeeds
    });

    it('should reject expired hunt codes', async () => {
      // Given: Hunt with past end time
      // When: Player attempts to join
      // Then: 403 Forbidden
    });

    it('should enforce hunt player limits', async () => {
      // Given: Hunt at maximum capacity
      // When: New player attempts to join
      // Then: 403 Forbidden with capacity message
    });

    it('should validate PIN format (4-6 digits)', async () => {
      // Given: PIN with invalid format
      // When: Authentication attempt
      // Then: 400 Bad Request
    });

    it('should create player session without expiration', async () => {
      // Given: Successful player authentication
      // When: JWT decoded
      // Then: No exp claim present
    });
  });

  describe('PIN Reset Flow', () => {
    it('should allow organizer to reset player PIN', async () => {
      // Given: Organizer authenticated, valid player
      // When: POST /api/players/:id/reset-pin
      // Then: Temporary PIN generated and returned
    });

    it('should mark PIN as temporary requiring change', async () => {
      // Given: PIN reset by organizer
      // When: Player logs in with temporary PIN
      // Then: Response includes mustChangePin: true
    });

    it('should enforce organizer permissions for PIN reset', async () => {
      // Given: Non-organizer user
      // When: Attempt PIN reset
      // Then: 403 Forbidden
    });
  });
});
```

### 1.3 Session Management
```typescript
describe('Session Management', () => {
  describe('Token Refresh', () => {
    it('should refresh valid JWT tokens', async () => {
      // Given: Valid JWT near expiration
      // When: POST /api/auth/refresh
      // Then: New JWT with extended expiration
    });

    it('should reject expired refresh tokens', async () => {
      // Given: Expired refresh token
      // When: Refresh attempt
      // Then: 401 Unauthorized
    });

    it('should maintain user claims during refresh', async () => {
      // Given: JWT with specific roles/permissions
      // When: Token refreshed
      // Then: Same claims in new token
    });
  });

  describe('Logout', () => {
    it('should clear JWT cookies on logout', async () => {
      // Given: Authenticated user
      // When: POST /api/auth/logout
      // Then: Cookie cleared with proper flags
    });

    it('should invalidate refresh tokens on logout', async () => {
      // Given: Valid refresh token
      // When: User logs out
      // Then: Refresh token no longer valid
    });
  });
});
```

## 2. Hunt Management Tests

### 2.1 Hunt CRUD Operations
```typescript
describe('Hunt Management', () => {
  describe('POST /api/hunts', () => {
    it('should create hunt with valid data', async () => {
      // Given: Authenticated organizer, valid hunt data
      // When: POST /api/hunts
      // Then: Hunt created with unique invite code
    });

    it('should auto-generate unique invite codes', async () => {
      // Given: Multiple hunts created
      // When: Checking invite codes
      // Then: All codes are unique across system
    });

    it('should validate required fields', async () => {
      // Given: Missing title or type
      // When: Create attempt
      // Then: 400 Bad Request with validation errors
    });

    it('should enforce organizer role for creation', async () => {
      // Given: Authenticated as player
      // When: Attempt to create hunt
      // Then: 403 Forbidden
    });

    it('should set creator as primary organizer', async () => {
      // Given: Hunt created by user X
      // When: Checking hunt organizers
      // Then: User X is organizer with full permissions
    });

    it('should validate date logic (start < end)', async () => {
      // Given: End time before start time
      // When: Create attempt
      // Then: 400 Bad Request
    });

    it('should allow scheduling future hunts', async () => {
      // Given: Start time in future
      // When: Hunt created
      // Then: Status remains 'draft' until start time
    });
  });

  describe('GET /api/hunts', () => {
    it('should return hunts for authenticated organizer', async () => {
      // Given: Organizer with multiple hunts
      // When: GET /api/hunts
      // Then: Only their hunts returned
    });

    it('should support pagination', async () => {
      // Given: Many hunts exist
      // When: GET /api/hunts?page=2&limit=10
      // Then: Correct page of results
    });

    it('should filter by hunt status', async () => {
      // Given: Hunts in various states
      // When: GET /api/hunts?status=active
      // Then: Only active hunts returned
    });

    it('should sort by creation date by default', async () => {
      // Given: Multiple hunts
      // When: GET /api/hunts
      // Then: Newest first
    });

    it('should include participant counts', async () => {
      // Given: Hunts with players
      // When: GET /api/hunts
      // Then: player_count included
    });
  });

  describe('PUT /api/hunts/:id', () => {
    it('should allow full edit in draft status', async () => {
      // Given: Hunt in draft status
      // When: Update any field
      // Then: Changes saved successfully
    });

    it('should restrict edits in active status', async () => {
      // Given: Active hunt
      // When: Attempt to change type/points
      // Then: 400 Bad Request
    });

    it('should allow status transitions (draft->active)', async () => {
      // Given: Draft hunt with tasks
      // When: PUT status to active
      // Then: Hunt activated, players can join
    });

    it('should prevent invalid status transitions', async () => {
      // Given: Completed hunt
      // When: Attempt to reactivate
      // Then: 400 Bad Request
    });

    it('should validate organizer permissions', async () => {
      // Given: User not organizer of hunt
      // When: Update attempt
      // Then: 403 Forbidden
    });

    it('should handle concurrent updates', async () => {
      // Given: Two simultaneous updates
      // When: Both submitted
      // Then: Version conflict handled gracefully
    });
  });

  describe('DELETE /api/hunts/:id', () => {
    it('should cascade delete all related data', async () => {
      // Given: Hunt with tasks, players, completions
      // When: DELETE /api/hunts/:id
      // Then: All related records removed
    });

    it('should only allow deletion by primary organizer', async () => {
      // Given: Co-organizer attempts delete
      // When: DELETE request
      // Then: 403 Forbidden
    });

    it('should prevent deletion of active hunts', async () => {
      // Given: Hunt with active players
      // When: Delete attempt
      // Then: 400 Bad Request
    });
  });
});
```

### 2.2 Hunt State Management
```typescript
describe('Hunt State Transitions', () => {
  it('should auto-activate hunts at start time', async () => {
    // Given: Hunt with future start time
    // When: Start time reached
    // Then: Cron job activates hunt
  });

  it('should auto-complete hunts at end time', async () => {
    // Given: Active hunt with end time
    // When: End time reached
    // Then: Hunt marked completed
  });

  it('should freeze leaderboard when paused', async () => {
    // Given: Active hunt
    // When: Status changed to paused
    // Then: No new score updates accepted
  });

  it('should allow resuming paused hunts', async () => {
    // Given: Paused hunt
    // When: Status changed to active
    // Then: Submissions accepted again
  });

  it('should notify players of state changes via WebSocket', async () => {
    // Given: Connected players
    // When: Hunt paused/resumed/ended
    // Then: Real-time notifications sent
  });
});
```

### 2.3 Multi-Organizer Support
```typescript
describe('Multi-Organizer Management', () => {
  it('should add co-organizers with specific permissions', async () => {
    // Given: Primary organizer
    // When: POST /api/hunts/:id/organizers
    // Then: Co-organizer added with custom permissions
  });

  it('should validate permission combinations', async () => {
    // Given: Invalid permission set
    // When: Adding co-organizer
    // Then: 400 Bad Request
  });

  it('should enforce permission-based access', async () => {
    // Given: Co-organizer without edit_tasks permission
    // When: Attempt to modify tasks
    // Then: 403 Forbidden
  });

  it('should allow permission updates', async () => {
    // Given: Existing co-organizer
    // When: PUT /api/hunts/:id/organizers/:userId
    // Then: Permissions updated
  });

  it('should prevent removing last organizer', async () => {
    // Given: Hunt with single organizer
    // When: Attempt to remove
    // Then: 400 Bad Request
  });
});
```

## 3. Task Management Tests

### 3.1 Task CRUD Operations
```typescript
describe('Task Management', () => {
  describe('POST /api/hunts/:huntId/tasks', () => {
    it('should create photo task with required fields', async () => {
      // Given: Valid photo task data
      // When: POST task
      // Then: Task created with type='photo'
    });

    it('should create GPS task with coordinates', async () => {
      // Given: GPS task with lat/lng/radius
      // When: POST task
      // Then: Task created with location data
    });

    it('should create checkbox task', async () => {
      // Given: Simple checkbox task
      // When: POST task
      // Then: Task created with type='checkbox'
    });

    it('should validate GPS coordinates format', async () => {
      // Given: Invalid lat/lng values
      // When: Create GPS task
      // Then: 400 Bad Request
    });

    it('should enforce unique order within hunt', async () => {
      // Given: Existing task with order 1
      // When: Create another with order 1
      // Then: 409 Conflict
    });

    it('should auto-assign next order if not specified', async () => {
      // Given: Hunt with 3 tasks
      // When: Create task without order
      // Then: Order set to 4
    });

    it('should validate conditional visibility rules', async () => {
      // Given: Condition referencing non-existent task
      // When: Create attempt
      // Then: 400 Bad Request
    });

    it('should prevent negative points', async () => {
      // Given: Task with points = -10
      // When: Create attempt
      // Then: 400 Bad Request
    });
  });

  describe('PUT /api/tasks/:id', () => {
    it('should update task in draft hunt', async () => {
      // Given: Task in draft hunt
      // When: Update any field
      // Then: Changes saved
    });

    it('should restrict updates in active hunt', async () => {
      // Given: Task in active hunt
      // When: Attempt to change points
      // Then: 400 Bad Request
    });

    it('should allow reordering tasks', async () => {
      // Given: Tasks with orders 1,2,3
      // When: Move task 3 to position 1
      // Then: Orders updated to maintain uniqueness
    });

    it('should validate circular dependencies', async () => {
      // Given: Task A depends on B
      // When: Make B depend on A
      // Then: 400 Bad Request
    });
  });

  describe('DELETE /api/tasks/:id', () => {
    it('should cascade delete completions', async () => {
      // Given: Task with completions
      // When: DELETE task
      // Then: Completions removed
    });

    it('should update dependent task conditions', async () => {
      // Given: Task B depends on Task A
      // When: Delete Task A
      // Then: Task B condition removed
    });

    it('should reorder remaining tasks', async () => {
      // Given: Tasks 1,2,3,4
      // When: Delete task 2
      // Then: Remaining are 1,2,3
    });
  });

  describe('POST /api/hunts/:huntId/tasks/bulk', () => {
    it('should import valid JSON task array', async () => {
      // Given: Valid JSON with multiple tasks
      // When: POST bulk import
      // Then: All tasks created
    });

    it('should validate all tasks before importing', async () => {
      // Given: One invalid task in array
      // When: Bulk import
      // Then: No tasks created, error returned
    });

    it('should maintain order from JSON', async () => {
      // Given: JSON with specific order
      // When: Import
      // Then: Database order matches
    });

    it('should handle duplicate detection', async () => {
      // Given: JSON with duplicate titles
      // When: Import
      // Then: Warning returned, duplicates skipped
    });
  });
});
```

### 3.2 Task Completion Flow
```typescript
describe('Task Completion', () => {
  describe('POST /api/tasks/:id/complete', () => {
    describe('Photo Tasks', () => {
      it('should accept photo upload with completion', async () => {
        // Given: Photo task, authenticated player
        // When: POST with image file
        // Then: Completion created with pending status
      });

      it('should validate file size (max 10MB)', async () => {
        // Given: Oversized image
        // When: Upload attempt
        // Then: 413 Payload Too Large
      });

      it('should validate file type (images only)', async () => {
        // Given: PDF file
        // When: Upload attempt
        // Then: 400 Bad Request
      });

      it('should compress images before storage', async () => {
        // Given: Large image upload
        // When: Processing complete
        // Then: Stored image is compressed
      });

      it('should strip EXIF data based on settings', async () => {
        // Given: Hunt with EXIF stripping enabled
        // When: Photo uploaded
        // Then: Location data removed
      });

      it('should handle concurrent uploads gracefully', async () => {
        // Given: Multiple simultaneous uploads
        // When: Processing
        // Then: All handled without conflict
      });

      it('should queue uploads during poor connectivity', async () => {
        // Given: Intermittent connection
        // When: Upload fails
        // Then: Queued for retry
      });
    });

    describe('Checkbox Tasks', () => {
      it('should complete instantly with points', async () => {
        // Given: Checkbox task worth 10 points
        // When: POST completion
        // Then: Points awarded immediately
      });

      it('should prevent duplicate completions', async () => {
        // Given: Already completed task
        // When: Complete again
        // Then: 409 Conflict
      });
    });

    describe('GPS Tasks', () => {
      it('should verify location within radius', async () => {
        // Given: GPS task, player at location
        // When: POST with coordinates
        // Then: Completion approved if within radius
      });

      it('should reject location outside radius', async () => {
        // Given: Player too far from target
        // When: Submit coordinates
        // Then: Completion rejected
      });

      it('should calculate distance accurately', async () => {
        // Given: Known coordinates
        // When: Distance calculated
        // Then: Haversine formula used correctly
      });

      it('should handle GPS unavailability', async () => {
        // Given: No GPS signal
        // When: Attempting completion
        // Then: Appropriate error message
      });
    });

    describe('Conditional Tasks', () => {
      it('should enforce prerequisite completion', async () => {
        // Given: Task requires another incomplete task
        // When: Attempt completion
        // Then: 403 Forbidden
      });

      it('should unlock when conditions met', async () => {
        // Given: Prerequisite completed
        // When: Check availability
        // Then: Task now available
      });

      it('should handle complex condition chains', async () => {
        // Given: Task C requires A AND B
        // When: Both A and B complete
        // Then: C becomes available
      });
    });
  });

  describe('PUT /api/completions/:id/verify', () => {
    it('should approve photo submission', async () => {
      // Given: Pending photo completion
      // When: Organizer approves
      // Then: Status updated, points awarded
    });

    it('should reject with feedback', async () => {
      // Given: Invalid photo submission
      // When: Reject with reason
      // Then: Player notified, can resubmit
    });

    it('should notify player via WebSocket', async () => {
      // Given: Connected player
      // When: Verification complete
      // Then: Real-time notification sent
    });

    it('should update leaderboard on approval', async () => {
      // Given: Competitive hunt
      // When: Task approved
      // Then: Leaderboard recalculated
    });

    it('should enforce organizer permissions', async () => {
      // Given: Non-organizer user
      // When: Attempt verification
      // Then: 403 Forbidden
    });

    it('should handle resubmissions', async () => {
      // Given: Previously rejected task
      // When: New photo submitted
      // Then: New completion created
    });
  });
});
```

## 4. Player Management Tests

### 4.1 Player Operations
```typescript
describe('Player Management', () => {
  describe('GET /api/hunts/:huntId/players', () => {
    it('should return all players for organizers', async () => {
      // Given: Hunt with multiple players
      // When: Organizer requests
      // Then: Full player list with scores
    });

    it('should include completion statistics', async () => {
      // Given: Players with various completions
      // When: GET players
      // Then: Completion count/percentage included
    });

    it('should support team filtering', async () => {
      // Given: Players in different teams
      // When: GET with team filter
      // Then: Only team members returned
    });

    it('should hide PINs in responses', async () => {
      // Given: Player data
      // When: Returned in API
      // Then: PIN field excluded
    });
  });

  describe('POST /api/hunts/:huntId/players/bulk', () => {
    it('should import players from CSV', async () => {
      // Given: Valid CSV with username,pin,team
      // When: Bulk import
      // Then: All players created
    });

    it('should generate PINs if not provided', async () => {
      // Given: CSV without PIN column
      // When: Import
      // Then: Random 4-digit PINs generated
    });

    it('should validate username uniqueness', async () => {
      // Given: CSV with duplicate usernames
      // When: Import
      // Then: Error with conflict details
    });

    it('should validate team assignments', async () => {
      // Given: CSV with invalid team names
      // When: Import
      // Then: Error with validation details
    });

    it('should support transaction rollback', async () => {
      // Given: Partial import failure
      // When: Error occurs
      // Then: No players created
    });
  });

  describe('DELETE /api/players/:id', () => {
    it('should remove player and completions', async () => {
      // Given: Player with task completions
      // When: DELETE player
      // Then: Player and completions removed
    });

    it('should update team scores in cooperative mode', async () => {
      // Given: Cooperative hunt, team player
      // When: Player removed
      // Then: Team score recalculated
    });

    it('should require organizer permissions', async () => {
      // Given: Non-organizer
      // When: Attempt delete
      // Then: 403 Forbidden
    });
  });
});
```

## 5. Real-time Features Tests

### 5.1 WebSocket Connection Management
```typescript
describe('WebSocket Management', () => {
  describe('Connection Handling', () => {
    it('should authenticate socket connections', async () => {
      // Given: Valid JWT token
      // When: Socket connection attempt
      // Then: Connection accepted, user identified
    });

    it('should reject unauthenticated connections', async () => {
      // Given: No/invalid token
      // When: Connection attempt
      // Then: Connection refused
    });

    it('should join hunt-specific rooms', async () => {
      // Given: Player/organizer in hunt
      // When: Socket connects
      // Then: Joined to hunt:{huntId} room
    });

    it('should handle reconnection gracefully', async () => {
      // Given: Previous connection lost
      // When: Client reconnects
      // Then: State restored, missed events queued
    });

    it('should enforce connection limits', async () => {
      // Given: Max connections reached
      // When: New connection attempt
      // Then: Oldest connection dropped
    });
  });

  describe('Event Broadcasting', () => {
    it('should broadcast leaderboard updates to hunt room', async () => {
      // Given: Task completion approved
      // When: Scores updated
      // Then: All hunt participants notified
    });

    it('should send targeted notifications', async () => {
      // Given: Photo verified
      // When: Event triggered
      // Then: Only submitting player notified
    });

    it('should batch rapid updates', async () => {
      // Given: Multiple quick score changes
      // When: Broadcasting
      // Then: Updates batched to reduce traffic
    });

    it('should handle room isolation', async () => {
      // Given: Multiple active hunts
      // When: Event in hunt A
      // Then: Hunt B receives no events
    });
  });

  describe('Redis Pub/Sub Scaling', () => {
    it('should sync events across server instances', async () => {
      // Given: Multiple server nodes
      // When: Event on node 1
      // Then: Broadcast to clients on node 2
    });

    it('should handle Redis failures', async () => {
      // Given: Redis connection lost
      // When: Events triggered
      // Then: Fallback to in-memory (with warning)
    });
  });
});
```

## 6. Performance & Scalability Tests

### 6.1 Load Testing
```typescript
describe('Performance Tests', () => {
  it('should handle 20 concurrent users per hunt', async () => {
    // Given: Load test scenario
    // When: 20 users active simultaneously
    // Then: Response times < 500ms
  });

  it('should process photo uploads efficiently', async () => {
    // Given: 10 simultaneous photo uploads
    // When: Processing
    // Then: All complete within 5 seconds
  });

  it('should maintain WebSocket performance', async () => {
    // Given: 50 connected clients
    // When: Broadcasting updates
    // Then: Delivery time < 100ms
  });

  it('should handle database connection pooling', async () => {
    // Given: High request rate
    // When: Connection pool exhausted
    // Then: Requests queued, no failures
  });
});
```

## 7. Security Tests

### 7.1 Authentication & Authorization
```typescript
describe('Security Tests', () => {
  it('should prevent JWT token tampering', async () => {
    // Given: Modified JWT payload
    // When: API request
    // Then: 401 Unauthorized
  });

  it('should enforce CORS policies', async () => {
    // Given: Request from unauthorized origin
    // When: API call
    // Then: CORS error
  });

  it('should prevent SQL injection', async () => {
    // Given: Malicious input in queries
    // When: Processed by Prisma
    // Then: Input sanitized, no injection
  });

  it('should validate all input data', async () => {
    // Given: Invalid data types/formats
    // When: API requests
    // Then: 400 Bad Request with details
  });

  it('should rate limit authentication endpoints', async () => {
    // Given: Rapid login attempts
    // When: Threshold exceeded
    // Then: 429 Too Many Requests
  });

  it('should strip sensitive data from responses', async () => {
    // Given: API responses
    // When: Checked for sensitive fields
    // Then: No passwords, PINs, tokens exposed
  });

  it('should log security events', async () => {
    // Given: Failed auth attempts
    // When: Logged
    // Then: Winston captures with correlation ID
  });
});
```

## 8. Error Handling Tests

### 8.1 Graceful Degradation
```typescript
describe('Error Handling', () => {
  it('should handle database connection loss', async () => {
    // Given: Database unavailable
    // When: API requests made
    // Then: 503 Service Unavailable
  });

  it('should handle Redis cache failures', async () => {
    // Given: Redis down
    // When: Operations continue
    // Then: Fallback to database, performance warning
  });

  it('should validate request payloads', async () => {
    // Given: Malformed JSON
    // When: POST request
    // Then: 400 Bad Request with details
  });

  it('should handle file storage errors', async () => {
    // Given: Disk full/permissions issue
    // When: Photo upload
    // Then: 507 Insufficient Storage
  });

  it('should provide correlation IDs', async () => {
    // Given: Any error occurs
    // When: Error response
    // Then: Correlation ID for debugging
  });
});
```

## 9. Integration Tests

### 9.1 End-to-End Workflows
```typescript
describe('E2E Workflows', () => {
  it('should complete full hunt lifecycle', async () => {
    // Given: New hunt creation through completion
    // When: All steps executed
    // Then: State transitions work correctly
  });

  it('should handle player journey', async () => {
    // Given: Player joins through task completion
    // When: Full flow tested
    // Then: All features work together
  });

  it('should sync offline/online transitions', async () => {
    // Given: Offline task completions
    // When: Connection restored
    // Then: Sync completes successfully
  });
});
```

## Running the Tests

```bash
# Run all tests
npm test

# Run specific module
npm test -- auth.test.ts

# Run with coverage
npm test -- --coverage

# Run in watch mode
npm test -- --watch

# Run integration tests only
npm test -- --testNamePattern="Integration"

# Run with specific database
DATABASE_URL=postgresql://... npm test
```

## Test Data Management

- Use factories for test data creation
- Reset database between test suites
- Use transactions for test isolation
- Mock external services (OAuth, S3, etc.)
- Seed realistic data for load tests

## CI/CD Integration

```yaml
# GitHub Actions example
- name: Run Backend Tests
  run: |
    npm ci
    npm run test:ci
    npm run test:coverage
  env:
    DATABASE_URL: ${{ secrets.TEST_DATABASE_URL }}
    REDIS_URL: ${{ secrets.TEST_REDIS_URL }}
```

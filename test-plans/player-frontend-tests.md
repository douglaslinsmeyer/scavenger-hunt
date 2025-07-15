
# Player Frontend TDD Test Suite

## Overview
This document outlines the comprehensive Test-Driven Development (TDD) test suite for the Scavenger Hunt Player Frontend application built with Next.js 14, React, and TypeScript.

## Test Framework & Tools
- **Component Testing**: Jest + React Testing Library
- **Integration Testing**: Testing Library with MSW (Mock Service Worker)
- **E2E Testing**: Playwright
- **Visual Regression**: Percy (optional)
- **Coverage Target**: Minimum 80%

## 1. Authentication Tests

### 1.1 Hunt Join Flow
```typescript
describe('Hunt Join Flow', () => {
  describe('JoinHuntPage', () => {
    it('should validate invite code format', async () => {
      // Given: User on join page
      // When: Invalid code entered (too short/long)
      // Then: Show validation error
    });

    it('should check if hunt exists and is active', async () => {
      // Given: Valid invite code format
      // When: Code entered for expired hunt
      // Then: Show "Hunt not available" message
    });

    it('should redirect to username selection for valid hunt', async () => {
      // Given: Valid, active hunt code
      // When: User submits code
      // Then: Navigate to username selection
    });

    it('should handle hunt at capacity', async () => {
      // Given: Valid hunt at max players
      // When: Attempting to join
      // Then: Show capacity error
    });
  });

  describe('UsernameSelection', () => {
    it('should validate username requirements', async () => {
      // Given: Username selection screen
      // When: Invalid username (special chars, too long)
      // Then: Show validation errors
    });

    it('should check username availability in hunt', async () => {
      // Given: Valid username format
      // When: Username already taken in hunt
      // Then: Show "Username taken" error
    });

    it('should proceed to PIN creation on valid username', async () => {
      // Given: Available username
      // When: User submits
      // Then: Navigate to PIN creation
    });
  });

  describe('PINCreation', () => {
    it('should enforce PIN format (4-6 digits)', async () => {
      // Given: PIN creation screen
      // When: Invalid PIN entered
      // Then: Show format requirements
    });

    it('should mask PIN input for security', async () => {
      // Given: PIN input field
      // When: User types
      // Then: Show masked characters
    });

    it('should confirm PIN before submission', async () => {
      // Given: PIN entered
      // When: Confirmation doesn't match
      // Then: Show mismatch error
    });

    it('should create player and authenticate on success', async () => {
      // Given: Valid PIN confirmed
      // When: User submits
      // Then: Create player, set JWT, redirect to hunt
    });
  });
});
```

### 1.2 Player Login
```typescript
describe('Player Login', () => {
  describe('LoginForm', () => {
    it('should validate all required fields', async () => {
      // Given: Empty form
      // When: Submit attempted
      // Then: Show field validation errors
    });

    it('should handle incorrect credentials', async () => {
      // Given: Valid form data
      // When: Wrong PIN submitted
      // Then: Show authentication error
    });

    it('should implement rate limiting feedback', async () => {
      // Given: Multiple failed attempts
      // When: Rate limit hit
      // Then: Show cooldown timer
    });

    it('should store auth token and redirect on success', async () => {
      // Given: Correct credentials
      // When: Login successful
      // Then: Store JWT, redirect to hunt dashboard
    });

    it('should handle temporary PIN flag', async () => {
      // Given: Login with temp PIN
      // When: Authentication succeeds
      // Then: Redirect to PIN change screen
    });
  });

  describe('Session Management', () => {
    it('should persist player session', async () => {
      // Given: Authenticated player
      // When: Page refresh
      // Then: Remain authenticated
    });

    it('should handle expired sessions', async () => {
      // Given: Expired JWT
      // When: API call made
      // Then: Redirect to login
    });

    it('should clear session on logout', async () => {
      // Given: Authenticated player
      // When: Logout clicked
      // Then: Clear storage, redirect to join
    });
  });
});
```

## 2. Hunt Dashboard Tests

### 2.1 Hunt Overview
```typescript
describe('Hunt Dashboard', () => {
  describe('HuntHeader', () => {
    it('should display hunt title and description', async () => {
      // Given: Active hunt
      // When: Dashboard loads
      // Then: Show hunt details
    });

    it('should show hunt status indicators', async () => {
      // Given: Hunt in various states
      // When: Status changes
      // Then: Update status badge
    });

    it('should display time remaining for active hunts', async () => {
      // Given: Hunt with end time
      // When: Dashboard renders
      // Then: Show countdown timer
    });

    it('should handle paused hunt state', async () => {
      // Given: Paused hunt
      // When: Viewing dashboard
      // Then: Show pause indicator, disable submissions
    });
  });

  describe('PlayerStats', () => {
    it('should show current score', async () => {
      // Given: Player with completed tasks
      // When: Stats component renders
      // Then: Display total points
    });

    it('should show task completion progress', async () => {
      // Given: Hunt with X tasks
      // When: Y tasks completed
      // Then: Show Y/X progress
    });

    it('should display team information if applicable', async () => {
      // Given: Player assigned to team
      // When: Viewing stats
      // Then: Show team name and color
    });

    it('should handle points-disabled hunts', async () => {
      // Given: Hunt with points disabled
      // When: Viewing stats
      // Then: Hide score, show completion only
    });
  });
});
```

### 2.2 Navigation
```typescript
describe('Navigation', () => {
  describe('BottomNavigation', () => {
    it('should highlight active section', async () => {
      // Given: Navigation bar
      // When: On specific page
      // Then: Highlight corresponding nav item
    });

    it('should navigate between sections', async () => {
      // Given: Any page
      // When: Nav item clicked
      // Then: Route to selected section
    });

    it('should show unread notification badge', async () => {
      // Given: New task verification
      // When: Not yet viewed
      // Then: Show notification dot
    });

    it('should persist across all hunt pages', async () => {
      // Given: Hunt navigation
      // When: Changing pages
      // Then: Bottom nav remains visible
    });
  });
});
```

## 3. Task List Tests

### 3.1 Task Display
```typescript
describe('Task List', () => {
  describe('TaskList Component', () => {
    it('should display all available tasks', async () => {
      // Given: Hunt with multiple tasks
      // When: Task list loads
      // Then: Show all tasks in order
    });

    it('should indicate task types with icons', async () => {
      // Given: Photo, checkbox, GPS tasks
      // When: Rendered
      // Then: Show appropriate icons
    });

    it('should show completion status', async () => {
      // Given: Mix of completed/pending tasks
      // When: List renders
      // Then: Show checkmarks for completed
    });

    it('should display points if enabled', async () => {
      // Given: Hunt with points
      // When: Task card renders
      // Then: Show point values
    });

    it('should handle conditional task visibility', async () => {
      // Given: Task with prerequisites
      // When: Prerequisites not met
      // Then: Hide or disable task
    });

    it('should show locked state for unavailable tasks', async () => {
      // Given: Conditional task locked
      // When: Viewing list
      // Then: Show lock icon and reason
    });
  });

  describe('TaskCard', () => {
    it('should expand to show full description', async () => {
      // Given: Task with long description
      // When: Card clicked
      // Then: Expand to show full text
    });

    it('should navigate to task detail on click', async () => {
      // Given: Any task
      // When: Card clicked
      // Then: Route to task completion screen
    });

    it('should show verification status for photo tasks', async () => {
      // Given: Submitted photo task
      // When: Pending/approved/rejected
      // Then: Show appropriate status
    });

    it('should display rejection reason if applicable', async () => {
      // Given: Rejected photo task
      // When: Viewing card
      // Then: Show rejection feedback
    });
  });

  describe('TaskFiltering', () => {
    it('should filter by completion status', async () => {
      // Given: Filter controls
      // When: "Incomplete" selected
      // Then: Show only pending tasks
    });

    it('should sort by different criteria', async () => {
      // Given: Sort options
      // When: "Points" selected
      // Then: Order by point value
    });

    it('should search tasks by name', async () => {
      // Given: Search input
      // When: Query entered
      // Then: Filter matching tasks
    });
  });
});
```

## 4. Task Completion Tests

### 4.1 Photo Tasks
```typescript
describe('Photo Task Completion', () => {
  describe('PhotoCapture', () => {
    it('should request camera permissions', async () => {
      // Given: Photo task screen
      // When: Camera accessed
      // Then: Show permission prompt
    });

    it('should handle permission denial gracefully', async () => {
      // Given: Camera permission denied
      // When: Attempting capture
      // Then: Show file upload alternative
    });

    it('should allow photo capture from camera', async () => {
      // Given: Camera permission granted
      // When: Photo taken
      // Then: Show preview
    });

    it('should support file upload fallback', async () => {
      // Given: File input
      // When: Image selected
      // Then: Process and preview
    });

    it('should validate file size (max 10MB)', async () => {
      // Given: Large file selected
      // When: Over limit
      // Then: Show size error
    });

    it('should validate file type', async () => {
      // Given: Non-image file
      // When: Selected
      // Then: Show type error
    });

    it('should compress images client-side', async () => {
      // Given: Large image
      // When: Processing
      // Then: Reduce size before upload
    });

    it('should show upload progress', async () => {
      // Given: Image being uploaded
      // When: In progress
      // Then: Show progress bar
    });

    it('should handle upload failures', async () => {
      // Given: Network error
      // When: Upload fails
      // Then: Show retry option
    });

    it('should queue uploads when offline', async () => {
      // Given: No connection
      // When: Photo submitted
      // Then: Queue for later sync
    });
  });

  describe('PhotoAnnotation', () => {
    it('should allow adding caption to photo', async () => {
      // Given: Photo preview
      // When: Caption added
      // Then: Include with submission
    });

    it('should show EXIF data warning if applicable', async () => {
      // Given: Photo with location data
      // When: Hunt strips EXIF
      // Then: Show privacy notice
    });
  });
});
```

### 4.2 Checkbox Tasks
```typescript
describe('Checkbox Task Completion', () => {
  it('should complete on single click', async () => {
    // Given: Checkbox task
    // When: Checkbox clicked
    // Then: Mark complete immediately
  });

  it('should show confirmation dialog', async () => {
    // Given: Checkbox task
    // When: About to complete
    // Then: Confirm before marking done
  });

  it('should prevent duplicate completion', async () => {
    // Given: Already completed task
    // When: Clicked again
    // Then: No action taken
  });

  it('should update score immediately', async () => {
    // Given: Task worth points
    // When: Completed
    // Then: Update player score
  });

  it('should work offline', async () => {
    // Given: No connection
    // When: Task completed
    // Then: Store locally, sync later
  });
});
```

### 4.3 GPS Tasks
```typescript
describe('GPS Task Completion', () => {
  describe('LocationVerification', () => {
    it('should request location permissions', async () => {
      // Given: GPS task
      // When: Opened
      // Then: Request location access
    });

    it('should show current location on map', async () => {
      // Given: Location permission granted
      // When: GPS task opened
      // Then: Display map with current position
    });

    it('should show target area on map', async () => {
      // Given: GPS task with coordinates
      // When: Map loads
      // Then: Show target circle/radius
    });

    it('should calculate distance to target', async () => {
      // Given: Current location known
      // When: Viewing GPS task
      // Then: Show distance to target
    });

    it('should verify when within radius', async () => {
      // Given: Player at target location
      // When: Verify clicked
      // Then: Complete task successfully
    });

    it('should reject when outside radius', async () => {
      // Given: Player too far away
      // When: Verify attempted
      // Then: Show distance error
    });

    it('should handle GPS unavailability', async () => {
      // Given: GPS disabled/unavailable
      // When: Task opened
      // Then: Show enablement instructions
    });

    it('should update location in real-time', async () => {
      // Given: Map view open
      // When: Player moves
      // Then: Update position marker
    });

    it('should work with offline maps', async () => {
      // Given: Map tiles cached
      // When: Offline
      // Then: Show cached map data
    });
  });
});
```

## 5. Leaderboard Tests

### 5.1 Leaderboard Display
```typescript
describe('Leaderboard', () => {
  describe('LeaderboardView', () => {
    it('should show all players ranked by score', async () => {
      // Given: Competitive hunt
      // When: Leaderboard loads
      // Then: Display players ordered by points
    });

    it('should highlight current player', async () => {
      // Given: Player in list
      // When: Viewing leaderboard
      // Then: Highlight own entry
    });

    it('should show team groupings in team mode', async () => {
      // Given: Team-based hunt
      // When: Viewing leaderboard
      // Then: Group by teams
    });

    it('should display completion percentage', async () => {
      // Given: Players with various progress
      // When: Displayed
      // Then: Show % tasks completed
    });

    it('should handle ties appropriately', async () => {
      // Given: Players with same score
      // When: Ranking
      // Then: Show same rank number
    });

    it('should update in real-time', async () => {
      // Given: Leaderboard open
      // When: Score changes via WebSocket
      // Then: Update positions smoothly
    });

    it('should show final results for completed hunts', async () => {
      // Given: Hunt ended
      // When: Viewing leaderboard
      // Then: Show final standings with badges
    });
  });

  describe('LeaderboardFilters', () => {
    it('should filter by team', async () => {
      // Given: Team filter
      // When: Team selected
      // Then: Show only team members
    });

    it('should toggle between individual and team views', async () => {
      // Given: Cooperative hunt
      // When: View toggled
      // Then: Switch ranking display
    });
  });
});
```

## 6. Real-time Features Tests

### 6.1 WebSocket Integration
```typescript
describe('Real-time Updates', () => {
  describe('WebSocket Connection', () => {
    it('should establish connection on hunt join', async () => {
      // Given: Authenticated player
      // When: Entering hunt
      // Then: Connect to hunt room
    });

    it('should handle connection loss gracefully', async () => {
      // Given: Active connection
      // When: Connection drops
      // Then: Show offline indicator
    });

    it('should auto-reconnect when possible', async () => {
      // Given: Lost connection
      // When: Network returns
      // Then: Reconnect automatically
    });

    it('should resync state after reconnection', async () => {
      // Given: Reconnected
      // When: State may be stale
      // Then: Fetch latest data
    });
  });

  describe('Live Updates', () => {
    it('should update leaderboard positions', async () => {
      // Given: Leaderboard visible
      // When: Score change event
      // Then: Animate position changes
    });

    it('should show task completion notifications', async () => {
      // Given: Photo task pending
      // When: Approved by organizer
      // Then: Show success notification
    });

    it('should update hunt status changes', async () => {
      // Given: Active hunt
      // When: Hunt paused/ended
      // Then: Update UI immediately
    });

    it('should handle player join notifications', async () => {
      // Given: In hunt
      // When: New player joins
      // Then: Show join message
    });
  });
});
```

## 7. Offline Functionality Tests

### 7.1 Service Worker
```typescript
describe('Offline Functionality', () => {
  describe('ServiceWorker', () => {
    it('should cache essential assets', async () => {
      // Given: First visit
      // When: Service worker installs
      // Then: Cache app shell
    });

    it('should serve cached content when offline', async () => {
      // Given: Cached assets
      // When: Offline
      // Then: App loads from cache
    });

    it('should queue API requests when offline', async () => {
      // Given: No connection
      // When: Actions performed
      // Then: Queue for sync
    });

    it('should sync queued actions when online', async () => {
      // Given: Queued actions
      // When: Connection restored
      // Then: Process queue
    });
  });

  describe('Local Storage', () => {
    it('should persist hunt data locally', async () => {
      // Given: Hunt data fetched
      // When: Stored
      // Then: Available offline
    });

    it('should store task completions locally', async () => {
      // Given: Task completed offline
      // When: Saved
      // Then: Persist until synced
    });

    it('should handle storage quota limits', async () => {
      // Given: Storage near limit
      // When: New data added
      // Then: Remove old data
    });

    it('should encrypt sensitive data', async () => {
      // Given: Auth tokens
      // When: Stored locally
      // Then: Encrypt before storage
    });
  });
});
```

## 8. Accessibility Tests

### 8.1 Screen Reader Support
```typescript
describe('Accessibility', () => {
  describe('ScreenReader', () => {
    it('should announce page changes', async () => {
      // Given: Screen reader active
      // When: Navigation occurs
      // Then: Announce new page
    });

    it('should provide alt text for all images', async () => {
      // Given: Images in app
      // When: Screen reader reads
      // Then: Meaningful descriptions
    });

    it('should support keyboard navigation', async () => {
      // Given: No mouse
      // When: Tab navigation
      // Then: Access all interactive elements
    });

    it('should indicate focus clearly', async () => {
      // Given: Keyboard navigation
      // When: Element focused
      // Then: Visible focus indicator
    });
  });

  describe('ReducedMotion', () => {
    it('should respect motion preferences', async () => {
      // Given: Reduced motion enabled
      // When: Animations triggered
      // Then: Skip or reduce animations
    });
  });
});
```

## 9. Performance Tests

### 9.1 Load Performance
```typescript
describe('Performance', () => {
  describe('InitialLoad', () => {
    it('should achieve FCP under 1.5s', async () => {
      // Given: Cold start
      // When: App loads
      // Then: First Contentful Paint < 1.5s
    });

    it('should be interactive under 3s', async () => {
      // Given: Page loading
      // When: TTI measured
      // Then: Time to Interactive < 3s
    });

    it('should lazy load images', async () => {
      // Given: Long task list
      // When: Scrolling
      // Then: Load images as needed
    });

    it('should code split by route', async () => {
      // Given: Route change
      // When: New route accessed
      // Then: Load route bundle
    });
  });

  describe('RuntimePerformance', () => {
    it('should handle large task lists efficiently', async () => {
      // Given: 100+ tasks
      // When: List renders
      // Then: Virtualize rendering
    });

    it('should debounce search inputs', async () => {
      // Given: Search field
      // When: Rapid typing
      // Then: Debounce API calls
    });

    it('should optimize re-renders', async () => {
      // Given: State updates
      // When: Props change
      // Then: Minimize re-renders
    });
  });
});
```

## 10. E2E Test Scenarios

### 10.1 Complete Hunt Flow
```typescript
describe('E2E: Complete Hunt Journey', () => {
  it('should complete full hunt from join to finish', async () => {
    // Given: Fresh browser
    // When: Full hunt flow
    // Then: Successfully complete all steps
    
    // Steps:
    // 1. Land on join page
    // 2. Enter valid hunt code
    // 3. Create username
    // 4. Set PIN
    // 5. View hunt dashboard
    // 6. Complete checkbox task
    // 7. Submit photo task
    // 8. Complete GPS task
    // 9. View leaderboard
    // 10. See completion message
  });

  it('should handle offline/online transitions', async () => {
    // Given: Player mid-hunt
    // When: Connection lost and restored
    // Then: Continue seamlessly
    
    // Steps:
    // 1. Complete task online
    // 2. Go offline
    // 3. Complete task offline
    // 4. Return online
    // 5. Verify sync
  });

  it('should recover from errors gracefully', async () => {
    // Given: Various error conditions
    // When: Errors occur
    // Then: Recover without data loss
    
    // Test:
    // - Network timeouts
    // - Invalid responses  
    // - Auth expiration
    // - Server errors
  });
});
```

## Running the Tests

```bash
# Unit/Integration tests
npm test
npm test -- --coverage
npm test -- --watch

# E2E tests
npm run test:e2e
npm run test:e2e:headed  # Show browser
npm run test:e2e:debug   # Debug mode

# Visual regression
npm run test:visual

# Accessibility
npm run test:a11y

# Performance
npm run test:perf
```

## Test Utilities

```typescript
// Test helpers
export const renderWithProviders = (ui, options) => {
  // Wrap with providers (Router, Auth, Theme, etc.)
};

export const mockApiResponses = () => {
  // Setup MSW handlers
};

export const waitForLoadingToFinish = () => {
  // Wait for async operations
};

export const createMockHunt = (overrides) => {
  // Generate test data
};
```

## CI/CD Integration

```yaml
# GitHub Actions
- name: Run Player Frontend Tests
  run: |
    npm ci
    npm run test:ci
    npm run test:e2e:ci
    npm run build
```


# Admin Dashboard TDD Test Suite

## Overview
This document outlines the comprehensive Test-Driven Development (TDD) test suite for the Scavenger Hunt Admin Dashboard built with React 18, Vite, and Material-UI.

## Test Framework & Tools
- **Component Testing**: Vitest + React Testing Library
- **Integration Testing**: Testing Library with MSW (Mock Service Worker)
- **E2E Testing**: Playwright
- **State Management Testing**: Redux Toolkit Testing
- **Coverage Target**: Minimum 80%

## 1. Authentication Tests

### 1.1 Social Login Flow
```typescript
describe('Admin Authentication', () => {
  describe('LoginPage', () => {
    it('should display social login options', async () => {
      // Given: Unauthenticated user
      // When: Login page loads
      // Then: Show Google and Facebook login buttons
    });

    it('should initiate OAuth flow on provider click', async () => {
      // Given: Login page
      // When: Google button clicked
      // Then: Redirect to OAuth provider
    });

    it('should handle OAuth callback', async () => {
      // Given: OAuth callback with code
      // When: Processing callback
      // Then: Exchange for JWT, redirect to dashboard
    });

    it('should display error for failed OAuth', async () => {
      // Given: OAuth error response
      // When: Callback processed
      // Then: Show error message
    });

    it('should redirect authenticated users', async () => {
      // Given: Already authenticated
      // When: Accessing login page
      // Then: Redirect to dashboard
    });
  });

  describe('SessionManagement', () => {
    it('should persist admin session', async () => {
      // Given: Authenticated admin
      // When: Page refresh
      // Then: Remain authenticated
    });

    it('should refresh tokens automatically', async () => {
      // Given: Token near expiry
      // When: API call made
      // Then: Token refreshed silently
    });

    it('should handle session expiry', async () => {
      // Given: Expired session
      // When: Protected action attempted
      // Then: Redirect to login
    });

    it('should clear session on logout', async () => {
      // Given: Authenticated admin
      // When: Logout clicked
      // Then: Clear tokens, redirect to login
    });
  });
});
```

## 2. Dashboard Overview Tests

### 2.1 Main Dashboard
```typescript
describe('Dashboard Overview', () => {
  describe('DashboardHome', () => {
    it('should display admin name and role', async () => {
      // Given: Authenticated admin
      // When: Dashboard loads
      // Then: Show user info in header
    });

    it('should show hunt statistics cards', async () => {
      // Given: Admin with hunts
      // When: Dashboard loads
      // Then: Display active/total hunts, total players
    });

    it('should list recent hunts', async () => {
      // Given: Hunts exist
      // When: Dashboard renders
      // Then: Show recent 5 hunts with status
    });

    it('should show quick actions', async () => {
      // Given: Dashboard loaded
      // When: Viewing quick actions
      // Then: Show create hunt, view all hunts buttons
    });

    it('should display activity feed', async () => {
      // Given: Recent activities
      // When: Feed loads
      // Then: Show player joins, task completions
    });
  });

  describe('Navigation', () => {
    it('should show sidebar navigation', async () => {
      // Given: Authenticated admin
      // When: Any page
      // Then: Sidebar with all sections visible
    });

    it('should highlight active section', async () => {
      // Given: On specific page
      // When: Viewing sidebar
      // Then: Active section highlighted
    });

    it('should collapse sidebar on mobile', async () => {
      // Given: Mobile viewport
      // When: Page loads
      // Then: Sidebar collapsed, hamburger shown
    });

    it('should support keyboard navigation', async () => {
      // Given: Sidebar visible
      // When: Tab key used
      // Then: Navigate through menu items
    });
  });
});
```

## 3. Hunt Management Tests

### 3.1 Hunt List
```typescript
describe('Hunt Management', () => {
  describe('HuntList', () => {
    it('should display all organizer hunts', async () => {
      // Given: Organizer with multiple hunts
      // When: Hunt list loads
      // Then: Show all hunts in table
    });

    it('should show hunt status badges', async () => {
      // Given: Hunts in various states
      // When: List renders
      // Then: Color-coded status badges
    });

    it('should support sorting', async () => {
      // Given: Hunt list
      // When: Column header clicked
      // Then: Sort by that column
    });

    it('should implement pagination', async () => {
      // Given: Many hunts
      // When: List renders
      // Then: Show pagination controls
    });

    it('should filter by status', async () => {
      // Given: Status filter dropdown
      // When: "Active" selected
      // Then: Show only active hunts
    });

    it('should search by hunt name', async () => {
      // Given: Search input
      // When: Query entered
      // Then: Filter matching hunts
    });

    it('should handle bulk actions', async () => {
      // Given: Hunts selected
      // When: Bulk action chosen
      // Then: Apply to all selected
    });
  });

  describe('HuntCreation', () => {
    it('should validate all required fields', async () => {
      // Given: Empty form
      // When: Submit attempted
      // Then: Show field errors
    });

    it('should validate date logic', async () => {
      // Given: End before start
      // When: Dates selected
      // Then: Show date error
    });

    it('should generate unique invite code', async () => {
      // Given: Hunt creation form
      // When: Code generation clicked
      // Then: Populate with unique code
    });

    it('should allow custom invite codes', async () => {
      // Given: Manual code entry
      // When: Code typed
      // Then: Validate uniqueness
    });

    it('should set hunt type options', async () => {
      // Given: Type selector
      // When: Competitive selected
      // Then: Show relevant options
    });

    it('should configure player limits', async () => {
      // Given: Player limit field
      // When: Number entered
      // Then: Validate positive integer
    });

    it('should handle form submission', async () => {
      // Given: Valid form data
      // When: Submit clicked
      // Then: Create hunt, redirect to details
    });

    it('should save draft hunts', async () => {
      // Given: Partially filled form
      // When: Save draft clicked
      // Then: Save without activation
    });
  });

  describe('HuntDetails', () => {
    it('should display hunt overview', async () => {
      // Given: Hunt selected
      // When: Details page loads
      // Then: Show all hunt information
    });

    it('should show real-time player count', async () => {
      // Given: Active hunt
      // When: Players join/leave
      // Then: Update count via WebSocket
    });

    it('should allow editing draft hunts', async () => {
      // Given: Draft hunt
      // When: Edit clicked
      // Then: Enable all fields
    });

    it('should restrict editing active hunts', async () => {
      // Given: Active hunt
      // When: Edit attempted
      // Then: Only allow safe edits
    });

    it('should manage hunt status', async () => {
      // Given: Hunt controls
      // When: Status changed
      // Then: Update with confirmation
    });

    it('should export hunt data', async () => {
      // Given: Export button
      // When: Clicked
      // Then: Download CSV/JSON
    });

    it('should display QR code for invite', async () => {
      // Given: Hunt with code
      // When: QR requested
      // Then: Generate and display
    });

    it('should copy invite link', async () => {
      // Given: Invite section
      // When: Copy clicked
      // Then: Copy to clipboard
    });
  });
});
```

### 3.2 Multi-Organizer Management
```typescript
describe('Co-Organizer Management', () => {
  describe('OrganizerList', () => {
    it('should display all hunt organizers', async () => {
      // Given: Hunt with multiple organizers
      // When: Organizer tab viewed
      // Then: List all with roles
    });

    it('should show permission matrix', async () => {
      // Given: Organizer list
      // When: Permissions viewed
      // Then: Show checkboxes for each permission
    });

    it('should allow adding co-organizers', async () => {
      // Given: Add organizer form
      // When: Email entered
      // Then: Send invitation
    });

    it('should validate organizer email', async () => {
      // Given: Email input
      // When: Invalid email
      // Then: Show validation error
    });

    it('should configure permissions', async () => {
      // Given: Permission checkboxes
      // When: Permissions selected
      // Then: Save custom permissions
    });

    it('should prevent removing last organizer', async () => {
      // Given: Single organizer
      // When: Remove attempted
      // Then: Show error message
    });

    it('should track organizer actions', async () => {
      // Given: Audit log
      // When: Viewed
      // Then: Show organizer activities
    });
  });
});
```

## 4. Task Management Tests

### 4.1 Task List
```typescript
describe('Task Management', () => {
  describe('TaskList', () => {
    it('should display all hunt tasks', async () => {
      // Given: Hunt with tasks
      // When: Task tab opened
      // Then: Show tasks in order
    });

    it('should indicate task types', async () => {
      // Given: Various task types
      // When: List renders
      // Then: Show type icons/badges
    });

    it('should allow drag-drop reordering', async () => {
      // Given: Task list
      // When: Task dragged
      // Then: Reorder and save
    });

    it('should show completion statistics', async () => {
      // Given: Tasks with completions
      // When: Stats viewed
      // Then: Show completion rate
    });

    it('should support bulk task operations', async () => {
      // Given: Tasks selected
      // When: Bulk delete chosen
      // Then: Confirm and delete
    });

    it('should filter tasks by type', async () => {
      // Given: Type filter
      // When: "Photo" selected
      // Then: Show only photo tasks
    });

    it('should search tasks by name', async () => {
      // Given: Search input
      // When: Query entered
      // Then: Filter matching tasks
    });
  });

  describe('TaskCreation', () => {
    it('should select task type first', async () => {
      // Given: Task creation
      // When: Started
      // Then: Show type selection
    });

    it('should show type-specific fields', async () => {
      // Given: GPS type selected
      // When: Form loads
      // Then: Show lat/lng/radius fields
    });

    it('should validate required fields', async () => {
      // Given: Incomplete form
      // When: Submit attempted
      // Then: Show validation errors
    });

    it('should validate GPS coordinates', async () => {
      // Given: GPS task form
      // When: Invalid coordinates
      // Then: Show format error
    });

    it('should set point values', async () => {
      // Given: Points field
      // When: Value entered
      // Then: Validate non-negative
    });

    it('should configure conditional visibility', async () => {
      // Given: Condition builder
      // When: Prerequisite selected
      // Then: Add dependency
    });

    it('should preview task appearance', async () => {
      // Given: Task form filled
      // When: Preview clicked
      // Then: Show player view
    });

    it('should support task templates', async () => {
      // Given: Template selector
      // When: Template chosen
      // Then: Pre-fill form
    });
  });

  describe('TaskEditing', () => {
    it('should load existing task data', async () => {
      // Given: Edit mode
      // When: Task loaded
      // Then: Populate all fields
    });

    it('should restrict edits in active hunts', async () => {
      // Given: Active hunt task
      // When: Editing
      // Then: Disable point changes
    });

    it('should update dependent tasks', async () => {
      // Given: Task with dependents
      // When: Task deleted
      // Then: Update conditions
    });

    it('should validate circular dependencies', async () => {
      // Given: Task A depends on B
      // When: B set to depend on A
      // Then: Show cycle error
    });
  });

  describe('BulkTaskImport', () => {
    it('should accept JSON file upload', async () => {
      // Given: Import dialog
      // When: File selected
      // Then: Parse and preview
    });

    it('should validate JSON structure', async () => {
      // Given: Invalid JSON
      // When: Import attempted
      // Then: Show structure errors
    });

    it('should preview import results', async () => {
      // Given: Valid JSON
      // When: Parsed
      // Then: Show task preview
    });

    it('should handle import conflicts', async () => {
      // Given: Duplicate task names
      // When: Import processed
      // Then: Show conflict resolution
    });

    it('should map GPS coordinates correctly', async () => {
      // Given: GPS tasks in JSON
      // When: Imported
      // Then: Convert coordinate formats
    });
  });
});
```

## 5. Photo Verification Tests

### 5.1 Verification Queue
```typescript
describe('Photo Verification', () => {
  describe('VerificationQueue', () => {
    it('should load pending submissions', async () => {
      // Given: Photo tasks with submissions
      // When: Queue loads
      // Then: Show all pending
    });

    it('should display photos in modal', async () => {
      // Given: Photo submission
      // When: Thumbnail clicked
      // Then: Open full-size modal
    });

    it('should show submission metadata', async () => {
      // Given: Submission card
      // When: Viewed
      // Then: Show player, task, time
    });

    it('should allow quick approval', async () => {
      // Given: Valid submission
      // When: Approve clicked
      // Then: Mark approved, next item
    });

    it('should require rejection reason', async () => {
      // Given: Reject clicked
      // When: No reason provided
      // Then: Show validation error
    });

    it('should support batch operations', async () => {
      // Given: Multiple selected
      // When: Batch approve
      // Then: Process all selected
    });

    it('should filter by task', async () => {
      // Given: Task filter
      // When: Task selected
      // Then: Show only that task
    });

    it('should implement keyboard shortcuts', async () => {
      // Given: Queue open
      // When: A key pressed
      // Then: Approve current item
    });

    it('should update via WebSocket', async () => {
      // Given: Queue open
      // When: New submission
      // Then: Add to queue live
    });

    it('should handle simultaneous verifiers', async () => {
      // Given: Multiple admins
      // When: Same item verified
      // Then: Handle gracefully
    });
  });

  describe('VerificationModal', () => {
    it('should zoom photo on click', async () => {
      // Given: Photo modal
      // When: Image clicked
      // Then: Toggle zoom
    });

    it('should show EXIF data if available', async () => {
      // Given: Photo with EXIF
      // When: Info clicked
      // Then: Display metadata
    });

    it('should navigate between submissions', async () => {
      // Given: Multiple pending
      // When: Next clicked
      // Then: Load next submission
    });

    it('should prefetch adjacent photos', async () => {
      // Given: Queue navigation
      // When: Viewing item
      // Then: Preload next/previous
    });
  });
});
```

## 6. Player Management Tests

### 6.1 Player List
```typescript
describe('Player Management', () => {
  describe('PlayerList', () => {
    it('should display all hunt players', async () => {
      // Given: Hunt with players
      // When: Player tab opened
      // Then: Show player table
    });

    it('should show player statistics', async () => {
      // Given: Player list
      // When: Rendered
      // Then: Show score, completion %
    });

    it('should indicate online status', async () => {
      // Given: Real-time connection
      // When: Players online
      // Then: Show status indicator
    });

    it('should support sorting', async () => {
      // Given: Player table
      // When: Column clicked
      // Then: Sort by that field
    });

    it('should filter by team', async () => {
      // Given: Team filter
      // When: Team selected
      // Then: Show team members only
    });

    it('should search players', async () => {
      // Given: Search box
      // When: Name entered
      // Then: Filter results
    });

    it('should export player list', async () => {
      // Given: Export button
      // When: Clicked
      // Then: Download CSV
    });
  });

  describe('PlayerDetails', () => {
    it('should show player profile', async () => {
      // Given: Player selected
      // When: Details viewed
      // Then: Show all player info
    });

    it('should display completion history', async () => {
      // Given: Player with completions
      // When: History tab
      // Then: Show timeline
    });

    it('should allow PIN reset', async () => {
      // Given: Reset button
      // When: Clicked
      // Then: Generate temp PIN
    });

    it('should show temporary PIN', async () => {
      // Given: PIN reset
      // When: Complete
      // Then: Display new PIN
    });

    it('should confirm player removal', async () => {
      // Given: Remove button
      // When: Clicked
      // Then: Show confirmation
    });

    it('should handle player removal', async () => {
      // Given: Removal confirmed
      // When: Processed
      // Then: Remove and update
    });

    it('should show team assignment', async () => {
      // Given: Team hunt
      // When: Player viewed
      // Then: Show team info
    });

    it('should allow team changes', async () => {
      // Given: Team selector
      // When: New team chosen
      // Then: Update assignment
    });
  });

  describe('BulkPlayerImport', () => {
    it('should accept CSV upload', async () => {
      // Given: Import dialog
      // When: CSV selected
      // Then: Parse and preview
    });

    it('should validate CSV format', async () => {
      // Given: Invalid CSV
      // When: Parsed
      // Then: Show format errors
    });

    it('should generate PINs if missing', async () => {
      // Given: CSV without PINs
      // When: Import processed
      // Then: Auto-generate PINs
    });

    it('should detect duplicate usernames', async () => {
      // Given: Duplicate in CSV
      // When: Validation
      // Then: Highlight duplicates
    });

    it('should preview import', async () => {
      // Given: Valid CSV
      // When: Processed
      // Then: Show preview table
    });

    it('should handle team assignments', async () => {
      // Given: CSV with teams
      // When: Imported
      // Then: Assign to teams
    });

    it('should rollback on error', async () => {
      // Given: Partial import
      // When: Error occurs
      // Then: Rollback all
    });
  });
});
```

## 7. Analytics & Reporting Tests

### 7.1 Hunt Analytics
```typescript
describe('Analytics', () => {
  describe('HuntAnalytics', () => {
    it('should display completion rates', async () => {
      // Given: Hunt with data
      // When: Analytics viewed
      // Then: Show task completion %
    });

    it('should show player engagement', async () => {
      // Given: Player activity
      // When: Chart loads
      // Then: Display activity graph
    });

    it('should calculate average completion time', async () => {
      // Given: Completion data
      // When: Stats calculated
      // Then: Show time metrics
    });

    it('should identify bottleneck tasks', async () => {
      // Given: Task completions
      // When: Analysis run
      // Then: Highlight slow tasks
    });

    it('should show team performance', async () => {
      // Given: Team hunt
      // When: Team tab selected
      // Then: Compare team stats
    });

    it('should export analytics data', async () => {
      // Given: Export options
      // When: Format selected
      // Then: Download report
    });

    it('should support date filtering', async () => {
      // Given: Date range picker
      // When: Dates selected
      // Then: Filter data
    });

    it('should refresh data live', async () => {
      // Given: Analytics open
      // When: New completions
      // Then: Update charts
    });
  });

  describe('PlayerAnalytics', () => {
    it('should show player progress', async () => {
      // Given: Player selected
      // When: Analytics viewed
      // Then: Show completion timeline
    });

    it('should calculate player velocity', async () => {
      // Given: Time data
      // When: Calculated
      // Then: Show tasks/hour
    });

    it('should identify struggling players', async () => {
      // Given: Completion rates
      // When: Analyzed
      // Then: Flag slow progress
    });

    it('should show comparative analysis', async () => {
      // Given: Multiple players
      // When: Compared
      // Then: Show rankings
    });
  });
});
```

## 8. Real-time Features Tests

### 8.1 Live Updates
```typescript
describe('Real-time Features', () => {
  describe('WebSocketIntegration', () => {
    it('should connect on dashboard load', async () => {
      // Given: Dashboard opened
      // When: Loaded
      // Then: Establish WebSocket
    });

    it('should join hunt-specific rooms', async () => {
      // Given: Hunt selected
      // When: Opened
      // Then: Join hunt room
    });

    it('should show connection status', async () => {
      // Given: WebSocket state
      // When: Connected/disconnected
      // Then: Update UI indicator
    });

    it('should handle reconnection', async () => {
      // Given: Connection lost
      // When: Network returns
      // Then: Auto-reconnect
    });
  });

  describe('LiveNotifications', () => {
    it('should notify of new players', async () => {
      // Given: Hunt monitoring
      // When: Player joins
      // Then: Show notification
    });

    it('should alert on photo submissions', async () => {
      // Given: Verification queue
      // When: New submission
      // Then: Show alert badge
    });

    it('should update player count live', async () => {
      // Given: Hunt overview
      // When: Players join/leave
      // Then: Update counter
    });

    it('should sync task completions', async () => {
      // Given: Task list
      // When: Task completed
      // Then: Update stats
    });

    it('should handle notification preferences', async () => {
      // Given: Settings
      // When: Notifications toggled
      // Then: Respect preferences
    });
  });
});
```

## 9. Settings & Configuration Tests

### 9.1 User Settings
```typescript
describe('Settings', () => {
  describe('UserPreferences', () => {
    it('should load current preferences', async () => {
      // Given: Settings page
      // When: Opened
      // Then: Show current values
    });

    it('should update notification settings', async () => {
      // Given: Notification toggles
      // When: Changed
      // Then: Save preferences
    });

    it('should configure language', async () => {
      // Given: Language selector
      // When: Language changed
      // Then: Update UI language
    });

    it('should set timezone', async () => {
      // Given: Timezone dropdown
      // When: Selected
      // Then: Update time displays
    });

    it('should toggle dark mode', async () => {
      // Given: Theme toggle
      // When: Clicked
      // Then: Switch theme
    });
  });

  describe('AccountManagement', () => {
    it('should display account info', async () => {
      // Given: Account section
      // When: Viewed
      // Then: Show email, provider
    });

    it('should link additional providers', async () => {
      // Given: Provider options
      // When: Link clicked
      // Then: OAuth flow
    });

    it('should handle account deletion', async () => {
      // Given: Delete option
      // When: Confirmed
      // Then: Process deletion
    });
  });
});
```

## 10. E2E Test Scenarios

### 10.1 Complete Hunt Management Flow
```typescript
describe('E2E: Hunt Management', () => {
  it('should complete full hunt creation and management', async () => {
    // Given: Fresh admin account
    // When: Full flow executed
    // Then: Hunt successfully managed
    
    // Steps:
    // 1. Login via OAuth
    // 2. Create new hunt
    // 3. Add multiple task types
    // 4. Configure settings
    // 5. Activate hunt
    // 6. Share invite link
    // 7. Monitor players joining
    // 8. Verify photo submissions
    // 9. View analytics
    // 10. Complete hunt
  });

  it('should handle multi-organizer collaboration', async () => {
    // Given: Primary organizer
    // When: Co-organizer added
    // Then: Both can manage
    
    // Steps:
    // 1. Add co-organizer
    // 2. Set permissions
    // 3. Co-organizer logs in
    // 4. Both verify photos
    // 5. Check audit log
  });

  it('should manage concurrent hunts', async () => {
    // Given: Multiple hunts
    // When: Switching between
    // Then: Maintain context
    
    // Test:
    // - Quick switching
    // - Notification routing
    // - Performance
  });
});
```

## Running the Tests

```bash
# Unit/Integration tests
npm test
npm test -- --coverage
npm test -- --watch
npm test -- --ui  # Vitest UI

# E2E tests
npm run test:e2e
npm run test:e2e:headed
npm run test:e2e:debug

# Component tests
npm run test:components

# Redux tests
npm run test:store
```

## Test Utilities

```typescript
// Test setup
export const renderWithProviders = (
  ui: React.ReactElement,
  {
    preloadedState = {},
    store = setupStore(preloadedState),
    ...renderOptions
  } = {}
) => {
  // Wrap with all providers
};

export const setupMockServer = () => {
  // Configure MSW handlers
};

export const createMockAdmin = (overrides = {}) => {
  // Generate test admin user
};

export const waitForDataToLoad = async () => {
  // Wait for async operations
};
```

## CI/CD Integration

```yaml
# GitHub Actions
- name: Run Admin Dashboard Tests
  run: |
    npm ci
    npm run test:ci
    npm run test:e2e:ci
    npm run build
```

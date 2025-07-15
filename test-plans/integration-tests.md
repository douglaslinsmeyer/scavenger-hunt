# Cross-Component Integration Test Suite

## Overview
This document outlines comprehensive integration tests that verify the complete system functionality across all components (Backend API, Player Frontend, Admin Dashboard) of the Scavenger Hunt application.

## Test Environment
- **Framework**: Playwright for E2E testing across all components
- **API Testing**: SuperTest for backend verification
- **Database**: Test PostgreSQL instance with migrations
- **Services**: Redis, Socket.io server
- **Browsers**: Chrome, Firefox, Safari, Mobile emulation

## 1. Complete Hunt Lifecycle Tests

### 1.1 Hunt Creation to Completion Flow
```typescript
describe('Full Hunt Lifecycle', () => {
  it('should complete entire hunt from creation to finish', async () => {
    // Test covers:
    // - Admin creates hunt
    // - Players join
    // - Tasks completed
    // - Real-time updates
    // - Hunt completion
    
    const { adminPage, playerPage } = await setupTestEnvironment();
    
    // Step 1: Admin Login
    await adminPage.goto('/admin/login');
    await adminPage.click('[data-testid="google-login"]');
    await handleOAuthFlow(adminPage);
    
    // Step 2: Create Hunt
    const huntData = {
      title: 'Integration Test Hunt',
      description: 'Testing full flow',
      type: 'competitive',
      maxPlayers: 10,
      pointsEnabled: true
    };
    await createHunt(adminPage, huntData);
    const inviteCode = await adminPage.textContent('[data-testid="invite-code"]');
    
    // Step 3: Add Tasks
    await addPhotoTask(adminPage, {
      title: 'Find the fountain',
      points: 20
    });
    await addCheckboxTask(adminPage, {
      title: 'Visit the museum',
      points: 10
    });
    await addGPSTask(adminPage, {
      title: 'Reach the park',
      lat: 37.7749,
      lng: -122.4194,
      radius: 50,
      points: 15
    });
    
    // Step 4: Activate Hunt
    await adminPage.click('[data-testid="activate-hunt"]');
    await adminPage.waitForSelector('[data-testid="status-active"]');
    
    // Step 5: Player Joins
    await playerPage.goto('/join');
    await playerPage.fill('[data-testid="invite-code"]', inviteCode);
    await playerPage.click('[data-testid="join-button"]');
    
    // Create player account
    await playerPage.fill('[data-testid="username"]', 'TestPlayer1');
    await playerPage.click('[data-testid="continue"]');
    await playerPage.fill('[data-testid="pin"]', '1234');
    await playerPage.fill('[data-testid="pin-confirm"]', '1234');
    await playerPage.click('[data-testid="create-account"]');
    
    // Step 6: Complete Tasks
    // Checkbox task
    await playerPage.click('[data-testid="task-checkbox-1"]');
    await playerPage.click('[data-testid="complete-checkbox"]');
    
    // Photo task
    await playerPage.click('[data-testid="task-photo-0"]');
    await uploadPhoto(playerPage, 'test-photo.jpg');
    await playerPage.click('[data-testid="submit-photo"]');
    
    // GPS task (mock location)
    await mockGeolocation(playerPage, { lat: 37.7749, lng: -122.4194 });
    await playerPage.click('[data-testid="task-gps-2"]');
    await playerPage.click('[data-testid="verify-location"]');
    
    // Step 7: Admin Verifies Photo
    await adminPage.goto('/admin/hunts/' + huntId + '/verify');
    await adminPage.waitForSelector('[data-testid="pending-photo"]');
    await adminPage.click('[data-testid="approve-photo"]');
    
    // Step 8: Verify Real-time Updates
    await playerPage.waitForSelector('[data-testid="photo-approved"]');
    await expect(playerPage.locator('[data-testid="player-score"]')).toHaveText('45');
    
    // Step 9: Check Leaderboard
    await playerPage.goto('/hunt/leaderboard');
    await expect(playerPage.locator('[data-testid="rank-1"]')).toContainText('TestPlayer1');
    
    // Step 10: Complete Hunt
    await adminPage.click('[data-testid="complete-hunt"]');
    await adminPage.click('[data-testid="confirm-complete"]');
    
    // Verify completion
    await playerPage.waitForSelector('[data-testid="hunt-completed"]');
    await expect(adminPage.locator('[data-testid="status-completed"]')).toBeVisible();
  });
});
```

### 1.2 Multi-Player Competitive Hunt
```typescript
describe('Multi-Player Competition', () => {
  it('should handle multiple players competing simultaneously', async () => {
    const players = await createMultiplePlayers(5);
    const adminPage = await setupAdmin();
    
    // Create and activate hunt
    const huntId = await createCompetitiveHunt(adminPage);
    const inviteCode = await getInviteCode(adminPage);
    
    // All players join simultaneously
    await Promise.all(
      players.map((player, index) => 
        joinHunt(player.page, inviteCode, `Player${index}`)
      )
    );
    
    // Players complete tasks at different rates
    const completionPromises = players.map(async (player, index) => {
      // Simulate different completion speeds
      await player.page.waitForTimeout(index * 1000);
      
      // Complete tasks
      await completeCheckboxTask(player.page, 0);
      await completePhotoTask(player.page, 1);
      
      return {
        player: `Player${index}`,
        completedAt: Date.now()
      };
    });
    
    await Promise.all(completionPromises);
    
    // Admin batch approves photos
    await adminPage.goto('/admin/hunts/' + huntId + '/verify');
    await adminPage.click('[data-testid="select-all"]');
    await adminPage.click('[data-testid="batch-approve"]');
    
    // Verify leaderboard updates for all players
    for (const player of players) {
      await player.page.goto('/hunt/leaderboard');
      await player.page.waitForSelector('[data-testid="leaderboard-table"]');
      
      // Verify all 5 players appear
      const playerCount = await player.page.locator('[data-testid^="player-row"]').count();
      expect(playerCount).toBe(5);
    }
    
    // Verify real-time position updates
    await completeGPSTask(players[0].page, 2);
    
    // Other players should see position change
    await players[1].page.waitForSelector('[data-testid="leaderboard-update"]');
  });
});
```

### 1.3 Team-Based Cooperative Hunt
```typescript
describe('Team Cooperation', () => {
  it('should handle team-based scoring correctly', async () => {
    const { adminPage, teamAPlayers, teamBPlayers } = await setupTeamHunt();
    
    // Create cooperative hunt with teams
    const huntData = {
      title: 'Team Hunt',
      type: 'cooperative',
      teamsEnabled: true,
      teams: ['Red Team', 'Blue Team']
    };
    
    const huntId = await createHunt(adminPage, huntData);
    await addMultipleTasks(adminPage, 5);
    
    // Import players with team assignments
    const csvData = generateTeamCSV([
      ...teamAPlayers.map(p => ({ ...p, team: 'Red Team' })),
      ...teamBPlayers.map(p => ({ ...p, team: 'Blue Team' }))
    ]);
    
    await importPlayers(adminPage, csvData);
    await activateHunt(adminPage);
    
    // Players join their respective teams
    await Promise.all([
      ...teamAPlayers.map(p => loginPlayer(p.page, p.username, p.pin)),
      ...teamBPlayers.map(p => loginPlayer(p.page, p.username, p.pin))
    ]);
    
    // Team A completes tasks
    await completeTaskAsTeam(teamAPlayers[0].page, 0);
    await completeTaskAsTeam(teamAPlayers[1].page, 1);
    
    // Verify shared points for Team A
    for (const player of teamAPlayers) {
      await player.page.goto('/hunt/dashboard');
      await expect(player.page.locator('[data-testid="team-score"]')).toHaveText('30');
    }
    
    // Team B completes tasks
    await completeTaskAsTeam(teamBPlayers[0].page, 0);
    
    // Verify team leaderboard
    await adminPage.goto('/admin/hunts/' + huntId + '/leaderboard');
    await adminPage.click('[data-testid="team-view"]');
    
    await expect(adminPage.locator('[data-testid="team-red-score"]')).toHaveText('30');
    await expect(adminPage.locator('[data-testid="team-blue-score"]')).toHaveText('15');
  });
});
```

## 2. Real-time Synchronization Tests

### 2.1 WebSocket Event Propagation
```typescript
describe('Real-time Updates', () => {
  it('should propagate events to all connected clients', async () => {
    const clients = await connectMultipleClients(3);
    const adminPage = await setupAdmin();
    
    // Setup hunt with all clients connected
    const huntId = await createActiveHunt(adminPage);
    await Promise.all(clients.map(c => joinHuntAsPlayer(c, huntId)));
    
    // Test 1: Task completion broadcasts
    await clients[0].completeTask(0);
    
    // All clients should receive update
    await Promise.all(clients.map(async (client) => {
      await client.waitForEvent('TASK_COMPLETED');
      await expect(client.page.locator('[data-testid="activity-feed"]'))
        .toContainText('Player1 completed task');
    }));
    
    // Test 2: Hunt status changes
    await adminPage.click('[data-testid="pause-hunt"]');
    
    await Promise.all(clients.map(async (client) => {
      await client.waitForEvent('HUNT_PAUSED');
      await expect(client.page.locator('[data-testid="hunt-status"]'))
        .toHaveText('Paused');
    }));
    
    // Test 3: Leaderboard updates
    await adminPage.click('[data-testid="resume-hunt"]');
    await clients[1].completeTask(1);
    
    // Verify leaderboard position changes
    await Promise.all(clients.map(async (client) => {
      await client.page.goto('/hunt/leaderboard');
      await client.waitForEvent('LEADERBOARD_UPDATE');
      await client.page.waitForSelector('[data-testid="position-change"]');
    }));
    
    // Test 4: Photo verification notifications
    await clients[2].submitPhoto(2);
    await approvePhoto(adminPage, 0);
    
    // Only submitter receives notification
    await clients[2].waitForEvent('TASK_VERIFIED');
    await expect(clients[2].page.locator('[data-testid="notification"]'))
      .toContainText('Photo approved');
  });
});
```

### 2.2 Concurrent Operations Handling
```typescript
describe('Concurrent Operations', () => {
  it('should handle simultaneous updates correctly', async () => {
    const admins = await setupMultipleAdmins(2);
    const players = await setupMultiplePlayers(10);
    
    // Both admins try to modify same hunt
    const huntId = await createHunt(admins[0].page);
    await shareHuntWithAdmin(admins[0].page, admins[1].email);
    
    // Concurrent task creation
    const taskPromises = [
      addTask(admins[0].page, { title: 'Task A' }),
      addTask(admins[1].page, { title: 'Task B' })
    ];
    
    await Promise.all(taskPromises);
    
    // Verify both tasks created
    await admins[0].page.reload();
    const taskCount = await admins[0].page.locator('[data-testid^="task-"]').count();
    expect(taskCount).toBe(2);
    
    // Concurrent photo verifications
    await activateHunt(admins[0].page);
    await Promise.all(players.map(p => joinAndSubmitPhoto(p, huntId)));
    
    // Both admins verify different photos simultaneously
    await Promise.all([
      verifyPhotoAtIndex(admins[0].page, 0, 'approve'),
      verifyPhotoAtIndex(admins[1].page, 1, 'approve')
    ]);
    
    // Verify no conflicts
    const pendingCount = await admins[0].page
      .locator('[data-testid="pending-count"]').textContent();
    expect(pendingCount).toBe('8'); // 10 - 2 approved
    
    // Concurrent player actions
    const completionPromises = players.slice(0, 5).map(p => 
      completeCheckboxTask(p.page, 0)
    );
    
    await Promise.all(completionPromises);
    
    // Verify task completion count
    await admins[0].page.goto('/admin/hunts/' + huntId + '/tasks');
    await expect(admins[0].page.locator('[data-testid="task-0-completions"]'))
      .toHaveText('5');
  });
});
```

## 3. Offline/Online Synchronization Tests

### 3.1 Offline Task Completion
```typescript
describe('Offline Functionality', () => {
  it('should handle offline task completion and sync', async () => {
    const { page } = await setupPlayer();
    
    // Join hunt while online
    await joinHunt(page, 'TEST123');
    await page.waitForSelector('[data-testid="task-list"]');
    
    // Go offline
    await page.context().setOffline(true);
    
    // Complete tasks offline
    await page.click('[data-testid="task-checkbox-0"]');
    await page.click('[data-testid="complete-checkbox"]');
    
    // Verify local storage
    await expect(page.locator('[data-testid="offline-indicator"]')).toBeVisible();
    await expect(page.locator('[data-testid="pending-sync"]')).toHaveText('1');
    
    // Complete photo task offline
    await page.click('[data-testid="task-photo-1"]');
    await uploadPhoto(page, 'offline-photo.jpg');
    await page.click('[data-testid="submit-photo"]');
    
    await expect(page.locator('[data-testid="pending-sync"]')).toHaveText('2');
    
    // GPS task offline
    await mockGeolocation(page, { lat: 37.7749, lng: -122.4194 });
    await page.click('[data-testid="task-gps-2"]');
    await page.click('[data-testid="verify-location"]');
    
    // Come back online
    await page.context().setOffline(false);
    
    // Wait for sync
    await page.waitForSelector('[data-testid="sync-complete"]');
    await expect(page.locator('[data-testid="pending-sync"]')).toHaveText('0');
    
    // Verify server received all completions
    const adminPage = await getAdminPage();
    await adminPage.goto('/admin/hunts/current/players');
    await expect(adminPage.locator('[data-testid="player-completions"]'))
      .toHaveText('3');
    
    // Verify photo in queue
    await adminPage.goto('/admin/hunts/current/verify');
    await expect(adminPage.locator('[data-testid="pending-photos"]'))
      .toHaveText('1');
  });
});
```

### 3.2 Conflict Resolution
```typescript
describe('Sync Conflict Resolution', () => {
  it('should handle offline/online conflicts correctly', async () => {
    const { playerPage, adminPage } = await setupTestEnvironment();
    
    // Player completes task offline
    await playerPage.context().setOffline(true);
    await completeCheckboxTask(playerPage, 0);
    
    // Admin deletes same task while player offline
    await deleteTask(adminPage, 0);
    
    // Player comes back online
    await playerPage.context().setOffline(false);
    
    // Verify conflict resolution
    await playerPage.waitForSelector('[data-testid="sync-conflict"]');
    await expect(playerPage.locator('[data-testid="conflict-message"]'))
      .toContainText('Task no longer exists');
    
    // Test duplicate prevention
    const player2 = await setupSecondPlayer();
    
    // Both complete same task while one is offline
    await player2.context().setOffline(true);
    await completeCheckboxTask(playerPage, 1); // Online
    await completeCheckboxTask(player2, 1);    // Offline
    
    await player2.context().setOffline(false);
    
    // Verify only one completion recorded
    await adminPage.goto('/admin/hunts/current/tasks');
    await expect(adminPage.locator('[data-testid="task-1-completions"]'))
      .toHaveText('1');
  });
});
```

## 4. Error Recovery Tests

### 4.1 Network Failure Recovery
```typescript
describe('Network Failure Recovery', () => {
  it('should recover from various network failures', async () => {
    const { page, interceptor } = await setupPlayerWithInterceptor();
    
    // Test 1: API timeout during task submission
    interceptor.simulateTimeout('/api/tasks/*/complete');
    
    await page.click('[data-testid="task-checkbox-0"]');
    await page.click('[data-testid="complete-checkbox"]');
    
    await expect(page.locator('[data-testid="error-message"]'))
      .toContainText('Network error. Retrying...');
    
    interceptor.restore();
    
    await page.waitForSelector('[data-testid="task-completed"]');
    
    // Test 2: WebSocket disconnection
    await disconnectWebSocket();
    
    await expect(page.locator('[data-testid="connection-lost"]')).toBeVisible();
    
    await reconnectWebSocket();
    
    await expect(page.locator('[data-testid="connection-restored"]')).toBeVisible();
    
    // Test 3: Photo upload failure
    interceptor.simulateError('/api/tasks/*/complete', 500);
    
    await uploadPhoto(page, 'large-photo.jpg');
    await page.click('[data-testid="submit-photo"]');
    
    await expect(page.locator('[data-testid="upload-failed"]')).toBeVisible();
    await expect(page.locator('[data-testid="retry-upload"]')).toBeVisible();
    
    interceptor.restore();
    
    await page.click('[data-testid="retry-upload"]');
    await page.waitForSelector('[data-testid="upload-success"]');
    
    // Test 4: Auth token expiration
    await expireAuthToken();
    
    await page.click('[data-testid="task-checkbox-1"]');
    
    await expect(page.locator('[data-testid="session-expired"]')).toBeVisible();
    
    // Auto-refresh should occur
    await page.waitForSelector('[data-testid="session-refreshed"]');
    await page.click('[data-testid="complete-checkbox"]');
    await page.waitForSelector('[data-testid="task-completed"]');
  });
});
```

### 4.2 Data Integrity Tests
```typescript
describe('Data Integrity', () => {
  it('should maintain data consistency across failures', async () => {
    const { players, admin, database } = await setupIntegrationTest();
    
    // Test 1: Partial bulk import rollback
    const csvData = generatePlayersCSV(100);
    csvData[50].username = csvData[49].username; // Duplicate
    
    await admin.goto('/admin/hunts/current/players/import');
    await uploadCSV(admin, csvData);
    await admin.click('[data-testid="import-players"]');
    
    await expect(admin.locator('[data-testid="import-error"]'))
      .toContainText('Duplicate username at row 51');
    
    // Verify no players were imported
    const playerCount = await database.query(
      'SELECT COUNT(*) FROM players WHERE hunt_id = $1',
      [currentHuntId]
    );
    expect(playerCount.rows[0].count).toBe('0');
    
    // Test 2: Concurrent task completion
    const taskCompletionPromises = players.slice(0, 10).map(p =>
      completeCheckboxTask(p.page, 0)
    );
    
    await Promise.all(taskCompletionPromises);
    
    // Verify exactly 10 completions recorded
    const completions = await database.query(
      'SELECT COUNT(*) FROM task_completions WHERE task_id = $1',
      [taskId]
    );
    expect(completions.rows[0].count).toBe('10');
    
    // Test 3: Hunt state consistency
    await admin.click('[data-testid="pause-hunt"]');
    
    // Try to complete task while paused
    await players[11].page.click('[data-testid="task-checkbox-1"]');
    await players[11].page.click('[data-testid="complete-checkbox"]');
    
    await expect(players[11].page.locator('[data-testid="error"]'))
      .toContainText('Hunt is paused');
    
    // Verify no completion recorded
    const pausedCompletions = await database.query(
      'SELECT COUNT(*) FROM task_completions WHERE player_id = $1',
      [players[11].id]
    );
    expect(pausedCompletions.rows[0].count).toBe('0');
  });
});
```

## 5. Performance & Load Tests

### 5.1 Concurrent User Load
```typescript
describe('Load Testing', () => {
  it('should handle expected concurrent user load', async () => {
    const CONCURRENT_HUNTS = 5;
    const PLAYERS_PER_HUNT = 20;
    
    const metrics = {
      responseTime: [],
      websocketLatency: [],
      errors: 0
    };
    
    // Create multiple hunts
    const hunts = await Promise.all(
      Array(CONCURRENT_HUNTS).fill(0).map(() => createHuntWithTasks())
    );
    
    // Spawn players for each hunt
    const playerGroups = await Promise.all(
      hunts.map(hunt => spawnPlayers(PLAYERS_PER_HUNT, hunt.inviteCode))
    );
    
    // All players complete tasks simultaneously
    const startTime = Date.now();
    
    const completionPromises = playerGroups.flat().map(async (player) => {
      try {
        const taskStart = Date.now();
        await completeRandomTask(player);
        metrics.responseTime.push(Date.now() - taskStart);
      } catch (error) {
        metrics.errors++;
      }
    });
    
    await Promise.all(completionPromises);
    
    const totalTime = Date.now() - startTime;
    
    // Verify performance metrics
    const avgResponseTime = metrics.responseTime.reduce((a, b) => a + b) / 
                          metrics.responseTime.length;
    
    expect(avgResponseTime).toBeLessThan(500); // < 500ms average
    expect(metrics.errors).toBeLessThan(CONCURRENT_HUNTS); // < 1% error rate
    expect(totalTime).toBeLessThan(30000); // Complete within 30s
    
    // Verify WebSocket performance
    const wsMetrics = await measureWebSocketLatency(playerGroups[0][0]);
    expect(wsMetrics.avgLatency).toBeLessThan(100); // < 100ms latency
  });
});
```

### 5.2 Photo Upload Stress Test
```typescript
describe('Photo Upload Performance', () => {
  it('should handle multiple simultaneous photo uploads', async () => {
    const players = await setupMultiplePlayers(10);
    const photos = generateTestPhotos(10, '5MB');
    
    // All players upload photos simultaneously
    const uploadPromises = players.map((player, index) => 
      uploadPhotoWithMetrics(player.page, photos[index])
    );
    
    const results = await Promise.all(uploadPromises);
    
    // Verify all uploads succeeded
    const successCount = results.filter(r => r.success).length;
    expect(successCount).toBe(10);
    
    // Verify upload times
    const avgUploadTime = results.reduce((sum, r) => sum + r.duration, 0) / 10;
    expect(avgUploadTime).toBeLessThan(5000); // < 5s average
    
    // Verify server processing
    const adminPage = await getAdminPage();
    await adminPage.goto('/admin/hunts/current/verify');
    
    const pendingCount = await adminPage
      .locator('[data-testid="pending-count"]').textContent();
    expect(pendingCount).toBe('10');
    
    // Verify image compression worked
    for (const result of results) {
      expect(result.compressedSize).toBeLessThan(result.originalSize * 0.7);
    }
  });
});
```

## 6. Security & Edge Case Tests

### 6.1 Authentication Boundary Tests
```typescript
describe('Authentication Security', () => {
  it('should enforce authentication boundaries correctly', async () => {
    const { playerPage, adminPage, unauthPage } = await setupSecurityTest();
    
    // Test 1: Player cannot access admin routes
    await playerPage.goto('/admin/hunts');
    await expect(playerPage).toHaveURL('/join');
    
    // Test 2: Admin cannot access other hunts
    const otherHuntId = await createHuntAsOtherAdmin();
    await adminPage.goto(`/admin/hunts/${otherHuntId}`);
    await expect(adminPage.locator('[data-testid="access-denied"]')).toBeVisible();
    
    // Test 3: Expired token handling
    await expireToken(playerPage);
    await playerPage.click('[data-testid="complete-task"]');
    await expect(playerPage).toHaveURL('/join');
    
    // Test 4: Invalid hunt codes
    await unauthPage.goto('/join');
    await unauthPage.fill('[data-testid="invite-code"]', 'INVALID');
    await unauthPage.click('[data-testid="join-button"]');
    await expect(unauthPage.locator('[data-testid="error"]'))
      .toContainText('Invalid invite code');
    
    // Test 5: Rate limiting
    for (let i = 0; i < 6; i++) {
      await attemptLogin(unauthPage, 'user', 'wrong-pin');
    }
    await expect(unauthPage.locator('[data-testid="rate-limited"]')).toBeVisible();
  });
});
```

### 6.2 Data Validation Tests
```typescript
describe('Input Validation', () => {
  it('should validate all user inputs correctly', async () => {
    const { adminPage, playerPage } = await setupValidationTest();
    
    // Test 1: XSS prevention
    const xssPayloads = [
      '<script>alert("xss")</script>',
      '<img src=x onerror=alert("xss")>',
      'javascript:alert("xss")'
    ];
    
    for (const payload of xssPayloads) {
      await createTask(adminPage, { title: payload });
      await adminPage.reload();
      
      // Verify escaped in display
      const taskTitle = await adminPage.locator('[data-testid="task-title"]').textContent();
      expect(taskTitle).not.toContain('<script>');
      expect(taskTitle).toContain('&lt;script&gt;');
    }
    
    // Test 2: SQL injection prevention
    await playerPage.fill('[data-testid="username"]', "admin'; DROP TABLE players;--");
    await playerPage.click('[data-testid="continue"]');
    
    // Should be treated as regular username
    await expect(playerPage).toHaveURL('/create-pin');
    
    // Test 3: File upload validation
    const invalidFiles = [
      { name: 'test.exe', type: 'application/exe' },
      { name: 'test.js', type: 'text/javascript' },
      { name: 'huge.jpg', size: 15 * 1024 * 1024 } // 15MB
    ];
    
    for (const file of invalidFiles) {
      await uploadFile(playerPage, file);
      await expect(playerPage.locator('[data-testid="file-error"]')).toBeVisible();
    }
    
    // Test 4: GPS coordinate validation
    const invalidCoords = [
      { lat: 91, lng: 0 },      // Invalid latitude
      { lat: 0, lng: 181 },      // Invalid longitude
      { lat: 'abc', lng: 'def' } // Non-numeric
    ];
    
    for (const coords of invalidCoords) {
      await createGPSTask(adminPage, coords);
      await expect(adminPage.locator('[data-testid="validation-error"]')).toBeVisible();
    }
  });
});
```

## 7. Mobile & Cross-Platform Tests

### 7.1 Mobile Responsiveness
```typescript
describe('Mobile Experience', () => {
  it('should work correctly on mobile devices', async () => {
    const devices = ['iPhone 12', 'Pixel 5', 'iPad Pro'];
    
    for (const deviceName of devices) {
      const device = playwright.devices[deviceName];
      const context = await browser.newContext({ ...device });
      const page = await context.newPage();
      
      // Test touch interactions
      await page.goto('/join');
      await page.tap('[data-testid="invite-code"]');
      await page.fill('[data-testid="invite-code"]', 'TEST123');
      
      // Test camera access
      await joinHunt(page);
      await page.tap('[data-testid="task-photo-0"]');
      
      // Grant camera permissions
      await context.grantPermissions(['camera']);
      await page.tap('[data-testid="take-photo"]');
      
      // Test GPS on mobile
      await context.setGeolocation({ latitude: 37.7749, longitude: -122.4194 });
      await page.tap('[data-testid="task-gps-1"]');
      await page.tap('[data-testid="verify-location"]');
      
      // Test offline mode
      await context.setOffline(true);
      await page.tap('[data-testid="task-checkbox-2"]');
      await expect(page.locator('[data-testid="offline-mode"]')).toBeVisible();
      
      await context.close();
    }
  });
});
```

## Running Integration Tests

```bash
# Full integration suite
npm run test:integration

# Specific test suites
npm run test:integration -- --grep "Hunt Lifecycle"
npm run test:integration -- --grep "Real-time"

# With specific browser
npm run test:integration -- --browser=firefox

# Parallel execution
npm run test:integration -- --workers=4

# Debug mode
npm run test:integration -- --debug

# Generate report
npm run test:integration -- --reporter=html
```

## Test Environment Setup

```typescript
// test-helpers/setup.ts
export async function setupTestEnvironment() {
  // Start test database
  await startTestDatabase();
  
  // Start Redis
  await startRedis();
  
  // Start backend server
  const backend = await startBackend();
  
  // Start frontend servers
  const playerFrontend = await startPlayerFrontend();
  const adminDashboard = await startAdminDashboard();
  
  // Create test data
  await seedTestData();
  
  return {
    backend,
    playerFrontend,
    adminDashboard,
    cleanup: async () => {
      await cleanupTestData();
      await stopAllServers();
    }
  };
}
```

## CI/CD Configuration

```yaml
# .github/workflows/integration-tests.yml
name: Integration Tests
on: [push, pull_request]

jobs:
  integration:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: testpass
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run migrations
        run: npm run migrate:test
      
      - name: Run integration tests
        run: npm run test:integration
        env:
          DATABASE_URL: postgresql://postgres:testpass@localhost/test
          REDIS_URL: redis://localhost:6379
      
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: integration-test-results
          path: test-results/
```
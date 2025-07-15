# Authentication System

### Social Authentication (Admin/Organizer)
- **OAuth Integration**
  - Google authentication
  - Facebook authentication
  - Automatic account creation on first login
  - Profile sync (name, email, avatar)
  
- **Session Management**
  - JWT-based authentication
  - Secure token storage
  - Automatic token refresh
  - Session expiry handling

### Hunt-Specific Authentication (Players)
- **Join Flow**
  - Access via unique invitation link
  - Username selection (unique per hunt)
  - 4-6 digit PIN creation
  - No email required
  
- **Security Features**
  - PIN hashing with bcrypt
  - Rate limiting on login attempts
  - PIN reset by organizers/admins (manual process, temporary PIN provided to player)
  - No session timeout

### Role-Based Access Control
- **Admin Privileges**
  - Full system access
  - User management
  - Hunt oversight
  - Player PIN reset
  
- **Organizer Privileges**
  - Hunt creation and management
  - Task management
  - Player verification
  - Analytics access
  
- **Player Privileges**
  - Hunt participation
  - Task completion
  - Photo submission
  - Leaderboard viewing

# API Architecture

### RESTful Endpoints
- **Authentication APIs**
  - POST /api/auth/social
  - POST /api/auth/player
  - POST /api/auth/refresh
  - POST /api/auth/logout
  
- **Hunt APIs**
  - GET /api/hunts
  - POST /api/hunts
  - PUT /api/hunts/:id
  - DELETE /api/hunts/:id
  
- **Task APIs**
  - GET /api/hunts/:huntId/tasks
  - POST /api/hunts/:huntId/tasks
  - PUT /api/tasks/:id
  - POST /api/tasks/:id/complete
  
- **Player APIs**
  - GET /api/hunts/:huntId/players
  - POST /api/hunts/:huntId/join
  - GET /api/hunts/:huntId/leaderboard

### API Documentation
- **OpenAPI/Swagger**
  - Interactive documentation
  - Request/response examples
  - Authentication details
  - Error code reference

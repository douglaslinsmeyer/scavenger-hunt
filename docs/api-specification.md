# API Specification

This document outlines the RESTful API for the Scavenger Hunt application. It details the endpoints, their purpose, and the roles required for access.

## Architectural Choice: REST vs. GraphQL

For this project, a RESTful architecture was chosen over GraphQL. While GraphQL offers benefits in flexible data fetching, the client data requirements for this application are well-defined and predictable. The REST approach provides a simpler, more direct implementation path that aligns well with the modular monolith architecture and the chosen tech stack (Express.js). The added complexity of implementing a GraphQL server, particularly for handling file uploads and caching, was deemed to outweigh the benefits for this specific use case.

## API Endpoint Plan (Version: `/api/v1`)

The following tables describe the planned API endpoints, grouped by resource.

### **Authentication (`/auth`)**

| Method | Path                  | Description                                           | User Role(s)      |
| :----- | :-------------------- | :---------------------------------------------------- | :---------------- |
| `POST` | `/auth/player`        | Authenticates a player using a username and PIN.      | Public (Player)   |
| `POST` | `/auth/social`        | Authenticates an admin/organizer via social provider. | Public (Organizer)|
| `GET`  | `/auth/me`            | Retrieves the profile of the currently logged-in user.| Player, Organizer |
| `POST` | `/auth/logout`        | Logs out the user (if using a token blacklist).       | Player, Organizer |

### **Hunts (`/hunts`)**

| Method   | Path                      | Description                                          | User Role(s)      |
| :------- | :------------------------ | :--------------------------------------------------- | :---------------- |
| `POST`   | `/hunts`                  | Creates a new scavenger hunt.                        | Organizer         |
| `GET`    | `/hunts`                  | Lists all hunts for the logged-in organizer.         | Organizer         |
| `GET`    | `/hunts/{huntId}`         | Retrieves the details of a specific hunt.            | Player, Organizer |
| `PUT`    | `/hunts/{huntId}`         | Updates the details of a hunt.                       | Organizer         |
| `DELETE` | `/hunts/{huntId}`         | Deletes a hunt.                                      | Organizer         |
| `GET`    | `/hunts/{huntId}/leaderboard` | Retrieves the current leaderboard for a hunt.      | Player, Organizer |

### **Players (`/hunts/{huntId}/players`)**

| Method   | Path                            | Description                                          | User Role(s)      |
| :------- | :------------------------------ | :--------------------------------------------------- | :---------------- |
| `POST`   | `/hunts/{huntId}/join`          | Allows a player to join a hunt with an invite code.  | Public (Player)   |
| `GET`    | `/hunts/{huntId}/players`       | Lists all players currently in a hunt.               | Organizer         |
| `POST`   | `/hunts/{huntId}/players/import`| Bulk imports players from a CSV file.                | Organizer         |
| `DELETE` | `/hunts/{huntId}/players/{playerId}` | Removes a player from a hunt.                      | Organizer         |

### **Tasks (`/hunts/{huntId}/tasks`)**

| Method   | Path                      | Description                                          | User Role(s)      |
| :------- | :------------------------ | :--------------------------------------------------- | :---------------- |
| `POST`   | `/hunts/{huntId}/tasks`   | Creates a new task within a hunt.                    | Organizer         |
| `GET`    | `/hunts/{huntId}/tasks`   | Lists all tasks for a specific hunt.                 | Player, Organizer |
| `PUT`    | `/hunts/{huntId}/tasks/{taskId}` | Updates an existing task.                          | Organizer         |
| `DELETE` | `/hunts/{huntId}/tasks/{taskId}` | Deletes a task from a hunt.                        | Organizer         |

### **Task Completions (`/tasks` & `/completions`)**

| Method | Path                          | Description                                          | User Role(s)      |
| :----- | :---------------------------- | :--------------------------------------------------- | :---------------- |
| `POST` | `/tasks/{taskId}/complete`    | A player submits a completion for a task (e.g., photo). | Player            |
| `GET`  | `/hunts/{huntId}/completions` | Retrieves all task completions for a hunt (for verification). | Organizer         |
| `PUT`  | `/completions/{completionId}/verify` | An organizer approves or rejects a task completion. | Organizer         |

### **Admin (`/admin`)**

| Method | Path                  | Description                                           | User Role(s)      |
| :----- | :-------------------- | :---------------------------------------------------- | :---------------- |
| `GET`  | `/admin/users`        | Lists all admin/organizer users in the system.        | Admin             |
| `PUT`  | `/admin/users/{userId}` | Updates a user's role or status.                      | Admin             |

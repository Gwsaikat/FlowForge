# ============================================================
# PHASE 1B — AUTHENTICATION SYSTEM
# ============================================================
# WHEN TO USE: After STEP2 is complete and project structure exists.
# HOW TO USE: Paste into Cursor Agent. One prompt does the full auth system.
# EXPECTED RESULT: Working register, login, logout, refresh token, protected routes.
# TIME: ~20 minutes
# COMMIT AFTER: git commit -m "feat: complete authentication system"
# ============================================================

------- PASTE INTO CURSOR AGENT -------

Build the complete authentication system for FlowForge. Follow the rules in .cursorrules exactly.

## Backend: User Model
Create `server/src/models/User.js` Mongoose schema with these fields:
```
{
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['admin', 'member'], default: 'member' },
  velocityDrift: { type: Number, default: 1.0 },
  taskHistory: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Task' }],
  refreshTokenHash: { type: String, default: null },
  timestamps: true
}
```

Add a pre-save hook that hashes the password with bcryptjs (cost factor 12) before saving.
Add an instance method `comparePassword(plainPassword)` that returns true/false.
Add a static method `findByEmail(email)` that finds user by email.
Do NOT store plain passwords anywhere.

## Backend: Auth Utility Functions
Create `server/src/utils/tokens.js` with these functions:

`generateAccessToken(userId)`:
- Signs a JWT with userId as payload
- Uses JWT_SECRET env var
- Expires in 15 minutes
- Returns the token string

`generateRefreshToken(userId)`:
- Signs a JWT with userId as payload
- Uses JWT_REFRESH_SECRET env var
- Expires in 7 days
- Returns the token string

`verifyAccessToken(token)`:
- Verifies and decodes an access token
- Returns decoded payload or throws error

`verifyRefreshToken(token)`:
- Verifies and decodes a refresh token
- Returns decoded payload or throws error

`hashToken(token)`:
- Returns a bcrypt hash of the token (cost 10)
- Used before storing refresh token in DB

`compareTokenHash(token, hash)`:
- Compares a plain token with its stored hash
- Returns true/false

## Backend: Auth Middleware
Create `server/src/middleware/authenticate.js`:
- Extract Bearer token from Authorization header
- If no token → return 401 { success: false, error: "Access token required" }
- Verify with verifyAccessToken()
- If expired/invalid → return 401 { success: false, error: "Invalid or expired token" }
- Attach decoded user to req.user = { id: decoded.userId }
- Call next()

## Backend: Auth Controller
Create `server/src/controllers/authController.js` with these functions:

`register(req, res, next)`:
- Validate: name (required), email (valid email), password (min 8 chars)
- Check if email already exists → 409 "Email already in use"
- Create new User with passwordHash
- Generate access token and refresh token
- Hash refresh token and save to user.refreshTokenHash
- Set refresh token in httpOnly cookie (name: 'refreshToken', httpOnly: true, secure: NODE_ENV==='production', sameSite: 'strict', maxAge: 7 days in ms)
- Return 201 { success: true, data: { user: { id, name, email }, accessToken } }

`login(req, res, next)`:
- Validate: email and password required
- Find user by email → 401 "Invalid credentials" if not found (do NOT say "email not found")
- Compare password with user.comparePassword() → 401 if wrong
- Generate new access + refresh tokens
- Update user.refreshTokenHash with new hash
- Set refresh token cookie
- Return 200 { success: true, data: { user: { id, name, email }, accessToken } }

`logout(req, res, next)`:
- Get refresh token from cookie
- Find user by req.user.id (this route is protected)
- Clear user.refreshTokenHash in database
- Clear the refreshToken cookie (set maxAge: 0)
- Return 200 { success: true, data: { message: "Logged out successfully" } }

`refreshToken(req, res, next)`:
- Get refresh token from cookie → 401 if not present
- Verify refresh token with verifyRefreshToken() → 401 if invalid
- Find user by decoded userId → 401 if not found
- Compare token with user.refreshTokenHash → 401 if no match
- Generate new access token AND new refresh token (rotation)
- Update refreshTokenHash in DB
- Set new refresh token cookie
- Return 200 { success: true, data: { accessToken } }

`getMe(req, res, next)`:
- Protected route
- Find user by req.user.id, select: -passwordHash -refreshTokenHash
- Return 200 { success: true, data: { user } }

## Backend: Auth Routes
Create `server/src/routes/authRoutes.js`:
- POST /api/auth/register → register controller (with express-validator checks)
- POST /api/auth/login → login controller (with express-validator checks)
- POST /api/auth/logout → authenticate middleware + logout controller
- POST /api/auth/refresh → refreshToken controller
- GET /api/auth/me → authenticate middleware + getMe controller

Mount auth routes in app.js.

## Backend: Rate Limiting on Auth
In auth routes, add stricter rate limiting:
- Login: 5 attempts per 15 minutes per IP
- Register: 3 per hour per IP
- Refresh: 20 per minute per IP
Use express-rate-limit with Redis store (use rate-limit-redis package — install it).

## Frontend: Auth Service
Create `client/src/services/authService.js` with these functions using the Axios instance:
- `registerUser({ name, email, password })` → POST /auth/register
- `loginUser({ email, password })` → POST /auth/login
- `logoutUser()` → POST /auth/logout
- `refreshAccessToken()` → POST /auth/refresh
- `getCurrentUser()` → GET /auth/me

## Frontend: Auth Pages
Create `client/src/pages/RegisterPage.jsx`:
- Form with: Name, Email, Password, Confirm Password fields
- On submit: call registerUser(), save accessToken to Zustand, save user to Zustand, navigate to /dashboard
- Show loading state during API call
- Show error message if API returns error (use react-hot-toast)
- Basic clean styling (doesn't need to be fancy yet)

Create `client/src/pages/LoginPage.jsx`:
- Form with: Email, Password fields
- On submit: call loginUser(), save accessToken and user to Zustand, navigate to /dashboard
- Show loading state
- Show error toast on failure
- Link to /register page

## Frontend: Auth Hook
Create `client/src/hooks/useAuth.js`:
- On app mount, call getCurrentUser() to check if user is already logged in (has valid cookie)
- If getCurrentUser() returns user → set in Zustand store → user stays logged in on refresh
- If it fails → clear Zustand auth state

## Frontend: Update App.jsx
- Wrap app with Toaster from react-hot-toast
- On app load, call the useAuth hook to restore session

## Testing
Create `server/src/algorithms/__tests__/auth.test.js` using Jest + Supertest:
- Test: POST /api/auth/register with valid data returns 201 and accessToken
- Test: POST /api/auth/register with duplicate email returns 409
- Test: POST /api/auth/login with correct credentials returns 200 and accessToken
- Test: POST /api/auth/login with wrong password returns 401
- Test: GET /api/auth/me without token returns 401
- Test: GET /api/auth/me with valid token returns user data
- Test: POST /api/auth/refresh with valid cookie returns new accessToken

After building all of this, test the full flow manually:
1. Register a new user → should get access token back
2. Login → should get access token
3. Call /api/auth/me with token → should return user
4. Logout → cookie should be cleared
5. Try /api/auth/me again → should get 401

------- END OF PROMPT -------

import "dotenv/config";
import express from "express";
import cors from "cors";
import session from "express-session";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";

const {
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  SESSION_SECRET,
  CLIENT_URL = "http://localhost:5173",
  SERVER_URL = "http://localhost:4000",
  PORT = 4000,
} = process.env;

const isProduction = process.env.NODE_ENV === "production";

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
  console.warn(
    "Missing Google OAuth credentials. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET."
  );
}

if (!SESSION_SECRET) {
  console.warn("Missing SESSION_SECRET. Session cookies will be insecure.");
}

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

passport.use(
  new GoogleStrategy(
    {
      clientID: GOOGLE_CLIENT_ID || "missing",
      clientSecret: GOOGLE_CLIENT_SECRET || "missing",
      callbackURL: `${SERVER_URL}/auth/google/callback`,
    },
    (accessToken, refreshToken, profile, done) => {
      const user = {
        id: profile.id,
        name: profile.displayName,
        email: profile.emails?.[0]?.value || null,
        photo: profile.photos?.[0]?.value || null,
      };
      done(null, user);
    }
  )
);

const app = express();

if (isProduction) {
  app.set("trust proxy", 1);
}

app.use(
  cors({
    origin: CLIENT_URL,
    credentials: true,
  })
);

app.use(
  session({
    name: "finances.sid",
    secret: SESSION_SECRET || "dev-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: isProduction ? "none" : "lax",
      secure: isProduction,
      maxAge: 1000 * 60 * 60 * 24 * 7,
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.get("/auth/google", passport.authenticate("google", {
  scope: ["profile", "email"],
}));

app.get(
  "/auth/google/callback",
  passport.authenticate("google", {
    failureRedirect: `${CLIENT_URL}/login?error=oauth`,
  }),
  (req, res) => {
    res.redirect(`${CLIENT_URL}/`);
  }
);

app.get("/auth/logout", (req, res) => {
  req.logout(() => {
    req.session?.destroy(() => {
      res.redirect(`${CLIENT_URL}/login`);
    });
  });
});

app.get("/api/me", (req, res) => {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return res.status(401).json({ error: "unauthenticated" });
  }
  return res.json(req.user);
});

app.get("/health", (req, res) => {
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`Auth server running on ${SERVER_URL}`);
});

-- College Event Management System - Database Schema
-- Scalable relational schema for future backend (PostgreSQL/MySQL compatible)

-- ---------------------------------------------------------------------------
-- USERS
-- ---------------------------------------------------------------------------
CREATE TABLE users (
  id            VARCHAR(36) PRIMARY KEY,
  name          VARCHAR(255) NOT NULL,
  email         VARCHAR(255) NOT NULL UNIQUE,
  student_id    VARCHAR(50),
  role          VARCHAR(20) NOT NULL DEFAULT 'student',  -- student | admin
  department    VARCHAR(100),
  avatar_url    VARCHAR(500),
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_student_id ON users(student_id);

-- ---------------------------------------------------------------------------
-- CLUBS
-- ---------------------------------------------------------------------------
CREATE TABLE clubs (
  id            VARCHAR(36) PRIMARY KEY,
  name          VARCHAR(255) NOT NULL,
  description   TEXT,
  logo_url      VARCHAR(500),
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------------------
-- EVENTS
-- ---------------------------------------------------------------------------
CREATE TABLE events (
  id                VARCHAR(36) PRIMARY KEY,
  title             VARCHAR(255) NOT NULL,
  description       TEXT,
  slug              VARCHAR(255) NOT NULL UNIQUE,
  club_id           VARCHAR(36) NOT NULL,
  event_date        DATE NOT NULL,
  start_time        TIME NOT NULL,
  end_time          TIME NOT NULL,
  location          VARCHAR(255) NOT NULL,
  total_seats       INT NOT NULL DEFAULT 0,
  available_seats   INT NOT NULL DEFAULT 0,
  registration_deadline DATE,
  status            VARCHAR(20) NOT NULL DEFAULT 'upcoming',  -- upcoming | closed | cancelled
  visibility        VARCHAR(20) NOT NULL DEFAULT 'internal', -- internal | external
  banner_url        VARCHAR(500),
  rulebook_url      VARCHAR(500),
  organizer_email   VARCHAR(255),
  organizer_name    VARCHAR(255),
  created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (club_id) REFERENCES clubs(id) ON DELETE CASCADE
);

CREATE INDEX idx_events_slug ON events(slug);
CREATE INDEX idx_events_club_id ON events(club_id);
CREATE INDEX idx_events_event_date ON events(event_date);
CREATE INDEX idx_events_status ON events(status);

-- ---------------------------------------------------------------------------
-- REGISTRATIONS
-- ---------------------------------------------------------------------------
CREATE TABLE registrations (
  id            VARCHAR(36) PRIMARY KEY,
  user_id       VARCHAR(36) NOT NULL,
  event_id      VARCHAR(36) NOT NULL,
  registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status        VARCHAR(20) NOT NULL DEFAULT 'confirmed',  -- confirmed | cancelled
  qr_code       VARCHAR(500),  -- store QR payload or URL for attendance
  UNIQUE (user_id, event_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
);

CREATE INDEX idx_registrations_user_id ON registrations(user_id);
CREATE INDEX idx_registrations_event_id ON registrations(event_id);

-- ---------------------------------------------------------------------------
-- ANNOUNCEMENTS
-- ---------------------------------------------------------------------------
CREATE TABLE announcements (
  id            VARCHAR(36) PRIMARY KEY,
  event_id      VARCHAR(36) NOT NULL,
  title         VARCHAR(255) NOT NULL,
  message       TEXT NOT NULL,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
);

CREATE INDEX idx_announcements_event_id ON announcements(event_id);

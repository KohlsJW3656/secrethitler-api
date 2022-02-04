DROP TABLE IF EXISTS game_user_action;
DROP TABLE IF EXISTS game_user;
DROP TABLE IF EXISTS game_policy;
DROP TABLE IF EXISTS game;
DROP TABLE IF EXISTS action;
DROP TABLE IF EXISTS role;
DROP TABLE IF EXISTS policy;
DROP TABLE IF EXISTS user;

CREATE TABLE user (
  user_id SERIAL PRIMARY KEY,
  first_name VARCHAR(25) NOT NULL,
  last_name VARCHAR(25) NOT NULL,
  email VARCHAR(200) NOT NULL,
  verified BOOLEAN NOT NULL,
  account_type BOOLEAN NOT NULL,
  last_used DATETIME NOT NULL,
  password TEXT NOT NULL
);

CREATE TABLE game (
  game_id SERIAL PRIMARY KEY,
  game_code VARCHAR(5) NOT NULL,
  player_count INT NOT NULL,
  private_game BOOLEAN NOT NULL,
  time_created DATETIME NOT NULL,
  start_time DATETIME DEFAULT NULL,
  end_time DATETIME DEFAULT NULL
);

CREATE TABLE role (
  role_id INT PRIMARY KEY,
  secret_identity VARCHAR(7) NOT NULL,
  party_membership BOOLEAN NOT NULL
);

CREATE TABLE policy (
  policy_id INT PRIMARY KEY,
  is_fascist BOOLEAN NOT NULL
);

CREATE TABLE action (
  action_id SERIAL PRIMARY KEY,
  action_preformed TEXT NOT NULL
);

CREATE TABLE game_user (
  game_id BIGINT UNSIGNED NOT NULL UNIQUE,
  user_id BIGINT UNSIGNED NOT NULL UNIQUE,
  role_id INT NOT NULL UNIQUE,
  username VARCHAR(20) NOT NULL,
  FOREIGN KEY(game_id) REFERENCES game(game_id),
  FOREIGN KEY(user_id) REFERENCES user(user_id),
  FOREIGN KEY(role_id) REFERENCES role(role_id)
);

CREATE TABLE game_policy (
  game_id BIGINT UNSIGNED NOT NULL UNIQUE,
  policy_id INT NOT NULL UNIQUE,
  deck_order INT NOT NULL,
  is_discarded BOOLEAN NOT NULL,
  is_enacted BOOLEAN NOT NULL,
  FOREIGN KEY(game_id) REFERENCES game(game_id),
  FOREIGN KEY(policy_id) REFERENCES policy(policy_id)
);

CREATE TABLE game_user_action (
  game_id BIGINT UNSIGNED NOT NULL UNIQUE,
  user_id BIGINT UNSIGNED NOT NULL UNIQUE,
  role_id INT NOT NULL UNIQUE,
  action_id BIGINT UNSIGNED NOT NULL UNIQUE,
  policy_id INT NOT NULL UNIQUE,
  timestamp DATETIME NOT NULL,
  FOREIGN KEY(game_id) REFERENCES game_user(game_id),
  FOREIGN KEY(user_id) REFERENCES game_user(user_id),
  FOREIGN KEY(role_id) REFERENCES game_user(role_id),
  FOREIGN KEY(action_id) REFERENCES action(action_id),
  FOREIGN KEY(policy_id) REFERENCES game_policy(policy_id)
);

INSERT INTO role VALUES (1, "Hitler", 1);
INSERT INTO role VALUES (2, "Fascist", 1);
INSERT INTO role VALUES (3, "Liberal", 0);
INSERT INTO role VALUES (4, "Liberal", 0);
INSERT INTO role VALUES (5, "Liberal", 0);
INSERT INTO role VALUES (6, "Liberal", 0);
INSERT INTO role VALUES (7, "Fascist", 1);
INSERT INTO role VALUES (8, "Liberal", 0);
INSERT INTO role VALUES (9, "Fascist", 1);
INSERT INTO role VALUES (10, "Liberal", 0);

INSERT INTO policy VALUES (1, 0);
INSERT INTO policy VALUES (2, 0);
INSERT INTO policy VALUES (3, 0);
INSERT INTO policy VALUES (4, 0);
INSERT INTO policy VALUES (5, 0);
INSERT INTO policy VALUES (6, 0);

INSERT INTO policy VALUES (7, 1);
INSERT INTO policy VALUES (8, 1);
INSERT INTO policy VALUES (9, 1);
INSERT INTO policy VALUES (10, 1);
INSERT INTO policy VALUES (11, 1);
INSERT INTO policy VALUES (12, 1);
INSERT INTO policy VALUES (13, 1);
INSERT INTO policy VALUES (14, 1);
INSERT INTO policy VALUES (15, 1);
INSERT INTO policy VALUES (16, 1);
INSERT INTO policy VALUES (17, 1);

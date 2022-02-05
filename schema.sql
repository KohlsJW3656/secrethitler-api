DROP TABLE IF EXISTS game_user_action;
DROP TABLE IF EXISTS game_user;
DROP TABLE IF EXISTS game_policy;
DROP TABLE IF EXISTS game_rule;
DROP TABLE IF EXISTS rule;
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

CREATE TABLE role (
  role_id SERIAL PRIMARY KEY,
  secret_identity VARCHAR(7) NOT NULL,
  party_membership BOOLEAN NOT NULL
);

CREATE TABLE policy (
  policy_id SERIAL PRIMARY KEY,
  fascist BOOLEAN NOT NULL
);

CREATE TABLE action (
  action_id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  game_action BOOLEAN NOT NULL
);

CREATE TABLE rule (
  rule_id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  description TEXT NOT NULL
);

CREATE TABLE game (
  game_id SERIAL PRIMARY KEY,
  game_code VARCHAR(5) NOT NULL,
  private_game BOOLEAN NOT NULL,
  created_time DATETIME NOT NULL,
  start_time DATETIME DEFAULT NULL,
  end_time DATETIME DEFAULT NULL
);

CREATE TABLE game_rule (
  game_rule_id SERIAL PRIMARY KEY,
  game_id BIGINT UNSIGNED NOT NULL,
  rule_id BIGINT UNSIGNED NOT NULL,
  FOREIGN KEY(game_id) REFERENCES game(game_id),
  FOREIGN KEY(rule_id) REFERENCES rule(rule_id)
);

CREATE TABLE game_user (
  game_user_id SERIAL PRIMARY KEY,
  game_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  role_id BIGINT UNSIGNED NOT NULL,
  username VARCHAR(20) NOT NULL,
  president BOOLEAN NOT NULL,
  chancellor BOOLEAN NOT NULL,
  prev_president BOOLEAN NOT NULL,
  prev_chancellor BOOLEAN NOT NULL,
  confirmed_not_hitler BOOLEAN NOT NULL,
  FOREIGN KEY(game_id) REFERENCES game(game_id),
  FOREIGN KEY(user_id) REFERENCES user(user_id),
  FOREIGN KEY(role_id) REFERENCES role(role_id)
);

CREATE TABLE game_policy (
  game_policy_id SERIAL PRIMARY KEY,
  game_id BIGINT UNSIGNED NOT NULL,
  policy_id BIGINT UNSIGNED NOT NULL,
  deck_order INT NOT NULL,
  discarded BOOLEAN NOT NULL,
  enacted BOOLEAN NOT NULL,
  FOREIGN KEY(game_id) REFERENCES game(game_id),
  FOREIGN KEY(policy_id) REFERENCES policy(policy_id)
);

CREATE TABLE game_user_action (
  game_user_action_id SERIAL PRIMARY KEY,
  game_user_id BIGINT UNSIGNED NOT NULL,
  action_id BIGINT UNSIGNED NOT NULL,
  game_policy_id BIGINT UNSIGNED,
  target_user_id BIGINT UNSIGNED,
  action_time DATETIME NOT NULL,
  FOREIGN KEY(game_user_id) REFERENCES game_user(game_user_id),
  FOREIGN KEY(action_id) REFERENCES action(action_id),
  FOREIGN KEY(game_policy_id) REFERENCES game_policy(game_policy_id)
);

INSERT INTO role(secret_identity, party_membership) VALUES ("Hitler", 1);
INSERT INTO role(secret_identity, party_membership) VALUES ("Fascist", 1);
INSERT INTO role(secret_identity, party_membership) VALUES ("Liberal", 0);
INSERT INTO role(secret_identity, party_membership) VALUES ("Liberal", 0);
INSERT INTO role(secret_identity, party_membership) VALUES ("Liberal", 0);
INSERT INTO role(secret_identity, party_membership) VALUES ("Liberal", 0);
INSERT INTO role(secret_identity, party_membership) VALUES ("Fascist", 1);
INSERT INTO role(secret_identity, party_membership) VALUES ("Liberal", 0);
INSERT INTO role(secret_identity, party_membership) VALUES ("Fascist", 1);
INSERT INTO role(secret_identity, party_membership) VALUES ("Liberal", 0);

INSERT INTO policy(fascist) VALUES (0);
INSERT INTO policy(fascist) VALUES (0);
INSERT INTO policy(fascist) VALUES (0);
INSERT INTO policy(fascist) VALUES (0);
INSERT INTO policy(fascist) VALUES (0);
INSERT INTO policy(fascist) VALUES (0);

INSERT INTO policy(fascist) VALUES (1);
INSERT INTO policy(fascist) VALUES (1);
INSERT INTO policy(fascist) VALUES (1);
INSERT INTO policy(fascist) VALUES (1);
INSERT INTO policy(fascist) VALUES (1);
INSERT INTO policy(fascist) VALUES (1);
INSERT INTO policy(fascist) VALUES (1);
INSERT INTO policy(fascist) VALUES (1);
INSERT INTO policy(fascist) VALUES (1);
INSERT INTO policy(fascist) VALUES (1);
INSERT INTO policy(fascist) VALUES (1);

INSERT INTO action(name, game_action) VALUES ("Game began", 1);
INSERT INTO action(name, game_action) VALUES ("Fascists won", 1);
INSERT INTO action(name, game_action) VALUES ("Liberals won", 1);
INSERT INTO action(name, game_action) VALUES ("Game ended", 1);

/* Election */
INSERT INTO action(name, game_action) VALUES ("Election began", 1);
INSERT INTO action(name, game_action) VALUES ("Vote passed", 1);
INSERT INTO action(name, game_action) VALUES ("Vote failed", 1);
INSERT INTO action(name, game_action) VALUES ("Election tracker increased", 1);
INSERT INTO action(name, game_action) VALUES ("Election tracker reset", 1);
INSERT INTO action(name, game_action) VALUES ("Top policy enacted", 1);
INSERT INTO action(name, game_action) VALUES ("Election ended", 1);

INSERT INTO action(name, game_action) VALUES ("Nominated for president", 0);
INSERT INTO action(name, game_action) VALUES ("Nominated for chancellor", 0);
INSERT INTO action(name, game_action) VALUES ("Voted Ja!", 0);
INSERT INTO action(name, game_action) VALUES ("Voted Nein!", 0);
INSERT INTO action(name, game_action) VALUES ("Elected president", 0);
INSERT INTO action(name, game_action) VALUES ("Elected chancellor", 0);

/* Legislative Session */
INSERT INTO action(name, game_action) VALUES ("Legislative Session began", 1);
INSERT INTO action(name, game_action) VALUES ("Fascist policy enacted", 1);
INSERT INTO action(name, game_action) VALUES ("Liberal policy enacted", 1);
INSERT INTO action(name, game_action) VALUES ("Legislative Session ended", 1);

INSERT INTO action(name, game_action) VALUES ("Discarded", 0);
INSERT INTO action(name, game_action) VALUES ("Enacted", 0);
INSERT INTO action(name, game_action) VALUES ("Requested veto", 0);
INSERT INTO action(name, game_action) VALUES ("Denied veto", 0);
INSERT INTO action(name, game_action) VALUES ("Accepted veto", 0);

/* Executive Action */
INSERT INTO action(name, game_action) VALUES ("Executive action began", 1);
INSERT INTO action(name, game_action) VALUES ("Investigate Loyalty", 1);
INSERT INTO action(name, game_action) VALUES ("Call Special Election", 1);
INSERT INTO action(name, game_action) VALUES ("Policy Peek", 1);
INSERT INTO action(name, game_action) VALUES ("Execution", 1);
INSERT INTO action(name, game_action) VALUES ("Veto Power", 1);
INSERT INTO action(name, game_action) VALUES ("Executive action ended", 1);

INSERT INTO action(name, game_action) VALUES ("Investigated loyalty", 0);
INSERT INTO action(name, game_action) VALUES ("Called Special Election", 0);
INSERT INTO action(name, game_action) VALUES ("Examined top 3 policies", 0);
INSERT INTO action(name, game_action) VALUES ("Executed", 0);


INSERT INTO rule(name, description) VALUES ("Anonymous voting", "Player ballots are not shown during and after voting");
INSERT INTO rule(name, description) VALUES ("Previous presidential powers", "If the group rejects three governments in a row, any power granted by the enacted policy is granted to the previously elected president");

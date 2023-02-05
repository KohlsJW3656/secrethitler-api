DROP TABLE IF EXISTS game_rule;
DROP TABLE IF EXISTS secret_hitler_game_user;
DROP TABLE IF EXISTS game_user;
DROP TABLE IF EXISTS game_action;
DROP TABLE IF EXISTS secret_hitler_policy;
DROP TABLE IF EXISTS game_rule;
DROP TABLE IF EXISTS game;
DROP TABLE IF EXISTS rule;
DROP TABLE IF EXISTS action;
DROP TABLE IF EXISTS secret_hitler_role;
DROP TABLE IF EXISTS fascist_policy_key;
DROP TABLE IF EXISTS game_type;
DROP TABLE IF EXISTS user;

/* Used for user login, emails, etc */
CREATE TABLE user (
  id SERIAL PRIMARY KEY,
  first_name VARCHAR(25) NOT NULL,
  last_name VARCHAR(25) NOT NULL,
  email VARCHAR(200) NOT NULL,
  verified BOOLEAN NOT NULL,
  account_type BOOLEAN NOT NULL,
  last_used DATETIME NOT NULL,
  password TEXT NOT NULL
);

/* Generic Games */

/* The types of games that are available to play */
CREATE TABLE game_type (
  id SERIAL PRIMARY KEY,
  name VARCHAR(60) NOT NULL,
  description TEXT NOT NULL
);

/* Used to keep track of game information */
CREATE TABLE game (
  id SERIAL PRIMARY KEY,
  game_type_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(40) NOT NULL,
  private_game BOOLEAN NOT NULL,
  created_time DATETIME NOT NULL,
  start_time DATETIME DEFAULT NULL,
  end_time DATETIME DEFAULT NULL,
  password TEXT,
  FOREIGN KEY(game_type_id) REFERENCES game_type(id)
);

/* Custom rules */
CREATE TABLE rule (
  id SERIAL PRIMARY KEY,
  game_type_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(40) NOT NULL,
  description TEXT NOT NULL,
  FOREIGN KEY(game_type_id) REFERENCES game_type(id)
);

/* Custom rules that are applied to the game */
CREATE TABLE game_rule (
  id SERIAL PRIMARY KEY,
  game_id BIGINT UNSIGNED NOT NULL,
  rule_id BIGINT UNSIGNED NOT NULL,
  FOREIGN KEY(game_id) REFERENCES game(id),
  FOREIGN KEY(rule_id) REFERENCES rule(id)
);

/* Used to keep track of game user information */
CREATE TABLE game_user (
  id SERIAL PRIMARY KEY,
  game_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  username VARCHAR(200) NOT NULL,
  ready BOOLEAN NOT NULL DEFAULT 0,
  FOREIGN KEY(game_id) REFERENCES game(id),
  FOREIGN KEY(user_id) REFERENCES user(id)
);

/* All possible actions a game could have */
CREATE TABLE action (
  id SERIAL PRIMARY KEY,
  game_type_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(50) NOT NULL,
  system_action BOOLEAN NOT NULL,
  FOREIGN KEY(game_type_id) REFERENCES game_type(id)
);

/* The action a player invokes */
CREATE TABLE game_action (
  id SERIAL PRIMARY KEY,
  game_id BIGINT UNSIGNED NOT NULL,
  action_id BIGINT UNSIGNED NOT NULL,
  game_user_id BIGINT UNSIGNED,
  target_user_id BIGINT UNSIGNED,
  turn INT NOT NULL,
  action_time DATETIME NOT NULL,
  FOREIGN KEY(game_id) REFERENCES game(id),
  FOREIGN KEY(game_user_id) REFERENCES game_user(id),
  FOREIGN KEY(action_id) REFERENCES action(id)
);

/* Secret Hitler */

CREATE TABLE secret_hitler_game (
  id SERIAL PRIMARY KEY,
  game_id BIGINT UNSIGNED UNIQUE NOT NULL,
  turn INT NOT NULL DEFAULT 1,
  ballot_fail_count INT NOT NULL DEFAULT 0,
  FOREIGN KEY(game_id) REFERENCES game(id)
);

/* Role cards */
CREATE TABLE secret_hitler_role (
  id SERIAL PRIMARY KEY,
  secret_identity VARCHAR(7) NOT NULL,
  party_membership BOOLEAN NOT NULL
);

/* Used to decode which presidential is active */
CREATE TABLE fascist_policy_key (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50),
  description TEXT NOT NULL,
  enacted_count INT NOT NULL,
  min_players INT NOT NULL,
  max_players INT NOT NULL
);

/* Used to keep track of Secret Hitler game user information */
CREATE TABLE secret_hitler_game_user(
  id SERIAL PRIMARY KEY,
  game_user_id BIGINT UNSIGNED NOT NULL,
  secret_hitler_role_id BIGINT UNSIGNED NOT NULL DEFAULT 1,
  president BOOLEAN NOT NULL DEFAULT 0,
  chancellor BOOLEAN NOT NULL DEFAULT 0,
  prev_president BOOLEAN NOT NULL DEFAULT 0,
  prev_chancellor BOOLEAN NOT NULL DEFAULT 0,
  confirmed_not_hitler BOOLEAN NOT NULL DEFAULT 0,
  investigated BOOLEAN NOT NULL DEFAULT 0,
  executed BOOLEAN NOT NULL DEFAULT 0,
  ballot BOOLEAN DEFAULT NULL,
  FOREIGN KEY(game_user_id) REFERENCES game_user(id),
  FOREIGN KEY(secret_hitler_role_id) REFERENCES secret_hitler_role(id)
);

/* Policy cards */
CREATE TABLE secret_hitler_policy (
  id SERIAL PRIMARY KEY,
  game_id BIGINT UNSIGNED NOT NULL,
  fascist BOOLEAN NOT NULL,
  deck_order INT NOT NULL,
  discarded BOOLEAN NOT NULL,
  enacted BOOLEAN NOT NULL,
  FOREIGN KEY(game_id) REFERENCES game(id)
);

/* Generic Games */

INSERT INTO game_type(name, description) VALUES ("Axis and Allies 1940 Global, Second Edition", "2 - 9 player game");
INSERT INTO game_type(name, description) VALUES ("Secret Hitler", "5 to 10 player game");

/* Secret Hitler */

INSERT INTO rule(game_type_id, name, description) VALUES (2, "Shadow Democracy", "Player ballots are not shown during and after voting");
INSERT INTO rule(game_type_id, name, description) VALUES (2, "Political Leverage", "If the group rejects three governments in a row, any power granted by the enacted policy is granted to the previously elected president");
INSERT INTO rule(game_type_id, name, description) VALUES (2, "Underground Nazi Network", "Fascist players, excluding Hitler, will see who their other teammates are for the duration of the game");

INSERT INTO secret_hitler_role(secret_identity, party_membership) VALUES ("Hitler", 1);
INSERT INTO secret_hitler_role(secret_identity, party_membership) VALUES ("Fascist", 1);
INSERT INTO secret_hitler_role(secret_identity, party_membership) VALUES ("Liberal", 0);
INSERT INTO secret_hitler_role(secret_identity, party_membership) VALUES ("Liberal", 0);
INSERT INTO secret_hitler_role(secret_identity, party_membership) VALUES ("Liberal", 0);
INSERT INTO secret_hitler_role(secret_identity, party_membership) VALUES ("Liberal", 0);
INSERT INTO secret_hitler_role(secret_identity, party_membership) VALUES ("Fascist", 1);
INSERT INTO secret_hitler_role(secret_identity, party_membership) VALUES ("Liberal", 0);
INSERT INTO secret_hitler_role(secret_identity, party_membership) VALUES ("Fascist", 1);
INSERT INTO secret_hitler_role(secret_identity, party_membership) VALUES ("Liberal", 0);
INSERT INTO secret_hitler_role(secret_identity, party_membership) VALUES ("Temp", 0);

/* Used to determine Presidential Powers */
INSERT INTO fascist_policy_key(name, description, enacted_count, min_players, max_players) VALUES (null, "A blank policy", 1, 5, 8);
INSERT INTO fascist_policy_key(name, description, enacted_count, min_players, max_players) VALUES ("investigate-loyalty", "The President Investigates a player's party membership card.", 1, 9, 10);
INSERT INTO fascist_policy_key(name, description, enacted_count, min_players, max_players) VALUES (null, "A blank policy", 2, 5, 6);
INSERT INTO fascist_policy_key(name, description, enacted_count, min_players, max_players) VALUES ("investigate-loyalty", "The President Investigates a player's party membership card.", 2, 7, 10);
INSERT INTO fascist_policy_key(name, description, enacted_count, min_players, max_players) VALUES ("policy-peek", "The President examines the top three cards.", 3, 5, 6);
INSERT INTO fascist_policy_key(name, description, enacted_count, min_players, max_players) VALUES ("call-special-election", "The president picks the next presidential candidate.", 3, 7, 10);
INSERT INTO fascist_policy_key(name, description, enacted_count, min_players, max_players) VALUES ("execution", "The President must kill a player.", 4, 4, 10);
INSERT INTO fascist_policy_key(name, description, enacted_count, min_players, max_players) VALUES ("execution-veto", "The President must kill a player. Veto power is unlocked.", 5, 3, 10);

INSERT INTO action(game_type_id, name, system_action) VALUES (2, "Secret Hitler Started", 1);
INSERT INTO action(game_type_id, name, system_action) VALUES (2, "Fascists won", 1);
INSERT INTO action(game_type_id, name, system_action) VALUES (2, "Liberals won", 1);
INSERT INTO action(game_type_id, name, system_action) VALUES (2, "Secret Hitler Ended", 1);

/* Election */
INSERT INTO action(game_type_id, name, system_action) VALUES (2, "Election began", 1);
INSERT INTO action(game_type_id, name, system_action) VALUES (2, "Vote passed", 1);
INSERT INTO action(game_type_id, name, system_action) VALUES (2, "Vote failed", 1);
INSERT INTO action(game_type_id, name, system_action) VALUES (2, "Election tracker increased", 1);
INSERT INTO action(game_type_id, name, system_action) VALUES (2, "Election tracker reset", 1);
INSERT INTO action(game_type_id, name, system_action) VALUES (2, "Top policy enacted", 1);
INSERT INTO action(game_type_id, name, system_action) VALUES (2, "Election ended", 1);

INSERT INTO action(game_type_id, name, system_action) VALUES (2, "Nominated for president", 0);
INSERT INTO action(game_type_id, name, system_action) VALUES (2, "Nominated for chancellor", 0);
INSERT INTO action(game_type_id, name, system_action) VALUES (2, "Voted Ja!", 0);
INSERT INTO action(game_type_id, name, system_action) VALUES (2, "Voted Nein!", 0);
INSERT INTO action(game_type_id, name, system_action) VALUES (2, "Elected president", 0);
INSERT INTO action(game_type_id, name, system_action) VALUES (2, "Elected chancellor", 0);

/* Legislative Session */
INSERT INTO action(game_type_id, name, system_action) VALUES (2, "Legislative Session began", 1);
INSERT INTO action(game_type_id, name, system_action) VALUES (2, "Fascist policy enacted", 1);
INSERT INTO action(game_type_id, name, system_action) VALUES (2, "Liberal policy enacted", 1);
INSERT INTO action(game_type_id, name, system_action) VALUES (2, "Legislative Session ended", 1);

INSERT INTO action(game_type_id, name, system_action) VALUES (2, "Discarded Fascist", 0);
INSERT INTO action(game_type_id, name, system_action) VALUES (2, "Discarded Liberal", 0);
INSERT INTO action(game_type_id, name, system_action) VALUES (2, "Enacted Fascist", 0);
INSERT INTO action(game_type_id, name, system_action) VALUES (2, "Enacted Liberal", 0);
INSERT INTO action(game_type_id, name, system_action) VALUES (2, "Requested veto", 0);
INSERT INTO action(game_type_id, name, system_action) VALUES (2, "Denied veto", 0);
INSERT INTO action(game_type_id, name, system_action) VALUES (2, "Accepted veto", 0);

/* Executive Action */
INSERT INTO action(game_type_id, name, system_action) VALUES (2, "Executive action began", 1);
INSERT INTO action(game_type_id, name, system_action) VALUES (2, "Investigate Loyalty", 1);
INSERT INTO action(game_type_id, name, system_action) VALUES (2, "Call Special Election", 1);
INSERT INTO action(game_type_id, name, system_action) VALUES (2, "Policy Peek", 1);
INSERT INTO action(game_type_id, name, system_action) VALUES (2, "Execution", 1);
INSERT INTO action(game_type_id, name, system_action) VALUES (2, "Veto Power", 1);
INSERT INTO action(game_type_id, name, system_action) VALUES (2, "Executive action ended", 1);

INSERT INTO action(game_type_id, name, system_action) VALUES (2, "Investigated loyalty", 0);
INSERT INTO action(game_type_id, name, system_action) VALUES (2, "Called Special Election", 0);
INSERT INTO action(game_type_id, name, system_action) VALUES (2, "Examined top 3 policies", 0);
INSERT INTO action(game_type_id, name, system_action) VALUES (2, "Executed", 0);

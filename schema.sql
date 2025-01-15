DROP TABLE IF EXISTS game_rule;
DROP TABLE IF EXISTS sh_player;
DROP TABLE IF EXISTS aa_country_facility;
DROP TABLE IF EXISTS aa_country_unit;
DROP TABLE IF EXISTS aa_country_territory;
DROP TABLE IF EXISTS aa_country;
DROP TABLE IF EXISTS aa_region;
DROP TABLE IF EXISTS aa_unit;
DROP TABLE IF EXISTS aa_facility;
DROP TABLE IF EXISTS game_user_action;
DROP TABLE IF EXISTS game_user;
DROP TABLE IF EXISTS game_action;
DROP TABLE IF EXISTS sh_policy;
DROP TABLE IF EXISTS game_rule;
DROP TABLE IF EXISTS sh_game;
DROP TABLE IF EXISTS aa_game;
DROP TABLE IF EXISTS game;
DROP TABLE IF EXISTS rule;
DROP TABLE IF EXISTS action;
DROP TABLE IF EXISTS sh_role;
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
CREATE TABLE game_user_action (
  id SERIAL PRIMARY KEY,
  action_id BIGINT UNSIGNED NOT NULL,
  game_user_id BIGINT UNSIGNED,
  target_user_id BIGINT UNSIGNED,
  turn INT NOT NULL,
  action_time DATETIME NOT NULL,
  FOREIGN KEY(game_user_id) REFERENCES game_user(id),
  FOREIGN KEY(action_id) REFERENCES action(id)
);

/* Secret Hitler */

CREATE TABLE sh_game (
  id SERIAL PRIMARY KEY,
  game_id BIGINT UNSIGNED UNIQUE NOT NULL,
  turn INT NOT NULL DEFAULT 1,
  ballot_fail_count INT NOT NULL DEFAULT 0,
  FOREIGN KEY(game_id) REFERENCES game(id)
);

/* Role cards */
CREATE TABLE sh_role (
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

/* Used to keep track of Secret Hitler player information */
CREATE TABLE sh_player (
  id SERIAL PRIMARY KEY,
  game_user_id BIGINT UNSIGNED NOT NULL,
  sh_role_id BIGINT UNSIGNED NOT NULL DEFAULT 1,
  president BOOLEAN NOT NULL DEFAULT 0,
  chancellor BOOLEAN NOT NULL DEFAULT 0,
  prev_president BOOLEAN NOT NULL DEFAULT 0,
  prev_chancellor BOOLEAN NOT NULL DEFAULT 0,
  confirmed_not_hitler BOOLEAN NOT NULL DEFAULT 0,
  special_election_president BOOLEAN NOT NULL DEFAULT 0,
  investigated BOOLEAN NOT NULL DEFAULT 0,
  executed BOOLEAN NOT NULL DEFAULT 0,
  ballot BOOLEAN DEFAULT NULL,
  FOREIGN KEY(game_user_id) REFERENCES game_user(id),
  FOREIGN KEY(sh_role_id) REFERENCES sh_role(id)
);

/* Policy cards */
CREATE TABLE sh_policy (
  id SERIAL PRIMARY KEY,
  sh_game_id BIGINT UNSIGNED NOT NULL,
  fascist BOOLEAN NOT NULL,
  deck_order INT NOT NULL,
  discarded BOOLEAN NOT NULL,
  enacted BOOLEAN NOT NULL,
  FOREIGN KEY(sh_game_id) REFERENCES sh_game(id)
);

/* Axis and Allies */

CREATE TABLE aa_game (
  id SERIAL PRIMARY KEY,
  game_id BIGINT UNSIGNED UNIQUE NOT NULL,
  current_country BIGINT UNSIGNED,
  turn INT NOT NULL DEFAULT 1,
  phase INT NOT NULL DEFAULT 1, /* Int range 1 - 6 */
  FOREIGN KEY(game_id) REFERENCES game(id)
);

/* Used to keep track of Axis and Allies country information */
CREATE TABLE aa_country (
  id SERIAL PRIMARY KEY,
  aa_game_id BIGINT UNSIGNED NOT NULL,
  game_user_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(30) NOT NULL,
  ipc INT,
  FOREIGN KEY(aa_game_id) REFERENCES aa_game(id),
  FOREIGN KEY(game_user_id) REFERENCES game_user(id)
);

/* Units */
CREATE TABLE aa_unit (
  id SERIAL PRIMARY KEY,
  name VARCHAR(30) NOT NULL,
  cost INT,
  alt_cost INT,
  attack INT,
  defense INT,
  movement INT,
  hit_points INT NOT NULL DEFAULT 1
);

/* All regions on the map */
CREATE TABLE aa_region (
  id SERIAL PRIMARY KEY,
  name VARCHAR(40) NOT NULL,
  ipc INT,
  is_water BOOLEAN NOT NULL DEFAULT 0,
  is_island BOOLEAN NOT NULL DEFAULT 0, -- Industrial complexes cannot be placed on islands
  is_coastal BOOLEAN NOT NULL DEFAULT 0 -- Naval bases can only be placed on coastal territories
);

/* TODO: Add mapping to adjacent regions */

/* A country's region */
CREATE TABLE aa_country_territory (
  id SERIAL PRIMARY KEY,
  aa_country_id BIGINT UNSIGNED NOT NULL,
  aa_region_id BIGINT UNSIGNED NOT NULL,
  captured BOOLEAN NOT NULL DEFAULT 0, /* Keeps track if the territory was captured by that country. Captured territories can't make major ics */
  FOREIGN KEY(aa_country_id) REFERENCES aa_country(id),
  FOREIGN KEY(aa_region_id) REFERENCES aa_region(id)
);

/* A country's unit and which territory it is in */
CREATE TABLE aa_country_unit (
  id SERIAL PRIMARY KEY,
  aa_country_territory_id BIGINT UNSIGNED NOT NULL,
  aa_unit_id BIGINT UNSIGNED NOT NULL,
  health INT,
  FOREIGN KEY(aa_country_territory_id) REFERENCES aa_country_territory(id),
  FOREIGN KEY(aa_unit_id) REFERENCES aa_unit(id)
);

/* Facilities */
CREATE TABLE aa_facility (
  id SERIAL PRIMARY KEY,
  name VARCHAR(40) NOT NULL,
  cost INT,
  hit_points INT,
  disabled_at INT
);

/* A country's facility and which territory it is in */
CREATE TABLE aa_country_facility (
  id SERIAL PRIMARY KEY,
  aa_country_territory_id BIGINT UNSIGNED NOT NULL,
  aa_facility_id BIGINT UNSIGNED NOT NULL,
  health INT,
  disabled BOOLEAN NOT NULL DEFAULT 0,
  FOREIGN KEY(aa_country_territory_id) REFERENCES aa_country_territory(id),
  FOREIGN KEY(aa_facility_id) REFERENCES aa_facility(id)
);

/* Generic Games */

INSERT INTO game_type(name, description) VALUES ("Axis and Allies 1940 Global, Second Edition", "2 - 9 player game");
INSERT INTO game_type(name, description) VALUES ("Secret Hitler", "5 to 10 player game");

/* Secret Hitler */

INSERT INTO rule(game_type_id, name, description) VALUES (2, "Shadow Democracy", "Player ballots are not shown during and after voting");
INSERT INTO rule(game_type_id, name, description) VALUES (2, "Political Leverage", "If the group rejects three governments in a row, any power granted by the enacted policy is granted to the previously elected president");
INSERT INTO rule(game_type_id, name, description) VALUES (2, "Underground Nazi Network", "Fascist players, excluding Hitler, will see who their other teammates are for the duration of the game");

INSERT INTO sh_role(secret_identity, party_membership) VALUES ("Hitler", 1);
INSERT INTO sh_role(secret_identity, party_membership) VALUES ("Fascist", 1);
INSERT INTO sh_role(secret_identity, party_membership) VALUES ("Liberal", 0);
INSERT INTO sh_role(secret_identity, party_membership) VALUES ("Liberal", 0);
INSERT INTO sh_role(secret_identity, party_membership) VALUES ("Liberal", 0);
INSERT INTO sh_role(secret_identity, party_membership) VALUES ("Liberal", 0);
INSERT INTO sh_role(secret_identity, party_membership) VALUES ("Fascist", 1);
INSERT INTO sh_role(secret_identity, party_membership) VALUES ("Liberal", 0);
INSERT INTO sh_role(secret_identity, party_membership) VALUES ("Fascist", 1);
INSERT INTO sh_role(secret_identity, party_membership) VALUES ("Liberal", 0);
INSERT INTO sh_role(secret_identity, party_membership) VALUES ("Temp", 0);

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

/* Axis and Allies */

INSERT INTO aa_unit(name, cost, alt_cost, attack, defense, movement) VALUES ("Infantry", 3, null, 1, 2, 1);
INSERT INTO aa_unit(name, cost, alt_cost, attack, defense, movement) VALUES ("Artillery", 4, null, 2, 2, 1);
INSERT INTO aa_unit(name, cost, alt_cost, attack, defense, movement) VALUES ("Mechanized Infantry", 4, null, 1, 2, 2);
INSERT INTO aa_unit(name, cost, alt_cost, attack, defense, movement) VALUES ("Tank", 6, null, 3, 3, 2);
INSERT INTO aa_unit(name, cost, alt_cost, attack, defense, movement) VALUES ("Antiaircraft Artillery", 5, null, null, null, 1);
INSERT INTO aa_unit(name, cost, alt_cost, attack, defense, movement) VALUES ("Fighter", 10, null, 3, 4, 4);
INSERT INTO aa_unit(name, cost, alt_cost, attack, defense, movement) VALUES ("Tactical Bomber", 11, null, 3, 3, 4);
INSERT INTO aa_unit(name, cost, alt_cost, attack, defense, movement) VALUES ("Strategic Bombers", 12, null, 4, 1, 6);
INSERT INTO aa_unit(name, cost, alt_cost, attack, defense, movement, hit_points) VALUES ("Battleship", 20, 17, 4, 4, 2, 2);
INSERT INTO aa_unit(name, cost, alt_cost, attack, defense, movement, hit_points) VALUES ("Aircraft Carrier", 16, 13, null, 2, 2, 2);
INSERT INTO aa_unit(name, cost, alt_cost, attack, defense, movement) VALUES ("Cruiser", 12, 9, 3, 3, 2);
INSERT INTO aa_unit(name, cost, alt_cost, attack, defense, movement) VALUES ("Destroyer", 8, 7, 2, 2, 2);
INSERT INTO aa_unit(name, cost, alt_cost, attack, defense, movement) VALUES ("Transport", 7, 6, null, null, 2);
INSERT INTO aa_unit(name, cost, alt_cost, attack, defense, movement) VALUES ("Submarine", 6, 5, 2, 1, 2);

INSERT INTO aa_facility(name, cost, hit_points, disabled_at) VALUES ("Major Industrial Complex", 30, 20, 10);
INSERT INTO aa_facility(name, cost, hit_points, disabled_at) VALUES ("Minor Industrial Complex", 12, 6, 3);
INSERT INTO aa_facility(name, cost, hit_points, disabled_at) VALUES ("Air base", 15, 6, 3);
INSERT INTO aa_facility(name, cost, hit_points, disabled_at) VALUES ("Naval base", 15, 6, 3);

/* Water Regions */
INSERT INTO aa_region (name, ipc, is_water, is_island, is_coastal) VALUES ("1", null, 1, 0, 0);
INSERT INTO aa_region (name, ipc, is_water, is_island, is_coastal) VALUES ("2", null, 1, 0, 0);
INSERT INTO aa_region (name, ipc, is_water, is_island, is_coastal) VALUES ("3", null, 1, 0, 0);
INSERT INTO aa_region (name, ipc, is_water, is_island, is_coastal) VALUES ("4", null, 1, 0, 0);
INSERT INTO aa_region (name, ipc, is_water, is_island, is_coastal) VALUES ("5", null, 1, 0, 0);
INSERT INTO aa_region (name, ipc, is_water, is_island, is_coastal) VALUES ("6", null, 1, 0, 0);
INSERT INTO aa_region (name, ipc, is_water, is_island, is_coastal) VALUES ("7", null, 1, 0, 0);
INSERT INTO aa_region (name, ipc, is_water, is_island, is_coastal) VALUES ("8", null, 1, 0, 0);
INSERT INTO aa_region (name, ipc, is_water, is_island, is_coastal) VALUES ("9", null, 1, 0, 0);
INSERT INTO aa_region (name, ipc, is_water, is_island, is_coastal) VALUES ("10", null, 1, 0, 0);
INSERT INTO aa_region (name, ipc, is_water, is_island, is_coastal) VALUES ("11", null, 1, 0, 0);
INSERT INTO aa_region (name, ipc, is_water, is_island, is_coastal) VALUES ("12", null, 1, 0, 0);
INSERT INTO aa_region (name, ipc, is_water, is_island, is_coastal) VALUES ("13", null, 1, 0, 0);
INSERT INTO aa_region (name, ipc, is_water, is_island, is_coastal) VALUES ("14", null, 1, 0, 0);
INSERT INTO aa_region (name, ipc, is_water, is_island, is_coastal) VALUES ("15", null, 1, 0, 0);
INSERT INTO aa_region (name, ipc, is_water, is_island, is_coastal) VALUES ("16", null, 1, 0, 0);
INSERT INTO aa_region (name, ipc, is_water, is_island, is_coastal) VALUES ("17", null, 1, 0, 0);
INSERT INTO aa_region (name, ipc, is_water, is_island, is_coastal) VALUES ("18", null, 1, 0, 0);
INSERT INTO aa_region (name, ipc, is_water, is_island, is_coastal) VALUES ("19", null, 1, 0, 0);
INSERT INTO aa_region (name, ipc, is_water, is_island, is_coastal) VALUES ("20", null, 1, 0, 0);
INSERT INTO aa_region (name, ipc, is_water, is_island, is_coastal) VALUES ("21", null, 1, 0, 0);
INSERT INTO aa_region (name, ipc, is_water, is_island, is_coastal) VALUES ("22", null, 1, 0, 0);
INSERT INTO aa_region (name, ipc, is_water, is_island, is_coastal) VALUES ("23", null, 1, 0, 0);
INSERT INTO aa_region (name, ipc, is_water, is_island, is_coastal) VALUES ("24", null, 1, 0, 0);
INSERT INTO aa_region (name, ipc, is_water, is_island, is_coastal) VALUES ("25", null, 1, 0, 0);
INSERT INTO aa_region (name, ipc, is_water, is_island, is_coastal) VALUES ("26", null, 1, 0, 0);
INSERT INTO aa_region (name, ipc, is_water, is_island, is_coastal) VALUES ("27", null, 1, 0, 0);
INSERT INTO aa_region (name, ipc, is_water, is_island, is_coastal) VALUES ("28", null, 1, 0, 0);
INSERT INTO aa_region (name, ipc, is_water, is_island, is_coastal) VALUES ("29", null, 1, 0, 0);
INSERT INTO aa_region (name, ipc, is_water, is_island, is_coastal) VALUES ("30", null, 1, 0, 0);
INSERT INTO aa_region (name, ipc, is_water, is_island, is_coastal) VALUES ("31", null, 1, 0, 0);
INSERT INTO aa_region (name, ipc, is_water, is_island, is_coastal) VALUES ("32", null, 1, 0, 0);
INSERT INTO aa_region (name, ipc, is_water, is_island, is_coastal) VALUES ("33", null, 1, 0, 0);
INSERT INTO aa_region (name, ipc, is_water, is_island, is_coastal) VALUES ("34", null, 1, 0, 0);
INSERT INTO aa_region (name, ipc, is_water, is_island, is_coastal) VALUES ("35", null, 1, 0, 0);
INSERT INTO aa_region (name, ipc, is_water, is_island, is_coastal) VALUES ("36", null, 1, 0, 0);
INSERT INTO aa_region (name, ipc, is_water, is_island, is_coastal) VALUES ("37", null, 1, 0, 0);
INSERT INTO aa_region (name, ipc, is_water, is_island, is_coastal) VALUES ("38", null, 1, 0, 0);
INSERT INTO aa_region (name, ipc, is_water, is_island, is_coastal) VALUES ("39", null, 1, 0, 0);
INSERT INTO aa_region (name, ipc, is_water, is_island, is_coastal) VALUES ("40", null, 1, 0, 0);
INSERT INTO aa_region (name, ipc, is_water, is_island, is_coastal) VALUES ("41", null, 1, 0, 0);
INSERT INTO aa_region (name, ipc, is_water, is_island, is_coastal) VALUES ("42", null, 1, 0, 0);
INSERT INTO aa_region (name, ipc, is_water, is_island, is_coastal) VALUES ("43", null, 1, 0, 0);
INSERT INTO aa_region (name, ipc, is_water, is_island, is_coastal) VALUES ("44", null, 1, 0, 0);
INSERT INTO aa_region (name, ipc, is_water, is_island, is_coastal) VALUES ("45", null, 1, 0, 0);
INSERT INTO aa_region (name, ipc, is_water, is_island, is_coastal) VALUES ("46", null, 1, 0, 0);
INSERT INTO aa_region (name, ipc, is_water, is_island, is_coastal) VALUES ("47", null, 1, 0, 0);
INSERT INTO aa_region (name, ipc, is_water, is_island, is_coastal) VALUES ("48", null, 1, 0, 0);
INSERT INTO aa_region (name, ipc, is_water, is_island, is_coastal) VALUES ("49", null, 1, 0, 0);
INSERT INTO aa_region (name, ipc, is_water, is_island, is_coastal) VALUES ("50", null, 1, 0, 0);
INSERT INTO aa_region (name, ipc, is_water, is_island, is_coastal) VALUES ("51", null, 1, 0, 0);
INSERT INTO aa_region (name, ipc, is_water, is_island, is_coastal) VALUES ("52", null, 1, 0, 0);
INSERT INTO aa_region (name, ipc, is_water, is_island, is_coastal) VALUES ("53", null, 1, 0, 0);
INSERT INTO aa_region (name, ipc, is_water, is_island, is_coastal) VALUES ("54", null, 1, 0, 0);
INSERT INTO aa_region (name, ipc, is_water, is_island, is_coastal) VALUES ("55", null, 1, 0, 0);
INSERT INTO aa_region (name, ipc, is_water, is_island, is_coastal) VALUES ("56", null, 1, 0, 0);
INSERT INTO aa_region (name, ipc, is_water, is_island, is_coastal) VALUES ("57", null, 1, 0, 0);
INSERT INTO aa_region (name, ipc, is_water, is_island, is_coastal) VALUES ("58", null, 1, 0, 0);
INSERT INTO aa_region (name, ipc, is_water, is_island, is_coastal) VALUES ("59", null, 1, 0, 0);
INSERT INTO aa_region (name, ipc, is_water, is_island, is_coastal) VALUES ("60", null, 1, 0, 0);
INSERT INTO aa_region (name, ipc, is_water, is_island, is_coastal) VALUES ("61", null, 1, 0, 0);
INSERT INTO aa_region (name, ipc, is_water, is_island, is_coastal) VALUES ("62", null, 1, 0, 0);
INSERT INTO aa_region (name, ipc, is_water, is_island, is_coastal) VALUES ("63", null, 1, 0, 0);
INSERT INTO aa_region (name, ipc, is_water, is_island, is_coastal) VALUES ("64", null, 1, 0, 0);
INSERT INTO aa_region (name, ipc, is_water, is_island, is_coastal) VALUES ("65", null, 1, 0, 0);
INSERT INTO aa_region (name, ipc, is_water, is_island, is_coastal) VALUES ("66", null, 1, 0, 0);
INSERT INTO aa_region (name, ipc, is_water, is_island, is_coastal) VALUES ("67", null, 1, 0, 0);
INSERT INTO aa_region (name, ipc, is_water, is_island, is_coastal) VALUES ("68", null, 1, 0, 0);
INSERT INTO aa_region (name, ipc, is_water, is_island, is_coastal) VALUES ("69", null, 1, 0, 0);
INSERT INTO aa_region (name, ipc, is_water, is_island, is_coastal) VALUES ("70", null, 1, 0, 0);
INSERT INTO aa_region (name, ipc, is_water, is_island, is_coastal) VALUES ("71", null, 1, 0, 0);
INSERT INTO aa_region (name, ipc, is_water, is_island, is_coastal) VALUES ("72", null, 1, 0, 0);
INSERT INTO aa_region (name, ipc, is_water, is_island, is_coastal) VALUES ("73", null, 1, 0, 0);
INSERT INTO aa_region (name, ipc, is_water, is_island, is_coastal) VALUES ("74", null, 1, 0, 0);
INSERT INTO aa_region (name, ipc, is_water, is_island, is_coastal) VALUES ("75", null, 1, 0, 0);
INSERT INTO aa_region (name, ipc, is_water, is_island, is_coastal) VALUES ("76", null, 1, 0, 0);
INSERT INTO aa_region (name, ipc, is_water, is_island, is_coastal) VALUES ("77", null, 1, 0, 0);
INSERT INTO aa_region (name, ipc, is_water, is_island, is_coastal) VALUES ("78", null, 1, 0, 0);
INSERT INTO aa_region (name, ipc, is_water, is_island, is_coastal) VALUES ("79", null, 1, 0, 0);
INSERT INTO aa_region (name, ipc, is_water, is_island, is_coastal) VALUES ("80", null, 1, 0, 0);
INSERT INTO aa_region (name, ipc, is_water, is_island, is_coastal) VALUES ("81", null, 1, 0, 0);
INSERT INTO aa_region (name, ipc, is_water, is_island, is_coastal) VALUES ("82", null, 1, 0, 0);
INSERT INTO aa_region (name, ipc, is_water, is_island, is_coastal) VALUES ("83", null, 1, 0, 0);
INSERT INTO aa_region (name, ipc, is_water, is_island, is_coastal) VALUES ("84", null, 1, 0, 0);
INSERT INTO aa_region (name, ipc, is_water, is_island, is_coastal) VALUES ("85", null, 1, 0, 0);
INSERT INTO aa_region (name, ipc, is_water, is_island, is_coastal) VALUES ("86", null, 1, 0, 0);
INSERT INTO aa_region (name, ipc, is_water, is_island, is_coastal) VALUES ("87", null, 1, 0, 0);
INSERT INTO aa_region (name, ipc, is_water, is_island, is_coastal) VALUES ("88", null, 1, 0, 0);
INSERT INTO aa_region (name, ipc, is_water, is_island, is_coastal) VALUES ("89", null, 1, 0, 0);
INSERT INTO aa_region (name, ipc, is_water, is_island, is_coastal) VALUES ("90", null, 1, 0, 0);
INSERT INTO aa_region (name, ipc, is_water, is_island, is_coastal) VALUES ("91", null, 1, 0, 0);
INSERT INTO aa_region (name, ipc, is_water, is_island, is_coastal) VALUES ("92", null, 1, 0, 0);
INSERT INTO aa_region (name, ipc, is_water, is_island, is_coastal) VALUES ("93", null, 1, 0, 0);
INSERT INTO aa_region (name, ipc, is_water, is_island, is_coastal) VALUES ("94", null, 1, 0, 0);
INSERT INTO aa_region (name, ipc, is_water, is_island, is_coastal) VALUES ("95", null, 1, 0, 0);
INSERT INTO aa_region (name, ipc, is_water, is_island, is_coastal) VALUES ("96", null, 1, 0, 0);
INSERT INTO aa_region (name, ipc, is_water, is_island, is_coastal) VALUES ("97", null, 1, 0, 0);
INSERT INTO aa_region (name, ipc, is_water, is_island, is_coastal) VALUES ("98", null, 1, 0, 0);
INSERT INTO aa_region (name, ipc, is_water, is_island, is_coastal) VALUES ("99", null, 1, 0, 0);
INSERT INTO aa_region (name, ipc, is_water, is_island, is_coastal) VALUES ("100", null, 1, 0, 0);
INSERT INTO aa_region (name, ipc, is_water, is_island, is_coastal) VALUES ("101", null, 1, 0, 0);
INSERT INTO aa_region (name, ipc, is_water, is_island, is_coastal) VALUES ("102", null, 1, 0, 0);
INSERT INTO aa_region (name, ipc, is_water, is_island, is_coastal) VALUES ("103", null, 1, 0, 0);
INSERT INTO aa_region (name, ipc, is_water, is_island, is_coastal) VALUES ("104", null, 1, 0, 0);
INSERT INTO aa_region (name, ipc, is_water, is_island, is_coastal) VALUES ("105", null, 1, 0, 0);
INSERT INTO aa_region (name, ipc, is_water, is_island, is_coastal) VALUES ("106", null, 1, 0, 0);
INSERT INTO aa_region (name, ipc, is_water, is_island, is_coastal) VALUES ("107", null, 1, 0, 0);
INSERT INTO aa_region (name, ipc, is_water, is_island, is_coastal) VALUES ("108", null, 1, 0, 0);
INSERT INTO aa_region (name, ipc, is_water, is_island, is_coastal) VALUES ("109", null, 1, 0, 0);
INSERT INTO aa_region (name, ipc, is_water, is_island, is_coastal) VALUES ("110", null, 1, 0, 0);
INSERT INTO aa_region (name, ipc, is_water, is_island, is_coastal) VALUES ("111", null, 1, 0, 0);
INSERT INTO aa_region (name, ipc, is_water, is_island, is_coastal) VALUES ("112", null, 1, 0, 0);
INSERT INTO aa_region (name, ipc, is_water, is_island, is_coastal) VALUES ("113", null, 1, 0, 0);
INSERT INTO aa_region (name, ipc, is_water, is_island, is_coastal) VALUES ("114", null, 1, 0, 0);
INSERT INTO aa_region (name, ipc, is_water, is_island, is_coastal) VALUES ("115", null, 1, 0, 0);
INSERT INTO aa_region (name, ipc, is_water, is_island, is_coastal) VALUES ("116", null, 1, 0, 0);
INSERT INTO aa_region (name, ipc, is_water, is_island, is_coastal) VALUES ("117", null, 1, 0, 0);
INSERT INTO aa_region (name, ipc, is_water, is_island, is_coastal) VALUES ("118", null, 1, 0, 0);
INSERT INTO aa_region (name, ipc, is_water, is_island, is_coastal) VALUES ("119", null, 1, 0, 0);
INSERT INTO aa_region (name, ipc, is_water, is_island, is_coastal) VALUES ("120", null, 1, 0, 0);
INSERT INTO aa_region (name, ipc, is_water, is_island, is_coastal) VALUES ("121", null, 1, 0, 0);
INSERT INTO aa_region (name, ipc, is_water, is_island, is_coastal) VALUES ("122", null, 1, 0, 0);
INSERT INTO aa_region (name, ipc, is_water, is_island, is_coastal) VALUES ("123", null, 1, 0, 0);
INSERT INTO aa_region (name, ipc, is_water, is_island, is_coastal) VALUES ("124", null, 1, 0, 0);
INSERT INTO aa_region (name, ipc, is_water, is_island, is_coastal) VALUES ("125", null, 1, 0, 0);
INSERT INTO aa_region (name, ipc, is_water, is_island, is_coastal) VALUES ("126", null, 1, 0, 0);
INSERT INTO aa_region (name, ipc, is_water, is_island, is_coastal) VALUES ("127", null, 1, 0, 0);
INSERT INTO aa_region (name, ipc, is_water, is_island, is_coastal) VALUES ("Caspian Sea", null, 1, 0, 0);

/* North America */
INSERT INTO aa_region (name, ipc, is_water, is_island, is_coastal) VALUES ("Greenland", null, 0, 0, 1);
INSERT INTO aa_region (name, ipc, is_water, is_island, is_coastal) VALUES ("Alberta Saskatchewan Manitoba", 1, 0, 0, 1);
INSERT INTO aa_region (name, ipc, is_water, is_island, is_coastal) VALUES ("Ontario", 2, 0, 0, 1);
INSERT INTO aa_region (name, ipc, is_water, is_island, is_coastal) VALUES ("Quebec", 2, 0, 0, 1);
INSERT INTO aa_region (name, ipc, is_water, is_island, is_coastal) VALUES ("Newfoundland Labrador", null, 0, 0, 1);
INSERT INTO aa_region (name, ipc, is_water, is_island, is_coastal) VALUES ("New Brunswick Nova Scotia", 1, 0, 0, 1);
INSERT INTO aa_region (name, ipc, is_water, is_island, is_coastal) VALUES ("Western Canada", 1, 0, 0, 1);
INSERT INTO aa_region (name, ipc, is_water, is_island, is_coastal) VALUES ("Alaska", 2, 0, 0, 1);
INSERT INTO aa_region (name, ipc, is_water, is_island, is_coastal) VALUES ("Aleutian Islands", null, 0, 1, 1);
INSERT INTO aa_region (name, ipc, is_water, is_island, is_coastal) VALUES ("Central United States", 12, 0, 0, 1);
INSERT INTO aa_region (name, ipc, is_water, is_island, is_coastal) VALUES ("Eastern United States", 20, 0, 0, 1);
INSERT INTO aa_region (name, ipc, is_water, is_island, is_coastal) VALUES ("Western United States", 10, 0, 0, 1);
INSERT INTO aa_region (name, ipc, is_water, is_island, is_coastal) VALUES ("Mexico", 2, 0, 0, 1);
INSERT INTO aa_region (name, ipc, is_water, is_island, is_coastal) VALUES ("Southeast Mexico", 1, 0, 0, 1);
INSERT INTO aa_region (name, ipc, is_water, is_island, is_coastal) VALUES ("West Indies", 1, 0, 1, 1);
INSERT INTO aa_region (name, ipc, is_water, is_island, is_coastal) VALUES ("Central America", 1, 0, 0, 1);

/* South America */
INSERT INTO aa_region (name, ipc, is_water, is_island, is_coastal) VALUES ("Venezuela", 2, 0, 0, 1);
INSERT INTO aa_region (name, ipc, is_water, is_island, is_coastal) VALUES ("Colombia", null, 0, 0, 1);
INSERT INTO aa_region (name, ipc, is_water, is_island, is_coastal) VALUES ("Ecuador", null, 0, 0, 1);
INSERT INTO aa_region (name, ipc, is_water, is_island, is_coastal) VALUES ("Peru", null, 0, 0, 1);
INSERT INTO aa_region (name, ipc, is_water, is_island, is_coastal) VALUES ("Bolivia", null, 0, 0, 0);
INSERT INTO aa_region (name, ipc, is_water, is_island, is_coastal) VALUES ("Paraguay", null, 0, 0, 0);
INSERT INTO aa_region (name, ipc, is_water, is_island, is_coastal) VALUES ("Chile", 2, 0, 0, 1);
INSERT INTO aa_region (name, ipc, is_water, is_island, is_coastal) VALUES ("Argentina", 2, 0, 0, 1);
INSERT INTO aa_region (name, ipc, is_water, is_island, is_coastal) VALUES ("Uruguay", null, 0, 0, 1);
INSERT INTO aa_region (name, ipc, is_water, is_island, is_coastal) VALUES ("Brazil", 2, 0, 0, 1);
INSERT INTO aa_region (name, ipc, is_water, is_island, is_coastal) VALUES ("British Guiana", null, 0, 0, 1);
INSERT INTO aa_region (name, ipc, is_water, is_island, is_coastal) VALUES ("Suriname", null, 0, 0, 1);
INSERT INTO aa_region (name, ipc, is_water, is_island, is_coastal) VALUES ("French Guiana", null, 0, 0, 1);

/* Africa */
INSERT INTO aa_region (name, ipc, is_water, is_island, is_coastal) VALUES ("Morocco", 1, 0, 0, 1);
INSERT INTO aa_region (name, ipc, is_water, is_island, is_coastal) VALUES ("Algeria", 1, 0, 0, 1);
INSERT INTO aa_region (name, ipc, is_water, is_island, is_coastal) VALUES ("Tunisia", 1, 0, 0, 1);
INSERT INTO aa_region (name, ipc, is_water, is_island, is_coastal) VALUES ("Libya", 1, 0, 0, 1);
INSERT INTO aa_region (name, ipc, is_water, is_island, is_coastal) VALUES ("Tobruk", null, 0, 0, 1);
INSERT INTO aa_region (name, ipc, is_water, is_island, is_coastal) VALUES ("Alexandria", null, 0, 0, 1);
INSERT INTO aa_region (name, ipc, is_water, is_island, is_coastal) VALUES ("Egypt", 2, 0, 0, 1);
INSERT INTO aa_region (name, ipc, is_water, is_island, is_coastal) VALUES ("Anglo-Egyptian Sudan", 1, 0, 0, 1);
INSERT INTO aa_region (name, ipc, is_water, is_island, is_coastal) VALUES ("Rio de Oro", null, 0, 0, 1);
INSERT INTO aa_region (name, ipc, is_water, is_island, is_coastal) VALUES ("Sahara Desert", null, 0, 0, 1); -- impassible
INSERT INTO aa_region (name, ipc, is_water, is_island, is_coastal) VALUES ("Portuguese Guinea", null, 0, 0, 1);
INSERT INTO aa_region (name, ipc, is_water, is_island, is_coastal) VALUES ("French West Africa", 1, 0, 0, 1);
INSERT INTO aa_region (name, ipc, is_water, is_island, is_coastal) VALUES ("Sierra Leone", null, 0, 0, 1);
INSERT INTO aa_region (name, ipc, is_water, is_island, is_coastal) VALUES ("Liberia", null, 0, 0, 1);
INSERT INTO aa_region (name, ipc, is_water, is_island, is_coastal) VALUES ("Gold Coast", 1, 0, 0, 1);
INSERT INTO aa_region (name, ipc, is_water, is_island, is_coastal) VALUES ("French Central Africa", 1, 0, 0, 0);
INSERT INTO aa_region (name, ipc, is_water, is_island, is_coastal) VALUES ("Nigeria", 1, 0, 0, 1);
INSERT INTO aa_region (name, ipc, is_water, is_island, is_coastal) VALUES ("French Equatorial Africa", 1, 0, 0, 1);
INSERT INTO aa_region (name, ipc, is_water, is_island, is_coastal) VALUES ("Ethiopia", 1, 0, 0, 1);
INSERT INTO aa_region (name, ipc, is_water, is_island, is_coastal) VALUES ("British Somaliland", null, 0, 0, 1);
INSERT INTO aa_region (name, ipc, is_water, is_island, is_coastal) VALUES ("Italian Somaliland", null, 0, 0, 1);
INSERT INTO aa_region (name, ipc, is_water, is_island, is_coastal) VALUES ("Kenya", 1, 0, 0, 1);
INSERT INTO aa_region (name, ipc, is_water, is_island, is_coastal) VALUES ("Belgian Congo", 1, 0, 0, 0);
INSERT INTO aa_region (name, ipc, is_water, is_island, is_coastal) VALUES ("Angola", 1, 0, 0, 1);
INSERT INTO aa_region (name, ipc, is_water, is_island, is_coastal) VALUES ("South West Africa", 1, 0, 0, 1);
INSERT INTO aa_region (name, ipc, is_water, is_island, is_coastal) VALUES ("Rhodesia", 1, 0, 0, 0);
INSERT INTO aa_region (name, ipc, is_water, is_island, is_coastal) VALUES ("Union of South Africa", 2, 0, 0, 1);
INSERT INTO aa_region (name, ipc, is_water, is_island, is_coastal) VALUES ("Mozambique", 1, 0, 0, 1);
INSERT INTO aa_region (name, ipc, is_water, is_island, is_coastal) VALUES ("Tanganyika Territory", 1, 0, 0, 1);
INSERT INTO aa_region (name, ipc, is_water, is_island, is_coastal) VALUES ("French Madagascar", 1, 0, 1, 1);

/* Europe */
INSERT INTO aa_region (name, ipc, is_water, is_island, is_coastal) VALUES ("Iceland", null, 0, 1, 1);

/* Asia */

/* Australia */

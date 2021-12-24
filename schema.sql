DROP TABLE IF EXISTS lobby_user;
DROP TABLE IF EXISTS user;
DROP TABLE IF EXISTS lobby;
DROP TABLE IF EXISTS policy;

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

CREATE TABLE lobby (
  lobby_id SERIAL PRIMARY KEY,
  lobby_code VARCHAR(5) NOT NULL,
  player_count INT NOT NULL,
  time_created DATETIME NOT NULL
);

CREATE TABLE lobby_user (
  lobby_id INT NOT NULL REFERENCES lobby,
  user_id INT NOT NULL REFERENCES user
);

CREATE TABLE policy (
  policy_id INT NOT NULL,
  type TEXT,
  deckOrder INT,
  isDiscarded BOOLEAN,
  isEnacted BOOLEAN,
  PRIMARY KEY(policy_id)
);

INSERT INTO policy VALUES (1, "Liberal", 0, 0, 0);
INSERT INTO policy VALUES (2, "Liberal", 1, 0, 0);
INSERT INTO policy VALUES (3, "Liberal", 2, 0, 0);
INSERT INTO policy VALUES (4, "Liberal", 3, 0, 0);
INSERT INTO policy VALUES (5, "Liberal", 4, 0, 0);
INSERT INTO policy VALUES (6, "Liberal", 5, 0, 0);

INSERT INTO policy VALUES (7, "Fascist", 6, 0, 0);
INSERT INTO policy VALUES (8, "Fascist", 7, 0, 0);
INSERT INTO policy VALUES (9, "Fascist", 8, 0, 0);
INSERT INTO policy VALUES (10, "Fascist", 9, 0, 0);
INSERT INTO policy VALUES (11, "Fascist", 10, 0, 0);
INSERT INTO policy VALUES (12, "Fascist", 11, 0, 0);
INSERT INTO policy VALUES (13, "Fascist", 12, 0, 0);
INSERT INTO policy VALUES (14, "Fascist", 13, 0, 0);
INSERT INTO policy VALUES (15, "Fascist", 14, 0, 0);
INSERT INTO policy VALUES (16, "Fascist", 15, 0, 0);
INSERT INTO policy VALUES (17, "Fascist", 16, 0, 0);

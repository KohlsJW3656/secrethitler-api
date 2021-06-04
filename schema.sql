DROP TABLE IF EXISTS policy;

CREATE TABLE policy (
  policy_id INT NOT NULL,
  type TEXT,
  deckOrder INT,
  isDiscarded BOOLEAN,
  isEnacted BOOLEAN,
  PRIMARY KEY(policy_id)
);

INSERT INTO policy VALUES (1, "Liberal", 1, FALSE, FALSE);
INSERT INTO policy VALUES (2, "Liberal", 2, FALSE, FALSE);
INSERT INTO policy VALUES (3, "Liberal", 3, FALSE, FALSE);
INSERT INTO policy VALUES (4, "Liberal", 4, FALSE, FALSE);
INSERT INTO policy VALUES (5, "Liberal", 5, FALSE, FALSE);
INSERT INTO policy VALUES (6, "Liberal", 6, FALSE, FALSE);

INSERT INTO policy VALUES (7, "Fascist", 7, FALSE, FALSE);
INSERT INTO policy VALUES (8, "Fascist", 8, FALSE, FALSE);
INSERT INTO policy VALUES (9, "Fascist", 9, FALSE, FALSE);
INSERT INTO policy VALUES (10, "Fascist", 10, FALSE, FALSE);
INSERT INTO policy VALUES (11, "Fascist", 11, FALSE, FALSE);
INSERT INTO policy VALUES (12, "Fascist", 12, FALSE, FALSE);
INSERT INTO policy VALUES (13, "Fascist", 13, FALSE, FALSE);
INSERT INTO policy VALUES (14, "Fascist", 14,FALSE, FALSE);
INSERT INTO policy VALUES (15, "Fascist", 15, FALSE, FALSE);
INSERT INTO policy VALUES (16, "Fascist", 16, FALSE, FALSE);
INSERT INTO policy VALUES (17, "Fascist", 17, FALSE, FALSE);

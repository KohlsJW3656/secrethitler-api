DROP DATABASE IF EXISTS secrethitler;
DROP USER IF EXISTS shUser@localhost;

CREATE DATABASE secrethitler CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER shUser@localhost IDENTIFIED BY 'wQynVfAg1$';
GRANT ALL PRIVILEGES ON secrethitler.* TO shUser@localhost;
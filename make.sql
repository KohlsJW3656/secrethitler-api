DROP DATABASE IF EXISTS secrethitler;
DROP USER IF EXISTS shUser@localhost;

CREATE DATABASE secrethitler CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'shUser'@'localhost' IDENTIFIED WITH mysql_native_password BY 'wQynVfAg1$';
GRANT ALL ON secrethitler.* TO 'shUser'@'localhost';
FLUSH PRIVILEGES;
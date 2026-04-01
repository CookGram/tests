CREATE DATABASE recipes_db;

CREATE TABLE IF NOT EXISTS users (
                       id            SERIAL PRIMARY KEY,
                       email         VARCHAR NOT NULL UNIQUE,
                       password VARCHAR NOT NULL,
                       name          VARCHAR  NOT NULL
);

CREATE TABLE IF NOT EXISTS recipes (
                         id        SERIAL PRIMARY KEY,
                         author_id  INT  NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                         title      VARCHAR(100) NOT NULL,
                         image_data BYTEA,
                         created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS recipe_steps (
                              id          SERIAL PRIMARY KEY,
                              recipe_id   INT  NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
                              step_no     SMALLINT NOT NULL,
                              description VARCHAR(100) NOT NULL,
                              image_data  BYTEA
);

CREATE TABLE IF NOT EXISTS follows (
                                id          SERIAL PRIMARY KEY,
                                follower_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                                followee_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE
);
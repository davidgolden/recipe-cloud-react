require('dotenv').config({path: './.env'});
const mongoose = require('mongoose');
const User = require('./models/user');
const Recipe = require("./models/recipe");
const Collection = require("./models/collection");
const Rating = require("./models/rating");

const db = require("./db/index");

function populate() {
    mongoose.connect(1 ? process.env.MONGO : process.env.MONGO_DEV,
        {useNewUrlParser: true, autoIndex: false, useCreateIndex: true})
        .then(async () => {

            User.find({}, async (err, users) => {
                for (let i = 0; i < users.length; i++) {
                    const user = users[i];

                    const userRes = await db.query(`
                        INSERT INTO users (username, email, profile_image, password)
                        VALUES ('${user.username}', '${user.email}', '${user.profileImage}', '${user.password}') RETURNING *;
                    `);

                    // add all user's created recipes
                    await Recipe.find({author_id: user._id}, async (err, recipes) => {
                        for (let i = 0; i < recipes.length; i++) {
                            const recipe = recipes[i];

                            const recipeRes = await db.query({
                                text: 'INSERT INTO recipes (name, url, notes, image, author_id, created_at) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
                                values: [recipe.name, recipe.url, recipe.notes, recipe.image, userRes.rows[0].id, recipe.created_at],
                            });

                            for (let x = 0; x < recipe.ingredients.length; x++) {
                                const ing = recipe.ingredients[x];
                                await db.query({
                                    text: 'INSERT INTO ingredients (name, quantity, measurement, recipe_id) VALUES ($1, $2, $3, $4)',
                                    values: [ing.name, ing.quantity, ing.measurement, recipeRes.rows[0].id],
                                });
                            }
                        }
                    });

                    await Rating.find({author_id: user._id}, async (err, ratings) => {
                        for (let i = 0; i < ratings.length; i++) {
                            await db.query({
                                text: 'INSERT INTO ratings (recipe_id, author_id, rating) VALUES ($1, $2, $3) RETURNING *',
                                values: [ratings[i].recipe_id, userRes.rows[0].id, ratings[i].rating],
                            })
                        }
                    })
                }

                await Collection.find({})
                    .populate('recipes')
                    .populate('ownerId')
                    .exec(async (err, collections) => {
                        for (let i = 0; i < collections.length; i++) {
                            const userRes = await db.query({
                                text: 'SELECT id FROM users where email = $1',
                                values: [collections[i].ownerId.email]
                            });

                            const collectionRes = await db.query({
                                text: 'INSERT INTO collections (name, author_id) VALUES ($1, $2) RETURNING *',
                                values: [collections[i].name, userRes.rows[0].id],
                            });

                            for (let x = 0; x < collections[i].recipes.length; x++) {
                                const recipe = collections[i].recipes[x];
                                const recipeRes = await db.query({
                                    text: 'SELECT id FROM recipes WHERE name = $1',
                                    values: [recipe.name],
                                });

                                await db.query({
                                    text: 'INSERT INTO recipes_collections (collection_id, recipe_id) VALUES ($1, $2)',
                                    values: [collectionRes.rows[0].id, recipeRes.rows[0].id]
                                })
                            }
                        }
                    })
            });
        })
        .catch(err => console.log(`Database connection error: ${err.message}`));
}

async function create() {
    db.query(`
    CREATE TABLE users (
        id BIGSERIAL NOT NULL PRIMARY KEY,
        created_at DATE NOT NULL DEFAULT CURRENT_DATE,
        username TEXT NOT NULL,
        email TEXT NOT NULL,
        profile_image TEXT,
        password TEXT NOT NULL,
        reset_token TEXT,
        token_expires TIMESTAMP
    );
    CREATE TABLE collections (
        id BIGSERIAL NOT NULL PRIMARY KEY,
        created_at DATE NOT NULL DEFAULT CURRENT_DATE,
        name TEXT NOT NULL,
        author_id BIGSERIAL REFERENCES users(id) ON DELETE CASCADE,
        is_primary BOOLEAN DEFAULT false
    );
    CREATE TABLE recipes (
        id BIGSERIAL NOT NULL PRIMARY KEY,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        name TEXT NOT NULL,
        url TEXT,
        notes TEXT,
        image TEXT,
        author_id BIGSERIAL REFERENCES users(id) ON DELETE NO ACTION
    );
    CREATE TABLE recipes_collections (
        id BIGSERIAL NOT NULL PRIMARY KEY,
        collection_id BIGSERIAL REFERENCES collections(id) ON DELETE CASCADE,
        recipe_id BIGSERIAL REFERENCES recipes(id) ON DELETE CASCADE
    );
    CREATE TABLE ingredients (
        id BIGSERIAL NOT NULL PRIMARY KEY,
        recipe_id BIGSERIAL REFERENCES recipes(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        quantity TEXT NOT NULL,
        measurement TEXT NOT NULL
    );
    CREATE TABLE users_recipes_menu (
        id BIGSERIAL NOT NULL PRIMARY KEY,
        user_id BIGSERIAL REFERENCES users(id) ON DELETE CASCADE,
        recipe_id BIGSERIAL REFERENCES recipes(id) ON DELETE CASCADE
    );
    CREATE TABLE users_ingredients_groceries (
        id BIGSERIAL NOT NULL PRIMARY KEY,
        user_id BIGSERIAL REFERENCES users(id) ON DELETE CASCADE,
        ingredient_id BIGSERIAL REFERENCES ingredients(id) ON DELETE CASCADE
    );
    CREATE TABLE users_collections_followers (
        user_id BIGSERIAL REFERENCES users(id) ON DELETE CASCADE,
        collection_id BIGSERIAL REFERENCES users(id) ON DELETE CASCADE
    );
    CREATE TABLE ratings (
        id BIGSERIAL NOT NULL PRIMARY KEY,
        created_at DATE NOT NULL DEFAULT CURRENT_DATE,
        recipe_id BIGSERIAL REFERENCES users(id) ON DELETE CASCADE,
        author_id BIGSERIAL REFERENCES users(id) ON DELETE CASCADE,
        rating INT NOT NULL
    );
`, (err, res) => {
        if (err) {
            return console.log('err: ', err);
        }
        console.log('success');
    });

}

create()
    .then(populate)
    .then(() => console.log('done'));
// after running this must run  psql recipecloud -p 5433 < node_modules/connect-pg-simple/table.sql to get sessions working

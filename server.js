require('dotenv').config({path: './.env'});
const express = require('express');
const compression = require('compression');
const next = require('next');

const port = parseInt(5000, 10);
const dev = process.env.NODE_ENV !== 'production';
const app = next({dev});
const handle = app.getRequestHandler();

const bodyParser = require('body-parser');
const session = require('express-session');
const connectStore = require('connect-mongo');
const mongoose = require('mongoose');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const MongoStore = connectStore(session);
const User = require('./models/user');

const userRoutes = require('./routes/users'),
    recipeRoutes = require('./routes/recipes'),
    collectionRoutes = require('./routes/collections'),
    indexRoutes = require('./routes/index');

const env = process.env.NODE_ENV || "development";

const forceSsl = function (req, res, next) {
    if (req.headers['x-forwarded-proto'] !== 'https') {
        return res.redirect(['https://', req.get('Host'), req.url].join(''));
    }
    return next();
};
if (env === 'production') {
    app.use(forceSsl);
}


mongoose.Promise = global.Promise;

mongoose.connect(1 ? process.env.MONGO : process.env.MONGO_DEV,
    {useNewUrlParser: true, autoIndex: false, useCreateIndex: true})
    .then(() => console.log(`Database connected`))
    .catch(err => console.log(`Database connection error: ${err.message}`));
//Configure Passport
passport.use(new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password'
}, function (email, password, done) {
    User.findOne({email: email}, function (err, user) {
        if (err) return done(err);
        if (!user) return done(null, false, {message: 'Incorrect email.'});
        user.comparePassword(password, function (err, isMatch) {
            if (isMatch) {
                return done(null, user);
            } else {
                return done(null, false, {message: 'Incorrect password.'});
            }
        });
    });
}));

const SESS_LIFETIME = 1000 * 60 * 60 * 24 * 30;

passport.serializeUser(function (user, done) {
    done(null, user.id);
});

passport.deserializeUser(function (id, done) {
    User.findById(id, function (err, user) {
        done(err, user);
    });
});



app.prepare().then(() => {
    const server = express();
    server.use(compression());

    server.use(bodyParser.urlencoded({extended: true}));
    server.use(bodyParser.json());

    server.use(session({
        name: 'recipecloudsession',
        secret: process.env.SESSION_SECRET,
        resave: false,
        store: new MongoStore({
            mongooseConnection: mongoose.connection,
            collection: 'session',
            ttl: SESS_LIFETIME
        }),
        cookie: {
            sameSite: true,
            secure: false,
            maxAge: SESS_LIFETIME
        },
        saveUninitialized: false,
    }));

    server.use(passport.initialize());

    // NEED TO IMPORT ROUTES
    server.use('/api/', indexRoutes);
    server.use('/api/', userRoutes);
    server.use('/api/', recipeRoutes);
    server.use('/api/', collectionRoutes);

    {/*<Index path={'/recipes'}/>*/}
    {/*<ViewUserRecipes path={'/users/:user_id/recipes'}/>*/}
    {/*<ViewCollection path={'/collections/:collection_id'}/>*/}
    {/*<RecipeContainer path={'/recipes/:recipe_id'}/>*/}
    {/*<GroceryList path={'/users/:user_id/groceries'}/>*/}
    {/*<AddRecipe path={'/add'}/>*/}
    {/*<UserSettings path={'/users/:user_id/settings'}/>*/}
    {/*<ForgotPassword path={'/forgot'}/>*/}
    {/*<Landing path={'/register'}/>*/}

    // server.get()

    // server.get("/", async (req, res) => {
    //     return app.render(req, res,'/BrowseRecipes', {
    //         user: req.session.user,
    //     })
    // });

    server.all('*', (req, res) => {
        return app.render(req, res,'/BrowseRecipes', {
            ...req.query,
            user: req.session.user,
        })
        // return handle(req, res)
    });

    server.listen(port, err => {
        if (err) throw err;
        console.log(`> Ready on http://localhost:${port}`)
    })
});

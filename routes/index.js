const express = require('express'),
    router = express.Router(),
    passport = require('passport'),
    User = require('../models/user'),
    nodemailer = require('nodemailer'),
    urlMetadata = require('url-metadata'),
    URLSafeBase64 = require('urlsafe-base64');

// authenticate user
router.post('/authenticate', function(req, res) {
    if(req.isAuthenticated()) {
        User.findById(req.user._id).populate('menu').populate('recipes').exec((err, user) => {
            return res.status( 200 ).send(JSON.stringify({ user: user }));
        })
    } else {
      return res.sendStatus( 200 );
    }
});

// CREATE USER
// router.post('/users', function(req, res, next) {
//     User.findOne({ "$or":[{ username: req.body.username }, { email: req.body.email }] }, function(err, user) {
//         if (err) {
//             return res.status( 404 ).send(err);
//         }
//
//         if(user) {
//             return res.status( 404 ).send('A user with that username or email already exists!');
//         }
//
//         let newUser = new User({username: req.body.username, email: req.body.email.toLowerCase(), password: req.body.password});
//         newUser.save();
//
//         req.logIn(newUser, function(err) {
//           if (err) return res.status( 404 ).send(err);
//           return res.status( 200 ).json({ user: req.user });
//         });
//     });
// });

// handle login logic
router.post('/login', emailToLowerCase, function(req, res, next) {
  passport.authenticate('local', function(err, user, info) {
    if (err) {
      return res.status( 404 ).send(err);
    }
    if (!user) {
      return res.status( 404 ).send('No user found with those user credentials!');
    }
    req.logIn(user, function(err) {
      if (err) return res.status( 404 ).json({ message: 'There was a problem logging in!' });
      return res.status( 200 ).json({ user: req.user });
    });
  })(req, res, next);
});

function emailToLowerCase(req, res, next){
    req.body.email = req.body.email.toLowerCase();
    next();
}

//logout
router.get('/logout', function(req, res) {
  req.logout();
  return res.status( 200 ).json({ message: 'success' });
});

// reset password route
router.post('/forgot', function(req, res) {
  let email = req.body.email;
    if(req.isAuthenticated()) {
        return res.status(404).send('User is already logged in!')
    }

    (function generateToken() {
          let buf = Buffer.alloc(16);
          for (let i = 0; i < buf.length; i++) {
              buf[i] = Math.floor(Math.random() * 256);
          }
          let token = URLSafeBase64.encode(buf).toString();

        (function assignToken(err) {
            if(err) {
                return res.status(404).send('There was a problem assigning a token!')
            }

            User.findOne({email: email}, function(err, user) {
                if(err) {
                  return res.status(404).send(err)
                }
                if(!user) {
                    return res.status(404).send('No user found!')
                }
                console.log(req.body.email)
                console.log(user)
                user.resetToken = token;
                user.tokenExpires = Date.now() + 3600000; // 1 hour

                user.save();

                let transporter = nodemailer.createTransport({
                    service: 'Mailgun',
                    auth: {
                        user: process.env.MAILUSER,
                        pass: process.env.MAILPASS
                    }
                });

                let mailOptions = {
                    from: 'Recipe Cloud <donotreply@recipe-cloud.com>', // sender address
                    to: req.body.email, // list of receivers
                    subject: 'Password Reset', // Subject line
                    html: `You are receiving this because you (or someone else) have requested the reset of the password for your account.<br /><br />
                    Your password reset token is ${user.resetToken}. Enter this token on the forgot password page to change your
                    password. Note: This token will expire after 1 hour.<br /><br />
                    If you did not request this, please ignore this email and your password will remain unchanged.` // html body
                };

                transporter.sendMail(mailOptions, (error, info) => {
                    if (error) {
                        return res.status(404).send(error)
                    } else {
                        return res.status(200).send('Success!')
                    }
                });
            });
        })();
  })();
});

// reset password
router.post('/reset', function(req, res) {
    User.findOne({resetToken: req.body.token, tokenExpires: { $gt: Date.now() } }, function(err, user) {
        if(err) {
          return res.status(404).send(err)
        }
        if(!user) {
            return res.status(404).send('Token is invalid or has expired.')
        }
            user.password = req.body.password;
            user.resetToken = undefined;
            user.tokenExpires = undefined;
            user.save();

            req.logIn(user, function(err) {
              if (err) return res.status( 404 ).send(err);
              return res.status( 200 ).json({ user: req.user });
            });
    });
});

//IMAGE SCRAPER
router.post('/scrape', function (req, res) {
    urlMetadata(req.body.imageUrl, {timeout: 0}).then(
        function (metadata) { // success handler
            return res.status(200).json({ imageUrl: metadata["og:image"]});
        },
        function (error) { // failure handler
            return res.status(404).send('')
        });
});

module.exports = router;

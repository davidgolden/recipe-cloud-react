var Recipe = require('../models/recipe');

var middlewareObj = {};

middlewareObj.isLoggedIn = (req, res, next) => {
  if(req.session.user) {
    return next();
  }
  return res.status(404).send({ detail: 'You need to be logged in to do that!' })
};

middlewareObj.checkRecipeOwnership = (req, res, next) => {
  // is user logged in?
  if(req.session.user) {
    Recipe.findById(req.params.recipe_id, function(err, recipe) {
      if(err) {
        return res.status(404).send(err)
      } else if(!recipe) {
        return res.status(404).send({ detail: 'Recipe does not exist!' })
      } else {
        // does user own the campground?
        // use equals because one is mongoose object and one is string
        if(recipe.author_id.equals(req.session.user._id) || req.session.user.isAdmin === true) {
          // if so, redirect
          next();
        } else {
          // if not, redirect
          return res.status(404).send({ detail: "You don't have permission to do that!" })
        }
      }
    });
  } else {
    return res.status(404).send({ detail: 'You need to be logged in to do that!' })
  }
};

module.exports = middlewareObj;

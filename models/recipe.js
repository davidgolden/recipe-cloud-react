var mongoose = require('mongoose');

var recipeSchema = new mongoose.Schema({
    name: { type: String, trim: true },
    url: { type: String, trim: true },
    notes: String,
    image: { type: String, trim: true },
    tags: [String],
    created: Date,
    ingredients: [
            {
                quantity: Number,
                measurement: String,
                name: { type: String, lowercase: true, trim: true }
            },
        ],
    author: {
        id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User'
        },
        username: String
      }
});

module.exports = mongoose.model('recipes', recipeSchema);

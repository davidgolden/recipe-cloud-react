const mongoose = require('mongoose');
const IngredientSchema = require('./ingredient');
const cloudinary = require('cloudinary');

cloudinary.config({
    cloud_name: 'recipecloud',
    api_key: '771378164651634',
    api_secret: '7vCnBsgJs5ZtAYR0lsU0IGUc8aw'
});

const recipeSchema = new mongoose.Schema({
    name: { type: String, trim: true, required: true },
    url: { type: String, trim: true },
    notes: String,
    image: { type: String, trim: true, required: true },
    tags: [String],
    ingredients: [
            IngredientSchema,
        ],
    author: {
        id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User'
        },
        username: String
      }
}, {
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at',
    }
});

recipeSchema.post('remove', function(doc) {
    cloudinary.uploader.destroy(`users/${doc.author.id}/recipes/${doc._id}`);
});

module.exports = mongoose.model('recipes', recipeSchema);

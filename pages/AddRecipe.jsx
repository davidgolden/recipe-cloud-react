import React, { useState, useContext } from 'react';
import RecipeInformation from '../client/components/recipes/RecipeInformation';
import AddIngredients from '../client/components/recipes/AddIngredients';
import Button from "../client/components/utilities/buttons/Button";
import {recipeTags} from "../client/stores/Setings";
import styles from './styles/AddRecipe.scss';
import classNames from 'classnames';
import {ApiStoreContext} from "../client/stores/api_store";
import {observer} from "mobx-react";
import Router from 'next/router';

const AddTags = (props) => {
    const tagClassName = classNames({
        [styles.tag]: true,
    });

    const TagList = recipeTags.map((tag, i) => {
        return (
            <div className={tagClassName} key={i}>
                <label>
                    <input
                        checked={props.selectedTags.includes(tag)}
                        type="checkbox"
                        name="recipe[tags]"
                        value={tag}
                        onChange={(e) => props.toggleTag(tag)}
                    />
                    {tag}
                </label>
            </div>
        )
    });

    return (
        <div>
            <h3>Add Tags</h3>
            {TagList}
        </div>
    )
};

const RecipeForm = observer(props => {
    const [name, setName] = useState(props.editMode ? props.recipe.name : '');
    const [url, setUrl] = useState(props.editMode ? props.recipe.url : '');
    const [image, setImage] = useState(props.editMode ? props.recipe.image : '');
    const [notes, setNotes] = useState(props.editMode ? props.recipe.notes : '');
    const [ingredients, setIngredients] = useState(props.editMode ? props.recipe.ingredients : []);
    const [tags, setTags] = useState(props.editMode ? props.recipe.tags : []);
    const [submitted, setSubmitted] = useState(false);

    const context = useContext(ApiStoreContext);

    const toggleTag = tag => {
        if (tags.includes(tag)) {
            // remove it
            let i = tags.indexOf(tag);
            let newTags = tags;
            newTags.splice(i, 1);
            setTags([...newTags]);
        } else {
            // add it
            let newTags = tags;
            newTags.push(tag);
            setTags([...newTags]);
        }
    };

    const handleUpdateIngredient = (index, ingredient) => {
        let ingredientList = ingredients;
        ingredientList[index] = {
            ...ingredientList[index],
            ...ingredient,
        };
        setIngredients([...ingredientList]);
    };

    const handleAddIngredient = (quantity = 0, measurement = '#', name = '') => {
        let ingredientList = [...ingredients];
        ingredientList.splice(0, 0, {quantity, measurement, name});
        setIngredients(ingredientList);
    };

    const handleDeleteIngredient = index => {
        let ingredientList = ingredients;
        ingredientList.splice(index, 1);
        setIngredients([...ingredientList]);
    };

    const handleSubmit = () => {
        setSubmitted(true);
        if (props.editMode) {
            context.patchRecipe(props.recipe._id, {name: name, url: url, image: image, notes: notes, ingredients: ingredients, tags: tags})
                .then(recipe => {
                    props.updateRecipe(recipe);
                    props.toggleEdit();
                })
        } else {
            context.createRecipe({name: name, url: url, image: image, notes: notes, ingredients: ingredients, tags: tags})
                .then(() => {
                    Router.push("/");
                })
        }
    };

    const recipeFormClassName = classNames({
        [styles.recipeForm]: true,
    });
    const submitButtonClassName = classNames({
        [styles.submitButton]: true,
        [styles.submitButtonDisabled]: !(name && image) || submitted,
    });

    return (
        <div className={recipeFormClassName}>
            <h2>Submit a Recipe</h2>
            <RecipeInformation
                name={name}
                url={url}
                image={image}
                notes={notes}
                handleRecipeLinkChange={e => setUrl(e.target.value)}
                handleRecipeNameChange={e => setName(e.target.value)}
                handleRecipeImageChange={i => setImage(i)}
                handleRecipeNotesChange={e => setNotes(e.target.value)}
            />
            <AddIngredients
                ingredients={ingredients}
                handleAddIngredient={handleAddIngredient}
                handleUpdateIngredient={handleUpdateIngredient}
                handleDeleteIngredient={handleDeleteIngredient}
            />
            <AddTags toggleTag={toggleTag} selectedTags={tags}/>
            <div>
                {context.user ?
                    <Button className={submitButtonClassName} onClick={handleSubmit}>Submit!</Button> :
                    <p>You must be logged in to add a recipe!</p>}
            </div>
        </div>
    )
});

RecipeForm.defaultProps = {
    editMode: false,
};

export default RecipeForm;

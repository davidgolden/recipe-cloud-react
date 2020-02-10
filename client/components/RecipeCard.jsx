import React, {useState} from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import styles from './styles/RecipeCard.scss';
import RecipeButtons from "./recipes/RecipeButtons";
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faImage} from '@fortawesome/free-solid-svg-icons';
import Link from "next/link";
import UserImageSmall from "./utilities/UserImageSmall";
import axios from "axios";

const addToGroceryList = async () => {
    await axios.post(`/api/users/${this.user.id}/recipes/${props.recipe.id}`);
};

const recipeCardClassName = classNames({
    [styles.recipeCard]: true,
});
const recipeCardImageClassName = classNames({
    [styles.recipeCardImage]: true,
});
const recipeCardTextClassName = classNames({
    [styles.recipeCardText]: true,
});
const recipeCardButtonClassName = classNames({
    [styles.recipeCardButtons]: true,
});

const RecipeCard = props => {
    const [showButtons, setShowButtons] = useState(false);

    const deleteRecipe = () => {
        if (confirm('Are you sure you want to do that?')) {
            props.deleteRecipe(props.recipe.id);
        }
    };

    return (
        <div className={recipeCardClassName} onMouseOver={() => setShowButtons(true)}
             onMouseLeave={() => setShowButtons(false)}>
            <Link href={`/recipes/[recipe_id]`} as={`/recipes/${props.recipe.id}`}>
                <a>
                    <div className={recipeCardImageClassName}>
                        {props.recipe.image ? <img src={props.recipe.image} /> : <div><FontAwesomeIcon icon={faImage} /></div>}
                    </div>
                    <div className={recipeCardTextClassName}>
                        <h3>{props.recipe.name}</h3>
                    </div>
                </a>
            </Link>
            <div className={recipeCardButtonClassName}>
                {showButtons && <RecipeButtons
                    recipe={props.recipe}
                    addToGroceryList={addToGroceryList}
                    deleteRecipe={deleteRecipe}
                />}
            </div>
            {showButtons && <UserImageSmall id={props.recipe.author_id} profileImage={props.recipe.author_image}/>}
        </div>
    )
};

RecipeCard.propTypes = {
    recipe: PropTypes.object.isRequired,
    deleteRecipe: PropTypes.func.isRequired,
};

export default RecipeCard;

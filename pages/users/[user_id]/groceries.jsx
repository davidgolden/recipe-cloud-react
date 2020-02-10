import React, {useContext, useState, useEffect} from 'react';
import AddIngredients from '../../../client/components/recipes/AddIngredients';
import styles from '../../styles/GroceryList.scss';
import classNames from 'classnames';
import Button from "../../../client/components/utilities/buttons/Button";
import RemoveButton from "../../../client/components/utilities/buttons/RemoveButton"
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faExternalLinkAlt} from '@fortawesome/free-solid-svg-icons'
import {ApiStoreContext} from "../../../client/stores/api_store";
import axios from "axios";
import Checkbox from "../../../client/components/utilities/Checkbox";

const groceryListContainerClassName = classNames({
    [styles.groceryListContainer]: true,
});
const ingredientsContainerClassName = classNames({
    [styles.ingredientsContainer]: true,
});
const menuContainerClassName = classNames({
    [styles.menuContainer]: true,
});

const Groceries = props => {
    const context = useContext(ApiStoreContext);

    const [storeMode, setStoreMode] = useState(false);
    const [groceryList, setGroceryList] = useState(props.groceryList || []);
    const [menu, setMenu] = useState(props.menu || []);
    const [ingredientIdsToRemove, setIngredientIdsToRemove] = useState([]);
    const [menuIdsToRemove, setMenuIdsToRemove] = useState([]);

    function toggleMenuIdToRemove(id) {
        if (menuIdsToRemove.includes(id)) {
            setMenuIdsToRemove(menuIdsToRemove.filter(recipeId => recipeId !== id));
        } else {
            setMenuIdsToRemove(menuIdsToRemove.concat([id]));
        }
    }

    async function handleDeleteMenuItems() {
        try {
            await axios.delete(`/api/users/${context.user.id}/recipes`, {
                data: {
                    recipe_ids: menuIdsToRemove,
                }
            });

            setMenu(menu.filter(item => !menuIdsToRemove.includes(item.id)));
            setMenuIdsToRemove([]);
        } catch (error) {
            context.handleError(error)
        }
    };

    const toggleStoreMode = () => {
        setStoreMode(!storeMode);
    };

    async function removeSelectedIngredients() {
        try {
            await axios.delete(`/api/users/${context.user.id}/ingredients`, {
                data: {
                    ingredient_ids: ingredientIdsToRemove,
                }
            });

            setGroceryList(groceryList.filter(ing => !ingredientIdsToRemove.includes(ing.id)));
            setIngredientIdsToRemove([]);
        } catch (error) {
            context.handleError(error)
        }
    }

    async function handleAddIngredient(ingredient) {
        try {
            const response = await axios.post(`/api/users/${context.user.id}/ingredients`, ingredient);
            setGroceryList([{...ingredient, id: response.data.id}].concat(groceryList))
        } catch (error) {
            context.handleError(error)
        }
    }

    async function handleUpdateIngredient(ingredient) {
        try {
            const oldIngredient = groceryList.find(ing => ing.id === ingredient.id);
            if (oldIngredient.name !== ingredient.name ||
            oldIngredient.quantity !== ingredient.quantity ||
            oldIngredient.measurement !== ingredient.measurement) {
                await axios.patch(`/api/users/${context.user.id}/ingredients/${ingredient.id}`, ingredient);
            }
            setGroceryList(groceryList.map(ing => {
                if (ing.id === ingredient.id) {
                    return ingredient;
                }
                return ing;
            }))
        } catch (error) {
            context.handleError(error)
        }
    }

    const saveListClassName = classNames({
        [styles.saveListButton]: true,
        [styles.saveListButtonDisabled]: ingredientIdsToRemove.length === 0,
    });

    const saveMenuClassName = classNames({
        [styles.saveListButton]: true,
        [styles.saveListButtonDisabled]: menuIdsToRemove.length === 0,
    });

    return (
        <div className={groceryListContainerClassName}>
            <h2>My Menu</h2>
            <ul className={menuContainerClassName}>
                {menu && menu.map((item) => {
                    return <li key={item.id}>
                        <Checkbox checked={menuIdsToRemove.includes(item.id)} onChange={() => toggleMenuIdToRemove(item.id)}/>
                        <a target='_blank' href={item.url}>
                            {item.name}
                            <FontAwesomeIcon icon={faExternalLinkAlt}/>
                        </a>
                    </li>
                })}
            </ul>
            <Button className={saveMenuClassName} onClick={handleDeleteMenuItems}>Remove Selected</Button>
            <h2>My Grocery List</h2>
            <AddIngredients
                containerClassName={ingredientsContainerClassName}
                ingredients={groceryList}
                handleAddIngredient={handleAddIngredient}
                handleUpdateIngredient={handleUpdateIngredient}
                ingredientIdsToRemove={ingredientIdsToRemove}
                setIngredientIdsToRemove={setIngredientIdsToRemove}
                storeMode={storeMode}
                dragEnabled={true}
            />
            <Button className={saveListClassName} onClick={removeSelectedIngredients}>Remove Selected</Button>
            <Button onClick={toggleStoreMode}>Toggle Store Mode</Button>
        </div>
    )
};

Groceries.getInitialProps = async ({req, query}) => {
    const currentFullUrl = typeof window !== 'undefined' ? window.location.origin : req.protocol + "://" + req.headers.host.replace(/\/$/, "");

    const response = await Promise.all([
        await axios.get(`${currentFullUrl}/api/users/${query.user_id}/recipes`, {
            headers: req?.headers?.cookie && {
                cookie: req.headers.cookie,
            }
        }),
        await axios.get(`${currentFullUrl}/api/users/${query.user_id}/ingredients`, {
            headers: req?.headers?.cookie && {
                cookie: req.headers.cookie,
            }
        })
    ]);

    return {
        groceryList: response[1].data.groceryList,
        menu: response[0].data.menu,
    };
};

export default Groceries;

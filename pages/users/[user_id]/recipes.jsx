import React, {useContext, useState, useEffect} from 'react';
import axios from 'axios';
import CollectionCard from "../../../client/components/CollectionCard";
import styles from '../../styles/BrowseRecipes.scss';
import {ApiStoreContext} from "../../../client/stores/api_store";
import RecipeCard from "../../../client/components/RecipeCard";
import useScrolledBottom from "../../../client/components/utilities/useScrolledBottom";
import {observer} from "mobx-react";
import UserBanner from "../../../client/components/UserBanner";

const Recipes = observer((props) => {
    const [recipes, setRecipes] = useState(new Map(props.recipes || []));
    const [collections, setCollections] = useState(props.collections || []);
    const [lastRecipePageLoaded, setLastRecipePageLoaded] = useState(0);
    const [loadedAll, setLoadedAll] = useState(props.loadedAll);
    const context = useContext(ApiStoreContext);

    const isBottom = useScrolledBottom();

    useEffect(() => {
        if (props.user_id === context.user?._id) {
            axios.get(`/api/users/${props.user_id}/collections`)
                .then(response => setCollections(response.data.collections))
        }
    }, [context.user?.collections.length !== props.collections.length]);

    useEffect(() => {
        if (!loadedAll) {
            context.getRecipes({
                page: lastRecipePageLoaded + 1,
                author: props.user_id,
            })
                .then(response => {
                    response.forEach(r => recipes.set(r._id, r));
                    if (response.length < 12) {
                        setLoadedAll(true);
                    } else {
                        setLastRecipePageLoaded(lastRecipePageLoaded + 1);
                    }
                });
        }
    }, [isBottom]);

    function deleteCollection(id) {
        context.deleteCollection(id)
            .then(() => {
                setCollections(c => c.filter(c => c._id !== id));
            })
    }

    function removeCollection(id) {
        context.patchUser({
            collections: context.user.collections.filter(c => c._id !== id).map(c => c._id),
        })
    }

    function addCollection(id) {
        context.patchUser({
            collections: context.user.collections.map(c => c._id).concat([id]),
        })
    }

    return (
        <div>
            <UserBanner user={props.user}
                        images={Array.from(recipes.values()).filter(r => r.image).slice(0, 4).map(r => r.image)}/>
            <div className={styles.browseRecipesContainer}>
                {collections.map(c => <CollectionCard
                    key={c._id}
                    removeCollection={removeCollection}
                    deleteCollection={deleteCollection}
                    addCollection={addCollection}
                    collection={c}
                />)}
                {Array.from(recipes.values()).map(r => <RecipeCard recipe={r} key={r._id} deleteRecipe={() => {
                }}/>)}
            </div>
        </div>
    )
});

Recipes.getInitialProps = async ({req, query}) => {
    const currentFullUrl = typeof window !== 'undefined' ? window.location.origin : req.protocol + "://" + req.headers.host.replace(/\/$/, "");

    const responses = await Promise.all([
        await axios.get(`${currentFullUrl}/api/users/${query.user_id}/collections`, {
            headers: req?.headers?.cookie && {
                cookie: req.headers.cookie,
            },
        }),
        await axios.get(`${currentFullUrl}/api/recipes`, {
            headers: req?.headers?.cookie && {
                cookie: req.headers.cookie,
            },
            params: {
                orderBy: 'desc',
                sortBy: 'created_at',
                author: query.user_id,
            }
        }),
        await axios.get(`${currentFullUrl}/api/users/${query.user_id}`, {
            headers: req?.headers?.cookie && {
                cookie: req.headers.cookie,
            },
        }),
    ]);
    return {
        collections: responses[0].data.collections,
        recipes: responses[1].data.recipes.map(r => [r._id, r]),
        loadedAll: responses[1].data.recipes.length < 12,
        user: responses[2].data.user,
        user_id: query.user_id,
    }
};

export default Recipes;
import React from 'react';
import {inject, observer} from 'mobx-react';
import {autorun} from 'mobx';
import RecipeCard from "../components/RecipeCard";
import classNames from 'classnames';
import styles from './styles/BrowseRecipes.scss';
import TagFilterBar from "../components/recipes/TagFilterBar";
import LoadingNextPage from '../components/utilities/LoadingNextPage';

@inject('apiStore')
@observer
export default class BrowseRecipes extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            lastRecipePageLoaded: 0,
            loadedAll: false,
        }
    }

    componentDidMount() {
        this.props.apiStore.getRecipes();

        this.disabler = autorun(() => {
            if (this.props.apiStore.distanceToBottom === 0 && !this.state.loadedAll) {
                this.props.apiStore.getRecipes({
                    page: this.state.lastRecipePageLoaded + 1,
                })
                    .then(recipes => {
                        this.setState(prevState => {
                            if (recipes.length === 0) {
                                return {
                                    loadedAll: true,
                                }
                            } else {
                                return {
                                    lastRecipePageLoaded: prevState.lastRecipePageLoaded + 1,
                                }
                            }
                        })
                    });
            }
        })
    }

    componentWillUnmount() {
        this.disabler();
    }

    sortByTag = tag => {
        if (tag === 'all') {
            this.props.apiStore.getRecipes()
        } else {
            this.props.apiStore.getRecipes({
                tag: tag,
            })
        }
    };

    render() {
        const browseRecipesContainerClassName = classNames({
            [styles.browseRecipesContainer]: true,
        });

        return (
            <div>
                <TagFilterBar sortByTag={this.sortByTag}/>
                <div className={browseRecipesContainerClassName}>
                    {this.props.apiStore.recipes.map(recipe => {
                        return <RecipeCard key={recipe._id} recipe={recipe}/>
                    })}
                    {this.props.apiStore.recipes.length === 0 && <p>There doesn't seem to be anything here...</p>}
                </div>
                {this.state.loadedAll || <LoadingNextPage/>}
            </div>
        )
    }
};

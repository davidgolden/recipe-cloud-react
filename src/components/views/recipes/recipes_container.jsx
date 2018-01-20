import React from 'react';
import ShowRecipe from './show_recipe';
import RecipeCards from './recipe_cards';
import RecipeForm from './recipe_form';

const TagFilter = (props) => {
  const TagButtonList = props.tags.map((tag) => {
    return <button onClick={() => props.sortByTag(tag)} className='tag btn btn-md btn-success' key={tag}>{tag}</button>
  })
  return (
    <div className='text-center'>
      <button onClick={() => props.sortByTag('all')} className='tag btn btn-md btn-success'>All</button>
      {TagButtonList}
    </div>
  )
}

class RecipeContainer extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      show: false,
      edit: false,
      recipe: {}
    }


    this.showRecipe = (show, recipe) => {
      this.setState({show: show, recipe: recipe})
      if(show === false) {
        this.setState({edit: false})
      }
    }

    this.toggleEdit = () => {
      if(this.state.edit === false) {
        this.setState({edit: true})
      } else {
        this.setState({edit: false})
      }
    }

    this.deleteRecipe = () => {
      if(confirm('Are you sure you want to do that?')) {
        let xml = new XMLHttpRequest();
        xml.open("POST", `/recipes/${this.state.recipe._id}?_method=DELETE`, true);
        xml.setRequestHeader("Content-Type", "application/json");
        xml.setRequestHeader('Access-Control-Allow-Headers', '*');
        xml.setRequestHeader('Access-Control-Allow-Origin', '*');
        xml.send();
        xml.onreadystatechange = () => {
          if(xml.readyState === 4 && xml.status === 200) {
            return this.setState({show: false})
          }
          if(xml.readyState === 4 && xml.status !== 200) {
            alert('There was a problem with your request!')
          }
        }
      }
    }

    this.sortByTag = (tag) => {
      event.preventDefault();
      let allRecipes = Array.from(document.getElementsByName('tags'));
      let unmatchedRecipes = allRecipes.filter(recipe => recipe.value.includes(tag) === false);
      let matchedRecipes = allRecipes.filter(recipe => recipe.value.includes(tag) === true);

      if(tag === 'all') {
        allRecipes.forEach(recipe => {
        recipe.parentElement.style.display = 'inline-block';

        setTimeout(function() {
          recipe.parentElement.style.opacity = '1';
        }, 500);
      });

      } else {
        unmatchedRecipes.forEach(recipe => {
          recipe.parentElement.style.opacity = '0';
          setTimeout(function() {
            recipe.parentElement.style.display = 'none';
          }, 500);
        });

        matchedRecipes.forEach(recipe => {
          recipe.parentElement.style.display = 'inline-block';

          setTimeout(function() {
            recipe.parentElement.style.opacity = '1';
          }, 500);
        });
      };
    }

    this.sortByUser = (user) => {
      event.preventDefault();
      this.setState({show: false}, function() {
        let allRecipes = Array.from(document.getElementsByName('author'));
        let unmatchedRecipes = allRecipes.filter(recipe => recipe.value.includes(user) === false);
        let matchedRecipes = allRecipes.filter(recipe => recipe.value.includes(user) === true);

          unmatchedRecipes.forEach(recipe => {
            recipe.parentElement.style.opacity = '0';
            setTimeout(function() {
              recipe.parentElement.style.display = 'none';
            }, 500);
          });

          matchedRecipes.forEach(recipe => {
            recipe.parentElement.style.display = 'inline-block';

            setTimeout(function() {
              recipe.parentElement.style.opacity = '1';
            }, 500);
          });
      })
    }
  }

  render() {
    return (
      <div>
        {this.state.show ? (
          <div className='show-recipe-state'>
            <button className='btn-success btn btn-md back' onClick={() => this.showRecipe(false)}><i className="fas fa-arrow-left"></i> Back to Recipes</button>
              {
                this.state.recipe.author.id === this.props.user._id && (
                  <div className='form-group edit'>
                    {this.state.edit === false ? (
                      <button className='btn btn-primary btn-md' onClick={() => this.toggleEdit()}><i className="fas fa-edit"></i> Edit</button>
                    ) : (
                      <button className='btn btn-primary btn-md' onClick={() => this.toggleEdit()}><i className="fas fa-search"></i> View</button>
                    )}
                    <button className='btn btn-primary btn-md' onClick={this.deleteRecipe}><i className="fas fa-trash-alt"></i> Delete Recipe</button>
                  </div>
                )
              }
            {this.state.edit === true ? (
              <div className='show-recipe-style'>
                <RecipeForm
                  user={this.props.user}
                  setView={this.props.setView}
                  tags={this.props.tags}
                  recipe={this.state.recipe}
                  toggleEdit={this.toggleEdit}
                />
              </div>
            ) : (
              <ShowRecipe
                recipe={this.state.recipe}
                user={this.props.user}
                showRecipe={this.showRecipe}
                sortByUser={this.sortByUser}
              />
            )}
          </div>
        ) : (
        <div>
          <TagFilter tags={this.props.tags} sortByTag={this.sortByTag} />
            <RecipeCards
              showRecipe={this.showRecipe}
              recipes={this.props.recipes}
              user={this.props.user}
              sortByUser={this.sortByUser}
            />
        </div> )}
      </div>
    )
  }
}

export default RecipeContainer;

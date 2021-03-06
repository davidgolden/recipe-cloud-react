import React, {useContext, useState, useRef, useEffect} from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import styles from './styles/IngredientListItem.module.scss';
import {ApiStoreContext} from "../../stores/api_store";
import {observer} from "mobx-react";
import Checkbox from "../utilities/Checkbox";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faArrowsAlt, faPencilAlt, faSave} from "@fortawesome/free-solid-svg-icons";

const Ingredient = observer((props) => {
    const context = useContext(ApiStoreContext);
    const [editing, setEditing] = useState(false);
    const [name, setName] = useState(props.value.name);
    const [quantity, setQuantity] = useState(props.value.quantity);
    const [measurement, setMeasurement] = useState(props.value.measurement);

    const ingredientRowClassName = classNames({
        [styles.ingredientRow]: true,
        [styles.ingredientRowStoreMode]: props.storeMode,
        "draggable": !props.storeMode,
        [styles.ingredientRowEditing]: editing,
    });

    function handleEditClick() {
        if (editing) {
            setEditing(false);
            props.handleUpdateIngredient(props.id, {measurement, name, quantity});
        } else {
            setEditing(true);
        }
    }

    if (!props.storeMode) {
        return (
            <li className={ingredientRowClassName}>
                <div className={styles.toolBar}>
                    {props.dragEnabled &&
                    <span><FontAwesomeIcon className={'drag-handler'}
                                                                          icon={faArrowsAlt}/></span>}
                    <button onClick={() => setEditing(handleEditClick)}><FontAwesomeIcon icon={editing ? faSave : faPencilAlt}/></button>
                </div>
                {editing ? <input
                    type='number'
                    step="0.01"
                    required
                    onChange={e => setQuantity(e.target.value)}
                    name='quantity'
                    placeholder='1'
                    value={quantity}
                /> : <span>{props.value.quantity}</span>}
                {editing ? <select
                    name='measurement'
                    value={measurement}
                    onChange={e => setMeasurement(e.target.value)}
                >
                    {context.measurements.map(m => <option value={m.short_name}>{m.short_name}</option>)}
                </select> : <span>{props.value.measurement}</span>}
                {editing ? <input
                    type='text'
                    required
                    name='name'
                    placeholder='Carrots'
                    onChange={e => setName(e.target.value)}
                    value={name}
                /> : <span>{props.value.name}</span>}
                <Checkbox checked={props.selectedIngredientId}
                          onChange={() => props.addToSelectedIngredientIds(props.id)}/>
            </li>
        )
    } else {
        return (
            <div className={ingredientRowClassName} data-id={props.dataId}>
                <Checkbox checked={props.selectedIngredientId}
                          onChange={() => props.addToSelectedIngredientIds(props.id)}/>
                <p>{props.value.quantity} {props.value.measurement.replace("#", "")} {props.value.name}</p>
            </div>
        )
    }
});

Ingredient.propTypes = {
    value: PropTypes.shape({
        measurement: PropTypes.string.isRequired,
        quantity: PropTypes.number.isRequired,
        name: PropTypes.string.isRequired,
    }).isRequired,
    selectedIngredientId: PropTypes.bool.isRequired,
    addToSelectedIngredientIds: PropTypes.func.isRequired,
    storeMode: PropTypes.bool,
    handleUpdateIngredient: PropTypes.func.isRequired,
};

export default Ingredient;

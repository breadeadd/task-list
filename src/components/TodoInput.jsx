import { useState } from "react"

export default function TodoInput(props) {
    const { handleAddTodos, todoValue, setTodoValue } = props

    const submit = () => {
        if (!todoValue.trim()) return;
        handleAddTodos(todoValue);
        setTodoValue("");
    };

    return (
        <header>
            <input 
            value={todoValue} 
            onChange={(e) => setTodoValue(e.target.value)}
            onKeyDown={(e) => {
                if (e.key === "Enter") submit();
            }}

             placeholder="Enter task..."/>

            <button onClick={submit}>Add</button>
        </header>
    )
}
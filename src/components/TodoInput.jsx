const TodoInput = ({ inputRef, handleAddTodos, todoValue, setTodoValue }) => {
    const submit = () => {
        if (!todoValue.trim()) return;
        handleAddTodos(todoValue);
        setTodoValue("");
    };

    return (
        <header>
            <input
            ref={inputRef}
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

export default TodoInput
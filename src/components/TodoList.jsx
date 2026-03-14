import React from 'react'
import { SortableContext,verticalListSortingStrategy } from '@dnd-kit/sortable'
import TodoCard from './TodoCard'

const TodoList = (props) => {
    const { todos } = props

  return (
    <SortableContext
    items={todos.map((t) => t.id)}
    strategy={verticalListSortingStrategy}
    >
        <ul className="main">
            {todos.map((todo, todoIndex) => {
                return(
                    <TodoCard 
                        {...props}
                        key={todo.id}
                        id={todo.id}
                        index={todoIndex}
                    >
                        <p>{todo.text}</p>
                    </TodoCard>
                )
            })}
        </ul>
    </SortableContext>
  )
}

export default TodoList

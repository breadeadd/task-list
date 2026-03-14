import React from 'react'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext,verticalListSortingStrategy } from '@dnd-kit/sortable'
import TodoCard from './TodoCard'

const TodoList = (props) => {
    const { todos, containerId = 'root-todos', className = '', emptyMessage = '', activeDragId, isInteractionDisabled = false } = props
    const { setNodeRef, isOver } = useDroppable({ id: containerId, disabled: isInteractionDisabled })

  return (
    <SortableContext
    items={todos.map((t) => t.id)}
    strategy={verticalListSortingStrategy}
    >
        <ul ref={setNodeRef} className={`main ${className}${isOver ? ' isOver' : ''}`.trim()}>
            {todos.length > 0 ? todos.map((todo, todoIndex) => {
                return(
                    <TodoCard 
                        {...props}
                        key={todo.id}
                        id={todo.id}
                        isDragActive={activeDragId === todo.id}
                        isInteractionDisabled={isInteractionDisabled}
                        index={todoIndex}
                    >
                        <p>{todo.text}</p>
                    </TodoCard>
                )
            }) : (
                emptyMessage ? <li className="listDropzonePlaceholder">{emptyMessage}</li> : null
            )}
        </ul>
    </SortableContext>
  )
}

export default TodoList

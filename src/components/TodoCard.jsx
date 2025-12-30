import React from 'react'

export default function TodoCard(props) {
const { children, handleDeleteTodo, index, handleEditTodo } = props


  return (
    <li className='todoItem'>
        {children}
        <div className="actionsContainer">
            {/* Delete Button */}
            <button onClick={() => {
                handleDeleteTodo(index)
            }}>
                <i class="fa-regular fa-trash-can"></i>
            </button>

            {/* Edit Button */}
            <button onClick={() => {
                handleEditTodo(index)
            }}>
                <i className="fa-regular fa-pen-to-square"></i>
            </button>

            {/* Completed Button */}
            <button>
                <i class="fa-solid fa-check"></i>
            </button>
        </div>            
    </li>
  )
}

import React, { useState } from 'react'
import ListHeader from './ListHeader'
import TodoCard from './TodoCard'

const ListsContainer = () => {
  const [lists, setLists] = useState([
    {id: 1, title: "Enter list name..."}
  ])

  //Adding new item
  const addList = () => {
    const newList = {
      id: Date.now(),
      title: "New List"
    };
    setLists([...lists, newList]);
  };

  return (
    <div className = "listContainer">
        <div style={{ marginLeft: 'auto' }}>
          <i onClick={addList} class="fa-solid fa-plus"></i>
        </div>
        {lists.map((list) => (
          <ListHeader key={list.id} initialTitle={list.title} />
        ))}
    </div>
  )
}

export default ListsContainer
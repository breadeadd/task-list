import React, { useState } from 'react'

const ListHeader = () => {
    const [isEditing, setIsEditing] = useState(false);
    const [title, setTitle] = useState("Enter list name");

    const toggleEdit = () => {
        setIsEditing(!isEditing);
    }

  return (
    <div className="listHeader">
        {isEditing ? (
            <>
                <input
                    type = "text"
                    value = {title}
                    autoFocus
                    onChange={(e) => setTitle(e.target.value)}
                    onKeyDown={(e) => {if (e.key === "Enter") toggleEdit()}}
                />
                <i onClick={toggleEdit} class="fa-regular fa-floppy-disk"></i>
            </>
        ) : (
            <>
                {title}
                <i onClick = {toggleEdit} className="fa-solid fa-pencil"></i>
            </>
        )}

    </div>
  )
}

export default ListHeader
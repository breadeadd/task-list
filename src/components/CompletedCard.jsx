import React, { memo } from 'react'

export default function CompletedCard(props) {
const { children } = props

  return (
    <li className="completedItem">
        {children}
        
        <i class="fa-regular fa-star"></i>
    </li>
  )
}

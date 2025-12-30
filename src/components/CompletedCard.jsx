import React, { memo } from 'react'

const CompletedCard = memo(({ children }) => {
  return (
    <li className="completedItem">
      {children}
      <i className="fa-regular fa-star"></i>
    </li>
  )
})

export default CompletedCard

import React, { memo } from 'react'
import CompletedCard from './CompletedCard'

const CompletedList = memo(({ todos = [] }) => {
    return (
        <ul className="main">
            {(
                todos.map((item, idx) => (
                    <CompletedCard key={idx}>
                        <p>{item}</p>
                    </CompletedCard>
                ))
            )}
        </ul>
    )
})

export default CompletedList
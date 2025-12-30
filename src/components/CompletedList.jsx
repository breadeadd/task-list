import React, { memo } from 'react'
import CompletedCard from './CompletedCard'

const CompletedList = memo(() => {
    const completedMock = [
        "Write report",
        "Walk the dog",
        "Clean the kitchen",
    ];

    return (
        <ul className="main">
            {completedMock.map((item, idx) => (
                <CompletedCard key={idx}>
                <p>{item}</p>
                </CompletedCard>
            ))}
        </ul>
    )
})

export default CompletedList
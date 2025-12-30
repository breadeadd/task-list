import React, { memo } from 'react'

const SessionHeader = memo(({ count = 0, handleResetSession }) => {
  return (
    <div className="sessionHeader">        
        <h3> You have finished {count} tasks this session</h3>
        <button onClick={handleResetSession}> Reset Session</button>
    </div>
  )
})

export default SessionHeader
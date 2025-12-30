import React, { memo } from 'react'

const SessionHeader = memo(() => {
  return (
    <div className="sessionHeader">        
        <h3> You have finished _ tasks this session</h3>
        <button> Reset Session</button>
    </div>
  )
})

export default SessionHeader
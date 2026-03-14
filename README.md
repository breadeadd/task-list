# 📝 Bread's Task List

Most productivity tools fall into two traps: 
They are either too shallow to keep you organized or so complex that they become a chore to maintain. **Bread's Task List** is a "digital sticky-note" ecosystem built to bridge the gap between simple lists and rigid project managers. It is specifically designed for users (like busy university students) who need to categorize tasks into sprints and track momentum without the friction of complex scheduling.

## ⭐ Why Bread?

I built Bread because I noticed a missing element in traditional todo apps: **Contextual Focus.** Seeing a single, massive "Wall of Tasks" is paralyzing. Bread solves this by focusing on:

* **Accomplishment-Based Sprints:** Most lists are infinite loops. Bread’s **Session Tracker** captures your momentum in real-time. Whether it's a single study block or your whole day, you see exactly what you've achieved *right now*, turning progress into immediate positive reinforcement.
  
* **Contextual Organization:** Stop getting overwhelmed by your grocery list while you're trying to study. **Custom Sectioning** allows you to compartmentalize different areas of your life (Uni, Work, Packing Lists) into distinct headers, keeping your workspace clean and your mind focused on one goal at a time.
  
* **Instant, Frictionless Entry:** Bread is designed for "Brain Dumps." There are no mandatory deadlines or priority dropdowns - just a clean interface to get thoughts out of your head and into a list in under two seconds.
  
* **Persistent Memory:** Built for the long haul. Your tasks, custom headers, and session data are automatically serialized to your browser's local storage. Close the tab, finish your lecture, or restart your computer—your workflow stays exactly as you left it.

## 🚀 Key Features & UX Philosophy

* **Cognitive Load Reduction:** By categorizing tasks into headers, users can focus on one context at a time while hiding the distraction of others. This "Sticky Note" approach ensures you only see what is relevant to your current mission.
  
* **Gamified Productivity:** Unlike lists that reset daily, the Session Tracker is designed for the "immediate timeframe." It captures the momentum of a single session, providing a psychological "win" that motivates the next hour of work.
  
* **Intuitive Visual Language:** Featuring a simple, accessible color palette, custom FontAwesome iconography, and a built-in **Theme Switcher** (Dark/Light mode) to ensure the app feels comfortable in any environment - from a bright library to a late-night study session.

## 💻 Technical Deep Dive

* **Complex Nested State:** Managed a multi-level state architecture where a master `lists` array contains objects, which in turn contain `todos` arrays. I implemented custom handlers to perform "immutable updates" even three levels deep, ensuring React re-renders efficiently.
  
* **Advanced DND Logic:** Beyond basic dragging, I utilized `@dnd-kit/core` to implement **Cross-Container Transfer**. This allows tasks to move fluidly between the global "Inbox" and specific "List Sections" by calculating real-time collision detections.
  
* **Performance Optimization:** Integrated `React.memo` for the Session Header and optimized re-renders during drag operations to ensure the UI remains fluid and responsive, even with a high volume of active tasks.
  
* **Persistent Engine:** Built a custom synchronization layer with `localStorage` that serializes the entire nested state tree, ensuring zero data loss on page refreshes or browser crashes.

## ‼️ Deployment

[Try it out here!](https://breadeaddtasklist.netlify.app/)


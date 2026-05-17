import { useState, useEffect, useRef } from "react"
import { DndContext, closestCenter, pointerWithin, useSensor, useSensors, PointerSensor, TouchSensor } from "@dnd-kit/core"
import { arrayMove } from "@dnd-kit/sortable"
import { supabase } from './supabase'
import AuthForm from './components/AuthForm'
import TodoInput from "./components/TodoInput"
import TodoList from "./components/TodoList"
import SessionHeader from "./components/SessionHeader"
import CompletedList from "./components/CompletedList"
import ThemeToggle from "./components/ThemeToggle"
import ListsContainer from "./components/ListsContainer"

const ROOT_TODO_CONTAINER = 'root-todos'

function listSectionCollisionDetection(args) {
  if (args.active && isListSectionId(args.active.id)) {
    const hits = pointerWithin(args).filter(({ id }) => isListSectionId(id))
    if (hits.length > 0) return hits
  }
  return closestCenter(args)
}

function isListSectionId(id) {
  return String(id).startsWith('list-section-')
}

function parseListIdFromSectionId(id) {
  return String(id).replace('list-section-', '')
}

async function migrateFromLocalStorage(userId) {
  const localTodos = (() => {
    try { return JSON.parse(localStorage.getItem('todos'))?.todos || [] } catch { return [] }
  })()
  const localCompleted = (() => {
    try { return JSON.parse(localStorage.getItem('completed'))?.completed || [] } catch { return [] }
  })()
  const localLists = (() => {
    try { return JSON.parse(localStorage.getItem('lists'))?.lists || [] } catch { return [] }
  })()

  if (localTodos.length > 0) {
    await supabase.from('todos').insert(
      localTodos.map((todo, i) => ({
        user_id: userId, list_id: null, text: todo.text, is_completed: false, position: i
      }))
    )
  }

  if (localCompleted.length > 0) {
    await supabase.from('todos').insert(
      localCompleted.map((todo, i) => ({
        user_id: userId, list_id: null, text: todo.text, is_completed: true, position: i
      }))
    )
  }

  for (const [listIndex, list] of localLists.entries()) {
    const { data: insertedList, error } = await supabase
      .from('lists')
      .insert({ user_id: userId, title: list.title, position: listIndex })
      .select()
      .single()

    if (error || !insertedList) continue

    if (list.todos?.length > 0) {
      await supabase.from('todos').insert(
        list.todos.map((todo, i) => ({
          user_id: userId, list_id: insertedList.id, text: todo.text, is_completed: false, position: i
        }))
      )
    }
  }

  localStorage.removeItem('todos')
  localStorage.removeItem('completed')
  localStorage.removeItem('lists')
}

const App = () => {

  const [todos, setTodos] = useState([])
  const [todoValue, setTodoValue] = useState('')
  const [completed, setCompleted] = useState([])
  const [lists, setLists] = useState([])
  const [activeListId, setActiveListId] = useState(null)
  const [pendingRenameListId, setPendingRenameListId] = useState(null)
  const [editingFromListId, setEditingFromListId] = useState(null)
  const [activeDragId, setActiveDragId] = useState(null)
  const [activeDragType, setActiveDragType] = useState(null)
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } })
  )
  const todoInputRef = useRef(null)
  const sessionCount = completed.length

  // Auth session
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setAuthLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  // Theme stays in localStorage — it's a UI preference, not user data
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('theme') || 'dark'
    } catch {
      return 'dark'
    }
  })

  useEffect(() => {
    try {
      document.documentElement.setAttribute('data-theme', theme)
      localStorage.setItem('theme', theme)
    } catch (e) {
      // ignore
    }
  }, [theme])

  // Load data from Supabase when user is available
  useEffect(() => {
    if (!user) return

    async function loadData() {
      const { data: listsData, error: listsError } = await supabase
        .from('lists')
        .select('*')
        .order('position')

      if (listsError) { console.error(listsError); return }

      const { data: todosData, error: todosError } = await supabase
        .from('todos')
        .select('*')
        .order('position')

      if (todosError) { console.error(todosError); return }

      // Migrate localStorage data on first login if Supabase is empty
      const hasLocalData = localStorage.getItem('todos') || localStorage.getItem('lists')
      if (hasLocalData && listsData.length === 0 && todosData.length === 0) {
        await migrateFromLocalStorage(user.id)
        window.location.reload()
        return
      }

      const rootTodos = todosData.filter(t => !t.list_id && !t.is_completed)
      const completedTodos = todosData.filter(t => t.is_completed)
      const hydratedLists = listsData.map(list => ({
        ...list,
        todos: todosData.filter(t => t.list_id === list.id && !t.is_completed)
      }))

      setTodos(rootTodos)
      setCompleted(completedTodos)
      setLists(hydratedLists)
      setActiveListId(hydratedLists[0]?.id ?? null)
    }

    loadData()
  }, [user])

  function focusTodoInput() {
    if (!todoInputRef.current) return

    requestAnimationFrame(() => {
      const input = todoInputRef.current
      input.focus()

      const end = input.value.length
      input.setSelectionRange(end, end)
    })
  }

  // Todos
  async function handleAddTodos(newTodo) {
    const targetListId = editingFromListId
    const position = targetListId
      ? (lists.find(l => l.id === targetListId)?.todos.length ?? 0)
      : todos.length

    const { data, error } = await supabase
      .from('todos')
      .insert({
        user_id: user.id,
        list_id: targetListId ?? null,
        text: newTodo,
        is_completed: false,
        position
      })
      .select()
      .single()

    if (error) { console.error(error); return }

    if (targetListId !== null) {
      if (lists.some(list => list.id === targetListId)) {
        setLists(prev => prev.map(list =>
          list.id === targetListId
            ? { ...list, todos: [...list.todos, data] }
            : list
        ))
        setEditingFromListId(null)
        return
      }
      setEditingFromListId(null)
    }

    setTodos(prev => [...prev, data])
  }

  async function handleDeleteTodo(index) {
    const todo = todos[index]
    setTodos(prev => prev.filter((_, i) => i !== index))
    await supabase.from('todos').delete().eq('id', todo.id)
  }

  function handleEditTodo(index) {
    const valueToBeEdited = todos[index]
    setTodoValue(valueToBeEdited.text)
    setEditingFromListId(null)
    handleDeleteTodo(index)
    focusTodoInput()
  }

  async function handleCompleteTodo(index) {
    const todo = todos[index]
    setTodos(prev => prev.filter((_, i) => i !== index))
    setCompleted(prev => [...prev, { ...todo, is_completed: true }])
    await supabase.from('todos').update({ is_completed: true }).eq('id', todo.id)
  }

  async function handleResetSession() {
    const completedIds = completed.map(t => t.id)
    setCompleted([])
    if (completedIds.length > 0) {
      await supabase.from('todos').delete().in('id', completedIds)
    }
  }

  async function handleDeleteListTodo(listId, index) {
    const listToUpdate = lists.find(list => list.id === listId)
    if (!listToUpdate) return
    const todo = listToUpdate.todos[index]
    if (!todo) return

    setLists(prev => prev.map(list =>
      list.id === listId
        ? { ...list, todos: list.todos.filter((_, i) => i !== index) }
        : list
    ))
    await supabase.from('todos').delete().eq('id', todo.id)
  }

  function handleEditListTodo(listId, index) {
    const listToEdit = lists.find(list => list.id === listId)
    if (!listToEdit) return

    const valueToBeEdited = listToEdit.todos[index]
    if (!valueToBeEdited) return

    setTodoValue(valueToBeEdited.text)
    setEditingFromListId(listId)
    handleDeleteListTodo(listId, index)
    focusTodoInput()
  }

  async function handleCompleteListTodo(listId, index) {
    const listToUpdate = lists.find(list => list.id === listId)
    if (!listToUpdate) return

    const todo = listToUpdate.todos[index]
    if (!todo) return

    setLists(prev => prev.map(list =>
      list.id === listId
        ? { ...list, todos: list.todos.filter((_, i) => i !== index) }
        : list
    ))
    setCompleted(prev => [...prev, { ...todo, is_completed: true }])
    await supabase.from('todos').update({ is_completed: true }).eq('id', todo.id)
  }

  function findContainer(id) {
    if (id === ROOT_TODO_CONTAINER) {
      return ROOT_TODO_CONTAINER
    }

    if (String(id).startsWith('list-')) {
      return String(id)
    }

    if (todos.some((todo) => todo.id === id)) {
      return ROOT_TODO_CONTAINER
    }

    const listMatch = lists.find((list) => list.todos.some((todo) => todo.id === id))
    return listMatch ? `list-${listMatch.id}` : null
  }

  function getContainerItems(containerId) {
    if (containerId === ROOT_TODO_CONTAINER) {
      return todos
    }

    const listId = String(containerId).replace('list-', '')
    return lists.find((list) => list.id === listId)?.todos || []
  }

  function applyContainerState(nextTodos, nextLists) {
    setTodos(nextTodos)
    setLists(nextLists)
  }

  function setItemsForContainer(containerId, nextItems, currentTodos, currentLists) {
    if (containerId === ROOT_TODO_CONTAINER) {
      return {
        nextTodos: nextItems,
        nextLists: currentLists
      }
    }

    const listId = String(containerId).replace('list-', '')
    return {
      nextTodos: currentTodos,
      nextLists: currentLists.map((list) =>
        list.id === listId ? { ...list, todos: nextItems } : list
      )
    }
  }

  function persistDragState(currentTodos, currentLists) {
    const allUpdates = [
      ...currentTodos.map((todo, i) => ({
        id: todo.id, user_id: user.id, list_id: null,
        text: todo.text, is_completed: todo.is_completed ?? false, position: i
      })),
      ...currentLists.flatMap(list =>
        list.todos.map((todo, i) => ({
          id: todo.id, user_id: user.id, list_id: list.id,
          text: todo.text, is_completed: todo.is_completed ?? false, position: i
        }))
      )
    ]
    if (allUpdates.length > 0) {
      supabase.from('todos').upsert(allUpdates)
        .then(({ error }) => { if (error) console.error(error) })
    }
  }

  const handleDragOver = (event) => {
    const { active, over } = event
    if (!over) return

    if (isListSectionId(active.id) || isListSectionId(over.id)) {
      return
    }

    const activeContainer = findContainer(active.id)
    const overContainer = findContainer(over.id)

    if (!activeContainer || !overContainer || activeContainer === overContainer) {
      return
    }

    const activeItems = getContainerItems(activeContainer)
    const overItems = getContainerItems(overContainer)
    const activeIndex = activeItems.findIndex((item) => item.id === active.id)
    if (activeIndex < 0) return

    const activeItem = activeItems[activeIndex]
    const overIndex = overItems.findIndex((item) => item.id === over.id)
    const newIndex = overIndex >= 0 ? overIndex : overItems.length

    const nextActiveItems = activeItems.filter((item) => item.id !== active.id)
    const nextOverItems = [
      ...overItems.slice(0, newIndex),
      activeItem,
      ...overItems.slice(newIndex),
    ]

    const firstUpdate = setItemsForContainer(activeContainer, nextActiveItems, todos, lists)
    const secondUpdate = setItemsForContainer(
      overContainer,
      nextOverItems,
      firstUpdate.nextTodos,
      firstUpdate.nextLists
    )

    applyContainerState(secondUpdate.nextTodos, secondUpdate.nextLists)
  }

  const handleDragStart = (event) => {
    setActiveDragId(event.active.id)
    setActiveDragType(isListSectionId(event.active.id) ? 'list-section' : 'todo-item')
  }

  const handleDragCancel = () => {
    setActiveDragId(null)
    setActiveDragType(null)
  }

  const handleDragEnd = (event) => {
    const { active, over } = event
    if (!over || active.id === over.id) {
      setActiveDragId(null)
      setActiveDragType(null)
      return
    }

    const activeIsListSection = isListSectionId(active.id)
    const overIsListSection = isListSectionId(over.id)

    if (activeIsListSection && overIsListSection) {
      const activeListId = parseListIdFromSectionId(active.id)
      const overListId = parseListIdFromSectionId(over.id)

      const oldIndex = lists.findIndex((list) => list.id === activeListId)
      const newIndex = lists.findIndex((list) => list.id === overListId)

      if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) {
        setActiveDragId(null)
        setActiveDragType(null)
        return
      }

      const reorderedLists = arrayMove(lists, oldIndex, newIndex)
      setLists(reorderedLists)
      supabase.from('lists').upsert(
        reorderedLists.map((list, index) => ({
          id: list.id, user_id: user.id, title: list.title, position: index
        }))
      ).then(({ error }) => { if (error) console.error(error) })

      setActiveDragId(null)
      setActiveDragType(null)
      return
    }

    if (activeIsListSection || overIsListSection) {
      setActiveDragId(null)
      setActiveDragType(null)
      return
    }

    const activeContainer = findContainer(active.id)
    const overContainer = findContainer(over.id)

    if (!activeContainer || !overContainer || activeContainer !== overContainer) {
      // Cross-container move: state was set optimistically in handleDragOver, now persist it
      persistDragState(todos, lists)
      setActiveDragId(null)
      setActiveDragType(null)
      return
    }

    const containerItems = getContainerItems(activeContainer)
    const oldIndex = containerItems.findIndex((item) => item.id === active.id)
    const newIndex = containerItems.findIndex((item) => item.id === over.id)
    if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) {
      // newIndex is -1 when the drop target is the container itself (e.g. an empty list).
      // handleDragOver already moved the item in state, so persist that state now.
      persistDragState(todos, lists)
      setActiveDragId(null)
      setActiveDragType(null)
      return
    }

    const reordered = arrayMove(containerItems, oldIndex, newIndex)
    const updatedState = setItemsForContainer(activeContainer, reordered, todos, lists)
    applyContainerState(updatedState.nextTodos, updatedState.nextLists)
    persistDragState(updatedState.nextTodos, updatedState.nextLists)

    setActiveDragId(null)
    setActiveDragType(null)
  }

  // Lists
  async function handleAddList() {
    const { data, error } = await supabase
      .from('lists')
      .insert({ user_id: user.id, title: 'New List', position: lists.length })
      .select()
      .single()

    if (error) { console.error(error); return }

    const newList = { ...data, todos: [] }
    setLists(prev => [...prev, newList])
    setActiveListId(newList.id)
    setPendingRenameListId(newList.id)
  }

  async function handleDeleteList(id) {
    const updatedLists = lists.filter(list => list.id !== id)
    setLists(updatedLists)
    if (activeListId === id) {
      setActiveListId(updatedLists[0]?.id ?? null)
    }
    await supabase.from('lists').delete().eq('id', id)
  }

  async function handleUpdateListTitle(id, newTitle) {
    setLists(prev => prev.map(list =>
      list.id === id ? { ...list, title: newTitle } : list
    ))
    await supabase.from('lists').update({ title: newTitle }).eq('id', id)
  }

  async function handleUndoCompleted(index) {
    const todo = completed[index]
    setCompleted(prev => prev.filter((_, i) => i !== index))
    setTodos(prev => [...prev, { ...todo, is_completed: false }])
    await supabase.from('todos').update({ is_completed: false }).eq('id', todo.id)
  }

  if (authLoading) return <div>Loading...</div>
  if (!user) return <AuthForm />

  return (
    <div className="App" data-theme={theme}>
      <button className="signOutButton" onClick={() => supabase.auth.signOut()}>Sign out</button>
      <ThemeToggle theme={theme} setTheme={setTheme} />
      <TodoInput
        inputRef={todoInputRef}
        todoValue={todoValue}
        setTodoValue={setTodoValue}
        handleAddTodos={handleAddTodos}
      />
      <DndContext
        sensors={sensors}
        collisionDetection={listSectionCollisionDetection}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <TodoList
          containerId={ROOT_TODO_CONTAINER}
          activeDragId={activeDragId}
          isInteractionDisabled={activeDragType === 'list-section'}
          handleCompleteTodo={handleCompleteTodo}
          handleEditTodo={handleEditTodo}
          handleDeleteTodo={handleDeleteTodo}
          todos={todos}
        />
        <ListsContainer
          activeDragId={activeDragId}
          activeDragType={activeDragType}
          lists={lists}
          activeListId={activeListId}
          onSelectList={setActiveListId}
          pendingRenameListId={pendingRenameListId}
          onRenamePromptHandled={() => setPendingRenameListId(null)}
          handleAddList={handleAddList}
          handleDeleteList={handleDeleteList}
          handleUpdateListTitle={handleUpdateListTitle}
          handleDeleteListTodo={handleDeleteListTodo}
          handleEditListTodo={handleEditListTodo}
          handleCompleteListTodo={handleCompleteListTodo}
        />
      </DndContext>
      <SessionHeader count={sessionCount} handleResetSession={handleResetSession}/>
      <CompletedList todos={completed} handleUndoCompleted={handleUndoCompleted}/>
    </div>
  )
}

export default App
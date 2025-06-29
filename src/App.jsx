import React, { useState, useRef, useEffect, useCallback } from 'react';
import './App.css';
import { useWordList } from './hooks/useWordList';
import { useSuggestions } from './hooks/useSuggestions';
import TextArea from './components/TextArea';
import Message from './components/Message';
import Keyboard from './components/Keyboard/Keyboard';
import ToDoList from './components/ToDoList';

function App() {
  const [value, setValue] = useState('');
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [todoItems, setTodoItems] = useState(() => {
    const saved = localStorage.getItem('todoItems');
    return saved ? JSON.parse(saved) : [];
  });
  
  const { wordList, fuseInstance } = useWordList();
  const { suggestions, updateFrequentWords } = useSuggestions(value, wordList, fuseInstance);
  
  const appRef = useRef(null);
  const textAreaRef = useRef(null);
  const backspaceTimeout = useRef(null);
  const backspaceInterval = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (appRef.current && !appRef.current.contains(event.target)) {
        setIsKeyboardVisible(false);
      } else if (textAreaRef.current && textAreaRef.current.contains(event.target)) {
        setIsKeyboardVisible(true);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    localStorage.setItem('todoItems', JSON.stringify(todoItems));
  }, [todoItems]);

  const startBackspace = useCallback(() => {
    backspaceTimeout.current = setTimeout(() => {
      backspaceInterval.current = setInterval(() => {
        setValue((prev) => prev.slice(0, -1));
      }, 100);
    }, 300);
  }, []);

  const stopBackspace = useCallback(() => {
    clearTimeout(backspaceTimeout.current);
    clearInterval(backspaceInterval.current);
  }, []);

  const handleDone = useCallback(() => {
    if (value.trim()) {
      setTodoItems((prev) => [...prev, value.trim()]);
      setValue('');
      setMessage('Tarefa adicionada com sucesso!');
      setTimeout(() => setMessage(''), 2000);
    }
    setIsKeyboardVisible(false);
  }, [value]);

  const handleSuggestionClick = useCallback((suggestion) => {
    const words = value.trim().split(/\s+/);
    const newValue =
      words[words.length - 1] === ''
        ? value + suggestion + ' '
        : [...words.slice(0, -1), suggestion].join(' ') + ' ';
    setValue(newValue);
    updateFrequentWords(newValue);
  }, [value, updateFrequentWords]);

  const handleValueChange = useCallback((newValue) => {
    setValue(newValue);
    updateFrequentWords(newValue);
  }, [updateFrequentWords]);

  const handleEditItem = useCallback((index, newText) => {
    setTodoItems((prev) => {
      const updated = [...prev];
      updated[index] = newText.trim();
      return updated;
    });
  }, []);

  const handleDeleteItem = useCallback((index) => {
    setTodoItems((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleClearText = useCallback(() => {
    setValue('');
  }, []);

  const handleEditStart = useCallback((text) => {
    setValue(text);
    setIsKeyboardVisible(true);
    // Foca no textarea
    if (textAreaRef.current) {
      textAreaRef.current.focus();
      // Seleciona todo o texto para facilitar a edição
      textAreaRef.current.setSelectionRange(0, text.length);
    }
  }, []);

  return (
    <div ref={appRef} className="app-container">
      <TextArea
        ref={textAreaRef}
        value={value}
        setValue={handleValueChange}
        setKeyboardVisible={setIsKeyboardVisible}
        onClearText={handleClearText}
      />
      <Message message={message} />
      <ToDoList
        items={todoItems}
        onEdit={handleEditItem}
        onDelete={handleDeleteItem}
        isKeyboardVisible={isKeyboardVisible}
        onEditStart={handleEditStart}
      />
      <Keyboard
        setValue={handleValueChange}
        isVisible={isKeyboardVisible}
        setKeyboardVisible={setIsKeyboardVisible}
        startBackspace={startBackspace}
        stopBackspace={stopBackspace}
        handleDone={handleDone}
        value={value}
        suggestions={suggestions}
        handleSuggestionClick={handleSuggestionClick}
      />
    </div>
  );
}

export default App;
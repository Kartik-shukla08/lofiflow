import React, { useState } from 'react';
import { useProductivityStore, useUIStore } from '../store';
import { Plus, Trash2, Check, Circle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const TodoList: React.FC = () => {
  const { currentTheme } = useUIStore();
  const { tasks, addTask, toggleTask, deleteTask } = useProductivityStore();
  const [newTask, setNewTask] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTask.trim()) {
      addTask(newTask.trim());
      setNewTask('');
    }
  };

  const cardColor = currentTheme?.colors?.card || 'rgba(30, 41, 59, 0.8)';
  const textColor = currentTheme?.colors?.text || '#fff';

  return (
    <div 
        className="h-full w-full flex flex-col rounded-2xl overflow-hidden backdrop-blur-md border border-white/10"
        style={{ backgroundColor: cardColor, color: textColor }}
    >
      <div className="p-4 border-b border-white/10 bg-white/5">
        <h2 className="text-lg font-semibold flex items-center gap-2">
            Tasks <span className="text-xs bg-white/10 px-2 py-0.5 rounded-full">{tasks.filter(t => !t.completed).length}</span>
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        <AnimatePresence>
            {tasks.length === 0 && (
                <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="text-center opacity-40 py-8 text-sm italic"
                >
                    No tasks yet. Stay focused!
                </motion.div>
            )}
            {tasks.sort((a,b) => Number(a.completed) - Number(b.completed)).map((task) => (
            <motion.div
                key={task.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className={`flex items-center group p-3 rounded-lg transition-all ${task.completed ? 'bg-white/5 opacity-50' : 'bg-white/10'}`}
            >
                <button 
                    onClick={() => toggleTask(task.id)}
                    className="mr-3 text-white/60 hover:text-white"
                >
                    {task.completed ? <Check size={18} className="text-green-400" /> : <Circle size={18} />}
                </button>
                <span className={`flex-1 text-sm ${task.completed ? 'line-through' : ''}`}>
                    {task.text}
                </span>
                <button 
                    onClick={() => deleteTask(task.id)}
                    className="opacity-0 group-hover:opacity-100 text-red-400 p-1 hover:bg-white/10 rounded transition"
                >
                    <Trash2 size={16} />
                </button>
            </motion.div>
            ))}
        </AnimatePresence>
      </div>

      <form onSubmit={handleSubmit} className="p-4 border-t border-white/10 bg-black/10">
        <div className="relative">
            <input
                type="text"
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
                placeholder="Add a new task..."
                className="w-full bg-white/10 border-none rounded-lg py-3 pl-4 pr-10 text-sm focus:ring-1 focus:ring-white/30 placeholder-white/30"
            />
            <button 
                type="submit"
                disabled={!newTask.trim()}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md hover:bg-white/10 disabled:opacity-30 transition"
            >
                <Plus size={16} />
            </button>
        </div>
      </form>
    </div>
  );
};

export default TodoList;
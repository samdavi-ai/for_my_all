import { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { chatApi } from '../api/chatApi'
import { 
  PaperAirplaneIcon, 
  TrashIcon, 
  DocumentTextIcon, 
  SparklesIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import { toast } from 'react-hot-toast'
import ReactMarkdown from 'react-markdown'
import { formatRelativeTime } from '../utils/formatters'

export default function Chat() {
  const queryClient = useQueryClient()
  const messagesEndRef = useRef(null)
  const [inputText, setInputText] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false)
  const [notesText, setNotesText] = useState('')

  const { data: history = [], isLoading } = useQuery({
    queryKey: ['chat-history'],
    queryFn: chatApi.getHistory
  })

  // Local optimistic state for instant UI update
  const [localMessages, setLocalMessages] = useState([])

  useEffect(() => {
    if (history.length > 0) {
      setLocalMessages(history)
    }
  }, [history])

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [localMessages, isTyping])

  const sendMutation = useMutation({
    mutationFn: chatApi.sendMessage,
    onSuccess: (newMsg) => {
      // API call actually saves both user and assistant msg to DB.
      // Easiest is to refetch all to get proper IDs, but we optimistically update UI first.
      queryClient.invalidateQueries({ queryKey: ['chat-history'] })
      setIsTyping(false)
    },
    onError: () => {
      toast.error('Failed to send message')
      setIsTyping(false)
      // Revert optimistic update
      setLocalMessages(localMessages.slice(0, -1))
    }
  })

  const clearMutation = useMutation({
    mutationFn: chatApi.clearHistory,
    onSuccess: () => {
      setLocalMessages([])
      queryClient.invalidateQueries({ queryKey: ['chat-history'] })
      toast.success('Chat history cleared')
    }
  })

  const summarizeMutation = useMutation({
    mutationFn: chatApi.summarizeNotes,
    onSuccess: (data) => {
      // Automatically send the summary as an AI message to the chat
      queryClient.invalidateQueries({ queryKey: ['chat-history'] })
      toast.success('Notes summarized!')
      setIsNotesModalOpen(false)
      setNotesText('')
    },
    onError: () => toast.error('Failed to summarize notes')
  })

  const handleSend = (text) => {
    const trimmed = text.trim()
    if (!trimmed || isTyping) return

    // Optimistic update
    const tempUserMsg = { id: `temp-${Date.now()}`, role: 'user', content: trimmed, timestamp: new Date().toISOString() }
    setLocalMessages(prev => [...prev, tempUserMsg])
    setInputText('')
    setIsTyping(true)

    sendMutation.mutate(trimmed)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend(inputText)
    }
  }

  const quickPrompts = [
    { text: 'Give me a study tip 📚', query: 'Give me a short study tip based on my learning style.' },
    { text: 'I am feeling stressed 😰', query: 'I am feeling a bit stressed right now. What should I do?' },
    { text: 'Help me prioritize 📋', query: 'Can you look at my pending tasks and help me prioritize?' },
    { text: 'Explain a topic 🎓', query: 'I need you to explain a topic to me. Ask me what it is!' }
  ]

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col bg-surface.card rounded-2xl border border-white/5 shadow-md overflow-hidden relative">
      
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10 bg-surface.card">
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center mr-3 border border-purple-500/20">
            <SparklesIcon className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-white font-semibold flex items-center gap-2">
              Study Companion 
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </h2>
            <p className="text-xs text-slate-400">Powered by Groq AI</p>
          </div>
        </div>

        <button 
          onClick={() => { if(window.confirm('Clear all conversation history?')) clearMutation.mutate() }}
          className="p-2 text-slate-500 hover:text-rose-400 hover:bg-white/5 rounded-lg transition-colors border border-transparent hover:border-white/5"
          title="Clear Chat History"
        >
          <TrashIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 no-scrollbar relative">
        {isLoading && localMessages.length === 0 ? (
          <div className="flex h-full items-center justify-center text-slate-500 flex-col gap-3">
             <div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin"></div>
             Loading conversation...
          </div>
        ) : localMessages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center px-4">
             <div className="w-20 h-20 bg-brand/10 rounded-full flex items-center justify-center mb-6">
                <SparklesIcon className="w-10 h-10 text-brand" />
             </div>
             <h3 className="text-xl font-medium text-white mb-2">Hello there!</h3>
             <p className="text-slate-400 max-w-sm mb-8">
               I'm your AI Study Companion. Ask me anything about your tasks, schedule, or let me explain complex topics to you.
             </p>
             
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
                {quickPrompts.map((p, i) => (
                  <button 
                    key={i} 
                    onClick={() => handleSend(p.query)}
                    className="p-3 rounded-xl bg-surface.elevated/30 border border-white/5 text-slate-300 hover:bg-white/10 hover:text-white transition-all text-sm text-left shadow-sm"
                  >
                    {p.text}
                  </button>
                ))}
             </div>
          </div>
        ) : (
          localMessages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
               <div className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                 
                 {/* Avatar */}
                 <div className="flex-shrink-0 mt-1">
                   {msg.role === 'user' ? (
                      <div className="w-8 h-8 rounded-full bg-brand flex items-center justify-center text-white text-xs font-bold ring-2 ring-surface">U</div>
                   ) : (
                      <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center ring-2 ring-surface">
                        <SparklesIcon className="w-5 h-5" />
                      </div>
                   )}
                 </div>

                 {/* Bubble */}
                 <div>
                   <div className={`p-4 shadow-sm ${
                     msg.role === 'user' 
                      ? 'bg-brand text-white rounded-2xl rounded-tr-sm' 
                      : 'bg-surface.elevated/50 text-slate-200 rounded-2xl rounded-tl-sm border border-white/5'
                   }`}>
                      {msg.role === 'assistant' ? (
                         <div className="prose prose-invert prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-surface prose-pre:border prose-pre:border-white/10">
                           <ReactMarkdown>{msg.content}</ReactMarkdown>
                         </div>
                      ) : (
                         <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
                      )}
                   </div>
                   <div className={`text-xs text-slate-500 mt-1.5 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                     {formatRelativeTime(msg.timestamp)}
                   </div>
                 </div>

               </div>
            </div>
          ))
        )}

        {isTyping && (
          <div className="flex justify-start">
             <div className="flex gap-3 max-w-[85%]">
               <div className="w-8 h-8 flex-shrink-0 mt-1 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center ring-2 ring-surface">
                 <SparklesIcon className="w-5 h-5" />
               </div>
               <div className="bg-surface.elevated/50 p-4 rounded-2xl rounded-tl-sm border border-white/5 flex items-center gap-1.5 shadow-sm h-[52px]">
                 <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></span>
                 <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                 <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
               </div>
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-white/10 bg-surface">
         <div className="flex items-end gap-2 bg-surface.card border border-white/10 rounded-2xl p-1.5 pb-2 transition-colors focus-within:border-brand/50 focus-within:ring-1 focus-within:ring-brand/50 shadow-inner">
           
           <button 
             onClick={() => setIsNotesModalOpen(true)}
             className="p-2.5 text-slate-400 hover:text-brand hover:bg-brand/10 rounded-xl transition-all self-end"
             title="Summarize Notes"
           >
             <DocumentTextIcon className="w-5 h-5" />
           </button>
           
           <textarea
             value={inputText}
             onChange={(e) => setInputText(e.target.value)}
             onKeyDown={handleKeyDown}
             placeholder="Ask your study companion... (Shift+Enter for newline)"
             className="flex-1 max-h-32 min-h-[44px] bg-transparent resize-none py-3 px-2 text-sm text-white placeholder-slate-500 focus:outline-none no-scrollbar"
             rows={inputText.split('\n').length > 1 ? Math.min(inputText.split('\n').length, 4) : 1}
           />
           
           <button 
             onClick={() => handleSend(inputText)}
             disabled={!inputText.trim() || isTyping}
             className="p-2.5 bg-brand text-white rounded-xl hover:bg-brand.dark disabled:opacity-50 disabled:hover:bg-brand transition-colors shadow-md self-end"
           >
             <PaperAirplaneIcon className="w-5 h-5" />
           </button>
         </div>
      </div>

      {/* Summarize Notes Modal */}
      {isNotesModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface/80 backdrop-blur-sm">
          <div className="bg-surface.card rounded-2xl w-full max-w-2xl border border-white/10 shadow-2xl flex flex-col">
            <div className="flex justify-between items-center p-5 border-b border-white/10">
              <h3 className="text-lg font-semibold text-white flex items-center">
                <DocumentTextIcon className="w-5 h-5 mr-2 text-brand" />
                Summarize Notes
              </h3>
              <button onClick={() => setIsNotesModalOpen(false)} className="text-slate-400 hover:text-white">
                 <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-5">
              <textarea 
                value={notesText}
                onChange={e => setNotesText(e.target.value)}
                placeholder="Paste your long study notes, articles, or lecture transcripts here..."
                className="w-full h-64 bg-surface.elevated/30 border border-white/10 rounded-xl p-4 text-white text-sm focus:ring-1 focus:ring-brand focus:border-brand resize-none"
              />
            </div>
            
            <div className="p-5 border-t border-white/10 flex justify-end gap-3 bg-surface.card rounded-b-2xl">
               <button onClick={() => setIsNotesModalOpen(false)} className="px-4 py-2 text-slate-300 hover:bg-white/5 rounded-lg transition-colors">
                 Cancel
               </button>
               <button 
                 onClick={() => summarizeMutation.mutate({ text: notesText })}
                 disabled={!notesText.trim() || summarizeMutation.isPending}
                 className="px-6 py-2 bg-brand text-white rounded-lg hover:bg-brand.dark disabled:opacity-50 flex items-center tracking-wide font-medium shadow-lg shadow-brand/20 transition-colors"
               >
                 {summarizeMutation.isPending ? 'Summarizing...' : <><SparklesIcon className="w-4 h-4 mr-2" /> Summarize</>}
               </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

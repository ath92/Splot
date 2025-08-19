import { useState, useEffect, useRef } from 'react'

interface ConsoleMessage {
  id: number
  type: 'log' | 'warn' | 'error' | 'info'
  message: string
  timestamp: Date
}

interface DebugConsoleProps {
  isVisible: boolean
}

export default function DebugConsole({ isVisible }: DebugConsoleProps) {
  const [messages, setMessages] = useState<ConsoleMessage[]>([])
  const [isExpanded, setIsExpanded] = useState(false)
  const messageIdRef = useRef(0)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isVisible) return

    // Store original console methods
    const originalConsole = {
      log: console.log,
      warn: console.warn,
      error: console.error,
      info: console.info
    }

    // Helper to capture console messages
    const captureMessage = (type: ConsoleMessage['type']) => (...args: unknown[]) => {
      // Call original console method first
      originalConsole[type](...args)
      
      // Capture for our debug panel
      const message = args.map(arg => {
        if (typeof arg === 'object' && arg !== null) {
          try {
            // Try to stringify, but handle circular references
            return JSON.stringify(arg, null, 2)
          } catch {
            // Fallback for circular references or other JSON errors
            if (arg.toString && typeof arg.toString === 'function') {
              return arg.toString()
            }
            return '[Complex Object]'
          }
        }
        return String(arg)
      }).join(' ')
      
      setMessages(prev => {
        const newMessage: ConsoleMessage = {
          id: messageIdRef.current++,
          type,
          message,
          timestamp: new Date()
        }
        // Keep only last 100 messages to prevent memory issues
        const updated = [...prev, newMessage].slice(-100)
        return updated
      })
    }

    // Override console methods
    console.log = captureMessage('log')
    console.warn = captureMessage('warn')
    console.error = captureMessage('error')
    console.info = captureMessage('info')

    // Cleanup function to restore original console
    return () => {
      console.log = originalConsole.log
      console.warn = originalConsole.warn
      console.error = originalConsole.error
      console.info = originalConsole.info
    }
  }, [isVisible])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (isExpanded && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isExpanded])

  if (!isVisible) {
    return null
  }

  const clearMessages = () => {
    setMessages([])
  }

  const getMessageClass = (type: ConsoleMessage['type']) => {
    switch (type) {
      case 'error': return 'debug-console-message-error'
      case 'warn': return 'debug-console-message-warn'
      case 'info': return 'debug-console-message-info'
      default: return 'debug-console-message-log'
    }
  }

  const formatTime = (timestamp: Date) => {
    return timestamp.toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit',
      fractionalSecondDigits: 3
    })
  }

  return (
    <div className="debug-console">
      <div 
        className="debug-console-header" 
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <span className="debug-console-title">
          🐛 Debug Console ({messages.length})
        </span>
        <span className="debug-console-toggle">
          {isExpanded ? '▲' : '▼'}
        </span>
      </div>
      
      {isExpanded && (
        <div className="debug-console-content">
          <div className="debug-console-controls">
            <button 
              onClick={clearMessages}
              className="debug-console-clear-btn"
            >
              Clear
            </button>
          </div>
          
          <div className="debug-console-messages">
            {messages.map((msg) => (
              <div 
                key={msg.id} 
                className={`debug-console-message ${getMessageClass(msg.type)}`}
              >
                <span className="debug-console-timestamp">
                  {formatTime(msg.timestamp)}
                </span>
                <span className="debug-console-type">
                  {msg.type.toUpperCase()}
                </span>
                <span className="debug-console-text">
                  {msg.message}
                </span>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>
      )}
    </div>
  )
}
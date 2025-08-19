import { useState, useEffect, useRef } from 'react'
import JsonView from '@uiw/react-json-view'

interface ConsoleMessage {
  id: number
  type: 'log' | 'warn' | 'error' | 'info'
  args: unknown[]
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

    // Helper function to remove circular references from objects
    const removeCircularReferences = (
      obj: unknown, 
      visited = new WeakSet(), 
      depth = 0, 
      startTime = Date.now()
    ): unknown => {
      // Prevent infinite recursion by limiting depth
      const MAX_DEPTH = 20
      if (depth > MAX_DEPTH) {
        return '[Max Depth Reached]'
      }
      
      // Prevent hanging by limiting processing time (max 100ms per object graph)
      const MAX_PROCESSING_TIME = 100
      if (Date.now() - startTime > MAX_PROCESSING_TIME) {
        return '[Processing Timeout]'
      }
      
      // Handle null, undefined, and primitive types
      if (obj === null || typeof obj !== 'object') {
        return obj
      }
      
      // Check if we've already visited this object (circular reference)
      if (visited.has(obj)) {
        return '[Circular Reference]'
      }
      
      // Add current object to visited set
      visited.add(obj)
      
      try {
        // Handle arrays
        if (Array.isArray(obj)) {
          // Limit array processing to prevent performance issues
          const maxItems = 50
          const result = obj.slice(0, maxItems).map(item => 
            removeCircularReferences(item, visited, depth + 1, startTime)
          )
          if (obj.length > maxItems) {
            result.push(`[... ${obj.length - maxItems} more items]`)
          }
          return result
        }
        
        // Handle Date objects
        if (obj instanceof Date) {
          return obj.toISOString()
        }
        
        // Handle Error objects
        if (obj instanceof Error) {
          return {
            name: obj.name,
            message: obj.message,
            stack: obj.stack
          }
        }
        
        // Handle regular objects
        const result: Record<string, unknown> = {}
        const keys = Object.keys(obj)
        const maxProperties = 30 // Limit properties to prevent performance issues
        
        // Process up to maxProperties
        const keysToProcess = keys.slice(0, maxProperties)
        for (const key of keysToProcess) {
          try {
            result[key] = removeCircularReferences(
              (obj as Record<string, unknown>)[key], 
              visited, 
              depth + 1, 
              startTime
            )
          } catch {
            // If there's an error accessing a property, skip it
            result[key] = '[Property Access Error]'
          }
        }
        
        // Add indicator if there are more properties
        if (keys.length > maxProperties) {
          result['[...]'] = `${keys.length - maxProperties} more properties`
        }
        
        return result
      } catch {
        return '[Object Processing Error]'
      }
    }

    // Helper to capture console messages
    const captureMessage = (type: ConsoleMessage['type']) => (...args: unknown[]) => {
      // Call original console method first
      originalConsole[type](...args)
      
      // Capture for our debug panel - store cleaned args instead of stringified message
      const cleanedArgs = args.map(arg => {
        if (typeof arg === 'object' && arg !== null) {
          try {
            // Try to clean circular references first
            return removeCircularReferences(arg)
          } catch {
            // Final fallback for objects that can't be processed
            if (arg instanceof Date) {
              return arg.toISOString()
            }
            
            if (arg instanceof Error) {
              return `Error: ${arg.message}`
            }
            
            if (Array.isArray(arg)) {
              try {
                // Try to stringify array elements individually
                const elements = arg.slice(0, 10).map(item => {
                  try {
                    return JSON.stringify(item)
                  } catch {
                    return String(item)
                  }
                })
                const preview = elements.join(', ')
                return `[${preview}${arg.length > 10 ? `, ...${arg.length - 10} more` : ''}]`
              } catch {
                return `[Array(${arg.length})]`
              }
            }
            
            // For other objects, try to get constructor name and some properties
            const constructorName = arg.constructor?.name || 'Object'
            
            // Try to get some property names without triggering getters
            try {
              const keys = Object.keys(arg)
              if (keys.length === 0) {
                return `{} (${constructorName})`
              }
              
              // For objects with circular references or that can't be stringified,
              // show a preview of property names
              const keyPreview = keys.slice(0, 5).join(', ')
              const moreKeys = keys.length > 5 ? `, ...${keys.length - 5} more` : ''
              return `{${keyPreview}${moreKeys}} (${constructorName})`
            } catch {
              // If even getting keys fails
              return `[${constructorName} Object]`
            }
          }
        }
        return arg
      })
      
      setMessages((prev: ConsoleMessage[]) => {
        const newMessage: ConsoleMessage = {
          id: messageIdRef.current++,
          type,
          args: cleanedArgs,
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
                <div className="debug-console-content-wrapper">
                  {msg.args.map((arg, index) => (
                    <div key={index} className="debug-console-arg">
                      {typeof arg === 'object' && arg !== null && typeof arg !== 'string' ? (
                        <JsonView 
                          value={arg} 
                          collapsed={1}
                          style={{
                            backgroundColor: 'transparent',
                            fontSize: '11px',
                            lineHeight: '1.4'
                          }}
                        />
                      ) : (
                        <span className="debug-console-primitive">
                          {String(arg)}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>
      )}
    </div>
  )
}
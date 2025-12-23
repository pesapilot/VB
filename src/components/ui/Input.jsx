import { forwardRef } from 'react'
import { cn } from '../../lib/cn'

const Input = forwardRef(({ className, type = 'text', error, ...props }, ref) => {
  return (
    <input
      type={type}
      ref={ref}
      className={cn(
        'w-full px-4 py-2.5 border rounded-lg text-gray-900 placeholder-gray-400 transition-colors',
        'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
        error ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300',
        className
      )}
      {...props}
    />
  )
})

Input.displayName = 'Input'

const Label = forwardRef(({ className, children, required, ...props }, ref) => {
  return (
    <label
      ref={ref}
      className={cn('block text-sm font-medium text-gray-700 mb-1', className)}
      {...props}
    >
      {children}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
  )
})

Label.displayName = 'Label'

const Select = forwardRef(({ className, error, children, ...props }, ref) => {
  return (
    <select
      ref={ref}
      className={cn(
        'w-full px-4 py-2.5 border rounded-lg text-gray-900 bg-white transition-colors',
        'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
        error ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300',
        className
      )}
      {...props}
    >
      {children}
    </select>
  )
})

Select.displayName = 'Select'

const Textarea = forwardRef(({ className, error, ...props }, ref) => {
  return (
    <textarea
      ref={ref}
      className={cn(
        'w-full px-4 py-2.5 border rounded-lg text-gray-900 placeholder-gray-400 transition-colors resize-none',
        'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
        error ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300',
        className
      )}
      {...props}
    />
  )
})

Textarea.displayName = 'Textarea'

export { Input, Label, Select, Textarea }

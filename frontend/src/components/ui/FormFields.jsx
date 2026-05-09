export function FormField({ label, error, required, children }) {
  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}{required && <span className="text-red-400 ml-1">*</span>}
        </label>
      )}
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

export function FormInput({ register, error, ...props }) {
  return (
    <input
      {...register}
      {...props}
      className={`input-field ${error ? 'border-red-300 focus:ring-red-300' : ''}`}
    />
  );
}

export function FormSelect({ register, error, children, ...props }) {
  return (
    <select
      {...register}
      {...props}
      className={`input-field ${error ? 'border-red-300 focus:ring-red-300' : ''}`}
    >
      {children}
    </select>
  );
}

export function FormTextarea({ register, error, ...props }) {
  return (
    <textarea
      {...register}
      {...props}
      rows={3}
      className={`input-field resize-none ${error ? 'border-red-300 focus:ring-red-300' : ''}`}
    />
  );
}

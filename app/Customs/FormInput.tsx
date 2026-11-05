interface FormInputProps {
  name: string;
  label: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  defaultValue?: string;
}

export default function FormInput({
  name,
  label,
  type = 'text',
  placeholder = '',
  required = true,
  defaultValue = '',
}: FormInputProps) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-700 mb-1">
        {label}
      </label>
      <input 
        name={name} 
        type={type} 
        required={required}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900 text-slate-900 font-medium placeholder:text-slate-400 placeholder:font-normal bg-white"
      />
    </div>
  );
}
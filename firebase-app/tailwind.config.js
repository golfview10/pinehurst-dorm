/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./public/**/*.{html,js}"
  ],
  safelist: [
    'group-hover:bg-apple-blue',
    'group-hover:bg-indigo-500',
    'group-hover:bg-purple-500',
    'group-hover:bg-orange-500',
    'group-hover:bg-emerald-500',
    'group-hover:text-white',
    'text-blue-700', 'bg-blue-100', 'bg-blue-50',
    'text-indigo-500', 'bg-indigo-50',
    'text-purple-700', 'bg-purple-100', 'bg-purple-50',
    'text-orange-700', 'bg-orange-100', 'bg-orange-50',
    'text-green-700', 'bg-green-100', 'bg-emerald-50', 'text-emerald-500',
    'text-teal-700', 'bg-teal-100', 'bg-teal-50', 'text-teal-600', 'bg-teal-500', 'border-teal-200',
    'text-amber-700', 'bg-amber-100', 'bg-amber-50', 'text-amber-600', 'bg-amber-500', 'border-amber-300', 'border-amber-400',
    'text-red-700', 'bg-red-100', 'bg-rose-500',
    'bg-indigo-600', 'bg-indigo-700', 'hover:bg-indigo-700', 'from-indigo-600', 'to-purple-600', 'bg-gradient-to-r'
  ],
  theme: {
    extend: {
      colors: {
        apple: {
          blue: '#007AFF',
          gray: '#F5F5F7',
          dark: '#1D1D1F',
          glass: 'rgba(255, 255, 255, 0.7)'
        }
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Inter', 'Sarabun', 'sans-serif']
      }
    }
  },
  plugins: [],
}

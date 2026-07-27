import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

export const confirmAction = async (title: string, text?: string, confirmText: string = "Yes, do it!") => {
  const result = await MySwal.fire({
    title,
    text,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#FF8C00', // Kambata orange
    cancelButtonColor: '#475569', // Slate 600
    confirmButtonText: confirmText,
    background: document.documentElement.classList.contains('dark') ? '#1E293B' : '#ffffff',
    color: document.documentElement.classList.contains('dark') ? '#ffffff' : '#0F172A',
    customClass: {
      popup: 'rounded-[2rem] border border-gray-100 dark:border-white/5 shadow-xl',
      confirmButton: 'rounded-xl px-6 py-3 font-bold',
      cancelButton: 'rounded-xl px-6 py-3 font-bold',
    }
  });

  return result.isConfirmed;
};

export const promptAction = async (title: string, inputPlaceholder: string = "") => {
  const result = await MySwal.fire({
    title,
    input: 'text',
    inputPlaceholder,
    icon: 'question',
    showCancelButton: true,
    confirmButtonColor: '#FF8C00',
    cancelButtonColor: '#475569',
    confirmButtonText: 'Submit',
    background: document.documentElement.classList.contains('dark') ? '#1E293B' : '#ffffff',
    color: document.documentElement.classList.contains('dark') ? '#ffffff' : '#0F172A',
    customClass: {
      popup: 'rounded-[2rem] border border-gray-100 dark:border-white/5 shadow-xl',
      input: 'rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#0F172A] px-4 py-3 font-medium text-sm focus:border-[#FF8C00] outline-none',
      confirmButton: 'rounded-xl px-6 py-3 font-bold',
      cancelButton: 'rounded-xl px-6 py-3 font-bold',
    },
    inputValidator: (value) => {
      if (!value) {
        return 'You need to write something!'
      }
    }
  });

  return result.isConfirmed ? result.value : null;
};

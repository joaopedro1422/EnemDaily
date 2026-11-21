import Swal from 'sweetalert2';

function playAudio() {
        const audio = new Audio();
        audio.src = `toast.mp3`;
        audio.load();
        audio.play();
}
export const Alert = {
    
  success: (msg: string) => {
    Swal.fire({
      icon: 'success',
      title: msg,
      timer: 3000,
      showConfirmButton: false,
      heightAuto: false
    });
  },
  error: (msg: string) => {
    Swal.fire({
      icon: 'error',
      title: 'Ops...',
      text: msg,
      confirmButtonColor: '#5c67f2'
    });
  },
  toast: (msg: string, icon: 'success' | 'error' | 'info' = 'success') => {
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: icon,
      title: msg,
      showConfirmButton: false,
      timer: 4000,
      
    });
  }
};
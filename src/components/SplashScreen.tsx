import { useEffect, useState } from 'react';

const SplashScreen = ({ onComplete }: { onComplete: () => void }) => {
  const [stage, setStage] = useState<'animating' | 'fading'>('animating');

  useEffect(() => {
    // Stage 1: Animation lasts for 2.5 seconds
    const animTimer = setTimeout(() => {
      setStage('fading');
    }, 2500);

    // Stage 2: Fade out lasts for 0.5s, then we unmount
    const unmountTimer = setTimeout(() => {
      onComplete();
    }, 3000);

    return () => {
      clearTimeout(animTimer);
      clearTimeout(unmountTimer);
    };
  }, [onComplete]);

  return (
    <div 
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-gradient-to-br from-primary-900 via-primary-800 to-secondary-900 overflow-hidden transition-opacity duration-500 ${
        stage === 'fading' ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Background Shapes */}
      <div className="absolute inset-0 overflow-hidden mix-blend-overlay opacity-20 pointer-events-none">
        <svg className="absolute left-[10%] top-[20%] w-96 h-96 text-white animate-spin-slow" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
          <path fill="currentColor" d="M44.7,-76.4C58.8,-69.2,71.8,-59.1,81.3,-46.3C90.8,-33.5,96.8,-18,97,-2.4C97.1,13.2,91.3,28.8,81.8,41.5C72.3,54.2,59.1,64,45.2,71.6C31.3,79.2,16.7,84.7,2.3,80.7C-12.1,76.6,-26.3,63.1,-40.4,53.4C-54.5,43.7,-68.5,37.8,-76.6,26.9C-84.7,16,-86.9,0.2,-83.4,-13.8C-79.9,-27.8,-70.7,-40,-58.8,-48.3C-46.9,-56.6,-32.3,-61,-19.1,-64.7C-5.9,-68.4,5.9,-71.4,19.2,-74.6C32.5,-77.8,47.3,-81.1,44.7,-76.4Z" transform="translate(100 100) scale(1.1)" />
        </svg>
      </div>

      <div className="relative z-10 flex flex-col items-center animate-bounce-slow">
        <div className="w-28 h-28 bg-white/10 backdrop-blur-md rounded-full mb-6 flex items-center justify-center border border-white/20 shadow-[0_0_30px_rgba(255,255,255,0.2)] animate-pulse">
          <img src="/icon-192.png" alt="Peto Care" className="w-20 h-20 object-contain drop-shadow-md" />
        </div>
        
        <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-primary-100 to-white tracking-wider animate-pulse mb-2">
          Welcome to peto care
        </h1>
        
        <div className="mt-2 py-1 px-4 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm animate-fade-in-up delay-150">
          <p className="text-sm md:text-base font-semibold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-teal-200 via-blue-200 to-purple-200 uppercase">
            Developed by yehia ayman
          </p>
        </div>
      </div>

      {/* Progress Bar Container */}
      <div className="absolute bottom-16 w-64 h-1.5 bg-black/20 rounded-full overflow-hidden">
        <div className="h-full bg-white rounded-full animate-progress-bar"></div>
      </div>
      
      <style>{`
        @keyframes typewriter {
          from { width: 0; }
          to { width: 100%; border-color: transparent; }
        }
        .animate-typewriter {
           width: fit-content;
           animation: typewriter 1s steps(15, end) forwards;
        }
        @keyframes progress-bar {
          0% { transform: scaleX(0); }
          100% { transform: scaleX(1); }
        }
        .animate-progress-bar {
           transform-origin: right;
           width: 100%;
           animation: progress-bar 2s ease-in-out forwards;
        }
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 3s ease-in-out infinite;
        }
        @keyframes fade-in-up {
          0% { opacity: 0; transform: translateY(10px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.5s ease-out forwards;
          opacity: 0; /* starts hidden */
        }
      `}</style>
    </div>
  );
};

export default SplashScreen;

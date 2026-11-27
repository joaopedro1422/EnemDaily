// Animações das capas, compartilhadas pelo componente e pelas prévias.
export const ESTILO_CAPAS = `
  ed-capa { display: block; overflow: hidden; }
  ed-capa svg { width: 100%; height: 100%; display: block; }
  .ed-capa-parada * { animation: none !important; }
  .ce-pisca { animation: ce-pisca 2.6s ease-in-out infinite; }
  @keyframes ce-pisca { 50% { opacity: .2; } }
  .ce-flutua { animation: ce-flutua 3.2s ease-in-out infinite; }
  @keyframes ce-flutua { 50% { transform: translateY(-5px); } }
  .ce-vapor { animation: ce-vapor 2.4s ease-out infinite; }
  @keyframes ce-vapor { from { transform: translateY(6px); opacity: 0; } 30% { opacity: .55; } to { transform: translateY(-10px); opacity: 0; } }
  .ce-ecg { stroke-dasharray: 900; animation: ce-ecg 3.2s linear infinite; }
  @keyframes ce-ecg { from { stroke-dashoffset: 900; } to { stroke-dashoffset: -900; } }
  .ce-pulso { animation: ce-pulso 1.1s ease-in-out infinite; }
  @keyframes ce-pulso { 15% { transform: scale(1.12); } 30% { transform: scale(1); } 45% { transform: scale(1.07); } 60% { transform: scale(1); } }
  .ce-balanca { animation: ce-balanca 5s ease-in-out infinite; }
  @keyframes ce-balanca { 25% { transform: rotate(3deg); } 75% { transform: rotate(-3deg); } }
  .ce-gira { animation: ce-gira 9s linear infinite; }
  .ce-gira-inv { animation: ce-gira 6s linear infinite reverse; }
  .ce-gira-lento { animation: ce-gira 40s linear infinite; }
  @keyframes ce-gira { to { transform: rotate(360deg); } }
  .ce-sobe { animation: ce-sobe 4.5s ease-in-out infinite; }
  @keyframes ce-sobe { 50% { transform: translateY(-8px); } }
  .ce-cursor { animation: ce-cursor 1.05s steps(1) infinite; }
  @keyframes ce-cursor { 50% { opacity: 0; } }
  .ce-chuva { animation: ce-chuva 6s linear infinite; }
  @keyframes ce-chuva { from { transform: translateY(-40px); } to { transform: translateY(30px); } }
  .ce-chama { animation: ce-chama .9s ease-in-out infinite alternate; }
  @keyframes ce-chama { from { transform: scaleY(.86) scaleX(1.04); } to { transform: scaleY(1.08) scaleX(.96); } }
  .ce-brasa { animation: ce-brasa 3s ease-out infinite; }
  @keyframes ce-brasa { from { transform: translateY(0); opacity: 1; } to { transform: translateY(-110px); opacity: 0; } }
  .ce-confete { animation: ce-confete 7s linear infinite; }
  @keyframes ce-confete { from { transform: translateY(-30px); } to { transform: translateY(40px); } }
  .ce-cadente { animation: ce-cadente 6s ease-in infinite; }
  @keyframes ce-cadente { 0%, 70% { transform: translate(0, 0); opacity: 0; } 72% { opacity: 1; } 85%, 100% { transform: translate(140px, 50px); opacity: 0; } }
  .ce-fogo { animation: ce-chama .25s ease-in-out infinite alternate; }
  .ce-bandeira { transform-box: fill-box; transform-origin: left center; animation: ce-bandeira 1.6s ease-in-out infinite; }
  @keyframes ce-bandeira { 50% { transform: skewY(6deg) scaleX(.9); } }
  .ce-xp { animation: ce-xp 3.5s ease-in-out infinite; transform-box: fill-box; transform-origin: left center; }
  @keyframes ce-xp { from { transform: scaleX(.25); } 70%, to { transform: scaleX(1); } }
  .ce-deriva { animation: ce-deriva 11s ease-in-out infinite alternate; }
  @keyframes ce-deriva { to { transform: translate(-26px, 10px); } }
  .ce-onda { animation: ce-onda 4s linear infinite; }
  @keyframes ce-onda { to { transform: translateX(-80px); } }
  .ce-agua { animation: ce-agua 2.4s ease-in-out infinite; }
  @keyframes ce-agua { 50% { opacity: .25; transform: translateX(4px); } }
  .ce-aurora { animation: ce-aurora 7s ease-in-out infinite alternate; }
  @keyframes ce-aurora { from { transform: skewX(-6deg) scaleY(.92); opacity: .75; } to { transform: skewX(6deg) scaleY(1.08); opacity: 1; } }
  .ce-ponteiro { animation: ce-gira 12s linear infinite; transform-origin: 0 0; }
  .ce-asa { animation: ce-asa 2.6s ease-in-out infinite; }
  @keyframes ce-asa { 50% { transform: rotate(0deg) scaleY(.86); } }
  .ce-barra { animation: ce-barra 1.6s ease-in-out infinite; transform-box: fill-box; transform-origin: bottom; }
  @keyframes ce-barra { 0%, 100% { transform: scaleY(1); } 40% { transform: scaleY(.55); } }
  @media (prefers-reduced-motion: reduce) { ed-capa * { animation: none !important; } }
`;

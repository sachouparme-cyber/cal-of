(() => {
  const cinematic = document.getElementById('cinematic');
  const blastLayer = document.getElementById('blast-layer');

  function explosion() {
    const blast = document.createElement('div');
    blast.className = 'blast';
    blast.style.left = `${15 + Math.random() * 70}%`;
    blast.style.top = `${20 + Math.random() * 60}%`;
    blastLayer.appendChild(blast);
    setTimeout(() => blast.remove(), 1100);
  }

  function playOpening() {
    cinematic.classList.add('active');
    [120, 420, 760, 1100, 1500].forEach((delay) => setTimeout(explosion, delay));
    setTimeout(() => cinematic.classList.remove('active'), 2500);
  }

  document.addEventListener('game:start-cinematic', playOpening);
})();

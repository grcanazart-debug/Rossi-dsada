window.rossi.onOverlayData((data) => {
  const container = document.getElementById('overlay-container');
  
  // Atualiza escala
  if (data.config.scale) {
    document.body.style.zoom = data.config.scale;
  }

  // Atualiza layout (simples vs complexo)
  if (data.config.mode === 'simple') {
    container.classList.add('simple');
  } else {
    container.classList.remove('simple');
  }

  // Atualiza visibilidade das seções
  document.getElementById('fps-section').style.display = data.config.showFPS ? 'block' : 'none';
  document.getElementById('cpu-section').style.display = data.config.showCPU ? 'block' : 'none';
  document.getElementById('gpu-section').style.display = data.config.showGPU ? 'block' : 'none';
  document.getElementById('ram-section').style.display = data.config.showRAM ? 'block' : 'none';

  // Atualiza dados de FPS (Simulado se não tiver ferramenta nativa externa injetada)
  if (data.config.showFPS && data.stats.fps) {
    document.getElementById('fps-val').textContent = data.stats.fps.current;
    document.getElementById('fps-avg').textContent = data.stats.fps.avg;
    document.getElementById('fps-1low').textContent = data.stats.fps.low1;
    document.getElementById('fps-01low').textContent = data.stats.fps.low01;
    document.getElementById('fps-001low').textContent = data.stats.fps.low001;
  }

  // Atualiza dados de CPU
  if (data.config.showCPU && data.stats.cpu) {
    document.getElementById('cpu-val').textContent = data.stats.cpu.usage + '%';
    document.getElementById('cpu-clock').textContent = data.stats.cpu.clock + ' MHz';
  }

  // Atualiza dados de GPU
  if (data.config.showGPU && data.stats.gpu) {
    document.getElementById('gpu-val').textContent = data.stats.gpu.usage + '%';
    document.getElementById('gpu-vram').textContent = data.stats.gpu.vram + ' GB';
  }

  // Atualiza dados de RAM
  if (data.config.showRAM && data.stats.ram) {
    document.getElementById('ram-val').textContent = data.stats.ram.usage + '%';
    document.getElementById('ram-used').textContent = data.stats.ram.usedGB + ' GB';
  }
});

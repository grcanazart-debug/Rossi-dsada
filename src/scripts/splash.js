const lords = [];
const maxLords = 20;
const lordSize = 150;
const durationMs = 10000;
let startTime = null;
const spawnIntervalMs = durationMs / maxLords;
let lastSpawn = 0;

function spawnLord() {
  if (lords.length >= maxLords) return;
  const img = document.createElement('img');
  img.src = 'assets/lord_rossi.png';
  img.className = 'lord';
  
  // Random position within screen bounds
  const x = Math.random() * (window.innerWidth - lordSize);
  const y = Math.random() * (window.innerHeight - lordSize);
  
  // Random speed
  const vx = (Math.random() > 0.5 ? 1 : -1) * (4 + Math.random() * 8);
  const vy = (Math.random() > 0.5 ? 1 : -1) * (4 + Math.random() * 8);
  
  document.body.appendChild(img);
  lords.push({ el: img, x, y, vx, vy });
}

function update(time) {
  if (!startTime) startTime = time;
  const elapsed = time - startTime;
  
  // Update progress bar
  const progressPct = Math.min((elapsed / durationMs) * 100, 100);
  const pb = document.getElementById('progress');
  if (pb) pb.style.width = progressPct + '%';
  
  // Spawn logic
  if (elapsed - lastSpawn > spawnIntervalMs && lords.length < maxLords) {
    spawnLord();
    lastSpawn = elapsed;
  }
  
  // Initially spawn one immediately if none
  if (lords.length === 0) {
    spawnLord();
  }
  
  // Physics logic
  lords.forEach(lord => {
    lord.x += lord.vx;
    lord.y += lord.vy;
    
    if (lord.x <= 0) { lord.x = 0; lord.vx *= -1; }
    if (lord.x >= window.innerWidth - lordSize) { lord.x = window.innerWidth - lordSize; lord.vx *= -1; }
    
    if (lord.y <= 0) { lord.y = 0; lord.vy *= -1; }
    if (lord.y >= window.innerHeight - lordSize) { lord.y = window.innerHeight - lordSize; lord.vy *= -1; }
    
    lord.el.style.left = lord.x + 'px';
    lord.el.style.top = lord.y + 'px';
  });
  
  if (progressPct < 100) {
    requestAnimationFrame(update);
  } else if (!window.giantTriggered) {
    window.giantTriggered = true;
    document.getElementById('splash-text').style.display = 'none';
    lords.forEach(l => l.el.style.display = 'none');
    
    const giant = document.getElementById('giant-face');
    if (giant) giant.classList.add('animate-giant');
  }
}

requestAnimationFrame(update);

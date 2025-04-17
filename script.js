class BlueHeartAnimation {
    constructor() {
      // Configuration
      this.config = {
        colors: {
          primary: '#00a8ff',    // Bright blue
          secondary: '#0097e6',  // Medium blue
          tertiary: '#0077b6',   // Deep blue
          background: 'rgba(5, 10, 20, 0.8)'  // Dark blue-black
        },
        desktop: {
          particleCount: 120,
          traceLength: 50,
          detail: 0.1
        },
        mobile: {
          particleCount: 60,
          traceLength: 20,
          detail: 0.3
        }
      };
  
      // Initialize
      this.initRAF();
      this.detectDevice();
      this.setupCanvas();
      this.createHeartShape();
      this.createParticles();
      this.startAnimation();
    }
  
    initRAF() {
      window.requestAnimationFrame = 
        window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame || 
        window.mozRequestAnimationFrame ||
        ((callback) => setTimeout(callback, 1000/60));
    }
  
    detectDevice() {
      this.isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
      this.settings = this.isMobile ? this.config.mobile : this.config.desktop;
      this.lowPowerMode = this.isMobile && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
  
    setupCanvas() {
      this.canvas = document.getElementById('heart');
      this.ctx = this.canvas.getContext('2d');
      this.resizeCanvas();
      window.addEventListener('resize', () => this.resizeCanvas());
    }
  
    resizeCanvas() {
      const scale = this.isMobile ? window.devicePixelRatio || 1 : 1;
      this.canvas.width = window.innerWidth * scale;
      this.canvas.height = window.innerHeight * scale;
      this.canvas.style.width = '100%';
      this.canvas.style.height = '100%';
      this.ctx.scale(scale, scale);
    }
  
    heartPosition(rad) {
      return [
        Math.pow(Math.sin(rad), 3),
        -(15 * Math.cos(rad) - 5 * Math.cos(2*rad) - 2 * Math.cos(3*rad) - Math.cos(4*rad))
      ];
    }
  
    createHeartShape() {
      this.pointsOrigin = [];
      for (let i = 0; i < Math.PI*2; i += this.settings.detail) {
        const scale = this.isMobile ? 0.7 : 1;
        this.pointsOrigin.push([
          200 * scale * Math.pow(Math.sin(i), 3),
          -scale * (13 * Math.cos(i) - 5 * Math.cos(2*i) - 2 * Math.cos(3*i) - Math.cos(4*i))
        ]);
      }
    }
  
    createParticles() {
      this.particles = [];
      for (let i = 0; i < this.settings.particleCount; i++) {
        const x = Math.random() * this.canvas.width;
        const y = Math.random() * this.canvas.height;
        
        this.particles.push({
          x, y,
          vx: 0, vy: 0,
          size: 2 + Math.random() * 2,
          speed: 1 + Math.random() * 3,
          targetIndex: Math.floor(Math.random() * this.pointsOrigin.length),
          trace: Array(this.settings.traceLength).fill().map(() => ({x, y})),
          color: this.getParticleColor(x, y)
        });
      }
    }
  
    getParticleColor(x, y) {
      if (this.lowPowerMode) {
        return `hsla(200, 100%, 60%, ${0.4 + Math.random() * 0.3})`;
      }
      
      const gradient = this.ctx.createRadialGradient(x, y, 0, x, y, 50);
      gradient.addColorStop(0, this.config.colors.primary);
      gradient.addColorStop(0.7, this.config.colors.secondary);
      gradient.addColorStop(1, this.config.colors.tertiary);
      return gradient;
    }
  
    updateParticle(particle) {
      const target = this.pointsOrigin[particle.targetIndex];
      const targetX = target[0] + this.canvas.width/2;
      const targetY = target[1] + this.canvas.height/2;
      
      const dx = targetX - particle.x;
      const dy = targetY - particle.y;
      const distance = Math.sqrt(dx*dx + dy*dy);
      
      if (distance < 10) {
        if (Math.random() > 0.95) {
          particle.targetIndex = Math.floor(Math.random() * this.pointsOrigin.length);
        }
      }
      
      particle.vx += dx/distance * particle.speed * 0.1;
      particle.vy += dy/distance * particle.speed * 0.1;
      
      particle.x += particle.vx;
      particle.y += particle.vy;
      
      particle.vx *= 0.85;
      particle.vy *= 0.85;
      
      // Update trace
      particle.trace.pop();
      particle.trace.unshift({x: particle.x, y: particle.y});
    }
  
    drawParticle(particle) {
      if (this.lowPowerMode) {
        this.ctx.beginPath();
        this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI*2);
        this.ctx.fillStyle = particle.color;
        this.ctx.fill();
        return;
      }
      
      for (let i = 0; i < particle.trace.length; i++) {
        const alpha = i/particle.trace.length;
        this.ctx.beginPath();
        this.ctx.arc(
          particle.trace[i].x,
          particle.trace[i].y,
          particle.size * (1 - alpha*0.7),
          0,
          Math.PI*2
        );
        this.ctx.fillStyle = this.adjustAlpha(particle.color, alpha*0.7);
        this.ctx.fill();
      }
    }
  
    adjustAlpha(color, alpha) {
      if (typeof color === 'string') {
        return color.replace(/[\d\.]+\)$/, alpha + ')');
      }
      return color;
    }
  
    startAnimation() {
      this.time = 0;
      this.lastTime = performance.now();
      this.animate();
    }
  
    animate() {
      const now = performance.now();
      const deltaTime = Math.min(now - this.lastTime, 1000/30);
      this.lastTime = now;
      
      // Clear with fade effect
      this.ctx.fillStyle = this.config.background;
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      
      // Update heart pulse
      this.time += deltaTime * 0.001;
      const pulse = 0.5 * (1 - Math.cos(this.time * 1.5));
      
      // Update and draw particles
      for (const particle of this.particles) {
        this.updateParticle(particle);
        this.drawParticle(particle);
      }
      
      requestAnimationFrame(() => this.animate());
    }
  }
  
  // Start when page loads
  document.addEventListener('DOMContentLoaded', () => {
    new BlueHeartAnimation();
  });
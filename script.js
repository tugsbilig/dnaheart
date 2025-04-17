class HeartAnimation {
    constructor() {
      this.initRAF();
      this.isMobile = this.checkIfMobile();
      this.loaded = false;
      this.canvas = document.getElementById('heart');
      this.ctx = this.canvas.getContext('2d');
      this.particles = [];
      this.targetPoints = [];
      this.pointsOrigin = [];
      this.config = {
        traceK: 0.4,
        timeDelta: 0.01,
        colors: {
          primary: '#ff3366',
          secondary: '#ff6699',
          tertiary: '#ff99cc',
          background: 'rgba(10, 5, 15, 0.8)'
        }
      };
      
      this.init();
    }
  
    initRAF() {
      window.requestAnimationFrame = 
        window.__requestAnimationFrame ||
        window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.oRequestAnimationFrame ||
        window.msRequestAnimationFrame ||
        ((callback) => window.setTimeout(callback, 1000/60));
    }
  
    checkIfMobile() {
      return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
        (navigator.userAgent || navigator.vendor || window.opera).toLowerCase()
      );
    }
  
    heartPosition(rad) {
      return [
        Math.pow(Math.sin(rad), 3), 
        -(15 * Math.cos(rad) - 5 * Math.cos(2 * rad) - 2 * Math.cos(3 * rad) - Math.cos(4 * rad))
      ];
    }
  
    scaleAndTranslate(pos, sx, sy, dx, dy) {
      return [dx + pos[0] * sx, dy + pos[1] * sy];
    }
  
    resizeCanvas() {
      const koef = this.isMobile ? 0.5 : 1;
      this.canvas.width = koef * window.innerWidth;
      this.canvas.height = koef * window.innerHeight;
      this.ctx.fillStyle = this.config.colors.background;
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
  
    generateGradient(x, y, radius) {
      const gradient = this.ctx.createRadialGradient(x, y, 0, x, y, radius);
      gradient.addColorStop(0, this.config.colors.primary);
      gradient.addColorStop(0.5, this.config.colors.secondary);
      gradient.addColorStop(1, this.config.colors.tertiary);
      return gradient;
    }
  
    init() {
      if (this.loaded) return;
      this.loaded = true;
  
      this.resizeCanvas();
      window.addEventListener('resize', () => this.resizeCanvas());
  
      // Create heart shape points
      const dr = this.isMobile ? 0.3 : 0.1;
      for (let i = 0; i < Math.PI * 2; i += dr) {
        this.pointsOrigin.push(this.scaleAndTranslate(this.heartPosition(i), 210, 13, 0, 0));
      }
      for (let i = 0; i < Math.PI * 2; i += dr) {
        this.pointsOrigin.push(this.scaleAndTranslate(this.heartPosition(i), 150, 9, 0, 0));
      }
      for (let i = 0; i < Math.PI * 2; i += dr) {
        this.pointsOrigin.push(this.scaleAndTranslate(this.heartPosition(i), 90, 5, 0, 0));
      }
  
      // Create particles
      const traceCount = this.isMobile ? 20 : 50;
      for (let i = 0; i < this.pointsOrigin.length; i++) {
        const x = Math.random() * this.canvas.width;
        const y = Math.random() * this.canvas.height;
        
        this.particles.push({
          vx: 0,
          vy: 0,
          radius: 2 + Math.random() * 2,
          speed: Math.random() * 2 + 3,
          q: ~~(Math.random() * this.pointsOrigin.length),
          direction: 2 * (i % 2) - 1,
          force: 0.2 * Math.random() + 0.7,
          color: this.generateGradient(x, y, 50),
          trace: Array(traceCount).fill().map(() => ({x, y}))
        });
      }
  
      this.time = 0;
      this.loop();
    }
  
    pulse(kx, ky) {
      for (let i = 0; i < this.pointsOrigin.length; i++) {
        this.targetPoints[i] = [
          kx * this.pointsOrigin[i][0] + this.canvas.width / 2,
          ky * this.pointsOrigin[i][1] + this.canvas.height / 2
        ];
      }
    }
  
    loop() {
      const n = -Math.cos(this.time);
      this.pulse((1 + n) * 0.5, (1 + n) * 0.5);
      this.time += ((Math.sin(this.time) < 0 ? 9 : (n > 0.8) ? 0.2 : 1) * this.config.timeDelta);
      
      // Clear with fade effect
      this.ctx.fillStyle = this.config.colors.background;
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  
      // Update and draw particles
      for (const particle of this.particles) {
        const target = this.targetPoints[particle.q];
        const dx = particle.trace[0].x - target[0];
        const dy = particle.trace[0].y - target[1];
        const distance = Math.sqrt(dx * dx + dy * dy);
  
        if (distance < 10) {
          if (Math.random() > 0.95) {
            particle.q = ~~(Math.random() * this.pointsOrigin.length);
          } else {
            if (Math.random() > 0.99) {
              particle.direction *= -1;
            }
            particle.q = (particle.q + particle.direction) % this.pointsOrigin.length;
            if (particle.q < 0) particle.q += this.pointsOrigin.length;
          }
        }
  
        particle.vx += (-dx / distance) * particle.speed;
        particle.vy += (-dy / distance) * particle.speed;
        particle.trace[0].x += particle.vx;
        particle.trace[0].y += particle.vy;
        particle.vx *= particle.force;
        particle.vy *= particle.force;
  
        // Update trace positions
        for (let k = 1; k < particle.trace.length; k++) {
          particle.trace[k].x -= this.config.traceK * (particle.trace[k].x - particle.trace[k-1].x);
          particle.trace[k].y -= this.config.traceK * (particle.trace[k].y - particle.trace[k-1].y);
        }
  
        // Draw particle trace
        for (let k = 0; k < particle.trace.length; k++) {
          const alpha = k / particle.trace.length;
          this.ctx.globalAlpha = alpha * 0.7;
          this.ctx.fillStyle = particle.color;
          
          // Draw circles instead of rectangles for smoother look
          this.ctx.beginPath();
          this.ctx.arc(
            particle.trace[k].x, 
            particle.trace[k].y, 
            particle.radius * (1 - alpha * 0.7), 
            0, 
            Math.PI * 2
          );
          this.ctx.fill();
        }
        this.ctx.globalAlpha = 1;
      }
  
      window.requestAnimationFrame(() => this.loop());
    }
  }
  
  // Initialize when DOM is ready
  document.addEventListener('DOMContentLoaded', () => {
    new HeartAnimation();
  });
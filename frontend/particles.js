/**
 * 粒子背景效果
 * 使用Canvas 2D API实现优雅的粒子动画
 */

class ParticleSystem {
    constructor() {
        this.canvas = document.getElementById('particleCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.mouse = { x: 0, y: 0 };
        this.animationId = null;
        
        // 配置参数
        this.config = {
            particleCount: 50,
            particleSize: 2,
            connectionDistance: 120,
            mouseInfluence: 100,
            speed: 0.5,
            colors: {
                particle: 'rgba(0, 122, 255, 0.6)',
                connection: 'rgba(0, 122, 255, 0.2)',
                mouseConnection: 'rgba(0, 122, 255, 0.4)'
            }
        };
        
        this.init();
    }
    
    init() {
        this.setupCanvas();
        this.createParticles();
        this.bindEvents();
        this.animate();
    }
    
    setupCanvas() {
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
    }
    
    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }
    
    createParticles() {
        this.particles = [];
        for (let i = 0; i < this.config.particleCount; i++) {
            this.particles.push(new Particle(this.canvas.width, this.canvas.height, this.config));
        }
    }
    
    bindEvents() {
        // 鼠标移动事件
        document.addEventListener('mousemove', (e) => {
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
        });
        
        // 页面可见性变化
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.pause();
            } else {
                this.resume();
            }
        });
    }
    
    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // 更新粒子
        this.particles.forEach(particle => {
            particle.update(this.mouse, this.config.mouseInfluence);
            particle.draw(this.ctx, this.config.colors.particle);
        });

        // 绘制连接线
        this.drawConnections();

        // 更新和绘制临时粒子
        this.updateTempParticles();

        this.animationId = requestAnimationFrame(() => this.animate());
    }

    updateTempParticles() {
        if (!this.tempParticles || this.tempParticles.length === 0) return;

        // 更新临时粒子
        for (let i = this.tempParticles.length - 1; i >= 0; i--) {
            const particle = this.tempParticles[i];

            // 更新位置
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.life -= particle.decay;
            particle.vx *= 0.98;
            particle.vy *= 0.98;

            // 绘制粒子
            const alpha = particle.life;
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);

            // 使用粒子自定义颜色或默认颜色
            if (particle.color) {
                this.ctx.fillStyle = particle.color.replace(/[\d.]+\)$/g, `${alpha * 0.7})`);
            } else {
                this.ctx.fillStyle = `rgba(0, 122, 255, ${alpha * 0.6})`;
            }

            this.ctx.fill();

            // 移除生命周期结束的粒子
            if (particle.life <= 0) {
                this.tempParticles.splice(i, 1);
            }
        }
    }
    
    drawConnections() {
        for (let i = 0; i < this.particles.length; i++) {
            for (let j = i + 1; j < this.particles.length; j++) {
                const distance = this.getDistance(this.particles[i], this.particles[j]);
                
                if (distance < this.config.connectionDistance) {
                    const opacity = 1 - (distance / this.config.connectionDistance);
                    this.drawLine(
                        this.particles[i], 
                        this.particles[j], 
                        `rgba(0, 122, 255, ${opacity * 0.2})`
                    );
                }
            }
            
            // 鼠标连接
            const mouseDistance = this.getDistance(this.particles[i], this.mouse);
            if (mouseDistance < this.config.mouseInfluence) {
                const opacity = 1 - (mouseDistance / this.config.mouseInfluence);
                this.drawLine(
                    this.particles[i], 
                    this.mouse, 
                    `rgba(0, 122, 255, ${opacity * 0.4})`
                );
            }
        }
    }
    
    drawLine(point1, point2, color) {
        this.ctx.beginPath();
        this.ctx.moveTo(point1.x, point1.y);
        this.ctx.lineTo(point2.x, point2.y);
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 1;
        this.ctx.stroke();
    }
    
    getDistance(point1, point2) {
        const dx = point1.x - point2.x;
        const dy = point1.y - point2.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    pause() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }
    
    resume() {
        if (!this.animationId) {
            this.animate();
        }
    }
    
    destroy() {
        this.pause();
        window.removeEventListener('resize', this.resizeCanvas);
        document.removeEventListener('mousemove', this.mouseMoveHandler);
        document.removeEventListener('visibilitychange', this.visibilityChangeHandler);
    }
}

class Particle {
    constructor(canvasWidth, canvasHeight, config) {
        this.x = Math.random() * canvasWidth;
        this.y = Math.random() * canvasHeight;
        this.vx = (Math.random() - 0.5) * config.speed;
        this.vy = (Math.random() - 0.5) * config.speed;
        this.size = config.particleSize;
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        this.originalVx = this.vx;
        this.originalVy = this.vy;
    }
    
    update(mouse, mouseInfluence) {
        // 鼠标影响
        const dx = mouse.x - this.x;
        const dy = mouse.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < mouseInfluence) {
            const force = (mouseInfluence - distance) / mouseInfluence;
            const angle = Math.atan2(dy, dx);
            this.vx += Math.cos(angle) * force * 0.01;
            this.vy += Math.sin(angle) * force * 0.01;
        } else {
            // 恢复原始速度
            this.vx += (this.originalVx - this.vx) * 0.01;
            this.vy += (this.originalVy - this.vy) * 0.01;
        }
        
        // 更新位置
        this.x += this.vx;
        this.y += this.vy;
        
        // 边界检测
        if (this.x < 0 || this.x > this.canvasWidth) {
            this.vx *= -1;
            this.originalVx *= -1;
        }
        if (this.y < 0 || this.y > this.canvasHeight) {
            this.vy *= -1;
            this.originalVy *= -1;
        }
        
        // 确保粒子在画布内
        this.x = Math.max(0, Math.min(this.canvasWidth, this.x));
        this.y = Math.max(0, Math.min(this.canvasHeight, this.y));
    }
    
    draw(ctx, color) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
    }
}

// 初始化粒子系统
function initParticleSystem() {
    try {
        // 检查Canvas支持
        const canvas = document.getElementById('particleCanvas');
        if (!canvas) {
            return;
        }

        const ctx = canvas.getContext('2d');
        if (!ctx) {
            return;
        }

        // 检查设备性能，移动设备使用较少粒子
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

        if (isMobile) {
            // 移动设备减少粒子数量以提高性能
            window.particleSystem = new ParticleSystem();
            window.particleSystem.config.particleCount = 25;
            window.particleSystem.config.connectionDistance = 80;
            window.particleSystem.createParticles();
        } else {
            window.particleSystem = new ParticleSystem();
        }
    } catch (error) {
        // 静默处理粒子系统初始化失败
    }
}

// 多种方式确保粒子系统能够初始化
document.addEventListener('DOMContentLoaded', initParticleSystem);

// 如果DOMContentLoaded已经触发，立即初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initParticleSystem);
} else {
    // DOM已经加载完成
    initParticleSystem();
}

// 页面卸载时清理
window.addEventListener('beforeunload', () => {
    if (window.particleSystem) {
        window.particleSystem.destroy();
    }
});

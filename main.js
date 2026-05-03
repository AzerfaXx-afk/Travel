import './style.css';

document.addEventListener('DOMContentLoaded', () => {
    // 1. Loading Screen Logic
    const loader = document.getElementById('app-loader');
    
    // Simulate loading time (e.g. fetching user data)
    setTimeout(() => {
        loader.classList.add('hidden');
    }, 1500); // 1.5 seconds loading screen

    // 2. Pull to Refresh Logic (Snapchat style)
    const appContent = document.getElementById('app-content');
    const ptrIcon = document.querySelector('.ptr-icon');
    
    let startY = 0;
    let currentY = 0;
    let isPulling = false;
    let isRefreshing = false;
    const triggerThreshold = 100; // pixels to pull before triggering refresh

    appContent.addEventListener('touchstart', (e) => {
        if (appContent.scrollTop === 0 && !isRefreshing) {
            startY = e.touches[0].clientY;
            isPulling = true;
            appContent.style.transition = 'none';
        }
    }, { passive: true });

    appContent.addEventListener('touchmove', (e) => {
        if (!isPulling || isRefreshing) return;
        
        currentY = e.touches[0].clientY;
        const pullDistance = currentY - startY;
        
        // Only pull down when at the top
        if (pullDistance > 0 && appContent.scrollTop === 0) {
            // Add resistance
            const resistance = 0.4;
            const transformY = Math.min(pullDistance * resistance, triggerThreshold + 20);
            
            appContent.style.transform = `translateY(${transformY}px)`;
            
            // Show and fade in the plane icon
            ptrIcon.style.opacity = Math.min(transformY / triggerThreshold, 1);
            
            // Prevent default scroll behavior when pulling
            if (e.cancelable) e.preventDefault();
        }
    }, { passive: false });

    appContent.addEventListener('touchend', () => {
        if (!isPulling || isRefreshing) return;
        isPulling = false;
        
        const pullDistance = currentY - startY;
        const transformY = Math.min(pullDistance * 0.4, triggerThreshold + 20);
        
        if (transformY >= triggerThreshold) {
            // Trigger refresh!
            isRefreshing = true;
            
            // Hold content slightly down
            appContent.style.transition = 'transform 0.3s ease-out';
            appContent.style.transform = `translateY(60px)`;
            
            // Animate airplane takeoff
            ptrIcon.classList.add('refreshing');
            
            // Simulate data fetch
            setTimeout(() => {
                // Reset everything
                appContent.style.transform = `translateY(0)`;
                setTimeout(() => {
                    ptrIcon.classList.remove('refreshing');
                    ptrIcon.style.opacity = '0';
                    isRefreshing = false;
                }, 300); // wait for content to slide back up
            }, 1200); // refresh duration
            
        } else {
            // Cancel refresh, snap back
            appContent.style.transition = 'transform 0.3s ease-out';
            appContent.style.transform = `translateY(0)`;
            ptrIcon.style.opacity = '0';
        }
        
        startY = 0;
        currentY = 0;
    });

    // 3. Navigation interaction (simple visual toggle)
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            // Don't toggle active state for FAB
            if (item.classList.contains('fab-wrapper')) return;
            
            navItems.forEach(n => n.classList.remove('active'));
            item.classList.add('active');
        });
    });
});

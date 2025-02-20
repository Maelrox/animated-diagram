
function addFlowAnimation(connection) {
    const particle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    particle.classList.add('flow-particle');
    particle.setAttribute('r', '4');

    const animateMotion = document.createElementNS('http://www.w3.org/2000/svg', 'animateMotion');
    animateMotion.setAttribute('dur', '2s');

    const path = connection.querySelector('path');
    animateMotion.setAttribute('path', path.getAttribute('d'));

    particle.appendChild(animateMotion);
    connection.appendChild(particle);
}

function stopAnimations() {
    connections.forEach(conn => {
        const particle = conn.element.querySelector('.flow-particle');
        if (particle) {
            const oldParticle = particle;
            const newParticle = oldParticle.cloneNode(true);
            oldParticle.parentNode.replaceChild(newParticle, oldParticle);
        }
    });
}

function loopAnimations() {
    const connectionsByOrder = new Map();
    connections.forEach(conn => {
        const order = conn.order;
        if (!connectionsByOrder.has(order)) {
            connectionsByOrder.set(order, []);
        }
        connectionsByOrder.get(order).push(conn);
    });

    const uniqueOrders = [...connectionsByOrder.keys()].sort((a, b) => a - b);
    let orderIndex = 0;

    function animateOrder() {
        if (orderIndex >= uniqueOrders.length) {
            setTimeout(() => {
                orderIndex = 0;
                loopAnimations();
            }, 1000);
            return;
        }

        const currentOrder = uniqueOrders[orderIndex];
        const currentConnections = connectionsByOrder.get(currentOrder);
        
        currentConnections.forEach(conn => {
            const animateMotion = conn.element.querySelector('animateMotion');
            if (animateMotion) {
                animateMotion.setAttribute('repeatCount', '1');
                animateMotion.setAttribute('begin', '0s');
                animateMotion.beginElement();
            }
        });

        orderIndex++;
        setTimeout(animateOrder, 1000);
    }

    animateOrder();
}

function updateAnimationDirection(connection) {
    const particle = connection.querySelector('.flow-particle');
    const animateMotion = particle.querySelector('animateMotion');
    const keyPoints = animateMotion.getAttribute('keyPoints');
    const keyTimes = animateMotion.getAttribute('keyTimes');

    if (keyPoints && keyTimes) {
        animateMotion.removeAttribute('keyPoints');
        animateMotion.removeAttribute('keyTimes');
    } else {
        animateMotion.setAttribute('keyPoints', '1;0');
        animateMotion.setAttribute('keyTimes', '0;1');
    }
    
    // Restart animation
    const newParticle = particle.cloneNode(true);
    particle.parentNode.replaceChild(newParticle, particle);
}

loopAnimations();
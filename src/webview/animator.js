// Create an animated particle (svg circle) that follows the connection path
function addFlowAnimation(connection) {
    const particle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    const path = connection.querySelector('path');
    const animateMotion = document.createElementNS('http://www.w3.org/2000/svg', 'animateMotion');
    animateMotion.setAttribute('dur', '2s');
    animateMotion.setAttribute('path', path.getAttribute('d'));
    particle.classList.add('flow-particle');
    particle.setAttribute('r', '4');
    particle.appendChild(animateMotion);
    connection.appendChild(particle);
}

function loopAnimations() {
    const connectionsByOrder = groupConnectionsByOrder(connections);
    const uniqueOrders = [...connectionsByOrder.keys()].sort((a, b) => a - b);
    animateOrders(uniqueOrders, connectionsByOrder, 0);
}

function animateOrders(uniqueOrders, connectionsByOrder, orderIndex) {
    if (orderIndex >= uniqueOrders.length) {
        requestAnimationFrame(loopAnimations);
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

    setTimeout(() => animateOrders(uniqueOrders, connectionsByOrder, orderIndex + 1), 2000);
}

function groupConnectionsByOrder(connections) {
    const connectionsByOrder = new Map();
    connections.forEach(conn => {
        if (!connectionsByOrder.has(conn.order)) {
            connectionsByOrder.set(conn.order, []);
        }
        connectionsByOrder.get(conn.order).push(conn);
    });
    return connectionsByOrder;
}

// Reverse the direction of the particle
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
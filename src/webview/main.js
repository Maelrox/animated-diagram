const svg = document.getElementById('canvas');
let selectedShape = null;
let offset = { x: 0, y: 0 };
let isConnectionMode = false;
let connectionStart = null;
let connections = [];
let isResizing = false;
let resizeHandle = null;
let currentOrder = 1;

const bgColorPicker = document.getElementById('bg-color-picker');
const textColorPicker = document.getElementById('text-color-picker');

bgColorPicker.addEventListener('input', () => {
    if (selectedShape) {
        changeShapeColor(selectedShape.parentNode, bgColorPicker.value, textColorPicker.value);
    }
});

textColorPicker.addEventListener('input', () => {
    if (selectedShape) {
        changeShapeColor(selectedShape.parentNode, bgColorPicker.value, textColorPicker.value);
    }
});

function addShape(type) {
    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    const shape = document.createElementNS('http://www.w3.org/2000/svg', type === 'rect' ? 'rect' : 'circle');
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');

    group.classList.add('shape-group');
    shape.classList.add('shape');

    if (type === 'rect') {
        shape.setAttribute('width', '100');
        shape.setAttribute('height', '60');
        shape.setAttribute('x', '100');
        shape.setAttribute('y', '100');
        text.setAttribute('x', '150');
        text.setAttribute('y', '130');
    } else {
        shape.setAttribute('r', '30');
        shape.setAttribute('cx', '100');
        shape.setAttribute('cy', '100');
        text.setAttribute('x', '100');
        text.setAttribute('y', '100');
    }

    shape.setAttribute('fill', '#fff');
    shape.setAttribute('stroke', '#000');
    shape.setAttribute('stroke-width', '2');

    text.textContent = 'Double click to edit';
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('fill', '#000');
    text.classList.add('shape-text');

    group.appendChild(shape);
    group.appendChild(text);

    const resizeHandle = createResizeHandle(group);
    group.appendChild(resizeHandle);

    group.addEventListener('mousedown', startDrag);
    group.addEventListener('click', handleShapeClick);

    svg.appendChild(group);
    svg.addEventListener("dblclick", function(event) {
        if (event.target.tagName === type) {
            editText(text);
        }
    });
    return group;
}

function createResizeHandle(group) {
    const handle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    handle.setAttribute('r', '5');
    handle.setAttribute('fill', '#4CAF50');
    handle.classList.add('resize-handle');
    handle.style.cursor = 'se-resize';

    requestAnimationFrame(() => updateResizeHandlePosition(handle));

    handle.addEventListener('mousedown', startResize);
    return handle;
}

function updateResizeHandlePosition(handle) {
    const rect = handle.parentNode.querySelector('rect');
    const x = parseFloat(rect.getAttribute('x'));
    const y = parseFloat(rect.getAttribute('y'));
    const width = parseFloat(rect.getAttribute('width'));
    const height = parseFloat(rect.getAttribute('height'));
    
    handle.setAttribute('cx', x + width);
    handle.setAttribute('cy', y + height);
}

function startResize(evt) {
    evt.stopPropagation();
    isResizing = true;
    resizeHandle = evt.target;
    
    document.addEventListener('mousemove', resize);
    document.addEventListener('mouseup', endResize);
}

function resize(evt) {
    if (!isResizing) return;
    
    const group = resizeHandle.parentNode;
    const rect = group.querySelector('rect');
    const text = group.querySelector('text');
    
    const x = parseFloat(rect.getAttribute('x'));
    const y = parseFloat(rect.getAttribute('y'));
    const width = Math.max(50, evt.clientX - x);
    const height = Math.max(30, evt.clientY - y);
    
    rect.setAttribute('width', width);
    rect.setAttribute('height', height);
    text.setAttribute('x', x + width/2);
    text.setAttribute('y', y + height/2);
    
    updateResizeHandlePosition(resizeHandle);
    updateConnections();
}

function endResize() {
    isResizing = false;
    document.removeEventListener('mousemove', resize);
    document.removeEventListener('mouseup', endResize);
}

function editText(text) {
    const currentText = text.textContent;
    const input = document.createElement('input');
    input.value = currentText;
    
    // Position input over text
    const svgRect = svg.getBoundingClientRect();
    const textRect = text.getBoundingClientRect();
    input.style.position = 'absolute';
    input.style.left = (textRect.left - svgRect.left) + 'px';
    input.style.top = (textRect.top - svgRect.top) + 'px';
    
    svg.parentNode.appendChild(input);
    input.focus();
    
    input.addEventListener('blur', function() {
        text.textContent = input.value;
        input.remove();
    });
    
    input.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            text.textContent = input.value;
            input.remove();
        }
    });
}

function changeShapeColor(group, backgroundColor, textColor) {
    const shape = group.querySelector('.shape');
    const text = group.querySelector('.shape-text');
    
    if (shape) {
        shape.setAttribute('fill', backgroundColor);
    }
    if (text) {
        text.setAttribute('fill', textColor);
    }
}

function createConnection(start, end) {
    const connection = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    connection.classList.add('connection');

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.classList.add('connection-path');
    path.setAttribute('marker-end', 'url(#arrow)');

    // Add order number
    const orderText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    orderText.textContent = currentOrder++;
    orderText.classList.add('order-text');
    orderText.setAttribute("pointer-events", "auto");

    connection.appendChild(path);
    connection.appendChild(orderText);
    svg.insertBefore(connection, svg.firstChild);

    connection.addEventListener('click', (event) => {
        if (event.target.classList.contains('order-text')) {
            console.log('Order text clicked:', event.target.textContent);
        }
    });
    connections.push({
        element: connection,
        start: start,
        end: end,
        order: parseInt(orderText.textContent)
    });

    updateConnections();
    addFlowAnimation(connection);
}

function updateConnections() {
    connections.forEach(conn => {
        const startPos = getShapeCenter(conn.start);
        const endPos = getShapeCenter(conn.end);
        
        const path = conn.element.querySelector('path');
        const orderText = conn.element.querySelector('.order-text');
        
        path.setAttribute('d', `M ${startPos.x} ${startPos.y} L ${endPos.x} ${endPos.y}`);
        orderText.setAttribute('d', `M ${startPos.x} ${startPos.y} L ${endPos.x} ${endPos.y}`);

        const midX = (startPos.x + endPos.x) / 2;
        const midY = (startPos.y + endPos.y) / 2;
        orderText.setAttribute('x', midX);
        orderText.setAttribute('y', midY - 8);
    });
}

function startDrag(evt) {
    if (isConnectionMode) return;
    
    selectedShape = evt.target;
    const bbox = selectedShape.getBBox();
    
    if (selectedShape.tagName === 'rect') {
        offset.x = evt.clientX - bbox.x;
        offset.y = evt.clientY - bbox.y;
    } else {
        offset.x = evt.clientX - (bbox.x + bbox.width/2);
        offset.y = evt.clientY - (bbox.y + bbox.height/2);
    }
    
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', endDrag);
}

function drag(evt) {
    if (!selectedShape) return;

    const group = selectedShape.parentNode;
    const shape = group.querySelector('.shape');
    const text = group.querySelector('.shape-text');

    if (shape.tagName === 'rect') {
        const x = evt.clientX - offset.x;
        const y = evt.clientY - offset.y;
        shape.setAttribute('x', x);
        shape.setAttribute('y', y);

        text.setAttribute('x', x + parseFloat(shape.getAttribute('width')) / 2);
        text.setAttribute('y', y + parseFloat(shape.getAttribute('height')) / 2 + 5);
    } else {
        const cx = evt.clientX - offset.x;
        const cy = evt.clientY - offset.y;
        shape.setAttribute('cx', cx);
        shape.setAttribute('cy', cy);

        text.setAttribute('x', cx);
        text.setAttribute('y', cy + 5);
    }

    updateConnections();
    const resizeHandle = group.querySelector('.resize-handle');
    if (resizeHandle) {
        updateResizeHandlePosition(resizeHandle);
    }
}

function endDrag() {
    document.removeEventListener('mousemove', drag);
    document.removeEventListener('mouseup', endDrag);
}

function toggleConnectionMode() {
    isConnectionMode = !isConnectionMode;
    connectionStart = null;
    document.querySelector('button:last-child').style.backgroundColor = 
        isConnectionMode ? '#4CAF50' : '';
}

function handleShapeClick(evt) {
    if (!isConnectionMode) return;
    
    if (!connectionStart) {
        connectionStart = evt.target;
        evt.target.setAttribute('stroke', '#4CAF50');
    } else {
        const connectionEnd = evt.target;
        if (connectionStart !== connectionEnd) {
            createConnection(connectionStart, connectionEnd);
        }
        connectionStart.setAttribute('stroke', '#000');
        connectionStart = null;
    }
    selectedShape = evt.target;
}

function getShapeCenter(shape) {
    const bbox = shape.getBBox();
    return { x: bbox.x + bbox.width / 2, y: bbox.y + bbox.height / 2 };
}

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
        const animateMotion = conn.element.querySelector('animateMotion');
        animateMotion.endElement();
    });
}

function loopAnimations() {
    let index = 0;

    function startNextAnimation() {
        if (index >= connections.length) {
            setTimeout(loopAnimations, 1000);
            return;
        }

        const conn = connections[index];
        if (!conn) return;

        const animateMotion = conn.element.querySelector('animateMotion');
        if (animateMotion) {
            animateMotion.setAttribute('repeatCount', '1');
            animateMotion.setAttribute('begin', '0s');
            animateMotion.beginElement();
        }

        index++;
        setTimeout(startNextAnimation, 1000);
    }
    startNextAnimation();
}

loopAnimations();

const style = document.createElement('style');
style.textContent = `
    .shape-text {
        pointer-events: none;
        user-select: none;
    }
    .shape-text.editing {
        pointer-events: all;
    }
    .resize-handle {
        cursor: se-resize;
    }
    .flow-particle {
        fill:rgb(235, 205, 71);
    }
`;
document.head.appendChild(style);
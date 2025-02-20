
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

function getShapeCenter(shape) {
    const bbox = shape.getBBox();
    return { x: bbox.x + bbox.width / 2, y: bbox.y + bbox.height / 2 };
}

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
    shape.addEventListener("dblclick", function(event) {
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
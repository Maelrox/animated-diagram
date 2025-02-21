let isRecording = false;
let frames = [];
let recorderInterval = null;

const gif = new GIF({
    workers: 2,
    quality: 10,
    width: 500,
    height: 400
});

function svgToCanvas(svgElement, callback) {
    const svgData = new XMLSerializer().serializeToString(svgElement);
    const img = new Image();
    img.onload = function () {
        const canvas = document.createElement('canvas');
        canvas.width = svgElement.clientWidth;
        canvas.height = svgElement.clientHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        callback(canvas);
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
}

function captureFrame() {
    if (isRecording) {
        svgToCanvas(svg, (canvas) => {
            frames.push(canvas.toDataURL('image/png')); // Convert SVG to Canvas and capture frame
        });
    }
}

function startRecording() {
    isRecording = true;
    frames = [];
    recorderInterval = setInterval(captureFrame, 100); // Capture every 100ms
}

function stopRecording() {
    isRecording = false;
    clearInterval(recorderInterval);

    frames.forEach(frame => {
        const img = new Image();
        img.src = frame;
        gif.addFrame(img, { delay: 100 });
    });

    gif.on('finished', blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'animation.gif';
        a.click();
        URL.revokeObjectURL(url);
    });

    gif.render();
}
import { logout } from "wasp/client/auth";
import { generateTextToImage, generateImageToImage } from "wasp/client/operations";
import { useCallback, useEffect, useRef, useState } from "react";

type BananaGridOptions = {
    bananaSize?: number; // approximate final banana width in pixels
    gap?: number;        // center-to-center spacing along diamond's left-right axis (full diamond width)
};

const drawBananaGrid = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    options: BananaGridOptions = {}
) => {
    // Extract configurable values with defaults
    const { bananaSize = 25, gap = 86 } = options;

    // Simpler mapping: gap is the diamond width. Maintain classic 2:1 ratio (height = gap / 2).
    const halfW = gap / 2;       // half diamond width
    const halfH = halfW / 2;     // half diamond height (since height = gap/2)

    // Center origin so grid radiates out and appears endless
    const originX = width / 2;
    const originY = height / 4; // shift upward so more tiles appear below

    // Compute how many logical steps we need to cover canvas + margin
    const margin = gap * 2; // draw beyond edges relative to spacing for seamless feel
    const maxDiagStepsX = Math.ceil((width + margin) / halfW);
    const maxDiagStepsY = Math.ceil((height + margin) / halfH);
    // Use larger span to ensure coverage
    const span = Math.max(maxDiagStepsX, maxDiagStepsY);

    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 2;

    const drawBanana = (screenX: number, screenY: number) => {
        // Cull if clearly off-canvas beyond margin (cheap reject)
        if (screenX < -margin || screenX > width + margin || screenY < -margin || screenY > height + margin) return;
        ctx.save();
        ctx.translate(screenX, screenY);
        // Scale banana so its approximate width becomes bananaSize (original path width ~525)
        const scale = bananaSize / 525;
        const tilt = 0.70;
        ctx.rotate(-Math.PI / 2 + tilt);
        ctx.scale(scale, scale);
        ctx.translate(-525 / 2, -300 / 2);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = '#e0e0e0';

        const outline = new Path2D();
        outline.moveTo(10, 170);
        outline.quadraticCurveTo(60, 150, 140, 160);
        outline.quadraticCurveTo(260, 180, 370, 140);
        outline.quadraticCurveTo(440, 115, 495, 55);
        outline.quadraticCurveTo(505, 35, 500, 15);
        outline.quadraticCurveTo(515, 25, 525, 60);
        outline.quadraticCurveTo(470, 190, 360, 250);
        outline.quadraticCurveTo(250, 300, 110, 270);
        outline.quadraticCurveTo(40, 255, 15, 225);
        outline.quadraticCurveTo(5, 210, 10, 195);
        outline.quadraticCurveTo(2, 185, 10, 170);
        ctx.lineWidth = 10;
        ctx.globalAlpha = 1;
        ctx.stroke(outline);
        ctx.lineWidth = 4;
        ctx.stroke(outline);

        const innerTop = new Path2D();
        innerTop.moveTo(55, 185);
        innerTop.quadraticCurveTo(180, 205, 300, 180);
        innerTop.quadraticCurveTo(390, 160, 455, 110);
        ctx.lineWidth = 5;
        ctx.stroke(innerTop);
        ctx.lineWidth = 2;
        ctx.stroke(innerTop);

        const innerLower = new Path2D();
        innerLower.moveTo(70, 215);
        innerLower.quadraticCurveTo(190, 245, 315, 225);
        innerLower.quadraticCurveTo(400, 210, 455, 165);
        ctx.lineWidth = 5;
        ctx.stroke(innerLower);
        ctx.lineWidth = 2;
        ctx.stroke(innerLower);

        ctx.lineWidth = 3;
        const tail = new Path2D();
        tail.moveTo(12, 190);
        tail.lineTo(25, 193);
        tail.lineTo(22, 178);
        tail.closePath();
        ctx.stroke(tail);

        const stem = new Path2D();
        stem.moveTo(500, 15);
        stem.lineTo(515, 25);
        stem.lineTo(525, 60);
        stem.lineTo(510, 55);
        stem.lineTo(500, 15);
        ctx.lineWidth = 3;
        ctx.stroke(stem);
        ctx.restore();
    };

    // Painter's algorithm: iterate in order of increasing (r + c)
    const minIdx = -span;
    const maxIdx = span;
    for (let s = minIdx * 2; s <= maxIdx * 2; s++) {
        for (let r = minIdx; r <= maxIdx; r++) {
            const c = s - r;
            if (c < minIdx || c > maxIdx) continue;
            const screenX = originX + (c - r) * halfW;
            const screenY = originY + (c + r) * halfH;
            drawBanana(screenX, screenY);
        }
    }
};

export const DashboardPage = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [bananaSize, setBananaSize] = useState(26);
    const [gap, setGap] = useState(86);

    // Track images placed onto the canvas
    const [placedImages, setPlacedImages] = useState<Array<{
        img: HTMLImageElement;
        x: number;
        y: number;
        width: number;
        height: number;
        objectUrl: string;
    }>>([]);

    // Keep a ref of object URLs so we can revoke them on unmount without revoking active ones prematurely
    const objectUrlsRef = useRef<string[]>([]);
    useEffect(() => {
        return () => {
            objectUrlsRef.current.forEach(url => URL.revokeObjectURL(url));
        };
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const redraw = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;
            // Background
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            // Banana grid
            drawBananaGrid(ctx, canvas.width, canvas.height, { bananaSize, gap });
            // Placed images
            placedImages.forEach(p => {
                ctx.drawImage(p.img, p.x, p.y, p.width, p.height);
            });
        };

        redraw();
        window.addEventListener('resize', redraw);
        return () => window.removeEventListener('resize', redraw);
    }, [bananaSize, gap, placedImages]);

    const addImageToCanvas = useCallback(async (file: File, customPosition?: { x: number; y: number }) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const objectUrl = URL.createObjectURL(file);
        objectUrlsRef.current.push(objectUrl);

        const img = new Image();
        img.onload = () => {
            // Scale down large images to a max dimension to avoid covering everything
            const MAX_DIM = 512;
            let { width: w, height: h } = img;
            if (w > MAX_DIM || h > MAX_DIM) {
                const scale = Math.min(MAX_DIM / w, MAX_DIM / h);
                w = w * scale;
                h = h * scale;
            }

            // Center image at drop position (or center of canvas if none provided)
            const centerX = customPosition?.x ?? canvas.width / 2;
            const centerY = customPosition?.y ?? canvas.height / 2;
            const x = centerX - w / 2;
            const y = centerY - h / 2;

            setPlacedImages(prev => [...prev, { img, x, y, width: w, height: h, objectUrl }]);
        };
        img.onerror = () => {
            URL.revokeObjectURL(objectUrl);
            // Remove from ref list if it failed
            objectUrlsRef.current = objectUrlsRef.current.filter(u => u !== objectUrl);
            console.warn('Failed to load image');
        };
        img.src = objectUrl;
    }, []);

    const handleDrop = useCallback(async (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const file = e.dataTransfer.files[0];
            if (file.type.startsWith('image/')) {
                const rect = canvasRef.current?.getBoundingClientRect();
                const dropX = e.clientX - (rect?.left ?? 0);
                const dropY = e.clientY - (rect?.top ?? 0);
                addImageToCanvas(file, { x: dropX, y: dropY });
            }
        }
    }, [addImageToCanvas]);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.type.startsWith('image/')) {
                addImageToCanvas(file);
            }
            e.target.value = '';
        }
    };

    // const handleGenerateTextToImage = async (prompt: string) => {
    //     try {
    //         setIsGenerating(true);
    //         setError(null);

    //         const result = await generateTextToImage({
    //             prompt: prompt, options: {
    //                 image_size: "square_hd",
    //                 num_images: 1
    //             }
    //         });

    //         // @ts-ignore
    //         setImageData(result);
    //         console.log('Generated image:', result);
    //     } catch (err) {
    //         console.error('Error generating image:', err);
    //         // @ts-ignore
    //         setError(err.message);
    //     } finally {
    //         setIsGenerating(false);
    //     }
    // };

    // const handleGenerateImageToImage = async (prompt: string) => {
    //     try {
    //         setIsGenerating(true);
    //         setError(null);

    //         const result = await generateImageToImage({
    //             prompt: prompt,
    //             image_urls: ["https://v3.fal.media/files/panda/x26pjHNLYN-VX-pLUzhzK.jpeg"],
    //             options: {
    //                 image_size: "square_hd",
    //                 num_images: 1
    //             }
    //         });

    //         // @ts-ignore
    //         setImageData(result);
    //         console.log('Generated image:', result);
    //     } catch (err) {
    //         console.error('Error generating image:', err);
    //         // @ts-ignore
    //         setError(err.message);
    //     } finally {
    //         setIsGenerating(false);
    //     }
    // };

    return (
        <div
            className="w-screen h-screen bg-white"
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
        >
            <canvas
                ref={canvasRef}
            />
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                className="hidden"
                accept="image/*"
            />
        </div>
    );
};
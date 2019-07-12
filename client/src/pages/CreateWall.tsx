import React, { createRef, useCallback, useEffect, useRef } from 'react';
import { Hold } from '../Hold';
import { Point } from '../Point';
import './CreateWall.css';

export const CreateWall: React.FC = () => {
	let drawing = useRef(false);
	let newPath: Point[] = [];
	const holds: Hold[] = [];

	const canvas1Ref = createRef<HTMLCanvasElement>();
	const canvas2Ref = createRef<HTMLCanvasElement>();

	const canvas1 = (
		<canvas
			id='canvas1'
			ref={canvas1Ref}
			width={window.innerWidth}
			height={window.innerHeight}
		/>
	);

	const canvas2 = (
		<canvas
			id='canvas2'
			ref={canvas2Ref}
			width={window.innerWidth}
			height={window.innerHeight}

			onMouseDown={mouseDown}
		/>
	);

	// const getCanvas1 = () => canvas1Ref!.current!;
	const getCanvas2 = useCallback(() => canvas2Ref!.current!, [canvas2Ref]);
	const getCanvas1Context = useCallback(() => canvas1Ref!.current!.getContext('2d')!, [canvas1Ref]);
	// const getCanvas2Context = () => canvas2Ref!.current!.getContext('2d')!;

	function mouseDown(e: React.MouseEvent<HTMLCanvasElement>) {
		if (!drawing.current) {
			drawing.current = true;
			newPath = [{ x: e.clientX, y: e.clientY }];

			const ctx = getCanvas1Context();
			ctx.strokeStyle = '#F00';
			ctx.fillStyle = '#0F0';
			ctx.lineWidth = 3;
			ctx.beginPath();
			ctx.moveTo(e.clientX, e.clientY);
		}
	}

	useEffect(() => {
		
		function mouseMove(e: MouseEvent) {
			if (drawing.current) {
				const lastPoint = newPath[newPath.length - 1];
				if (lastPoint.x !== e.clientX ||
					lastPoint.y !== e.clientY
				) {
					newPath.push({ x: e.clientX, y: e.clientY });

					const ctx = getCanvas1Context();
					ctx.lineTo(e.clientX, e.clientY);
					ctx.stroke();
				}
			}

			const canvas2 = getCanvas2();
			const ctx = canvas2.getContext('2d')!;
			ctx.clearRect(0, 0, canvas2.width, canvas2.height);

			if (!drawing.current) {
				for (let i = holds.length - 1; i >= 0; --i) {
					const hold = holds[i];
					if (hold.isPointInBounds({ x: e.clientX, y: e.clientY }, ctx)) {
						ctx.fillStyle = '#00F';
						ctx.fill(hold.path2D);
						break;
					}
				}
			}
		}

		function mouseUp() {
			if (drawing.current) {
				holds.push(new Hold(newPath));
				console.log(holds);

				const ctx = getCanvas1Context();
				ctx.lineTo(newPath[0].x, newPath[0].y);
				ctx.stroke();
				ctx.fill();

				drawing.current = false;
			}
		}

		document.addEventListener('mousemove', mouseMove);
		document.addEventListener('mouseup', mouseUp);

		return () => {
			document.removeEventListener('mousemove', mouseMove);
			document.removeEventListener('mouseup', mouseUp);
		}
	}, [getCanvas1Context, getCanvas2, holds, newPath]);

	return <>
		<div id="canvasContainer" style={{ width: `${window.innerWidth}px`, height: `${window.innerHeight}px` }}>
			{canvas1}
			{canvas2}
		</div>
		<div>
			<p>Text!</p>
		</div>
	</>;
}

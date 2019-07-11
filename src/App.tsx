import React, { createRef, useEffect } from 'react';
import './App.css';
import { Hold } from './Hold';
import { Point } from './Point';

let drawing = false;
let newPath: Point[];
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
const getCanvas2 = () => canvas2Ref!.current!;
const getCanvas1Context = () => canvas1Ref!.current!.getContext('2d')!;
// const getCanvas2Context = () => canvas2Ref!.current!.getContext('2d')!;

function mouseDown(e: React.MouseEvent<HTMLCanvasElement>) {
	if (!drawing) {
		drawing = true;
		newPath = [{ x: e.clientX, y: e.clientY }];

		const ctx = getCanvas1Context();
		ctx.strokeStyle = '#F00';
		ctx.fillStyle = '#0F0';
		ctx.lineWidth = 3;
		ctx.beginPath();
		ctx.moveTo(e.clientX, e.clientY);
	}
}

function mouseMove(e: MouseEvent) {
	if (drawing) {
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

	if (!drawing) {
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
	if (drawing) {
		holds.push(new Hold(newPath));
		console.log(holds);

		const ctx = getCanvas1Context();
		ctx.lineTo(newPath[0].x, newPath[0].y);
		ctx.stroke();
		ctx.fill();

		drawing = false;
	}
}

export const App: React.FC = () => {
	useEffect(() => {
		document.addEventListener('mousemove', mouseMove);
		document.addEventListener('mouseup', mouseUp);

		return () => {
			document.removeEventListener('mousemove', mouseMove);
			document.removeEventListener('mouseup', mouseUp);
		}
	}, []);

	return (
		<div className="App">
			{canvas1}
			{canvas2}
		</div>
	);
}

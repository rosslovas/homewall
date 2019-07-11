import React, { useEffect } from 'react';
import logo from './logo.svg';
import './App.css';
import { Hold } from './Hold';
import { Point } from './Point';

let drawing = false;
let newPath: Point[];
const holds: Hold[] = [];

function createMouseMove(
	getContext1: () => CanvasRenderingContext2D,
	getContext2: () => CanvasRenderingContext2D
) {
	return (e: MouseEvent) => {
		if (drawing) {
			const lastPoint = newPath[newPath.length - 1];
			if (lastPoint.x !== e.clientX ||
				lastPoint.y !== e.clientY
			) {
				newPath.push({ x: e.clientX, y: e.clientY });

				const ctx = getContext1();
				ctx.lineTo(e.clientX, e.clientY);
				ctx.stroke();
			}
		}
		else {
			const ctx = getContext2();
			ctx.clearRect(0, 0, window.innerWidth, window.innerHeight)
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
}

function createMouseUp(getContext: () => CanvasRenderingContext2D) {
	return () => {
		if (drawing) {
			holds.push(new Hold(newPath));
			console.log(holds);
			
			const ctx = getContext();
			ctx.lineTo(newPath[0].x, newPath[0].y);
			ctx.stroke();
			ctx.fill();

			drawing = false;
		}
	}
}

const App: React.FC = () => {

	const canvas1Ref = React.useRef<HTMLCanvasElement>(null);
	const canvas2Ref = React.useRef<HTMLCanvasElement>(null);

	function getCanvas1Context() {
		return canvas1Ref.current!.getContext('2d')!;
	}

	function getCanvas2Context() {
		return canvas2Ref.current!.getContext('2d')!;
	}

	const mouseMove = createMouseMove(getCanvas1Context, getCanvas2Context);
	const mouseUp = createMouseUp(getCanvas1Context);

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
			<canvas
				className='canvas1'

				ref={canvas1Ref}
				width={window.innerWidth}
				height={window.innerHeight}
			/>
			<canvas
				className='canvas2'

				ref={canvas2Ref}
				width={window.innerWidth}
				height={window.innerHeight}

				onMouseDown={e => {
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
				}}
			/>
		</div>
	);
}

export default App;

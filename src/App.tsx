import React from 'react';
import logo from './logo.svg';
import './App.css';

let drawing = false;
let startX: number;
let startY: number;
let currentPath: Path2D;
let newPath: [number, number][];
const paths: [number, number][][] = [];

const App: React.FC = () => {
	const canvasRef = React.useRef<HTMLCanvasElement>(null);
	function getCtx() {
		return canvasRef.current!.getContext('2d')!;
	}
	return (
		<div className="App">
			<canvas
				ref={canvasRef}
				width={window.innerWidth}
				height={window.innerHeight}
				onMouseDown={e => {
					const ctx = getCtx();
					ctx.strokeStyle = '#F00';
					ctx.fillStyle = '#0F0';
					ctx.lineWidth = 3;
					ctx.beginPath();
					ctx.moveTo(e.clientX, e.clientY);
					currentPath = new Path2D();
					currentPath.moveTo(e.clientX, e.clientY);
					newPath = [];
					newPath.push([e.clientX, e.clientY]);
					startX = e.clientX;
					startY = e.clientY;
					drawing = true;
				}}
				onMouseUp={e => {
					const ctx = getCtx();
					if (drawing) {
						newPath.push([startX, startY]);
						paths.push(newPath);
						console.log(paths);
						ctx.lineTo(startX, startY);
						currentPath.lineTo(startX, startY);
						ctx.stroke();
						ctx.fill();
						drawing = false;
					}
				}}
				onMouseMove={e => {
					const ctx = getCtx();
					if (drawing) {
						ctx.lineTo(e.clientX, e.clientY);
						currentPath.lineTo(e.clientX, e.clientY);
						newPath.push([e.clientX, e.clientY]);
						ctx.stroke();
					}
				}}
			/>
		</div>
	);
}

export default App;

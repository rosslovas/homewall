import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Hold } from '../Hold';
import { Point } from '../Point';

export interface WallProps {
	interactive: boolean;
	holds: Hold[];
	selectedHolds: Hold[];
	holdClicked?: (hold: Hold) => void;
}

export const Wall: React.FC<WallProps> = ({ interactive, holds, selectedHolds, holdClicked }) => {

	const [wallDimensions, setWallDimensions] = useState<{ width: number, height: number } | undefined>(undefined);
	const [ready, setReady] = useState(false);

	const canvas1Ref = useRef<HTMLCanvasElement>(null);
	const canvas2Ref = useRef<HTMLCanvasElement>(null);
	const getCanvas1 = useCallback(() => canvas1Ref!.current!, [canvas1Ref]);
	const getCanvas2 = useCallback(() => canvas2Ref!.current!, [canvas2Ref]);
	const getCanvas1Context = useCallback(() => canvas1Ref!.current!.getContext('2d')!, [canvas1Ref]);
	const getCanvas2Context = useCallback(() => canvas2Ref!.current!.getContext('2d')!, [canvas2Ref]);

	const canvasesReady = useCallback(() => {
		if (ready) {
			{
				const ctx = getCanvas1Context();
				ctx.strokeStyle = '#ffffff44';
				ctx.fillStyle = '#ffffff02';
				ctx.lineWidth = 3;

				for (const hold of holds) {
					ctx.stroke(hold.path2D);
					ctx.fill(hold.path2D);
				}
			}

			{
				const ctx = getCanvas2Context();
				ctx.strokeStyle = '#ffffffff';
				ctx.fillStyle = '#88ff8822';
				ctx.lineWidth = 3.5;
			}
		}
	}, [ready, getCanvas1Context, getCanvas2Context, holds]);

	useEffect(() => {
		if (ready) {
			const canvas2 = getCanvas2();
			const ctx = getCanvas2Context();
			ctx.clearRect(0, 0, canvas2.width, canvas2.height);
			for (const hold of selectedHolds) {
				ctx.stroke(hold.path2D);
				ctx.fill(hold.path2D);
			}
		}
	}, [selectedHolds, ready, getCanvas2, getCanvas2Context]);

	const getHoldAtPoint = useCallback((point: Point, ctx: CanvasRenderingContext2D) => {
		for (let i = holds.length - 1; i >= 0; --i) {
			const hold = holds[i];
			if (hold.isPointInBounds(point, ctx)) {
				return hold;
			}
		}
	}, [holds]);

	function click(e: React.MouseEvent<HTMLCanvasElement>) {
		const { left, top } = getCanvas1().getBoundingClientRect();
		const mouseX = e.clientX - left;
		const mouseY = e.clientY - top;

		const hold = getHoldAtPoint({ x: mouseX, y: mouseY }, getCanvas1Context());

		console.log(hold);

		if (hold && holdClicked) {
			holdClicked(hold);
		}
	}

	useEffect(() => {
		if (ready && interactive) {
			function mouseMove(e: MouseEvent) {
				const { left, top } = getCanvas1().getBoundingClientRect();
				const mouseX = e.clientX - left;
				const mouseY = e.clientY - top;

				const canvas2 = getCanvas2();
				const ctx = getCanvas2Context();
				ctx.clearRect(0, 0, canvas2.width, canvas2.height);
				const hoveredHold = getHoldAtPoint({ x: mouseX, y: mouseY }, getCanvas1Context());
				if (hoveredHold) {
					ctx.stroke(hoveredHold.path2D);
					ctx.fill(hoveredHold.path2D);
				}

				for (const hold of selectedHolds) {
					if (hold !== hoveredHold) {
						ctx.stroke(hold.path2D);
						ctx.fill(hold.path2D);
					}
				}
			}

			document.addEventListener('mousemove', mouseMove);
			return () => document.removeEventListener('mousemove', mouseMove);
		}
	}, [ready, interactive, getCanvas1, getCanvas2, getCanvas1Context, getCanvas2Context, getHoldAtPoint, holds, selectedHolds]);

	return <>
		<div
			id="canvasContainer"
			style={{
				width: `${wallDimensions ? wallDimensions.width : 0}px`,
				height: `${wallDimensions ? wallDimensions.height : 0}px`
			}}
		>
			<img
				id='wallImage'
				src='/wall.jpg'
				alt=''
				onLoad={e => {
					setReady(true);
					setWallDimensions({ width: e.currentTarget.width, height: e.currentTarget.height });
				}} />
			{wallDimensions && <div ref={canvasesReady}>
				<canvas
					id='canvas1'
					ref={canvas1Ref}
					width={wallDimensions.width}
					height={wallDimensions.height}
				/>
				<canvas
					id='canvas2'
					ref={canvas2Ref}
					width={wallDimensions.width}
					height={wallDimensions.height}

					onClick={click}
				/>
			</div>}
		</div>
	</>;
}

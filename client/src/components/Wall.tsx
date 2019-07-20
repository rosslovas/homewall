import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Hold, HoldState } from '../Hold';
import { Point } from '../Point';
import './Wall.css';

function renderSelectedHolds(holds: Hold[], hoveredHold: Hold | undefined, ctx: CanvasRenderingContext2D) {

	if (hoveredHold) {
		if (hoveredHold.state === HoldState.Start) {
			ctx.strokeStyle = '#4fc3f7ee';
			ctx.fillStyle = '#8888ff0a';
		} else if (hoveredHold.state === HoldState.End) {
			ctx.strokeStyle = '#77ff77dd';
			ctx.fillStyle = '#88ff880a';
		} else {
			ctx.strokeStyle = '#ffffffff';
			ctx.fillStyle = '#aabbaa11';
		}
		ctx.stroke(hoveredHold.path2D);
		ctx.fill(hoveredHold.path2D);
	}

	for (const hold of holds.filter(h => h !== hoveredHold && h.state !== HoldState.Unselected)) {
		if (hold.state === HoldState.Start) {
			ctx.strokeStyle = '#4fc3f7dd';
			ctx.fillStyle = '#8888ff0a';
		} else if (hold.state === HoldState.End) {
			ctx.strokeStyle = '#77ff77cc';
			ctx.fillStyle = '#88ff880a';
		} else {
			ctx.strokeStyle = '#ffffffcc';
			ctx.fillStyle = '#88aa880a';
		}
		ctx.stroke(hold.path2D);
		ctx.fill(hold.path2D);
	}
}

function getHoldAtPoint(holds: Hold[], point: Point, ctx: CanvasRenderingContext2D) {
	for (let i = holds.length - 1; i >= 0; --i) {
		const hold = holds[i];
		if (hold.isPointInBounds(point, ctx)) {
			return hold;
		}
	}
}

export interface WallProps {
	interactive: boolean;
	imageSrc: string;
	holds: Hold[];
	holdClicked?: (hold: Hold) => void;
}

export const Wall: React.FC<WallProps> = ({ interactive, imageSrc, holds, holdClicked }) => {

	const [wallDimensions, setWallDimensions] = useState<{ width: number, height: number } | undefined>(undefined);
	const [ready, setReady] = useState(false);
	const [holdsDrawnOnCanvas1, setHoldsDrawnOnCanvas1] = useState(false);
	const [hoveredHold, setHoveredHold] = useState<Hold | undefined>();
	const [touchDetected, setTouchDetected] = useState(false);

	const canvas1Ref = useRef<HTMLCanvasElement>(null);
	const canvas2Ref = useRef<HTMLCanvasElement>(null);
	const getCanvas1 = useCallback(() => canvas1Ref!.current!, [canvas1Ref]);
	const getCanvas2 = useCallback(() => canvas2Ref!.current!, [canvas2Ref]);
	const getCanvas1Context = useCallback(() => canvas1Ref!.current!.getContext('2d')!, [canvas1Ref]);
	const getCanvas2Context = useCallback(() => canvas2Ref!.current!.getContext('2d')!, [canvas2Ref]);

	const canvasesReady = useCallback(() => {
		if (ready) {
			if (interactive && !holdsDrawnOnCanvas1) {
				const ctx1 = getCanvas1Context();
				ctx1.strokeStyle = '#ffffff33';
				// ctx.fillStyle = '#ffffff02';
				ctx1.lineWidth = 2.5;

				for (const hold of holds) {
					ctx1.stroke(hold.path2D);
					// ctx.fill(hold.path2D);
				}

				if (holds.length > 0) {
					setHoldsDrawnOnCanvas1(true);
				}
			}

			const ctx2 = getCanvas2Context();
			ctx2.lineWidth = 3.5;
		}
	}, [ready, interactive, getCanvas1Context, getCanvas2Context, holds, holdsDrawnOnCanvas1]);

	useEffect(() => {
		if (ready) {
			const canvas2 = getCanvas2();
			const ctx = getCanvas2Context();
			ctx.clearRect(0, 0, canvas2.width, canvas2.height);
			renderSelectedHolds(holds, hoveredHold, ctx);
		}
	}, [holds, hoveredHold, ready, getCanvas2, getCanvas2Context]);

	function click(e: React.MouseEvent<HTMLCanvasElement>) {
		const { left, top } = getCanvas1().getBoundingClientRect();
		const mouseX = e.clientX - left;
		const mouseY = e.clientY - top;

		const hold = getHoldAtPoint(holds, { x: mouseX, y: mouseY }, getCanvas1Context());

		console.log(hold);

		if (hold && holdClicked) {
			holdClicked(hold);
		}
	}

	useEffect(() => {
		if (ready && interactive) {
			function mouseMove(e: MouseEvent) {
				if (touchDetected) {
					return;
				}

				const { left, top } = getCanvas1().getBoundingClientRect();
				const mouseX = e.clientX - left;
				const mouseY = e.clientY - top;

				setHoveredHold(getHoldAtPoint(holds, { x: mouseX, y: mouseY }, getCanvas1Context()));
			}

			// Prevent mouseMove from triggering on mobile
			function touchEnd(e: TouchEvent) {
				setTouchDetected(true);
			}

			document.addEventListener('touchend', touchEnd);
			document.addEventListener('mousemove', mouseMove);
			return () => {
				document.removeEventListener('mousemove', mouseMove);
				document.removeEventListener('touchend', touchEnd);
			}
		}
	}, [ready, interactive, touchDetected, getCanvas1, getCanvas2, getCanvas1Context, getCanvas2Context, holds]);

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
				src={imageSrc}
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

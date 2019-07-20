import { Point } from './Point';
import { Rect } from './Rect';

export class Hold {

	readonly path2D: Path2D;
	readonly bounds: Rect;

	id?: number;

	constructor(
		readonly path: ReadonlyArray<Point>,
		path2D?: Path2D
	) {
		if (!path2D) {
			const newPath = new Path2D();
			
			for (const [index, point] of path.entries()) {
				index === 0
					? newPath.moveTo(point.x, point.y)
					: newPath.lineTo(point.x, point.y);
			}

			if (path[0]) {
				newPath.lineTo(path[0].x, path[0].y);
			}

			this.path2D = newPath;
		}
		else {
			this.path2D = path2D;
		}

		if (path[0]) {
			let x1: number = path[0].x;
			let y1: number = path[0].y;
			let x2: number = path[0].x;
			let y2: number = path[0].y;
			for (const point of path) {
				if (point.x < x1) {
					x1 = point.x;
				}
				if (point.x > x2) {
					x2 = point.x;
				}
				if (point.y < y1) {
					y1 = point.y;
				}
				if (point.y > y2) {
					y2 = point.y;
				}
			}
			this.bounds = new Rect(x1, y1, x2, y2);
		} else {
			this.bounds = new Rect(0, 0, 0, 0);
		}
	}

	isPointInBounds(point: Point, context2D: CanvasRenderingContext2D) {
		return this.bounds.isPointInBoundsInclusive(point) &&
			context2D.isPointInPath(this.path2D, point.x, point.y);
	}

}

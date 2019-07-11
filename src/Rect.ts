import { Point } from './Point';

export class Rect {
	constructor(readonly x1: number, readonly y1: number, readonly x2: number, readonly y2: number) { }

	isPointInBoundsInclusive(point: Point) {
		return (
			point.x >= this.x1 && point.x <= this.x2 &&
			point.y >= this.y1 && point.y <= this.y2);
	}
}

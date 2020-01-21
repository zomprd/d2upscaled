import Vector from '../../pixi-component/utils/vector';

export class PathContext {
    currentPointIndex: number = -1;
    targetLocation: Vector;
}

export class PathSegment {
    // starting position
    start: Vector;
    // final position
    end: Vector;
    // segment length
    length: number;

    constructor(start: Vector, end: Vector) {
        this.start = start;
        this.end = end;
        this.length = (end.subtract(start)).magnitude();
    }
}

/**
 * Sequence of line segments used in steering behaviors
 */
export class Path {
    // collection of segments
    segments = new Array<PathSegment>();
    // total length of the path
    pathLength: number;

    constructor(firstSegmentStart: Vector = null, firstSegmentEnd: Vector = null) {
        if (firstSegmentStart != null && firstSegmentEnd != null) {
            this.addFirstSegment(firstSegmentStart, firstSegmentEnd);
        }
    }

    addFirstSegment(firstSegmentStart: Vector, firstSegmentEnd: Vector) {
        // clear all segments
        this.segments = new Array<PathSegment>();

        let firstSegment = new PathSegment(firstSegmentStart, firstSegmentEnd);
        this.segments.push(firstSegment);
        this.pathLength = firstSegment.length;
    }

    addSegment(endPoint: Vector) {
        // connect the segment to the last one
        let lastSegment = this.segments[this.segments.length - 1];
        let newSegment = new PathSegment(lastSegment.end, endPoint);
        this.segments.push(newSegment);
        this.pathLength += newSegment.length;
    }

    calcTargetPoint(radiusTolerance: number, location: Vector, context: PathContext) {
        // get current followed segment
        let currentSegment = this.segments[context.currentPointIndex !== -1 ? context.currentPointIndex : 0];

        if (context.currentPointIndex === -1 && location.distance(currentSegment.start) > radiusTolerance) {
            context.currentPointIndex = -1; // not yet at the beginning
            context.targetLocation = currentSegment.start;
            return;
        }

        if (context.currentPointIndex === -1) {
            // arrived to the beginning of the first segment -> set index to 0
            context.currentPointIndex = 0;
        }

        if (location.distance(currentSegment.end) > radiusTolerance) {
            // still not there. Go to the end of the segment
            context.targetLocation = currentSegment.end;
            return;
        } else {
            if (context.currentPointIndex === this.segments.length - 1) {
                // final segment
                context.targetLocation = location; // stay where you are
            } else {
                // go to the end of the next segment
                context.currentPointIndex = context.currentPointIndex + 1;
                context.targetLocation = this.segments[context.currentPointIndex].end;
            }

            return;
        }
    }
}
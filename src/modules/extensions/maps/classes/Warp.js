export default class Warp {
	x;
	y;
	locationId;
	destX;
	destY;
	element = null;
	
	constructor (x, y, locationId, destX, destY) {
		this.x = +x;
		this.y = +y;
		this.locationId = locationId;
		this.destX = (destX == null) ? null : +destX;
		this.destY = (destY == null) ? null : +destY;
	}
};

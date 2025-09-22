export default class Layer {
	index;
	
	name;
	width;
	height;
	
	properties = {};
	tiles;
	tileAttributes;
	
	constructor (name, width, height) {
		let area = width * height;
		this.name = name;
		this.width = width;
		this.height = height;
		this.tiles = new Int16Array(area);
		this.tileAttributes = new Array(area);
	}
	
	getTileIndex (tileX, tileY) {
		if (!this.isTileOnMap(tileX, tileY)) {
			return null;
		}
		
		return tileX + tileY * this.width;
	}
	
	getTileX (tileIndex) {
		return tileIndex % this.width;
	}
	
	getTileY (tileIndex) {
		return Math.floor(tileIndex / this.width);
	}
	
	isTileOnMap (tileX, tileY) {
		return (tileX >= 0 && tileY >= 0 && tileX < this.width && tileY < this.height);
	}
};

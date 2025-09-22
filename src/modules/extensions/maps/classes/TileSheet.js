import * as mapsUtil from '../mapsUtil.js';
import * as util from '../../../util.js';

export default class TileSheet {
	index;
	
	name;
	texture;
	url;
	
	firstGid = null;
	tileCount = 0;
	columns = 0;
	width = 0;
	height = 0;
	tileWidth = 16;
	tileHeight = 16;
	tileProperties = {};
	
	constructor (name, texture) {
		this.name = name;
		this.texture = texture;
		this.url = util.contentURI(`${texture}.png`);
	}
	
	loadElement (source) {
		let $image = $(source).find('> image').first();
		this.firstGid = +source.getAttribute('firstgid');
		this.tileCount = source.getAttribute('tilecount');
		this.columns = +source.getAttribute('columns');
		this.width = +$image.attr('width');
		this.height = +$image.attr('height');
		this.tileWidth = +source.getAttribute('tilewidth');
		this.tileHeight = +source.getAttribute('tileheight');
		let tileSheet = this;
		
		$(source).find('> tile').each(function () {
			let properties = {};
			tileSheet.tileProperties[this.getAttribute('id')] = properties;
			
			$(this).find('> properties > property').each(function () {
				mapsUtil.addMapPropertyElement(properties, this);
			});
		});
	}
	
	importTileSheet (source) {
		this.firstGid = source.firstGid;
		this.tileCount = source.tileCount;
		this.columns = source.columns;
		this.width = source.width;
		this.height = source.height;
		this.tileWidth = source.tileWidth;
		this.tileHeight = source.tileHeight;
		this.tileProperties = window.structuredClone(source.tileProperties);
	}
	
	setSize (width, height, tileWidth = 16, tileHeight = 16) {
		this.width = width;
		this.height = height;
		this.tileWidth = tileWidth;
		this.tileHeight = tileHeight;
		
		this.columns = Math.floor(width / tileWidth);
		this.tileCount = this.columns * Math.floor(height / tileHeight);
	}
};

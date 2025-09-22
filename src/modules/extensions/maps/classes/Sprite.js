import * as util from '../../../util.js';

export default class Sprite {
	type;
	texture;
	x;
	y;
	sheetX;
	sheetY;
	width;
	height;
	tintColor;
	rotation;
	origin;
	scale;
	effects;
	layerDepth;
	
	accessoryIndex;
	isShadow;
	isLight;
	paint;
	linearTint;
	
	paintCanvases;
	
	static TYPE_NONE = 0;
	static TYPE_TEXTURE = 1;
	static TYPE_SOLID = 2;
	
	// Sprite effects.
	
	static EF_NONE = 0;
	static EF_FLIP_HORIZONTALLY = 1;
	static EF_FLIP_VERTICALLY = 2;
	
	static ORIGIN_ZERO = [0, 0];
	
	constructor (type, texture, x, y, sheetX, sheetY, width, height, tintColor, rotation, origin, scale, effects, layerDepth, properties = {}) {
		this.type = type ?? Sprite.TYPE_TEXTURE;
		this.texture = util.normalizeTexture(texture);
		this.x = Math.round(x ?? 0);
		this.y = Math.round(y ?? 0);
		this.sheetX = Math.round(sheetX ?? 0);
		this.sheetY = Math.round(sheetY ?? 0);
		this.width = Math.round(width ?? 0);
		this.height = Math.round(height ?? 0);
		this.tintColor = tintColor ?? null;
		this.rotation = +(rotation ?? 0);
		this.origin = origin ?? Sprite.ORIGIN_ZERO;
		this.scale = +(scale ?? 1);
		this.effects = effects ?? Sprite.EF_NONE;
		this.layerDepth = +(layerDepth ?? 0);
		
		this.accessoryIndex = +(properties.accessoryIndex ?? -1);
		this.isShadow = (properties.isShadow == true);
		this.isLight = (properties.isLight == true);
		this.paint = properties.paint ?? null;
		this.linearTint = (properties.linearTint == true);
	}
};

import {default as Feature, FurnitureMeta} from '../classes/Feature.js';
import Sprite from '../classes/Sprite.js';

import * as mapsUtil from '../mapsUtil.js';
import * as util from '../../../util.js';

export let loadXML = function (locationElement, context) {
	let lib = context.core.extensions.maps.lib;
	
	$(locationElement).find('> furniture > Furniture').each(function () {
		let feature = new Feature(
			'furniture',
			+$(this).find('> tileLocation > X').first().text(),
			+$(this).find('> tileLocation > Y').first().text(),
			util.getElementDetails(this)
		);
		context.features.push(feature);
		updateFeature(feature, context.location, context.core);
	});
};

export let syncDetails = function (feature, location, core) {
	feature.details.tileLocation ??= {};
	feature.details.tileLocation.X = feature.tileX + '';
	feature.details.tileLocation.Y = feature.tileY + '';
};

export let updateFeature = function (feature, location, core) {
	setMeta(feature.meta, feature.details, location, core);
};

export let drawFeature = function (feature, location, core) {
	let lib = core.extensions.maps.lib;
	
	let zTileX = feature.tileX + ((feature.index >= 0) ? 0 : 20);
	let zTileY = feature.tileY + ((feature.index >= 0) ? 0 : 20);
	
	let item = feature.meta.item;
	let boundingBox = new util.Rect(feature.tileX * 64, feature.tileY * 64, feature.meta.width * 64, feature.meta.height * 64);
	let sourceRect = feature.meta.sourceRect;
	let drawPosition = [boundingBox.x, boundingBox.y - (sourceRect.height * 4 - boundingBox.height)];
	let flipEffect = feature.meta.flipped ? Sprite.EF_FLIP_HORIZONTALLY : Sprite.EF_NONE;
	let zBoundingBoxY = boundingBox.y + (zTileY - feature.tileY) * 64;
	
	switch (feature.meta.type) {
	case 'RandomizedPlantFurniture': {
		let baseSortY = (zBoundingBoxY + boundingBox.height - 8) / 10000;
		let drawnSourceRect = new util.Rect(0, 96, 16, 16);
		drawnSourceRect.x += +(feature.details.bottomIndex ?? 0) % 8 * 16;
		drawnSourceRect.y += Math.floor(+(feature.details.bottomIndex ?? 0) / 8) * 16;
		feature.drawSprite(item.texture, drawPosition, drawnSourceRect, null, 0, null, 4, flipEffect, baseSortY);
		
		drawnSourceRect = new util.Rect(0, 48, 16, 16);
		drawnSourceRect.x += +(feature.details.middleIndex ?? 0) % 8 * 16;
		drawnSourceRect.y += Math.floor(+(feature.details.middleIndex ?? 0) / 8) * 16;
		feature.drawSprite(item.texture, [drawPosition[0] - 4, drawPosition[1] - 32], drawnSourceRect, null, 0, null, 4, flipEffect, baseSortY + 1e-5);
		
		drawnSourceRect = new util.Rect(0, 0, 16, 16);
		drawnSourceRect.x += +(feature.details.topIndex ?? 0) % 8 * 16;
		drawnSourceRect.y += Math.floor(+(feature.details.topIndex ?? 0) / 8) * 16;
		feature.drawSprite(item.texture, [drawPosition[0] - 4, drawPosition[1] - 96], drawnSourceRect, null, 0, null, 4, flipEffect, baseSortY + 1e-5);
		break;
	}
	default:
		feature.drawSprite(item.texture, drawPosition, sourceRect, null, 0, null, 4, flipEffect, (feature.meta.furnitureType === 12) ? (2e-9 + zTileY / 100000) : ((zBoundingBoxY + boundingBox.height - ([6, 17, 13].includes(feature.meta.furnitureType) ? 48 : 8)) / 10000));
	}
	
	if (feature.details.heldObject != null) {
		feature.beginAccessory('heldObject');
		
		try {
			let heldObject = util.rootDetails(feature.details, 'heldObject');
			let heldItem = mapsUtil.getObjectItem(core, heldObject);
			
			if (heldItem.itemType === 'F') {
				// See StardewValley.Objects.drawAtNonTileSpot()
				
				let meta = new FurnitureMeta();
				setMeta(meta, heldObject, location, core);
				
				let heldPosition = [
					boundingBox.centerX() - 32,
					boundingBox.centerY() - meta.sourceRect.height * 4 - ((feature.details.drawHeldObjectLow === 'true') ? -16 : 16),
				];
				let layerDepth = (zBoundingBoxY + boundingBox.height - 7) / 10000;
				feature.drawSprite(meta.item.texture, heldPosition, meta.sourceRect, null, 0, null, 4, meta.flipped ? Sprite.EF_FLIP_HORIZONTALLY : Sprite.EF_NONE, layerDepth);
			}
			else {
				let heldPosition = [
					boundingBox.centerX() - 32,
					boundingBox.centerY() - ((feature.details.drawHeldObjectLow === 'true') ? 32 : 85),
				];
				feature.drawBasicShadow([heldPosition[0] + 32, heldPosition[1] + 53], (zBoundingBoxY + boundingBox.height) / 10000);
				
				if (heldObject['@xsi:type'] === 'ColoredObject') {
					mapsUtil.drawColoredObjectInMenu(feature, location, core, heldItem, heldObject, heldPosition, 1, 1, (zBoundingBoxY + boundingBox.height + 1) / 10000, null, false);
				}
				else {
					feature.drawSprite(heldItem.texture, heldPosition, heldItem.spriteRect, null, 0, null, 4, Sprite.EF_NONE, (zBoundingBoxY + boundingBox.height + 1) / 10000);
				}
			}
		}
		finally {
			feature.endAccessory();
		}
	}
	
	if (feature.details.isOn === 'true' && feature.meta.furnitureType === 14) {
		feature.drawSprite(util.tx.mouseCursors, [boundingBox.centerX() - 12, boundingBox.centerY() - 64], new util.Rect(276 + Math.floor((feature.tileX * 3047 + feature.tileY * 88) % 400 / 100) * 12, 1985, 12, 11), null, 0, null, 4, Sprite.EF_NONE, (zBoundingBoxY + boundingBox.height - 2) / 10000);
		feature.drawSprite(util.tx.mouseCursors, [boundingBox.centerX() - 36, boundingBox.centerY() - 64], new util.Rect(276 + Math.floor((feature.tileX * 2047 + feature.tileY * 98) % 400 / 100) * 12, 1985, 12, 11), null, 0, null, 4, Sprite.EF_NONE, (zBoundingBoxY + boundingBox.height - 1) / 10000);
	}
	else if (feature.details.isOn === 'true' && feature.meta.furnitureType === 16) {
		feature.drawSprite(util.tx.mouseCursors, [boundingBox.centerX() - 20, boundingBox.centerY() - 105.6], new util.Rect(276 + Math.floor((feature.tileX * 3047 + feature.tileY * 88) % 400 / 100) * 12, 1985, 12, 11), null, 0, null, 4, Sprite.EF_NONE, (zBoundingBoxY + boundingBox.height - 2) / 10000);
	}
};

let setMeta = function (meta, details, location, core) {
	let lib = core.extensions.maps.lib;
	
	let item = core.items.get('F', details.itemId);
	
	meta.name = item.displayName;
	meta.type = details['@xsi:type'] ?? null;
	meta.furnitureType = +details.furniture_type;
	meta.item = item;
	meta.passable = (meta.furnitureType === 12 || lib.itemIsPassable(item));
	meta.rotations = +item.data[4];
	
	if (meta.type === 'BedFurniture') {
		meta.additionalTilePropertyRadius = 1;
	}
	
	// See StardewValley.Objects.Furniture:RecalculateBoundingBox()
	
	if (item.data[3] != null) {
		let size = mapsUtil.getFurnitureSize(item, meta.furnitureType);
		meta.width = +size[0];
		meta.height = +size[1];
	}
	
	// See StardewValley.Objects.Furniture:updateRotation()
	
	let rotation = +(details.currentRotation ?? 0);
	let sourceRect = util.getItemRect(item);
	let flipped = false;
	
	if (rotation > 0) {
		let specialRotationOffsets = {
			2: [-1, 1],
			5: [-1, 0],
			3: [-1, 1],
		}[meta.furnitureType] ?? [0, 0];
		
		let irregular =
			([5, 11, 12].includes(meta.furnitureType) || ['(F)724', '(F)727'].includes(item.qualifiedItemId)) &&
			!item.name.includes('End Table') &&
			!item.name.includes('EndTable');
		
		let sourceRectRotate = (meta.width !== meta.height);
		
		if (irregular && rotation === 2) {
			rotation = 1;
		}
		
		if (sourceRectRotate && [1, 3].includes(rotation)) {
			let oldHeight = meta.height;
			meta.height = meta.width + specialRotationOffsets[0];
			meta.width = oldHeight + specialRotationOffsets[1];
		}
		
		let specialSpecialSourceRectOffset = (meta.furnitureType === 12) ? [1, -1] : [0, 0];
		flipped = (rotation === 3);
		
		if (sourceRectRotate) {
			switch (rotation) {
			case 1:
			case 3:
				sourceRect = new util.Rect(
					sourceRect.x + sourceRect.width,
					sourceRect.y,
					sourceRect.height - 16 + specialRotationOffsets[1] * 16 + specialSpecialSourceRectOffset[0] * 16,
					sourceRect.width + 16 + specialRotationOffsets[0] * 16 + specialSpecialSourceRectOffset[1] * 16,
				);
				break;
			
			case 2:
				sourceRect = new util.Rect(
					sourceRect.x + sourceRect.width + sourceRect.height - 16 + specialRotationOffsets[1] * 16 + specialSpecialSourceRectOffset[0] * 16,
					sourceRect.y,
					sourceRect.width,
					sourceRect.height,
				);
				break;
			}
		}
		else {
			if (meta.rotations === 2) {
				sourceRect = new util.Rect(
					sourceRect.x + ((rotation === 2) ? 1 : 0) * sourceRect.width,
					sourceRect.y,
					sourceRect.width,
					sourceRect.height,
				);
			}
			else {
				sourceRect = new util.Rect(
					sourceRect.x + ((rotation === 3) ? 1 : rotation) * sourceRect.width,
					sourceRect.y,
					sourceRect.width,
					sourceRect.height,
				);
			}
		}
	}
	
	meta.sourceRect = sourceRect;
	meta.flipped = flipped;
};

/*
export let getPlacementRestriction = function (furnitureItem) {
	if (furnitureItem.data.length > 6 && +furnitureItem.data[6] >= 0) {
		return +furnitureItem.data[6];
	}
	else if (furnitureItem.name.includes('TV')) {
		return 0;
	}
	else if ([11, 5, 0, 8, 16].includes(mapsUtil.getFurnitureType(furnitureItem))) {
		return 2;
	}
	else {
		return 0;
	}
};
*/

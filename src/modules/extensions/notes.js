import * as util from '../util.js';

export let initialize = function (core, extension) {
	let save = core.save;
	let common = core.common;
	let ext = core.extVars.calendar;
	let baseUtil = core.baseUtil;
	let lib = extension.lib;
	
	let notes;
	
	core.addSaveLoader(function (xmlDoc, wasChanged) {
		notes = util.retrieve(`notes.save.${save.gameID}`) ?? {};
		notes.general ??= '';
		notes.day ??= {};
	});
	
	core.addPredictor('notes', 'Notes', function (isSearch, offset, extra) {
		offset ??= save.daysPlayed + save.dayAdjust - 1;
		
		$('#notes-prev-week').val(offset - 7).prop('disabled', offset < 7);
		$('#notes-prev-day').val(offset - 1).prop('disabled', offset < 1);
		$('#notes-reset').val('reset');
		$('#notes-next-day').val(offset + 1).prop('disabled', false);
		$('#notes-next-week').val(offset + 7).prop('disabled', false);
		
		let year = Math.floor(offset / 112) + 1;
		let seasonName = baseUtil.capitalize(util.getSeasonName(Math.floor(offset / 28) % 4));
		let dayOfMonth = (offset % 28) + 1;
		let weekday = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][offset % 7];
		
		let output = '';
		
		// Note: We add a leading "\n" in order to preserve any entered whitespace.
		// See https://html.spec.whatwg.org/multipage/syntax.html#element-restrictions
		
		output += `<h4>${weekday}, ${seasonName} ${dayOfMonth}, Year ${year}</h4>`;
		output += `<textarea id="notes-day" style="width: 100%; height: 15em;">\n${util.escapeHTML(notes.day[offset] ?? '')}</textarea>`;
		
		output += '<h4>General Notes</h4>';
		output += `<textarea id="notes-general" style="width: 100%; height: 15em;">\n${util.escapeHTML(notes.general)}</textarea>`;
		
		output += '<p style="text-align: center;"><button type="button" id="notes-save" disabled>Save</button></p>';
		
		return {
			output: output,
			afterUpdate: function () {
				$('#notes-day').on('input', function () {
					notes.day[offset] = this.value;
					setHasUnsavedChanges(true);
				});
				
				$('#notes-general').on('input', function () {
					notes.general = this.value;
					setHasUnsavedChanges(true);
				});
				
				$('#notes-save').on('click', function () {
					util.store(`notes.save.${save.gameID}`, notes);
					setHasUnsavedChanges(false);
				});
			},
		};
	});
	
	let setHasUnsavedChanges = function (state) {
		extension.hasUnsavedChanges = state;
		$('#notes-save').prop('disabled', !state);
	};
};

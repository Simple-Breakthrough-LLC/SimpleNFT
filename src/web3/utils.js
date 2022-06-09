import {
	CONFIG_ARRAY_START_V2,
	CONFIG_LINE_SIZE_V2,
} from './constants.js';

export const candyAccountSize = (itemsAvailable) => {
	itemsAvailable = Number(itemsAvailable);
	return (
		CONFIG_ARRAY_START_V2 +
		4 +
		itemsAvailable * CONFIG_LINE_SIZE_V2 +
		8 +
		2 * (Math.floor(itemsAvailable / 8) + 1)
	);
}

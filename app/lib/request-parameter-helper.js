const lastUpdatedByQueryHelper = function (lastUpdatedByOption) {
	if (Array.isArray(lastUpdatedByOption)) {
		return { $in: lastUpdatedByOption };
	} else {
		return lastUpdatedByOption;
	}
};

module.exports = {
	lastUpdatedByQueryHelper,
};

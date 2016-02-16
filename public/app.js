'use strict';

var learnjs = {};

learnjs.problemView = function(problemNumber) {
    var title = 'Problem #' + problemNumber + ' Coming Soon!';
    return $('<div class="problem-view">').text(title);
};

learnjs.showView = function(hash) {
    var routes = {
	'#problem' : learnjs.problemView
    };

    var hashParts = hash.split('-');

    var route = hashParts[0];
    var param = hashParts[1];

    var viewFn = routes[route];
    if (viewFn) {
	$('.view-container').empty().append(viewFn(param));
    }
};

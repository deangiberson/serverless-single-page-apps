'use strict';

var learnjs = {};

learnjs.problemView = function(problemNumber) {
    var view = $('.templates .problem-view').clone();
    view.find('.title').text('Problem #' + problemNumber);
    return view;
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

learnjs.appOnReady = function() {
    window.onhashchange = function() {
	learnjs.showView(window.location.hash);
    };
    learnjs.showView(window.location.hash);
};

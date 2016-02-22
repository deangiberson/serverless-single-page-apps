'use strict';

var learnjs = {};

learnjs.problemView = function(data) {
    var problemNumber = parseInt(data, 10);
    var view = $('.templates .problem-view').clone();
    var problemData = learnjs.problems[problemNumber - 1];
    var resultFlash = view.find('.result');

    function checkAnswer() {
	var answer = view.find('.answer').val();
	var test = problemData.code.replace('__', answer) + '; problem()';
	return eval(test);
    }

    function checkAnswerClick() {
	if (checkAnswer()) {
	    learnjs.flashElement(resultFlash, 'Correct!');
	} else {
	    learnjs.flashElement(resultFlash, 'Incorrect!');
	}
	return false;
    }

    view.find('.check-btn').click(checkAnswerClick);
    view.find('.title').text('Problem #' + problemNumber);
    learnjs.applyObject(learnjs.problems[problemNumber - 1], view);
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

learnjs.problems = [
    {
	description: "What is truth?",
	code: "function problem() { return __; }"
    },
    {
	description: "Simple Math",
	code: "function problem() { return 42 === 6 * __; }"
    }
];

learnjs.applyObject = function(obj, elem) {
    for (var key in obj) {
	elem.find('[data-name="' + key + '"]').text(obj[key]);
    }
};

learnjs.flashElement = function(elem, content) {
    elem.fadeOut('fast', function() {
	elem.html(content);
	elem.fadeIn();
    });
};

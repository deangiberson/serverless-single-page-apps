'use strict';

function googleSignIn(googleUser) {
    var id_token = googleUser.getAuthResponse().id_token;
    AWS.config.update({
	region:'us-east-1',
	credentials: new AWS.CognitoIdentityCredentials({
	    IdentityPoolId: learnjs.poolId,
	    Logins: {
		'accounts.google.com': id_token
	    }
	})
    });
    function refresh() {
	return gapi.auth2.getAuthInstance().signIn({
	    prompt: 'login'
	}).then(function(userUpdate){
	    var creds = AWS.config.credentials;
	    var newToken = userUpdate.getAuthResponse().id_token;
	    creds.params.Logins['accounts.google.com'] = newToken;
	    return learnjs.awsRefresh();
	});
    }
    learnjs.awsRefresh().then(function(id) {
	learnjs.identity.resolve({
	    id: id,
	    email: googleUser.getBasicProfile().getEmail(),
	    refresh: refresh
	});
    });
};

var learnjs = {
    poolId: 'us-east-1:28fa74b4-7d27-4bb4-bb09-9c73460bf12e'
};

learnjs.identity = new $.Deferred();

learnjs.awsRefresh = function() {
    var deferred = new $.Deferred();
    AWS.config.credentials.refresh(function(err) {
	if (err) {
	    deferred.reject(err);
	} else {
	    deferred.resolve(AWS.config.credentials.identity.Id);
	}
    });
    return deferred.promise();
};

learnjs.landingView = function() {
    return learnjs.template('landing-view');
};

learnjs.problemView = function(data) {
    var problemNumber = parseInt(data, 10);
    var view = $('.templates .problem-view').clone();
    var problemData = learnjs.problems[problemNumber - 1];
    var resultFlash = view.find('.result');
    var answer = view.find('.answer');

    function checkAnswer() {
	var test = problemData.code.replace('__', answer.val()) + '; problem()';
	return eval(test);
    }

    function checkAnswerClick() {
	if (checkAnswer()) {
	    var correctFlash = learnjs.buildCorrectFlash(problemNumber);
	    learnjs.flashElement(resultFlash, correctFlash);
	    learnjs.saveAnswer(problemNumber, answer.val());
	} else {
	    learnjs.flashElement(resultFlash, 'Incorrect!');
	}
	return false;
    }

    view.find('.check-btn').click(checkAnswerClick);
    view.find('.title').text('Problem #' + problemNumber);
    learnjs.applyObject(learnjs.problems[problemNumber - 1], view);

    if (problemNumber < learnjs.problems.length) {
	var buttonItem = learnjs.template('skip-btn');
	buttonItem.find('a').attr('href', "#problem-" + (problemNumber + 1));
	$('.nav-list').append(buttonItem);
	view.bind('removingView', function() {
	    buttonItem.remove();
	});
    }

    return view;
};

learnjs.showView = function(hash) {
    var routes = {
	'#problem' : learnjs.problemView,
	'#profile' : learnjs.profileView,
	'#' : learnjs.landingView,
	'' : learnjs.landingView
    };

    var hashParts = hash.split('-');

    var route = hashParts[0];
    var param = hashParts[1];

    var viewFn = routes[route];
    if (viewFn) {
	learnjs.triggerEvent('removingView', []);
	$('.view-container').empty().append(viewFn(param));
    }
};

learnjs.appOnReady = function() {
    window.onhashchange = function() {
	learnjs.showView(window.location.hash);
    };
    learnjs.showView(window.location.hash);
    learnjs.identity.done(learnjs.addProfileLink);
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

learnjs.template = function(name) {
    return $('.templates .' + name).clone();
};

learnjs.buildCorrectFlash = function(problemNumber) {
    var correctFlash = learnjs.template('correct-flash');
    var link = correctFlash.find('a');
    if (problemNumber < learnjs.problems.length) {
	link.attr('href', '#problem-' + (problemNumber + 1));
    } else {
	link.attr('href', '');
	link.text("You're finished!");
    }
    return correctFlash;
};

learnjs.triggerEvent = function(name,args) {
    $('.view-container>*').trigger(name, args);
};

learnjs.profileView = function() {
    var view = learnjs.template('profile-view');
    learnjs.identity.done(function(identity) {
	view.find('.email').text(identity.email);
    });
    return view;
};

learnjs.addProfileLink = function(profile) {
    var link = learnjs.template('profile-link');
    link.find('a').text(profile.email);
    $('.signin-bar').prepend(link);
};

learnjs.sendDbRequest = function(req, retry) {
    var promise = $.Deferred();
    req.on('error', function(error) {
	if (error.code === 'CredentialsError') {
	    learnjs.identity.then(function(identity) {
		return identity.refresh().then(function() {
		    return retry;
		}, function() {
		    promise.reject(resp);
		});
	    });
	}
    });
    req.on('success', function(resp) {
	promise.resolve(resp.data);
    });
    req.send();
    return promise;
};

learnjs.saveAnswer = function(problemId, answer) {
    return learnjs.identity.then(function(identity) {
	var db = new AWS.DynamoDB.DocumentClient();
	var item = {
	    TableName: 'learnjs',
	    Item: {
		userId: identity.id,
		problemId: problemId,
		answer: answer
	    }
	};
	return learnjs.sendDbRequest(db.put(item), function() {
	    return learnjs.saveAnswer(problemId, answer);
	});
    });
};

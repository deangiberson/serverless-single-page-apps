/***
 * Excerpted from "Serverless Single Page Apps",
 * published by The Pragmatic Bookshelf.
 * Copyrights apply to this code. It may not be used to create training material,
 * courses, books, articles, and the like. Contact us if you are in doubt.
 * We make no guarantees that this code is fit for any purpose.
 * Visit http://www.pragmaticprogrammer.com/titles/brapps for more book information.
***/
describe('LearnJS', function() {
  beforeEach(function() {
    learnjs.identity = new $.Deferred();
  });

  describe('changing views', function() {
    beforeEach(function() {
      fetchAnswerDef = new $.Deferred();
      spyOn(learnjs, 'fetchAnswer').and.returnValue(fetchAnswerDef);
    });

    it('can show a problem view', function() {
      learnjs.showView('#problem-1');
      expect($('.view-container .problem-view').length).toEqual(1);
    });

    it('triggers removingView event when removing the view', function() {
      spyOn(learnjs, 'triggerEvent');
      learnjs.showView('#problem-1');
      expect(learnjs.triggerEvent).toHaveBeenCalledWith('removingView', []);
    });
  });

  it('shows the landing page view when there is no hash', function() {
    learnjs.showView('');
    expect($('.view-container .landing-view').length).toEqual(1);
  });

  it('passes the hash view parameter to the view function', function() {
    spyOn(learnjs, 'problemView');
    learnjs.showView('#problem-42');
    expect(learnjs.problemView).toHaveBeenCalledWith('42');
  });

  it('invokes the router when loaded', function() {
    spyOn(learnjs, 'showView');
    learnjs.appOnReady();
    expect(learnjs.showView).toHaveBeenCalledWith(window.location.hash);
  });

  it('subscribes to the hash change event', function() {
    learnjs.appOnReady();
    spyOn(learnjs, 'showView');
    $(window).trigger('hashchange');
    expect(learnjs.showView).toHaveBeenCalledWith(window.location.hash);
  });

  it('can flash an element while setting the text', function() {
    var elem = $('<p>');
    spyOn(elem, 'fadeOut').and.callThrough();
    spyOn(elem, 'fadeIn');
    learnjs.flashElement(elem, "new text");
    expect(elem.text()).toEqual("new text");
    expect(elem.fadeOut).toHaveBeenCalled();
    expect(elem.fadeIn).toHaveBeenCalled();
  });

  it('can redirect to the main view after the last problem is answered', function() {
    var flash = learnjs.buildCorrectFlash(2);
    expect(flash.find('a').attr('href')).toEqual("");
    expect(flash.find('a').text()).toEqual("You're Finished!");
  });

  it('can trigger events on the view', function() {
    callback = jasmine.createSpy('callback');
    var div = $('<div>').bind('fooEvent', callback);
    $('.view-container').append(div);
    learnjs.triggerEvent('fooEvent', ['bar']);
    expect(callback).toHaveBeenCalled();
    expect(callback.calls.argsFor(0)[1]).toEqual('bar');
  });

  it('adds the profile link when the user logs in', function() {
    var profile = {email: 'foo@bar.com'};
    spyOn(learnjs, 'addProfileLink');
    learnjs.appOnReady();
    learnjs.identity.resolve(profile);
    expect(learnjs.addProfileLink).toHaveBeenCalledWith(profile);
  });

  it('can append a profile view link to navbar', function() {
    learnjs.addProfileLink({email: 'foo@bar.com'});
    expect($('.signin-bar a').attr('href')).toEqual('#profile');
  });

  describe('with DynamoDB', function() {
    var dbspy, req, identityObj;
    beforeEach(function() {
      dbspy = jasmine.createSpyObj('db', ['get', 'put']);
      spyOn(AWS.DynamoDB,'DocumentClient').and.returnValue(dbspy);
      spyOn(learnjs, 'sendAwsRequest');
      identityObj = {id: 'COGNITO_ID'};
      learnjs.identity.resolve(identityObj);
    });

    describe('fetchAnswer', function() {
      beforeEach(function() {
	dbspy.get.and.returnValue('request');
      });

      it('reads the item from the database', function(done) {
	learnjs.sendAwsRequest.and.returnValue(new $.Deferred().resolve('item'));
	learnjs.fetchAnswer(1).then(function(item) {
	  expect(item).toEqual('item');
	  expect(learnjs.sendAwsRequest).toHaveBeenCalledWith('request', jasmine.any(Function));
	  expect(dbspy.get).toHaveBeenCalledWith({
	    TableName: 'learnjs',
	    Key: {
	      userId: 'COGNITO_ID',
	      problemId: 1
	    }
	  });
	  done();
	});
      });

      it('resubmits the request on retry', function() {
	learnjs.fetchAnswer(1, {answer: 'false'});
	spyOn(learnjs, 'fetchAnswer').and.returnValue('promise');
	expect(learnjs.sendAwsRequest.calls.first().args[1]()).toEqual('promise');
	expect(learnjs.fetchAnswer).toHaveBeenCalledWith(1);
      });
    });


    describe('saveAnswer', function() {
      beforeEach(function() {
	dbspy.put.and.returnValue('request');
      });

      it('writes the item to the database', function() {
	learnjs.saveAnswer(1, {});
	expect(learnjs.sendAwsRequest).toHaveBeenCalledWith('request', jasmine.any(Function));
	expect(dbspy.put).toHaveBeenCalledWith({
	  TableName: 'learnjs',
	  Item: {
	    userId: 'COGNITO_ID',
	    problemId: 1,
	    answer: {}
	  }
	});
      });

      it('resubmits the request on retry', function() {
	learnjs.saveAnswer(1, {answer: 'false'});
	spyOn(learnjs, 'saveAnswer').and.returnValue('promise');
	expect(learnjs.sendAwsRequest.calls.first().args[1]()).toEqual('promise');
	expect(learnjs.saveAnswer).toHaveBeenCalledWith(1, {answer: 'false'});
      });
    });

  });

    describe('with Lambda', function() {
	var lambdaspy, req, identityObj;
	beforeEach(function() {
	    lambdaspy = jasmine.createSpyObj('lambda', ['invoke']);
	    spyOn(AWS,'Lambda').and.returnValue(lambdaspy);
	    spyOn(learnjs, 'sendAwsRequest');
	    identityObj = {id: 'COGNITO_ID'};
	    learnjs.identity.resolve(identityObj);
	});

	describe('popularAnswers', function() {
	    beforeEach(function() {
		lambdaspy.invoke.and.returnValue('request');
	    });

	it('calls to Lambda', function() {
	    learnjs.sendAwsRequest.and.returnValue(new $.Deferred().resolve('item'));
	    learnjs.popularAnswers(1).then(function(item) {
		expect(item).toEqual('item');
		expect(learnjs.sendAwsRequest).toHaveBeenCalledWith('request', jasmine.any(Function));
		expect(lambdaspy.invoke).toHaveBeenCalledWith({
		    FunctionName: 'learnjs_popularAnswers',
		    Payload: '{"problemNumber":1}'
		});
	    });
	});

	});
    });

  describe('sendAwsRequest', function() {
    var request, requestHandlers, promise, retrySpy;
    beforeEach(function() {
      requestHandlers = {};
      request = jasmine.createSpyObj('request', ['send', 'on']);
      request.on.and.callFake(function(eventName, callback) {
	requestHandlers[eventName] = callback;
      });
      retrySpy = jasmine.createSpy('retry');
      promise = learnjs.sendAwsRequest(request, retrySpy);
    });

    it('resolves the returned promise on success', function(done) {
      requestHandlers.success({data: 'data'});
      expect(request.send).toHaveBeenCalled();
      promise.then(function(data) {
	expect(data).toEqual('data');
	done();
      }, fail);
    });

    it('rejects the returned promise on error', function(done) {
      learnjs.identity.resolve({refresh: function() { return new $.Deferred().reject()}});
      requestHandlers.error({code: "SomeError"});
      promise.fail(function(resp) {
	expect(resp).toEqual({code: "SomeError"});
	done();
      });
    });

    it('refreshes the credentials and retries when the credentials are expired', function() {
      learnjs.identity.resolve({refresh: function() { return new $.Deferred().resolve()}});
      requestHandlers.error({code: "CredentialsError"});
      expect(retrySpy).toHaveBeenCalled();
    });
  });

  describe('awsRefresh', function() {
    var callbackArg, fakeCreds;

    beforeEach(function() {
      fakeCreds = jasmine.createSpyObj('creds', ['refresh']);
      fakeCreds.identityId = 'COGNITO_ID';
      AWS.config.credentials = fakeCreds;
      fakeCreds.refresh.and.callFake(function(cb) { cb(callbackArg); });
    });

    it('returns a promise that resolves on success', function(done) {
      learnjs.awsRefresh().then(function(id) {
	expect(fakeCreds.identityId).toEqual('COGNITO_ID');
      }).then(done, fail);
    });

    it('rejects the promise on a failure', function(done) {
      callbackArg = 'error';
      learnjs.awsRefresh().fail(function(err) {
	expect(err).toEqual("error");
	done();
      });
    });
  });

  describe('profile view', function() {
    var view;
    beforeEach(function() {
      view = learnjs.profileView();
    });

    it('shows the users email address when they log in', function() {
      learnjs.identity.resolve({
	email: 'foo@bar.com'
      });
      expect(view.find('.email').text()).toEqual("foo@bar.com");
    });

    it('shows no email when the user is not logged in yet', function() {
      expect(view.find('.email').text()).toEqual("");
    });
  });

  describe('googleSignIn callback', function() {
    var user, profile;

    beforeEach(function() {
      profile = jasmine.createSpyObj('profile', ['getEmail']);
      var refreshPromise = new $.Deferred().resolve("COGNITO_ID").promise();
      spyOn(learnjs, 'awsRefresh').and.returnValue(refreshPromise);
      spyOn(AWS, 'CognitoIdentityCredentials');
      user = jasmine.createSpyObj('user',
	  ['getAuthResponse', 'getBasicProfile']);
      user.getAuthResponse.and.returnValue({id_token: 'GOOGLE_ID'});
      user.getBasicProfile.and.returnValue(profile);
      profile.getEmail.and.returnValue('foo@bar.com');
      googleSignIn(user);
    });

    it('sets the AWS region', function() {
      expect(AWS.config.region).toEqual('us-east-1');
    });

    it('sets the identity pool ID and Google ID token', function() {
      expect(AWS.CognitoIdentityCredentials).toHaveBeenCalledWith({
	IdentityPoolId: learnjs.poolId,
	Logins: {
	  'accounts.google.com': 'GOOGLE_ID'
	}
      });
    });

    it('fetches the AWS credentials and resolved the deferred', function(done) {
      learnjs.identity.done(function(identity) {
	expect(identity.email).toEqual('foo@bar.com');
	expect(identity.id).toEqual('COGNITO_ID');
	done();
      });
    });

    describe('refresh', function() {
      var instanceSpy;
      beforeEach(function() {
	AWS.config.credentials = {params: {Logins: {}}};
	var updateSpy = jasmine.createSpyObj('userUpdate', ['getAuthResponse']);
	updateSpy.getAuthResponse.and.returnValue({id_token: "GOOGLE_ID"});
	instanceSpy = jasmine.createSpyObj('instance', ['signIn']);
	instanceSpy.signIn.and.returnValue(Promise.resolve(updateSpy));
	var auth2Spy = jasmine.createSpyObj('auth2', ['getAuthInstance']);
	auth2Spy.getAuthInstance.and.returnValue(instanceSpy);
	window.gapi = { auth2: auth2Spy };
      });

      it('returns a promise when token is refreshed', function(done) {
	learnjs.identity.done(function(identity) {
	  identity.refresh().then(function() {
	    expect(AWS.config.credentials.params.Logins).toEqual({
	      'accounts.google.com': "GOOGLE_ID"
	    });
	    done();
	  });
	});
      });

      it('does not re-prompt for consent when refreshing the token in', function(done) {
	learnjs.identity.done(function(identity) {
	  identity.refresh().then(function() {
	    expect(instanceSpy.signIn).toHaveBeenCalledWith({prompt: 'login'});
	    done();
	  });
	});
      });
    });
  });

  describe('problem view', function() {
    var view, fetchAnswerDef;
    beforeEach(function() {
      fetchAnswerDef = new $.Deferred();
      spyOn(learnjs, 'fetchAnswer').and.returnValue(fetchAnswerDef);
      view = learnjs.problemView('1');
    });

    it('loads the previous answer, if there is one', function(done) {
      fetchAnswerDef.resolve({Item: {answer: 'true'}}).then(function() {
	expect(view.find('.answer').val()).toEqual('true');
	done();
      });
    });

    it('keeps the answer blank until the promise is resolved', function() {
      expect(view.find('.answer').val()).toEqual('');
    });

    it('does nothing if the question has not been answered yet', function(done) {
      fetchAnswerDef.resolve({}).then(function() {
	expect(view.find('.answer').val()).toEqual('');
	done();
      });
    });

    it('has a title that includes the problem number', function() {
      expect(view.find('.title').text()).toEqual('Problem #1');
    });

    it('shows the description', function() {
      expect(view.find('[data-name="description"]').text()).toEqual('What is truth?');
    });

    it('shows the problem code', function() {
      expect(view.find('[data-name="code"]').text()).toEqual('function problem() { return __; }');
    });

    describe('skip button', function() {
      it('is added to the navbar when the view is added', function() {
	expect($('.nav-list .skip-btn').length).toEqual(1);
      });

      it('is removed from the navbar when the view is removed', function() {
	view.trigger('removingView');
	expect($('.nav-list .skip-btn').length).toEqual(0);
      });

      it('contains a link to the next problem', function() {
	expect($('.nav-list .skip-btn a').attr('href')).toEqual('#problem-2');
      });

      it('does not added when at the last problem', function() {
	view.trigger('removingView');
	view = learnjs.problemView('2');
	expect($('.nav-list .skip-btn').length).toEqual(0);
      });
    });

    describe('answer section', function() {
      var resultFlash;

      beforeEach(function() {
	spyOn(learnjs, 'flashElement');
	resultFlash = view.find('.result');
      });

      describe('when the answer is correct', function() {
	beforeEach(function() {
	  spyOn(learnjs, 'saveAnswer');
	  view.find('.answer').val('true');
	  view.find('.check-btn').click();
	});

	it('saves the result', function() {
	  expect(learnjs.saveAnswer).toHaveBeenCalledWith(1, "true");
	});
	// ...older tests follow

	it('flashes the result', function() {
	  var flashArgs = learnjs.flashElement.calls.argsFor(0);
	  expect(flashArgs[0]).toEqual(resultFlash);
	  expect(flashArgs[1].find('span').text()).toEqual('Correct!');
	});

	it('shows a link to the next problem', function() {
	  var link = learnjs.flashElement.calls.argsFor(0)[1].find('a');
	  expect(link.text()).toEqual('Next Problem');
	  expect(link.attr('href')).toEqual('#problem-2');
	});
      });

      it('rejects an incorrect answer', function() {
	view.find('.answer').val('false');
	view.find('.check-btn').click();
	expect(learnjs.flashElement).toHaveBeenCalledWith(resultFlash, 'Incorrect!');
      });
    });
  });
});

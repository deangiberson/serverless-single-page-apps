describe('LearnJS', function() {
    it('can show a problem view', function() {
	learnjs.showView('#problem-1');
	expect($('.view-container .problem-view').length).toEqual(1);
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

    it('triggers removingView event when removing the view', function() {
	spyOn(learnjs, 'triggerEvent');
	learnjs.showView('#problem-1');
	expect(learnjs.triggerEvent).toHaveBeenCalledWith('removingView', []);
    });

    it('invokes the router when loaded', function() {
	spyOn(learnjs,'showView');
	learnjs.appOnReady();
	expect(learnjs.showView).toHaveBeenCalledWith(window.location.hash);
    });

    it('subscribes to the hash change event', function() {
	learnjs.appOnReady();
	spyOn(learnjs,'showView');
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

    it('can redirect to main view after the last problem is answered', function() {
	var flash = learnjs.buildCorrectFlash(2);
	expect(flash.find('a').attr('href')).toEqual("");
	expect(flash.find('a').text()).toEqual("You're finished!");
    });

    it('can trigger events on the view', function() {
	callback = jasmine.createSpy('callback');
	var div = $('<div>').bind('fooEvent', callback);
	$('.view-container').append(div);
	learnjs.triggerEvent('fooEvent', ['bar']);
	expect(callback).toHaveBeenCalled();
	expect(callback.calls.argsFor(0)[1]).toEqual('bar');
    });

    it('can create a profile view', function() {
	var div = learnjs.profileView();
	expect(div.find('h3').text()).toEqual("Your Profile");
	expect(div.find('.email').text()).toEqual("");
    });

    describe('problem view', function() {
	var view;
	beforeEach(function() {
	    view = learnjs.problemView('1');
	});

	it('has a title that includes problem number', function() {
	    expect(view.find('.title').text()).toEqual('Problem #1');
	});

	it('shows the description', function() {
	    expect(view.find('[data-name="description"]').text()).toEqual('What is truth?');
	});

	it('shows the problem code', function() {
	    expect(view.find('[data-name="code"]').text()).toEqual('function problem() { return __; }');
	});

	it('creates template clones', function() {
	    var clone = learnjs.template('correct-flash');
	    expect(clone.find('span').text()).toEqual('Correct!');
	    expect(clone.find('a').text()).toEqual('Next Problem');
	});

	it('correctly chooses next problem', function() {
	    var view = learnjs.buildCorrectFlash(1);
	    expect(view.find('a').attr('href')).toEqual('#problem-2');

	    view = learnjs.buildCorrectFlash(learnjs.problems.length);
	    expect(view.find('a').attr('href')).toEqual('');
	});

	describe('answer section', function() {
	    it('can check a correct answer by hitting a button', function() {
		view.find('.answer').val('true');
		view.find('.check-btn').click();
		expect(view.find('.result').find('span').text()).toEqual('Correct!');
	    });

	    it('rejects an incorrect answer', function() {
		view.find('.answer').val('false');
		view.find('.check-btn').click();
		expect(view.find('.result').text()).toEqual('Incorrect!');
	    });
	});
    });
});

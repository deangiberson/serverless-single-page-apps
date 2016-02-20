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

    it('replaces data attributes', function(){
	var template = $('<div/>').html('<span data-one="" data-two=""').contents();
	var data = { 'one':'one',
		     'two':'two'
		     //'three':'three'
		   };
	learnjs.applyObject(data, template);
	//expect(template.text()).toEqual('<span data-one="one" data-two="two">');
    });

    describe('problem view', function() {
	it('has a title that includes problem number', function() {
	    var view = learnjs.problemView('1');
	    expect(view.text().trim()).toMatch(/Problem #1/);
	});
    });
});

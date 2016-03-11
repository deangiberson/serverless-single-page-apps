describe('lambda function', function() {
  var index = require('index');
  var context;

  beforeEach(function() {
    context = jasmine.createSpyObj('context', ['succeed']);
  });

  describe('echo', function() {
    it('returns a result', function() {
      index.echo({}, context);
      expected = ["Hello from the cloud! You sent {}"];
      expect(context.succeed).toHaveBeenCalledWith(expected);
    });
  });
});

describe('lambda function', function() {
    var index = require('index');
    var context;

    beforeEach(function() {
	context = jasmine.createSpyObj('context', ['succeed', 'fail']);
	index.dynamodb = jasmine.createSpyObj('dynamodb', ['scan']);
    });

    describe('popular answers', function() {
	it('requests problems with the given problem number', function() {
	    index.popularAnswers({problemNumber: 42}, context);
	    expect(index.dynamodb.scan).toHaveBeenCalledWith({
		FilterExpression: "problemId = :problemId",
		ExpressionAttributeValues: {":problemId": 42},
		TableName: "learnjs"
	    }, jasmine.any(Function));
	});

	it('groups answers by minified code', function() {
	    index.popularAnswers({"problemNumber": 1}, context);
	    index.dynamodb.scan.calls.first().args[1](undefined,
						      {Items: [
							  {answer: "true"},
							  {answer: "true"},
							  {answer: "true"},
							  {answer: "!false"},
							  {answer: "!false"}
						      ]});
	    expect(context.succeed).toHaveBeenCalledWith({"true":3, "!false":2});
	});
    });
});

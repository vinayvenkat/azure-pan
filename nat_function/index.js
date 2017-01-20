module.exports = function (context, myTimer, myQueue) {
    context.log('JavaScript HTTP trigger function processed a request.');
    context.log('This is where it all starts this is where it gets good');
	context.log('Node.js queue trigger function processed work item', context.bindings.myQueue)
	context.log('queueTrigger = ', context.bindingData.queueTrigger);
    context.done();
};

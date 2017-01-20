module.exports = function (context, req) {
    context.log('JavaScript HTTP trigger function processed a request.');
    context.log('This is where it all starts this is where it gets good');
    context.log('some data: ' + context.bindings.req.version)
    //context.log('req data: ' + req.body.context.resourceGroupName)
    //context.log('Details: ' + req.body.context.details)
    //context.log('Old Capacity' + req.body.context.oldCapacity)
    //context.log('New Capacity' + req.body.context.newCapacity)
    //var message = 'Webhook notification message/' + req.body.context.oldCapacity + '/' + req.body.context.newCapacity;
    var message = 'Webhook notification message/1/2' 
    context.bindings.myQueue = message;
    context.done();
};

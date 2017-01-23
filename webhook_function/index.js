module.exports = function (context, req) {
    context.log('JavaScript HTTP trigger function processed a request.');
    context.log('Status: ' + req.body.status)
    context.log('Operation: ' + req.body.operation)
    context.log('Context: ' + req.body.context)
    context.log('Timestamp: ' + req.body.context.timestamp)
    context.log('ID: ' + req.body.context.id)
    context.log('Name: ' + req.body.context.name)
    context.log('SubscriptionID: ' + req.body.context.subscriptionId)
    context.log('Resource Group Name: ' + req.body.context.resourceGroupName)
    context.log('Resource Name: ' + req.body.context.resourceName)
    context.log('Resource type: ' + req.body.context.resourceType)
    context.log('Resource ID: ' + req.body.context.resourceId)
    context.log('Details: ' + req.body.context.details)
    context.log('Old Capacity' + req.body.context.oldCapacity)
    context.log('New Capacity' + req.body.context.newCapacity)
    var message = 'Webhook notification message/' + req.body.context.oldCapacity + '/' + req.body.context.newCapacity;
    context.bindings.myQueue = message;
    context.done();
};

var msRestAzure = require('ms-rest-azure')

var clientId = 'af780774-f3b9-45ff-a13f-26fe25157ddf';
var domain = 'esadarampaloaltonetworks.onmicrosoft.com';
var secret = 'UQuo5EzWIeIfzc/WuN4rHGch+qtTq2G1krDTXgbI/Z8=';
var subscriptionId = '93f083c5-7cd6-4fe2-b746-ab91a3e5d6e3';
var resourceClient;
//Sample Config
var randomIds = {};
var location = 'westus';
var resourceGroupName = _generateRandomId('testrg', randomIds);
var resourceName = _generateRandomId('testresource', randomIds);

var resourceProviderNamespace = 'Microsoft.KeyVault';
var parentResourcePath = '';
var resourceType = 'vaults';
var apiVersion = '2015-06-01';

///////////////////////////////////////
//Entrypoint for the sample script   //
///////////////////////////////////////
module.exports = function (context, myTimer) {
    context.log('JavaScript HTTP trigger function processed a request.');
    msRestAzure.loginWithServicePrincipalSecret(clientId, secret, domain, function(err, credentials) {
        if(err) {
                console.log(err);
        } else {
            console.info(credentials)
            //process_load_balancer(credentials, resource_gp_name)
        }
    });
}

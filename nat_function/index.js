var msRestAzure = require('ms-rest-azure')
var ComputeManagementClient = require('azure-arm-compute')
//var StorageManagementClient = require('azure-arm-storage')
var NetworkManagementClient = require('azure-arm-network')
var SubscriptionManagementClient = require('azure-arm-resource').SubscriptionClient;


var rexec = require('remote-exec');
var s_exec = require('node-ssh-exec')

var config = {
    username: 'vinay',
    password: 'VinayLinux2017$',
}
command = 'sudo iptables -t nat -L -v -n'

resource_gp_name = 'vvend2endv2'
// see documentation for the ssh2 npm package for a list of all options  
var connection_options = {
    port: 50000,
    username: 'vinay',
    password: 'VinayLinux2017$'
};

var prerouting_cmd = 'sudo iptables -t nat -A PREROUTING -i eth0 -p tcp --dport 80 -j DNAT --to-destination'

var iptables_cmd1 = [
    'sudo echo net.ipv4.ip_forward = 1 | sudo tee -a /etc/sysctl.conf',
    'sudo sysctl -p /etc/sysctl.conf' 
];

var iptables_cmd2 = [
    'sudo iptables -A FORWARD -i eth0 -j ACCEPT',
    'sudo iptables -t nat -A POSTROUTING -j MASQUERADE'
]

var pilot_cmd = [
    'sudo ip a s'
]

var clientId = "af780774-f3b9-45ff-a13f-26fe25157ddf"
var secret = 'Vinay123'
var domain = "esadarampaloaltonetworks.onmicrosoft.com"

var external_load_balancer = {}
var internal_load_balancer = {}
var global_credentials;
var global_resource_group_name;
var nat_port_range = []; 
var hosts = [];


function clone(a) {
   return JSON.parse(JSON.stringify(a));
}

function check_nat_exists() {
    config['host'] = external_load_balancer.ip_address
    // Cycle through all the nat ports
    for(s = 0; s < nat_port_range.length; s++) {
        config['port'] = nat_port_range[s]
        tmp_config = {}
        tmp_config = clone(config)
        console.log('config options')
        console.info(tmp_config)
        execute_ssh_command_with_output(tmp_config, nat_port_range[s])
    }
}

function execute_ssh_command_with_output(tmp_config, remote_port) {

    s_exec(tmp_config, command, function (error, response) {
        if (error) {
            throw error;
        } else {
            console.log('#############' + response);
            nat_rule_ip_str = 'to:' + internal_load_balancer.privateIPAddress
            if (response.includes(nat_rule_ip_str)) {
                console.log('Exists')
            } else {
                n_config = {}
                n_config = clone(connection_options)
                install_nat_rules(n_config, remote_port)
            }
        }
    });
}

function execute_remote_ssh_command(cmds_list) {
    rexec(hosts, cmds_list, connection_options, function(err){
        if (err) {
            console.log(err);
            return 1;
        } else {
            //console.log('Great Success!!');
            return 0;
        }
    });
}

function install_nat_rules(n_config, remote_port) {

    // Require: 
    // 1. Private IP address of the internal load balancer
    // 2. Also need the public ip of the external load balancer 
    // 3. Also need the port range of the NAT pool 
    // in order to iterate through those ports to install NAT rules 

    console.info('Summary')
    console.info(external_load_balancer)
    console.info(internal_load_balancer)
    console.info(hosts)
    console.info('Nat Port Range: ' + nat_port_range)

    // Setup the final set of commands to execute on the 
    // NAT servers 

    final_preroute_cmd = prerouting_cmd + ' ' + internal_load_balancer.privateIPAddress
    iptables_cmd1.push(final_preroute_cmd)
    final_cmds_list = iptables_cmd1.concat(iptables_cmd2)
    console.log('Final commands list :::::  ' + final_cmds_list)
    // Algorithm is as follows
    // Send a pilot command to check connectivity 

    // Add the specific port to the 
    // connections options. 
    
    n_config['port'] = remote_port
    console.log('Connection options')
    console.info(n_config)
    ret = execute_remote_ssh_command(n_config, pilot_cmd)
    if (ret) {
        console.log('Error occurred executing command against remote server.')
    } else {
        console.info('Remote command successfully executed.')
        // Execute establishing the NAT rules
        ret = execute_remote_ssh_command(n_config, final_cmds_list)
        if (!ret) {
            console.log('Command executed successfully.')
        } else {
            console.info('Failed to execute the command on the remote server.')
        }
    }
}

function process_lb(data, resourceGroupName) { 
    // identifies either an elb or an ilb
   console.log('######### process_lb called. ') 
   if (data.publicIPAddress == undefined) {
    console.info('Identified the ILB');    
    internal_load_balancer.privateIPAddress = data.privateIPAddress
    internal_load_balancer.privateIPAllocationMethod = data.privateIPAllocationMethod
    console.info('Print out the internal load balancer')
    console.info(internal_load_balancer)
   } else {
        process_public_lb(data, resourceGroupName)
   }
}

function process_public_lb(result, resourceGroupName) {
    // retrieve the public IP of the public ELB
    pub_ip_ep = result['publicIPAddress']['id']
    console.log('Public IP Address EP ' + pub_ip_ep)
    pub_ip_name_array = pub_ip_ep.split('/')
    pub_ip_name = pub_ip_name_array[pub_ip_name_array.length -1]
    console.log('Public IP Name ' + pub_ip_name)
    var nw_client = new NetworkManagementClient(global_credentials, '93f083c5-7cd6-4fe2-b746-ab91a3e5d6e3');
    nw_client.publicIPAddresses.get(global_resource_group_name, pub_ip_name, handle_pub_ip_response)  
}


function identify_nat_ports(_name) {
    // Also need to identify the NAT rules of the Public ELB.
    var nw_client = new NetworkManagementClient(global_credentials, '93f083c5-7cd6-4fe2-b746-ab91a3e5d6e3');
    nw_client.loadBalancers.get(resource_gp_name, _name, expand='inboundNatRules', function(err, result) {
                    if (err) {
                        console.error('############ Error ' + err)
                    } else {
                        console.info('######### LB ###############')
                        nat_rules = result['inboundNatRules']
                        for (x = 0; x < nat_rules.length; x++) {
                            //console.log(nat_rules[x])
                            //print_object(nat_rules[x])
                            if (nat_rules[x].frontendPort != '80') {
                                nat_port_range.push(nat_rules[x].frontendPort)
                                console.info('Adding NAT Port ' + nat_port_range)
                            }
                        }
                    }
    })
}

function populate_public_lb(result) {

    for (var key in result) {
        if (result.hasOwnProperty(key)) {   
            console.log("key " + key + "value " + result[key])
        }
    }
    external_load_balancer.ip_address = result['ipAddress']
    hosts.push(external_load_balancer.ip_address)
    config['host'] = external_load_balancer.ip_address
    console.info('External LB IP' + external_load_balancer.ip_address)
    setTimeout(check_nat_exists, 10000)
}

function handle_pub_ip_response(err, result) {

    if (err) {
        console.error(err)
    } else {
       console.info('############ Response ' + result)
       populate_public_lb(result)
       console.info("Nat port range :::::" + nat_port_range)
    }
}

function print_object(data) {
    for(var key in data) {
        console.info('Key ' + key + ' Value ' + data[key])
    }
}

function lb_resp(err, result){
        if(err) {
            console.error(err)
        } else {
            console.log('Ouput the Load Balancer Result')
            console.info(result)
            for(i = 0; i < result.length; i++) {
                _id = result[i]['id']
                _name = result[i]['name']
                identify_nat_ports(_name)
                fip = result[i].frontendIPConfigurations[0]
                console.log('Output the Frontend IP Configurations')
                //console.info(fip)
                process_lb(fip, _name)
                console.info('######### LB END ###############')
            }
        }
}

// Implement a function here to make ansible calls 
// to program the masquerade rules and the DNAT rules


process_load_balancer = function(credentials, resourceGroupName)
{
    var nw_client = new NetworkManagementClient(credentials, '93f083c5-7cd6-4fe2-b746-ab91a3e5d6e3');
    
    nw_client.loadBalancers.list(resourceGroupName, lb_resp);
    global_credentials = credentials
    global_resource_group_name = resourceGroupName
}

module.exports = function (context, myTimer) {
    context.log('JavaScript HTTP trigger function processed a request.');
    msRestAzure.loginWithServicePrincipalSecret(clientId, secret, domain, function(err, credentials) {
        if(err) {
                console.log(err);
        } else {
            console.log(credentials)
            process_load_balancer(credentials, resource_gp_name)
        }
    });
}
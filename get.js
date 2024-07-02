var Client = require('mysql').Client;
var client = new Client(); 
client.host ='some.host.com';
client.user = 'user';
client.password = 'password';
console.log("connecting...");
client.connect(function(err, results) {
    if (err) {
        console.log("ERROR: " + err.message);
        throw err;
    }
    console.log("connected.");
    clientConnected(client);
});

clientConnected = function(client)
{
	tableHasData(client);
}           


tableHasData = function(client)
{
    client.query(
        'SELECT * FROM [db].[table] LIMIT 0,10',
        // you can keep this function anonymous
        function (err, results, fields) {
            if (err) {
                console.log("ERROR: " + err.message);
                throw err;
            }
            console.log("Got "+results.length+" Rows:");
            for(var i in results){
		
		console.log('\n');
				
            	//console.log("The meta data about the columns:");
            	//console.log(fields);     
	    }
            client.end();
        });
};
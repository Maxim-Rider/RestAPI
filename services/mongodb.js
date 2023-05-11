var axios = require('axios');

var data = JSON.stringify(
    {
        "collection": "articles",
        "database": "articles",
        "dataSource": "maksimkolesnikov",
        "filter": {},
        "projection": {},
        "document": {},
        "update": {}
    }
);
            
var config = {
    method: 'post',
    url: 'https://eu-central-1.aws.data.mongodb-api.com/app/data-aksde/endpoint/data/v1/action/findOne',
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Request-Headers': '*',
      'api-key': 'Zi2TohGIOlrk6Mbe9qayaLcMFOkA0wdPcnxTeWcAqH7oAhd52FKRV2nthak8tkln',
    },
    data: data
};
            

function sendQuery(collection, action, filter, projection, body, limit, method) {
    config.method = method;
    let json =         {
        "collection": collection,
        "database": "articles",
        "dataSource": "maksimkolesnikov",
        "filter": filter,
        "projection": projection,
        "limit": limit
    };
    if (action == 'insertOne' || action == 'insertMany') {
        json["document"] = body;
    } 
    if (action == 'updateOne' || action == 'findMany') {
        json["update"] = body;
    }  
    data = JSON.stringify(json);   
    config.data = data;
    config.url = "https://eu-central-1.aws.data.mongodb-api.com/app/data-aksde/endpoint/data/v1/action/" + action;
    console.log(config);
    return axios(config)
        .then((response) => {
            return response.data;
        })
        .catch((error) => {
            return error;
        });
}

exports.sendQuery = sendQuery;

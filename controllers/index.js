const AppError = require("../utils/appError");
const mongo = require("../services/mongodb");
const crypto = require("crypto");
const { propfind } = require("../routes");
const { parse } = require("path");

tokens = [];

const toBase64 = obj => {
  const str = JSON.stringify (obj);
  return Buffer.from(str).toString ('base64');
};

const replaceSpecialChars = b64string => {
    return b64string.replace (/[=+/]/g, charToBeReplaced => {
      switch (charToBeReplaced) {
        case '=':
          return '';
        case '+':
          return '-';
        case '/':
          return '_';
      }
    });
  };

const createSignature =(jwtB64Header,jwtB64Payload,secret)=>{
    let signature = crypto.createHmac ('sha256', secret);
    signature.update (jwtB64Header + '.' + jwtB64Payload);
    signature = signature.digest ('base64');
    signature = replaceSpecialChars (signature);
    return signature
}

function createToken(id, email, password) {
  const header = {
    alg: 'HS256',
    typ: 'JWT',
  };
  const b64Header = toBase64(header);
  const jwtB64Header = replaceSpecialChars(b64Header);
  let payload = {
    "date": new Date().getTime(),
    "id": id,
    "email": email,
    "password": password
  }
  const b64Payload = toBase64 (payload);
  const jwtB64Payload = replaceSpecialChars (b64Payload);
  const secret = 'bla bla';
  const signature = createSignature(jwtB64Header,jwtB64Payload, secret);
  const jsonWebToken = jwtB64Header + '.' + jwtB64Payload + '.' + signature;
  return jsonWebToken;
}

function parseJwt(token) {
  return JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
}

exports.login = (req, res, next) => {
  let collection = "authors";
  let action = "find";
  let filter = req.body.user;
  let projection = {"password": 0};
  let body;
  let limit;
  if (!req.body.user.email || !req.body.user.password) {
    let body = {"body": ["Unauthorized"]};
    res.status(401).json({
      errors: body
    });  
  } else {
    mongo.sendQuery(collection, action, filter, projection, body, limit, "post").then((data) => {
      if (data.documents.length == 0) {
        let body = {"body": ["Unauthorized"]};
        res.status(401).json({
          errors: body
        });           
      } else {
        let JWT = createToken(data.documents[0]._id, req.body.user.email, req.body.user.password);
        tokens.push(JWT);
        data.documents[0]["token"] = JWT;
        if (!data.documents[0].bio) {
          data.documents[0]["bio"] = null;
        }
        if (!data.documents[0].image) {
          data.documents[0]["image"] = null;
        }
        res.status(200).json({
          user: data.documents[0],
        });          
      }
    });      
  }
}

exports.me = (req, res, next) => {
  let token = req.headers.authorization.substring(6, req.headers.authorization.length).trim();
  console.log(token);
  if (!req.headers.authorization || !tokens.includes(token)) {
    let body = {"body": ["Unauthorized"]};
    res.status(401).json({
      errors: body
    });  
  } else {
    let collection = "authors";
    let action = "find";
    console.log(parseJwt(token));
    let filter = { "_id": {"$oid": parseJwt(token)["id"] }};
    let projection = {"_id": 0};
    let body;
    let limit;
    mongo.sendQuery(collection, action, filter, projection, body, limit, "post").then((data) => {
      if (data.documents.length == 0) {
        let body = {"body": ["Unauthorized"]};
        res.status(401).json({
          errors: body
        });        
      } else {
        data.documents[0]["token"]= token;
        if (!data.documents[0].bio) {
          data.documents[0]["bio"] = null;
        }
        if (!data.documents[0].image) {
          data.documents[0]["image"] = null;
        }
        res.status(200).json({
          user: data.documents[0]
        });          
      }
    });      
  }
}

exports.updateMe = (req, res, next) => {
  let token = req.headers.authorization.substring(6, req.headers.authorization.length).trim();
  console.log(token);
  if (!req.headers.authorization || !tokens.includes(token)) {
    let body = {"body": ["Unauthorized"]};
    res.status(401).json({
      errors: body
    });  
  } else {
    let collection = "authors";
    let action = "updateOne";
    let filter = { "_id": {"$oid": parseJwt(token)["id"] }};
    let user = {};
    if (req.body.user.email) {
      user["email"] = req.body.user.email;
    }
    if (req.body.user.username) {
      user["email"] = req.body.user.username;
    }
    if (req.body.user.password) {
      user["email"] = req.body.user.password;
    }
    if (req.body.user.image) {
      user["email"] = req.body.user.image;
    }
    if (req.body.user.bio) {
      user["email"] = req.body.user.bio;
    }
    let body = { "$set": user };
    let projection;
    let limit;
    mongo.sendQuery(collection, action, filter, projection, body, limit, "post").then((data) => {
      res.status(200).json({
        status: "Success",
        length: data?.length,
        data: data,
      });  
    });
  }
};

exports.getArticles = (req, res, next) => {
  let collection = "articles";
  let filter = {};
  let projection = {"_id": 0};
  let action = "find";
  let body;
  let limit;
  if (req.query.tag) {
    console.log("Tag");
    filter["tagList"] = req.query.tag;
  }
  if (req.query.limit) {
    console.log("Limit")
    limit = parseInt(req.query.limit);
  }
  if (req.query.author) {
    console.log("Author to find");
    filter["author"] = req.query.author;
  }
  if (req.params.id) {
    console.log("ID to find");
    filter["_id"] = req.params.id;
  }
  mongo.sendQuery(collection, action, filter, projection, body, limit, "post").then((data) => {
    if (req.params.id) {
      res.status(200).json({
        article: data.documents[0],
      });  
    } else {
      res.status(200).json({
        articles: data.documents,
        articlesCount: data.documents.length
      });        
    } 
  });
};

exports.updateArticle = (req, res, next) => {
  let token = req.headers.authorization.substring(6, req.headers.authorization.length).trim();
  console.log(token);
  if (!req.headers.authorization || !tokens.includes(token)) {
    let body = {"body": ["Unauthorized"]};
    res.status(401).json({
      errors: body
    });   
  } else {
    let collection = "articles";
    let action = "updateOne";
    let filter = { "_id": {"$oid": req.params.id }};
    let article = {};
    if (req.body.article.body) {
      article["body"] = req.body.article.email;
    }
    if (req.body.article.title) {
      article["title"] = req.body.article.title;
      article["slug"] = req.body.article.title.toLowerCase().replaceAll(" ", "-")
    }
    if (req.body.article.description) {
      article["description"] = req.body.article.description;
    }
    article["updatedAt"] = new Date().toISOString();
    let body = { "$set": article };
    let projection;
    let limit;
    mongo.sendQuery(collection, action, filter, projection, body, limit, "post").then((data) => {
      res.status(200).json({
        status: "Success",
        length: data?.length,
        data: data,
      });  
    });
  }
};

exports.postArticles = (req, res, next) => {
  let token = req.headers.authorization.substring(6, req.headers.authorization.length).trim();
  console.log(token);
  if (!req.headers.authorization || !tokens.includes(token)) {
    let body = {"body": ["Unauthorized"]};
    res.status(401).json({
      errors: body
    });   
  } else {
    let collection = "articles";
    let action = "insertOne";
    let body = req.body.article;
    let error = {"body": []};
    if (!body.title) {
      error.body.push("Title was not provided!");   
    }
    if (!body.description) {
      error.body.push("Description was not provided!");   
    }
    if (!body.body) {
      error.body.push("Body was not provided!");   
    }
    if (error.body.length > 0) {
      res.status(422).json({
        errors: error
      });    
      return;  
    }
    body["createdAt"] = new Date().toISOString();
    body["updatedAt"] = new Date().toISOString();
    body["author"] = parseJwt(token)["id"]; 
    body["slug"] = req.body.article.title.toLowerCase().replaceAll(" ", "-");
    let filter;
    let projection;
    let limit;
    mongo.sendQuery(collection, action, filter, projection, body, limit, "post").then((data) => {
      let action2 = "find";
      let filter2 =  { "_id": {"$oid": data.insertedId }};
      let projection2 = {"_id": 0};
      let body2;
      let limit2 = null;
      mongo.sendQuery(collection, action2, filter2, projection2, body2, limit2, "post").then((data2) => {
        if (data2.documents.length == 0) {
          res.status(200).json({
            status: "Success",
            message: "Invalid Credentials"
          });          
        } else {
          if (!data2.documents[0].tagList) {
            data2.documents[0]["tagList"] = null;
          }
          res.status(200).json({
            article: data2.documents[0]
          });          
        }
      });  
    });
  }
};

exports.deleteArticles = (req, res, next) => {
  let token = req.headers.authorization.substring(6, req.headers.authorization.length).trim();
  console.log(token);
  if (!req.headers.authorization || !tokens.includes(token)) {
    let body = {"body": ["Unauthorized"]};
    res.status(401).json({
      errors: body
    });  
  } else {
    let collection = "articles";
    let action = "deleteMany";
    let body;
    let filter = {};
    let projection;
    let limit;
    if (req.params.id) {
      console.log("ID to find");
      filter["_id"] = { "$oid": req.params.id };
    }
    mongo.sendQuery(collection, action, filter, projection, body, limit, "post").then((data) => {
      res.status(200).json({
        status: "Success",
        length: data?.length,
        data: data,
      });  
    });
  }
};

exports.getAuthors = (req, res, next) => {
  if (!req.headers.token || !tokens.includes(req.headers.token)) {
    let body = {"body": ["Unauthorized"]};
    res.status(401).json({
      errors: body
    });  
  } else {
    let collection = "authors";
    let action = "find";
    let filter = {};
    let body;
    let projection = {"password": 0};
    let limit;
    if (req.query.limit) {
      console.log("Limit")
      limit = parseInt(req.query.limit);
    }
    if (req.query.username) {
      console.log("Username to find");
      filter["username"] = req.query.username;
    }
    if (req.query.email) {
      console.log("Email to find");
      filter["email"] = req.query.email;
    }
    if (req.query.id) {
      console.log("ID to find");
      filter["_id"] = { "$oid": req.query.id };
    }
    mongo.sendQuery(collection, action, filter, projection, body, limit, "post").then((data) => {
      res.status(200).json({
        status: "Success",
        length: data?.length,
        data: data,
      });  
    });
  }
};

exports.postAuthors = (req, res, next) => {
  let collection = "authors";
  let action = "insertOne";
  let body = req.body.user;
  let filter;
  let projection;
  let limit;
  mongo.sendQuery(collection, action, filter, projection, body, limit, "post").then((data) => {
    let action2 = "find";
    let filter2 =  { "_id": {"$oid": data.insertedId }};
    let projection2 = {"password": 0, "_id": 0};
    let body2;
    let limit2 = null;
    mongo.sendQuery(collection, action2, filter2, projection2, body2, limit2, "post").then((data2) => {
      if (data2.documents.length == 0) {
        res.status(200).json({
          status: "Success",
          message: "Invalid Credentials"
        });          
      } else {
        if (!data2.documents[0].bio) {
          data2.documents[0]["bio"] = null;
        }
        if (!data2.documents[0].image) {
          data2.documents[0]["image"] = null;
        }
        res.status(200).json({
          user: data2.documents[0]
        });          
      }
    }); 
  });
};

exports.getComments = (req, res, next) => {
  let collection = "comments";
  let filter = {};
  let body;
  let projection = {};
  let action = "find";
  let limit;
  if (req.query.limit) {
    console.log("Limit")
    limit = parseInt(req.query.limit);
  }
  if (req.query.author) {
    console.log("Author to find");
    filter["author"] = req.query.author;   
  }
  if (req.params.id) {
    console.log("ID to find");
    filter["article"] = req.params.id;
  }
  mongo.sendQuery(collection, action, filter, projection, body, limit, "post").then((data) => {
    for (i of data.documents) {
      i["id"] = i["_id"];
      i["_id"] = undefined;
    }
    res.status(200).json({
      comments: data.documents,
      commentsCount: data.documents.length
    });  
  });
}

exports.postComments = (req, res, next) => {
  let token = req.headers.authorization.substring(6, req.headers.authorization.length).trim();
  console.log(token);
  if (!req.headers.authorization || !tokens.includes(token)) {
    let body = {"body": ["Unauthorized"]};
    res.status(401).json({
      errors: body
    });  
  } else {
    let collection = "comments";
    let action = "insertOne";
    let body = req.body.comment;
    body["createdAt"] = new Date().toISOString();
    body["updatedAt"] = new Date().toISOString();
    body["author"] = parseJwt(token)["id"]; 
    body["article"] = req.params.id;
    let filter;
    let projection;
    let limit;
    mongo.sendQuery(collection, action, filter, projection, body, limit, "post").then((data) => {
      let action2 = "find";
      let filter2 =  { "_id": {"$oid": data.insertedId }};
      let projection2;
      let body2;
      let limit2 = null;
      mongo.sendQuery(collection, action2, filter2, projection2, body2, limit2, "post").then((data2) => {
        if (data2.documents.length == 0) {
          let body = {"body": ["Unauthorized"]};
          res.status(401).json({
            errors: body
          });        
        } else {
          for (i of data2.documents) {
            i["id"] = i["_id"];
            i["_id"] = undefined;
          }
          res.status(200).json({
            comment: data2.documents[0]
          });          
        }
      });  
    });
  }
};

exports.deleteComments = (req, res, next) => {
  let token = req.headers.authorization.substring(6, req.headers.authorization.length).trim();
  console.log(token);
  if (!req.headers.authorization || !tokens.includes(token)) {
    let body = {"body": ["Unauthorized"]};
    res.status(401).json({
      errors: body
    });  
  } else {
    let collection = "comments";
    let action = "deleteMany";
    let body;
    let filter = {};
    let projection;
    let limit;
    if (req.params.id2) {
      console.log("ID to find");
      filter["_id"] = { "$oid": req.params.id2 };
    }
    mongo.sendQuery(collection, action, filter, projection, body, limit, "post").then((data) => {
      res.status(200).json({
        status: "Success",
        length: data?.length,
        data: data,
      });  
    });
  }
};

exports.notFound = (req, res, next) => { 
  let body = {"body": ["Not found"]};
  res.status(404).json({
    errors: body
  });  
}
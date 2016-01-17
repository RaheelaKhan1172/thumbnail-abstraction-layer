var express = require('express');
var request = require('request');
var cheerio = require('cheerio');
var MongoClient = require('mongodb').MongoClient;
var mongourl = 'mongodb://localhost:27017/test';
var app = express();
var ObjectId = require('mongodb').ObjectID;

function insertdataBase(req) {
  MongoClient.connect(mongourl,function(err,db) {
   var collection = db.collection('usersearches');
   collection.insert({
     term:req
   },function(err,result) {
     if (err) throw err;
     console.log('inserted data',result);
     db.close();
   }); 
  });
}

function retrieveData(res) {
  MongoClient.connect(mongourl,function(err,db) {
    var cursor = db.collection('usersearches').find();
    cursor.toArray(function(err,doc) {
      doc = doc.map(function(a) {
        var currId = a._id;
        a._id = ObjectId(currId).getTimestamp();
        return a = JSON.parse(JSON.stringify(a).replace(/"_id":/g,'"when":'));
      });
      console.log(doc);
      res.end(JSON.stringify(doc)); 
    });
    });
  }

function extractOffset(query) {
  return Number(query.offset);
}

app.get('/api/imagesearch/:id',function(req,res) {
  
  insertdataBase(req.params.id);
  var dataToReturn = [];
  var offset;
  console.log(req.query,req.params.id);
  if (Object.keys(req.query).length) {
    offset = extractOffset(req.query);
  } 

  var url = 'https://www.google.com/search?site=&tbm=isch&source=hp&biw=1680&bih=906&q='+req.params.id+'&oq='+req.params.id;
  request(url,function(error,response,html) {
    if (error) throw error;
    var $ = cheerio.load(html);
    var data = $("a");
    var data2 = $("img");
    var hrefArr = [];
    var imgArr = [];
    var i = (offset === undefined) ? 51 : 51 + offset;
    
    for (i; i < 70; i++) {
      var currurl = data[i].attribs.href;
      currurl = currurl.split('?q=')[1];
      hrefArr.push(currurl);
    };

    var k = (offset === undefined) ? 1 : offset;    
    for (k; k < data2.length;k++ ) {
      imgArr.push(data2[k].attribs.src);
    }
    
    dataToReturn = hrefArr.map(function(a,i) {
      return {"url":hrefArr[i], "image": imgArr[i]}
    }); 
    res.end(JSON.stringify(dataToReturn));  
  });
});

app.get('/api/latest/imagesearch/',function(req,res) {
  retrieveData(res);
});


app.listen(3030);

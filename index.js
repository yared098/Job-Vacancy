const express = require('express');
const app = express();
const mysql = require('mysql');
const port = process.env.PORT || 3000;

var con = mysql.createConnection({
    host: "127.0.0.1",
    user: "", // WRONG USER
    password: "root"
  });
  
  con.connect(function(err) {
    if (err) throw err;
    console.log("Connected!");
    /*Create a database named "mydb":*/
    con.query("CREATE DATABASE mydb", function (err, result) {
      if (err) throw err;
      console.log("Database created");
    });
  });
app.get("", (req, res) => {
    res.send("well come to ")

});
app.listen(port, () => {
    console.log(`erver is running on port ${port}`);
})
import {MongoClient} from 'mongodb';
const dbUrl = 'mongodb://localhost:27017/chatapp';
let _db;

MongoClient.connect(dbUrl, function (error, db) {
  console.log(error)
  const dbo = db.db('chatapp');
  _db = dbo;
});

export default function db(){
  return _db;
}
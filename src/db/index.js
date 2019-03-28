/* db/index.js
/-----------------------------------------------------------------------------
// Author : Andrew Nolan, Max Atkinson ,Angus Cameron, Bruce Thomson   
//----------------------- ----------------------------------------------------
// Purpose: Node.js server side code for configuring the connection to mongodb
			database. Function is exported to allow other parts of system to
		
	Requires: mongodb
//-----------------------------------------------------------------------------
*/

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